/**
 * config.ts — typed, validated access to environment configuration.
 *
 * The rest of the app imports `config` from here and NEVER reads `process.env`
 * directly. That keeps env access in one place and lets us fail loudly (see below)
 * instead of letting an `undefined` leak deep into the app.
 *
 * ---------------------------------------------------------------------------
 * WHERE VALUES COME FROM
 * ---------------------------------------------------------------------------
 * - Local development: put values in `.env.local` (gitignored). See `.env.example`
 *   for the list of required variables. Expo loads `.env.local` automatically.
 * - Production mobile builds (EAS): store each variable as an EAS secret, e.g.
 *     eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
 * - Backend / web functions (Vercel): set variables in the Vercel project's
 *   Environment Variables dashboard. Never commit real values anywhere.
 *
 * ---------------------------------------------------------------------------
 * WHY THE `EXPO_PUBLIC_` PREFIX IS SAFE HERE
 * ---------------------------------------------------------------------------
 * `EXPO_PUBLIC_*` variables are embedded in the client bundle and are readable by
 * anyone with the app. That is fine for the Supabase project URL and the *anon*
 * (publishable) key, which are meant to be public and are protected by Row-Level
 * Security. NEVER put the Supabase `service_role` key (or any true secret) behind
 * an `EXPO_PUBLIC_` name — it would ship to every user.
 */

// Expo statically inlines `process.env.EXPO_PUBLIC_*` at build time, but ONLY for
// direct member access like below. Do not access these via a dynamic key.
const RAW = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
} as const;

/**
 * Returns the value of a required env var, or throws a clear, actionable error if
 * it is missing or blank. Failing here (at startup) is intentional — a misconfigured
 * environment should be impossible to miss.
 */
function requireEnv(name: keyof typeof RAW): string {
  const value = RAW[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[config] Missing required environment variable "${name}".\n` +
        `Add it to .env.local (copy .env.example and fill it in). ` +
        `For production set it as an EAS secret (mobile) or in the Vercel dashboard (backend).`
    );
  }
  return value;
}

/** The shape of validated app configuration. All fields are guaranteed present. */
export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validated configuration. Importing this module runs validation immediately, so a
 * missing variable throws at startup rather than at some later, confusing moment.
 */
export const config: AppConfig = {
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
};
