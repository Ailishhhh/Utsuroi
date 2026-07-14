/**
 * chat.ts — orchestrates one chat turn.
 *
 * Load character -> load/create the (user, character) conversation -> pull recent
 * history -> build the system prompt -> generate a SAFE reply -> persist both the user
 * message and the reply. All DB access uses the caller-scoped Supabase client, so RLS
 * guarantees the user only ever touches their own rows.
 *
 * Memory-summary injection is layered in at M2.10.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ChatMessage } from './ai/gateway';
import { getMemory, maybeRefreshMemory } from './memory';
import { buildSystemPrompt, type PersonaLean } from './prompt';
import { generateSafeReply, type CrisisResource, type SafeReplyOutcome } from './safety';
import type { Database } from './types/database';

/** How many recent messages to include as live context (older context -> memory, M2.10). */
const HISTORY_LIMIT = 20;

export type ChatResult =
  | { kind: 'reply'; reply: string; provider: string; model: string }
  | { kind: 'crisis'; reply: string; resources: CrisisResource[] };

export interface ChatFailure {
  error: string;
  status: number;
}

export interface ChatParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  characterId: string;
  message: string;
  persona?: PersonaLean;
}

export async function handleChat(params: ChatParams): Promise<ChatResult | ChatFailure> {
  const { supabase, userId, characterId, message, persona } = params;

  // 1. Load the character (must exist and be active).
  const { data: character, error: charErr } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .eq('is_active', true)
    .single();
  if (charErr || !character) {
    return { error: 'That companion could not be found.', status: 404 };
  }

  // 2. Load or create the single ongoing conversation for this (user, character).
  let conversationId: string;
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .maybeSingle();
  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error: convErr } = await supabase
      .from('conversations')
      .insert({ user_id: userId, character_id: characterId })
      .select('id')
      .single();
    if (convErr || !created) {
      return { error: 'Could not start the conversation.', status: 500 };
    }
    conversationId = created.id;
  }

  // 3. Load the rolling memory summary (if any) for this (user, character).
  const memory = await getMemory(supabase, userId, characterId);

  // 4. Recent history (fetch newest N, then restore chronological order).
  const { data: recent } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  const history: ChatMessage[] = (recent ?? [])
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  // 5. Build the prompt (with memory) + assemble the message list.
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(character, { persona, memory: memory?.summary }) },
    ...history,
    { role: 'user', content: message },
  ];

  // 5. Generate a safe reply (crisis short-circuits inside; both providers may be
  //    tried). If generation fails entirely, don't persist a half-turn.
  let outcome: SafeReplyOutcome;
  try {
    outcome = await generateSafeReply({ messages }, { userText: message });
  } catch (error) {
    console.error('[chat] generation failed:', error);
    return { error: 'The companion is unavailable right now. Please try again.', status: 502 };
  }

  // 6. Persist the user message + the reply, and touch the conversation.
  const { error: insertErr } = await supabase.from('messages').insert([
    { conversation_id: conversationId, user_id: userId, role: 'user', content: message },
    { conversation_id: conversationId, user_id: userId, role: 'assistant', content: outcome.text },
  ]);
  if (insertErr) {
    console.error('[chat] failed to persist messages:', insertErr);
    // The reply was produced; surface it even if persistence hiccupped.
  }
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (outcome.kind === 'crisis') {
    // Don't fold crisis turns into memory — that's a safety moment, not character history.
    return { kind: 'crisis', reply: outcome.text, resources: outcome.resources };
  }

  // Refresh the rolling memory if enough new messages have accumulated (every N).
  await maybeRefreshMemory({
    supabase,
    userId,
    characterId,
    conversationId,
    currentMemory: memory,
    characterName: character.name,
  });

  return { kind: 'reply', reply: outcome.text, provider: outcome.provider, model: outcome.model };
}
