/**
 * gateway.ts — the AI Gateway.
 *
 * This is the ONLY thing callers use to get a model reply. They pass conversation
 * context and get text back — they never name a provider or model (those come from
 * config via the registry). One OpenAI-compatible adapter serves every provider by
 * swapping baseURL + apiKey + model.
 *
 * Kept deliberately thin so the chat-flow milestone can wrap safety checks around
 * `generateReply` (pre-check the input, post-check the output) without touching this.
 *
 * M2.4: single active provider. M2.5 adds a one-shot fallback to the secondary.
 */

import OpenAI from 'openai';

import { getActiveProviderId, loadProviderConfig, type ProviderConfig } from './providers';

/** A single conversation turn. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Everything the gateway needs to produce a reply. */
export interface GenerateInput {
  messages: ChatMessage[];
}

/** The gateway's result — the reply text plus which provider/model produced it. */
export interface GenerateResult {
  text: string;
  provider: ProviderId_;
  model: string;
}

// Re-export type locally to keep the public result shape self-contained.
type ProviderId_ = ProviderConfig['id'];

/** How long to wait on a single provider before giving up. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * The one OpenAI-compatible adapter. Any provider that implements the Chat Completions
 * API works here — there is no provider-specific branching.
 */
async function callProvider(config: ProviderConfig, input: GenerateInput): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    // We control retries/fallback ourselves (M2.5); don't let the SDK silently retry.
    maxRetries: 0,
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: input.messages,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Provider returned an empty completion.');
  }
  return text;
}

/**
 * Produce a reply for the given conversation context using the active provider.
 * (M2.5 will add: on failure/timeout, try the secondary provider once.)
 */
export async function generateReply(input: GenerateInput): Promise<GenerateResult> {
  const activeId = getActiveProviderId();
  const config = loadProviderConfig(activeId);
  const text = await callProvider(config, input);
  return { text, provider: config.id, model: config.model };
}
