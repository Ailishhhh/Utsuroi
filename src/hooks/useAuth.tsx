/**
 * useAuth.tsx — the app's authentication state, provided via React Context.
 *
 * Responsibilities:
 * - Load the existing session on mount (so a returning user stays signed in).
 * - Subscribe to Supabase auth changes so `session` is always current (this is also
 *   how sign-in/out/refresh propagate — the methods below don't set session by hand).
 * - Expose the auth operations from services/auth.ts to the UI.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  type AuthResult,
} from '@/services/auth';

interface AuthContextValue {
  /** Current session, or null when signed out. */
  session: Session | null;
  /** True until the initial session lookup completes (used to gate navigation). */
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1) Load any persisted session once at startup.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 2) Keep session in sync for all future changes (sign in/out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth state and actions. Throws if used outside an AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
