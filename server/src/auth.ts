/**
 * auth.ts — verifies the caller's Supabase session.
 *
 * The AI endpoint is a spend boundary (it costs real credits), so every request must
 * carry a valid Supabase access token. This is access-control only — it is NOT the
 * content-safety layer (that wraps the gateway at the chat-flow milestone).
 */

import { createClient } from '@supabase/supabase-js';

import { requireEnv } from './env';

export interface AuthedUser {
  userId: string;
}

/**
 * Validates a Supabase access token (the JWT the app already holds after login).
 * Returns the user on success, or null if the token is missing/invalid/expired.
 */
export async function verifySupabaseToken(token: string): Promise<AuthedUser | null> {
  if (!token) {
    return null;
  }
  // A lightweight client is fine per request; we only use it to validate the token.
  const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'));
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return { userId: data.user.id };
}

/** Extracts a bearer token from an Authorization header value. */
export function bearerFromHeader(headerValue: string | undefined): string {
  if (!headerValue) return '';
  return headerValue.startsWith('Bearer ') ? headerValue.slice('Bearer '.length).trim() : '';
}
