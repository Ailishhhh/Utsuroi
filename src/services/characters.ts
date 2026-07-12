/**
 * characters.ts — data access for the companion characters.
 *
 * Business/data logic only: it talks to Supabase and returns typed results. No React,
 * no UI. Callers (the useCharacters hook) never see raw Supabase errors — those are
 * mapped to calm, user-facing messages, the same way the auth service does.
 */

import { supabase } from '@/lib/supabase';
import type { Character } from '@/types/character';

/** Result of a characters fetch. On failure, `data` is empty and `error` is a message. */
export interface CharactersResult {
  data: Character[];
  error: string | null;
}

/** Maps a raw Supabase error to a friendly message; logs the raw one in dev for us. */
function mapCharactersError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (__DEV__) {
    console.log('[characters] unmapped error:', message);
  }
  return "Couldn't load your companions right now. Please try again.";
}

/**
 * Fetches all active characters, ordered for display. Access is allowed by RLS to
 * signed-in users only (see the characters migration).
 */
export async function fetchCharacters(): Promise<CharactersResult> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: [], error: mapCharactersError(error.message) };
  }
  return { data: data ?? [], error: null };
}
