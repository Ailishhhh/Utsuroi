/**
 * conversation.ts — conversation lifecycle: find-or-create, and the "open" flow that
 * seeds a new conversation with the character's static greeting and returns the
 * displayable message history.
 *
 * All DB access uses the caller-scoped Supabase client, so RLS keeps a user to their
 * own rows. The greeting is trusted hand-written text — it is inserted and returned
 * directly, never routed through the model or the safety layer.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types/database';

/** A message as returned to the app for display. */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface OpenFailure {
  error: string;
  status: number;
}

/**
 * Finds the single (user, character) conversation, creating it if absent.
 * Returns its id and whether it was just created, or null on failure.
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient<Database>,
  userId: string,
  characterId: string
): Promise<{ id: string; created: boolean } | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .maybeSingle();
  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, character_id: characterId })
    .select('id')
    .single();
  if (error || !created) {
    return null;
  }
  return { id: created.id, created: true };
}

/**
 * Opens a conversation: find-or-create it, seed a brand-new one with the character's
 * greeting (as a flagged:false assistant message — no model, no safety, no cost), and
 * return the displayable history in chronological order.
 *
 * Flagged (crisis) turns are stored but EXCLUDED from what's returned — a returning user
 * must never reopen a chat to their own crisis message replayed as a bubble.
 */
export async function openConversation(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  characterId: string;
}): Promise<{ messages: ConversationMessage[] } | OpenFailure> {
  const { supabase, userId, characterId } = params;

  const { data: character, error: charErr } = await supabase
    .from('characters')
    .select('id, greeting')
    .eq('id', characterId)
    .eq('is_active', true)
    .single();
  if (charErr || !character) {
    return { error: 'That companion could not be found.', status: 404 };
  }

  const conversation = await getOrCreateConversation(supabase, userId, characterId);
  if (!conversation) {
    return { error: 'Could not open the conversation.', status: 500 };
  }

  // Seed a new conversation with the static greeting (trusted text — no model/safety).
  if (conversation.created && character.greeting && character.greeting.trim()) {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      user_id: userId,
      role: 'assistant',
      content: character.greeting,
      flagged: false,
    });
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversation.id)
    .eq('flagged', false)
    .order('created_at', { ascending: true });

  return { messages: (messages ?? []) as ConversationMessage[] };
}
