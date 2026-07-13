/**
 * providers.ts — the AI provider registry.
 *
 * Both providers speak the OpenAI Chat Completions format, so they are pure config:
 * baseURL + apiKey + model. Adding/removing/switching a provider is a config/env
 * change, never new code. Model IDs differ per provider and live HERE, never in the
 * gateway logic.
 *
 * `AI_ACTIVE_PROVIDER` selects the active provider. Only the provider actually being
 * used is validated, so unrelated providers' env vars can be absent (e.g. OpenRouter
 * is not required until the M2.5 fallback).
 */

import { requireEnv } from '../env.ts';

export type ProviderId = 'bluesminds' | 'openrouter';

export interface ProviderConfig {
  id: ProviderId;
  baseURL: string;
  apiKey: string;
  model: string;
}

/** Which env vars configure each provider. */
const PROVIDER_ENV: Record<ProviderId, { apiKey: string; baseURL: string; model: string }> = {
  bluesminds: {
    apiKey: 'BLUESMINDS_API_KEY',
    baseURL: 'BLUESMINDS_BASE_URL',
    model: 'BLUESMINDS_MODEL',
  },
  openrouter: {
    apiKey: 'OPENROUTER_API_KEY',
    baseURL: 'OPENROUTER_BASE_URL',
    model: 'OPENROUTER_MODEL',
  },
};

/** The provider selected by AI_ACTIVE_PROVIDER. */
export function getActiveProviderId(): ProviderId {
  const raw = requireEnv('AI_ACTIVE_PROVIDER');
  if (raw !== 'bluesminds' && raw !== 'openrouter') {
    throw new Error(
      `[ai] AI_ACTIVE_PROVIDER must be "bluesminds" or "openrouter", but was "${raw}".`
    );
  }
  return raw;
}

/** The other provider — used as the fallback target (wired in M2.5). */
export function getSecondaryProviderId(active: ProviderId): ProviderId {
  return active === 'bluesminds' ? 'openrouter' : 'bluesminds';
}

/** Resolves a provider's config from its env vars (validated on demand). */
export function loadProviderConfig(id: ProviderId): ProviderConfig {
  const names = PROVIDER_ENV[id];
  return {
    id,
    apiKey: requireEnv(names.apiKey),
    baseURL: requireEnv(names.baseURL),
    model: requireEnv(names.model),
  };
}
