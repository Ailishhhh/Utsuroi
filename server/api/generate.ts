import type { VercelRequest, VercelResponse } from '@vercel/node';

import { type ChatMessage } from '../src/ai/gateway';
import { bearerFromHeader, verifySupabaseToken } from '../src/auth';
import { generateSafeReply } from '../src/safety';

/**
 * POST /api/generate — the AI Gateway's HTTP boundary.
 *
 * Requires a valid Supabase session (Authorization: Bearer <access_token>) so the
 * endpoint can't be used to burn credits anonymously. Body: { messages: ChatMessage[] }.
 * Returns { reply, provider, model }.
 *
 * Non-streaming by design for now. No provider/model is named by the caller.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  // --- Access control: valid Supabase session required ---
  const token = bearerFromHeader(req.headers.authorization);
  const user = await verifySupabaseToken(token);
  if (!user) {
    res.status(401).json({ error: 'A valid session is required.' });
    return;
  }

  // --- Validate the request body ---
  const body = (req.body ?? {}) as { messages?: unknown };
  if (!isValidMessages(body.messages)) {
    res.status(400).json({
      error: 'Body must include a non-empty "messages" array of { role, content }.',
    });
    return;
  }

  // --- Generate (through the safety wrapper — no path skips safety) ---
  // NOTE: this raw endpoint is superseded by /api/chat and is retired in M2.9.
  const lastUserMessage = [...body.messages].reverse().find((m) => m.role === 'user');
  try {
    const outcome = await generateSafeReply(
      { messages: body.messages },
      { userText: lastUserMessage?.content ?? '' }
    );
    if (outcome.kind === 'crisis') {
      res.status(200).json({ reply: outcome.text, safety: 'crisis', resources: outcome.resources });
    } else {
      res.status(200).json({ reply: outcome.text, provider: outcome.provider, model: outcome.model });
    }
  } catch (error) {
    console.error('[generate] gateway error:', error);
    res.status(502).json({ error: 'The AI provider could not be reached. Please try again.' });
  }
}

/** Narrows unknown input to a valid, non-empty ChatMessage[]. */
function isValidMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const msg = item as Record<string, unknown>;
    const roleOk = msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant';
    return roleOk && typeof msg.content === 'string';
  });
}
