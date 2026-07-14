/**
 * safety.ts — the crisis/safety layer that wraps every model call.
 *
 * Two lines of defense live here:
 *   1. A deterministic, keyword-first crisis detector (pre-check on user input,
 *      post-check on model output). It is intentionally high-precision on genuine
 *      self-harm/suicide phrasing and avoids everyday hyperbole ("dying to see it",
 *      "this is killing me") so the feature stays trustworthy and non-noisy.
 *   2. generateSafeReply(), the ONLY sanctioned way to produce a reply: it pre-checks
 *      the user's message (short-circuiting to real help WITHOUT calling the model if
 *      someone is in crisis), calls the gateway, then post-checks the output.
 *
 * TRACKED DEBT (near-term fast-follow, per founder): add an LLM-based crisis classifier
 * as a second detection pass for the subtler/ambiguous cases the keyword layer misses.
 * The model's own behavior (global safety preamble, M2.8) is a further guard on output.
 *
 * Crisis resources ship from day one for the launch market (India) and the US, plus a
 * generic local-emergency prompt.
 */

import { generateReply, type GenerateInput } from './ai/gateway';
import type { ProviderId } from './ai/providers';

/** A crisis helpline / resource, structured so the app can render it distinctly. */
export interface CrisisResource {
  region: string;
  name: string;
  contact: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { region: 'India', name: 'Tele-MANAS (mental health helpline)', contact: '14416 or 1-800-891-4416' },
  { region: 'US', name: '988 Suicide & Crisis Lifeline', contact: 'call or text 988' },
  {
    region: 'Anywhere',
    name: 'Emergency services',
    contact: 'if you may be in immediate danger, contact your local emergency number right away',
  },
];

/** The message shown when a crisis is detected. Warm, honest about being an AI, never
 *  minimizing, and pointing to real help. */
export const CRISIS_MESSAGE = [
  "I'm going to step out of character for a moment, because what you just shared really matters to me.",
  "I'm an AI companion, so I can't give you the kind of support you deserve right now — but people who can are a call or message away:",
  '• India — Tele-MANAS: 14416 or 1-800-891-4416',
  '• US — 988 Suicide & Crisis Lifeline: call or text 988',
  '• Anywhere — if you might be in immediate danger, please contact your local emergency services.',
  "You don't have to carry this alone, and reaching out is a strong, worthwhile thing to do. I'll be right here when you're ready.",
].join('\n');

/** Shown to users at the start of a session (rendered by the app in M2.11b). */
export const AI_DISCLOSURE =
  "Utsuroi is an AI companion — not a real person, and not a substitute for professional, medical, or crisis help. If you're ever in danger or crisis, please reach out to a real person or a helpline.";

/**
 * High-precision crisis phrasings. Kept specific on purpose: "kill myself" is a signal,
 * "this is killing me" is not. Ambiguous cases are deferred to the LLM-classifier
 * fast-follow rather than flagged here.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(?:ing)?\s+my\s?self\b/i,
  /\bkms\b/i,
  /\bend(?:ing)?\s+(?:it\s+all|my\s+life)\b/i,
  /\b(?:want|wanna)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(?:live|be\s+here|exist|wake\s+up)\b/i,
  /\bno\s+(?:reason|point)\s+(?:to|in)\s+(?:live|living|go(?:ing)?\s+on)\b/i,
  /\bbetter\s+off\s+(?:dead|without\s+me)\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\b(?:hurt|harm|cut|cutting)\s+my\s?self\b/i,
  /\bhang\s+my\s?self\b/i,
  /\boverdos/i,
  /\btake\s+my\s+(?:own\s+)?life\b/i,
  /\bwish\s+i\s+(?:was|were)\s+(?:dead|never\s+born)\b/i,
];

/**
 * Second-person / encouragement patterns — the danger in MODEL OUTPUT is the model
 * telling the user to harm themselves ("kill yourself", "you should die"). The
 * first-person CRISIS_PATTERNS above don't cover this, so model output is checked
 * against both sets.
 */
const HARM_OUTPUT_PATTERNS: RegExp[] = [
  /\bkys\b/i,
  /\bkill\s+(?:your\s?self|urself)\b/i,
  /\b(?:hurt|harm|cut|hang)\s+(?:your\s?self|urself)\b/i,
  /\bend\s+your\s+life\b/i,
  /\byou\s+should\s+(?:die|kill\s+your\s?self|be\s+dead)\b/i,
  /\byou'?d\s+be\s+better\s+off\s+dead\b/i,
  /\byou\s+deserve\s+to\s+die\b/i,
  /\b(?:nobody|no\s?one)\s+would\s+miss\s+you\b/i,
];

/** True if the text contains first-person crisis/self-harm language (user input). */
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

/** True if the text encourages the reader to harm themselves (guards model output). */
export function detectHarmfulOutput(text: string): boolean {
  if (!text) return false;
  return HARM_OUTPUT_PATTERNS.some((pattern) => pattern.test(text));
}

/** Pre-check on the user's message. */
export function checkUserInput(text: string): { crisis: boolean } {
  return { crisis: detectCrisis(text) };
}

/**
 * Post-check backstop on the model's output — trips on either first-person crisis
 * phrasing or second-person self-harm encouragement.
 */
export function checkModelOutput(text: string): { crisis: boolean } {
  return { crisis: detectCrisis(text) || detectHarmfulOutput(text) };
}

/** The outcome of a safe generation: either a normal reply or a crisis response. */
export type SafeReplyOutcome =
  | { kind: 'reply'; text: string; provider: ProviderId; model: string }
  | { kind: 'crisis'; text: string; resources: CrisisResource[] };

/**
 * The ONLY sanctioned way to produce a reply. Every endpoint must call this rather than
 * generateReply directly, so no path can skip the safety checks.
 */
export async function generateSafeReply(
  input: GenerateInput,
  opts: { userText: string }
): Promise<SafeReplyOutcome> {
  // Pre-check: never send crisis input to the model — surface real help immediately.
  if (detectCrisis(opts.userText)) {
    return { kind: 'crisis', text: CRISIS_MESSAGE, resources: CRISIS_RESOURCES };
  }

  const result = await generateReply(input);

  // Post-check backstop: catch first-person crisis OR second-person self-harm
  // encouragement in the model's output.
  if (checkModelOutput(result.text).crisis) {
    return { kind: 'crisis', text: CRISIS_MESSAGE, resources: CRISIS_RESOURCES };
  }

  return { kind: 'reply', text: result.text, provider: result.provider, model: result.model };
}
