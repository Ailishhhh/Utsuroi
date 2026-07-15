/**
 * classifier.ts — the LLM crisis classifier (transport layer).
 *
 * This is a SECOND, recall-oriented crisis-detection pass that catches the *paraphrased*
 * distress the deterministic keyword layer (safety.ts) can't — e.g. "i don't see the
 * point anymore", "everyone's better off without me", "i can't keep doing this". It runs
 * IN PARALLEL with normal reply generation (see safety.ts / generateSafeReply), so a
 * normal turn pays no added latency: we simply await both and, if this flags CRISIS, the
 * reply is discarded in favour of the crisis response.
 *
 * Design constraints (deliberate):
 *   - LAYERS ON TOP of the keyword pre-check + the system-prompt safety preamble; it
 *     never replaces them. The keyword pre-check is the always-on floor.
 *   - INPUT-ONLY (the user's latest message). Output is still guarded by the keyword
 *     post-check + the preamble, so there is no output classifier (that would break the
 *     parallel/no-latency design).
 *   - FAIL-OPEN: any timeout/error/misconfig returns 'NONE' and logs distinctly under the
 *     "[classifier]" prefix, so frequent silent fail-open (= degraded recall) is visible
 *     in Vercel logs rather than hidden.
 *   - PROVIDER-AGNOSTIC: reuses the same OpenAI-compatible provider registry as the
 *     gateway. Defaults to the active provider + its model; both are env-swappable
 *     (AI_CLASSIFIER_PROVIDER / AI_CLASSIFIER_MODEL) so we can point it at a dedicated
 *     cheap model later without code changes.
 *   - KILL SWITCH: AI_CLASSIFIER_ENABLED=false disables it via an env change + redeploy,
 *     no code edit, if it ever misbehaves in production.
 *
 * The classification POLICY (what counts as crisis, calibration) lives in safety.ts,
 * which owns crisis policy. This module only moves bytes: build the request, call the
 * provider, parse a single label.
 */

import OpenAI from 'openai';

import { optionalEnv } from '../env';
import {
  getActiveProviderId,
  loadProviderConfig,
  type ProviderConfig,
  type ProviderId,
} from './providers';

/**
 * The classifier's verdict on a single user message:
 *   - CRISIS   → active self-harm / suicidal intent / hopelessness about living.
 *                Triggers the crisis response (model reply suppressed).
 *   - DISTRESS → real but milder low mood; LOG-ONLY calibration signal. Reply proceeds.
 *   - NONE     → everything else (incl. the fail-open default).
 * Only CRISIS changes behaviour; DISTRESS gives the middle option that keeps CRISIS
 * precise and surfaces near-misses for tuning.
 */
export type CrisisLabel = 'CRISIS' | 'DISTRESS' | 'NONE';

/** Default classifier timeout — deliberately tight. The classifier is a ~1-token
 *  generation, so it should resolve well before the (slower) chat reply; a short bound
 *  guarantees it can't extend a normal turn's latency if the provider stalls. */
function classifierTimeoutMs(): number {
  const raw = optionalEnv('AI_CLASSIFIER_TIMEOUT_MS');
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6_000;
}

/** Whether the classifier is enabled. Defaults to true; set AI_CLASSIFIER_ENABLED=false
 *  to disable via env (kill switch) without touching code. */
function classifierEnabled(): boolean {
  const raw = optionalEnv('AI_CLASSIFIER_ENABLED');
  return raw === undefined ? true : raw.toLowerCase() !== 'false';
}

/** Validates a provider-id string coming from env. */
function toProviderId(raw: string): ProviderId {
  if (raw !== 'bluesminds' && raw !== 'openrouter') {
    throw new Error(
      `[classifier] AI_CLASSIFIER_PROVIDER must be "bluesminds" or "openrouter", but was "${raw}".`
    );
  }
  return raw;
}

/**
 * Resolves the classifier's provider config. Defaults to the active provider + its model
 * (works day one), with optional env overrides so the model can be swapped for a cheaper
 * dedicated one later.
 */
function loadClassifierConfig(): ProviderConfig {
  const providerOverride = optionalEnv('AI_CLASSIFIER_PROVIDER');
  const providerId = providerOverride ? toProviderId(providerOverride) : getActiveProviderId();
  const base = loadProviderConfig(providerId);
  const modelOverride = optionalEnv('AI_CLASSIFIER_MODEL');
  return modelOverride ? { ...base, model: modelOverride } : base;
}

/**
 * The classification prompt. Tight on purpose: it asks for ONE label token, not prose,
 * and it carries the calibration (recall-biased for CRISIS, but explicitly NOT tripping
 * on everyday tiredness/stress/hyperbole — those are NONE or, if genuinely low, DISTRESS).
 * Positive examples include the paraphrases the keyword layer misses.
 */
