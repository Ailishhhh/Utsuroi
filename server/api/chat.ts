import type { VercelRequest, VercelResponse } from '@vercel/node';

import { authenticate, bearerFromHeader } from '../src/auth';
import { handleChat } from '../src/chat';
import type { PersonaLean } from '../src/prompt';

/**
 * POST /api/chat — send a message to a character and get a safe, in-character reply.
 *
 * Auth: Authorization: Bearer <supabase access token>.
 * Body: { characterId: string, message: string, persona?: 'friend'|'mentor'|'romantic' }.
 * Returns: { reply, provider, model } | { reply, safety: 'crisis', resources }.
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

  const body = (req.body ?? {}) as { characterId?: unknown; message?: unknown; persona?: unknown };
  const characterId = typeof body.characterId === 'string' ? body.characterId : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const persona = isPersona(body.persona) ? body.persona : undefined;

  if (!characterId || !message) {
    res.status(400).json({ error: 'characterId and a non-empty message are required.' });
    return;
  }
  if (message.length > 4000) {
    res.status(400).json({ error: 'Message is too long.' });
    return;
  }

  const result = await handleChat({
    supabase: auth.supabase,
    userId: auth.userId,
    characterId,
    message,
    persona,
  });

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  if (result.kind === 'crisis') {
    res.status(200).json({ reply: result.reply, safety: 'crisis', resources: result.resources });
    return;
  }
  res.status(200).json({ reply: result.reply, provider: result.provider, model: result.model });
}

function isPersona(value: unknown): value is PersonaLean {
  return value === 'friend' || value === 'mentor' || value === 'romantic';
}
