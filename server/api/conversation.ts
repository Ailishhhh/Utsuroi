import type { VercelRequest, VercelResponse } from '@vercel/node';

import { authenticate, bearerFromHeader } from '../src/auth';
import { openConversation } from '../src/conversation';

/**
 * POST /api/conversation — open (find-or-create) the caller's conversation with a
 * character. A brand-new conversation is seeded with the character's static greeting.
 *
 * Auth: Authorization: Bearer <supabase access token>.
 * Body: { characterId: string }.
 * Returns: { messages: [{ id, role, content, created_at }] } in chronological order,
 * excluding flagged (crisis) turns.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const auth = await authenticate(bearerFromHeader(req.headers.authorization));
  if (!auth) {
    res.status(401).json({ error: 'A valid session is required.' });
    return;
  }

  const body = (req.body ?? {}) as { characterId?: unknown };
  const characterId = typeof body.characterId === 'string' ? body.characterId : '';
  if (!characterId) {
    res.status(400).json({ error: 'characterId is required.' });
    return;
  }

  const result = await openConversation({
    supabase: auth.supabase,
    userId: auth.userId,
    characterId,
  });

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(200).json({ messages: result.messages });
}
