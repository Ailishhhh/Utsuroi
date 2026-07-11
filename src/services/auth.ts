/**
 * auth.ts — authentication business logic.
 *
 * This is the layer between the UI and Supabase. It contains NO React and NO UI:
 * screens/hooks call these functions, which call `supabase.auth`. Keeping it here
 * means auth rules live in one place and screens stay thin (Clean Architecture).
 *
 * Every function returns an `AuthResult` with a user-friendly `error` (or null on
 * success) — we never surface raw Supabase error strings to users.
 */

import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';

// Required for the web OAuth popup to hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

/** Result of an auth operation. `error` is a user-facing message, or null on success. */
export interface AuthResult {
  error: string | null;
  /** Optional non-error info to show the user (e.g. "check your email"). */
  info?: string;
}

// ---------------------------------------------------------------------------
// Validation (Zod) — runs client-side before we ever hit the network.
// ---------------------------------------------------------------------------

const emailSchema = z.email('Enter a valid email address.');

/** Sign-in only checks presence; sign-up enforces our password policy. */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// ---------------------------------------------------------------------------
// Error mapping — turn Supabase errors into calm, human messages.
// ---------------------------------------------------------------------------

/**
 * Maps a raw Supabase auth error message to something a user should see. Unknown
 * errors fall back to a generic message; the raw error is logged in dev for us.
 */
function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox, then sign in.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('network')) {
    return 'Network problem. Check your connection and try again.';
  }

  if (__DEV__) {
    console.log('[auth] unmapped error:', message);
  }
  return 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/** Sign in with email + password. Session updates flow through onAuthStateChange. */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? mapAuthError(error.message) : null };
}

/**
 * Create an account with email + password. If the Supabase project requires email
 * confirmation, no session is returned yet — we tell the user to check their inbox.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: mapAuthError(error.message) };
  }
  // No session + a user means email confirmation is enabled on the project.
  if (!data.session && data.user) {
    return { error: null, info: 'Check your email to confirm your account, then sign in.' };
  }
  return { error: null };
}

/**
 * Sign in with Google via the browser-based OAuth flow (works in Expo Go).
 *
 * Flow: ask Supabase for the provider URL → open it in an auth session browser →
 * on redirect back, exchange the returned `code` for a session (PKCE). The session
 * is then persisted and picked up by onAuthStateChange.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectTo = AuthSession.makeRedirectUri();

    if (__DEV__) {
      // Handy for configuring Supabase's allowed redirect URLs.
      console.log('[auth] Google redirectTo:', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    if (!data.url) {
      return { error: 'Could not start Google sign-in. Please try again.' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      // User dismissed/cancelled — not an error worth alarming them about.
      return { error: null };
    }

    // Parse via expo-linking (React Native's URL.searchParams is unreliable on Hermes).
    const { queryParams } = Linking.parse(result.url);
    const rawCode = queryParams?.code;
    const code = typeof rawCode === 'string' ? rawCode : null;
    if (!code) {
      return { error: 'Google sign-in did not complete. Please try again.' };
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError ? mapAuthError(exchangeError.message) : null };
  } catch (e) {
    if (__DEV__) {
      console.log('[auth] google sign-in threw:', e);
    }
    return { error: 'Something went wrong with Google sign-in. Please try again.' };
  }
}

/** Sign out of the current session. */
export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? mapAuthError(error.message) : null };
}
