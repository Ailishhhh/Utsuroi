import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/health — liveness check for the Utsuroi backend.
 *
 * Intentionally trivial: no auth, no env, no dependencies. Its only job is to prove
 * the Vercel deploy + function routing work before we add any AI logic or credits.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: 'utsuroi-server',
    timestamp: new Date().toISOString(),
  });
}