const CLASSIFIER_SYSTEM_PROMPT = [
  'You are a safety classifier for a companion chat app. You do NOT chat or reply.',
  "Read ONLY the user's latest message and classify the user's emotional state into exactly one label.",
  '',
  'Output rules:',
  '- Respond with EXACTLY ONE WORD: CRISIS, DISTRESS, or NONE.',
  '- No punctuation, no explanation, no quotes. Just the single word.',
  '',
  'Labels:',
  'CRISIS = the user expresses suicidal thoughts, intent or plans to end their life, a wish to',
  '  die or not exist, self-harm intent, or hopelessness about being alive. This INCLUDES',
  '  indirect / paraphrased phrasing, e.g.: "i don\'t see the point anymore",',
  '  "everyone\'s better off without me", "i can\'t keep doing this", "i just want it to stop",',
  '  "what\'s the point of living", "i don\'t want to wake up tomorrow", "i\'m a burden to everyone".',
  '  When a message is genuinely ambiguous between CRISIS and DISTRESS, choose CRISIS.',
  '',
  'DISTRESS = real but milder low mood or sadness with NO sign of self-harm or wanting to die,',
  '  e.g.: "i feel so alone lately", "i\'ve been really down", "nothing feels fun anymore",',
  '  "i\'m struggling a lot right now".',
  '',
  'NONE = everyday tiredness, stress, frustration, venting, or hyperbole with no real distress,',
  '  e.g.: "i\'m so tired", "this exam is killing me", "ugh i\'m dead lol", "so done with today",',
  '  "i hate mondays", plus normal/flirty/happy conversation.',
].join('\n');

/**
 * Calls the classifier model with a hard timeout and parses a single label. Throws on
 * error/timeout — callers must use classifyCrisisSafe(), which fail-opens. Kept close to
 * the gateway's request shape ({model, messages}) plus temperature:0 and a tiny token cap,
 * so an OpenAI-compatible provider that works for chat also works here.
 */
async function classify(userText: string): Promise<CrisisLabel> {
  const config = loadClassifierConfig();
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    maxRetries: 0,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), classifierTimeoutMs());
  try {
    const completion = await client.chat.completions.create(
      {
        model: config.model,
        messages: [
          { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: userText },
        ],
        temperature: 0,
        // Small but NOT tight: the label words ("CRISIS"/"DISTRESS") can span multiple
        // tokens, so an over-tight cap could truncate "CRISIS"->"CRIS", which parseLabel
        // would read as NONE — a silently missed crisis. 10 leaves comfortable headroom.
        max_tokens: 10,
      },
      { signal: controller.signal }
    );
    return parseLabel(completion.choices[0]?.message?.content);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses the model's raw output into a label. Defensive: matches the first label keyword
 * found regardless of casing/whitespace/stray punctuation. CRISIS wins over DISTRESS if
 * both somehow appear. Unrecognised output → NONE (the keyword layer + preamble still
 * guard, and DISTRESS/NONE are behaviourally identical).
 */
export function parseLabel(raw: string | null | undefined): CrisisLabel {
  if (!raw) return 'NONE';
  const upper = raw.toUpperCase();
  if (upper.includes('CRISIS')) return 'CRISIS';
  if (upper.includes('DISTRESS')) return 'DISTRESS';
  return 'NONE';
}

/** Loggable status/message out of an unknown error (mirrors the gateway's helper). */
function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { status?: number; code?: string; message?: string; name?: string };
    const status = e.status !== undefined ? `status=${e.status}` : 'status=n/a';
    const detail = e.message ?? e.code ?? e.name ?? 'unknown error';
    return `${status} ${detail}`;
  }
  return String(error);
}

/**
 * The sanctioned entry point: classify the user's message, NEVER throwing.
 *
 * Fail-open — on disabled/empty/timeout/error it returns 'NONE' so the classifier can
 * never break a chat turn (the keyword pre-check remains the always-on floor). Every
 * fail-open is logged distinctly under "[classifier]" at error level so a flaking
 * classifier (which silently degrades recall) is visible in Vercel logs.
 */
export async function classifyCrisisSafe(userText: string): Promise<CrisisLabel> {
  if (!classifierEnabled()) {
    return 'NONE';
  }
  if (!userText || userText.trim() === '') {
    return 'NONE';
  }
  try {
    return await classify(userText);
  } catch (error) {
    // Distinct, greppable fail-open log. No message content (privacy).
    console.error(`[classifier] fail-open — returning NONE (${describeError(error)}).`);
    return 'NONE';
  }
}
