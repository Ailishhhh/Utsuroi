/**
 * auth.ts — authenticate a request and hand back a user-scoped Supabase client.
 *
 * The endpoint is a spend + data boundary, so every request must carry a valid
 * Supabase access token. We build the Supabase client WITH that token as the
 * Authorization header, so all its queries run under Row-Level Security as that user
 * (decision: no service_role anywhere — RLS is the enforcement).
 *
 * This is access-control, NOT the content-safety layer (that's safety.ts).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { requireEnv } from './env';
import type { Database } from './types/database';

/** Extracts a bearer token from an Authorization header value. */
export function bearerFromHeader(headerValue: string | undefined): string {
  if (!headerValue) return '';
  return headerValue.startsWith('Bearer ') ? headerValue.slice('Bearer '.length).trim() : '';
}

export interface AuthContext {
  userId: string;
  /** Supabase client scoped to the caller — every query runs under their RLS. */
  supabase: SupabaseClient<Database>;
}

/**
 * Validates the token and returns the user + a user-scoped Supabase client, or null
 * if the token is missing/invalid/expired.
 */
export async function authenticate(token: string): Promise<AuthContext | null> {
  if (!token) {
    return null;
  }
  const supabase = createClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return { userId: data.user.id, supabase };
}
