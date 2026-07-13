/**
 * env.ts — server-side environment access.
 *
 * Server-only: these values (API keys, provider config) must NEVER reach the app
 * bundle. In production they live in the Vercel project's Environment Variables; for
 * local `vercel dev`, in server/.env.local. Missing required vars fail loudly.
 */

/** Returns a required env var, or throws a clear error naming what's missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable "${name}". ` +
        `Set it in the Vercel project settings (or server/.env.local for local dev).`
    );
  }
  return value;
}
