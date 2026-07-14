/**
 * gateway.ts — the AI Gateway.
 *
 * The ONLY entry point callers use is generateReply(context): they pass conversation
 * context and get text back, never naming a provider or model (those come from the
 * registry/config). One OpenAI-compatible adapter serves every provider by swapping
 * baseURL + apiKey + model.
 *
 * Reliability (M2.5): each provider call has a hard timeout (AbortController). If the
 * active provider errors or times out, we try the secondary provider exactly once —
 * a plain try -> catch -> try, not a routing engine. If both fail, a friendly error
 * is thrown. The real underlying error (HTTP status + provider message) is always
 * logged server-side BEFORE falling back, so failures are diagnosable in Vercel logs
 * while the client only ever sees a calm message.
 *
 * Kept thin so the chat-flow milestone can wrap safety checks around generateReply.
 */

import OpenAI from 'openai';

import {
  getActiveProviderId,
  getSecondaryProviderId,
  loadProviderConfig,
  type ProviderConfig,
  type ProviderId,
} from './providers';

/** A single conversation turn. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Everything the gateway needs to produce a reply. */
export interface GenerateInput {
  messages: ChatMessage[];
}

/** The gateway's result — the reply plus which provider/model actually produced it. */
export interface GenerateResult {
  text: string;
  provider: ProviderId;
  model: string;
}

/** Default per-request timeout; overridable via env for ops/testing. */
function timeoutMs(): number {
  const raw = process.env.AI_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25_000;
}

/** Pulls a loggable status + message out of an unknown error (OpenAI SDK errors carry
 *  `status` and `message`; aborts/timeouts carry a name). */
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
 * The single OpenAI-compatible adapter. No provider-specific branching — any provider
 * that speaks the Chat Completions API works by config alone. Hard-bounded by a
 * per-request AbortController timeout.
 */
async function callProvider(config: ProviderConfig, input: GenerateInput): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    // We own the retry/fallback policy; don't let the SDK retry silently.
    maxRetries: 0,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const completion = await client.chat.completions.create(
      { model: config.model, messages: input.messages },
      { signal: controller.signal }
    );
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Provider returned an empty completion.');
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Produce a reply using the active provider, falling back to the secondary once if the
 * active one errors or times out. Throws only if BOTH providers fail.
 */
export async function generateReply(input: GenerateInput): Promise<GenerateResult> {
  const activeId = getActiveProviderId();
  const secondaryId = getSecondaryProviderId(activeId);

  // 1) Try the active provider.
  try {
    const config = loadProviderConfig(activeId);
    const text = await callProvider(config, input);
    return { text, provider: activeId, model: config.model };
  } catch (activeError) {
    // Log the REAL error server-side before falling back (so a hidden 401/404/timeout
    // is visible in Vercel logs), then continue to the secondary.
    console.error(
      `[gateway] active provider "${activeId}" failed (${describeError(activeError)}) — falling back to "${secondaryId}".`
    );
  }

  // 2) Fallback: try the secondary provider exactly once.
  try {
    const config = loadProviderConfig(secondaryId);
    const text = await callProvider(config, input);
    return { text, provider: secondaryId, model: config.model };
  } catch (secondaryError) {
    console.error(
      `[gateway] secondary provider "${secondaryId}" also failed (${describeError(secondaryError)}).`
    );
    throw new Error('AI_UNAVAILABLE');
  }
}
