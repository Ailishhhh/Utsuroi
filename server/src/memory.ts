/**
 * memory.ts — the rolling per-(user, character) memory summary.
 *
 * A single evolving text summary gives the companion continuity across sessions
 * (no vector DB). It's injected into the system prompt each turn and regenerated
 * every N messages (env-tunable, default 10) by summarizing the recent conversation
 * together with the previous memory.
 *
 * Summarization uses generateReply directly: it's an internal operation (the transcript
 * being summarized already passed the safety checks), not a user-facing reply. It's
 * awaited inline because serverless functions can't reliably finish fire-and-forget work
 * after the response is sent.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { generateReply, type ChatMessage } from './ai/gateway';
import type { Database } from './types/database';

const DEFAULT_MEMORY_EVERY_N = 10;

/** How many new messages trigger a memory refresh (tunable via env). */
function memoryEveryN(): number {
  const raw = process.env.AI_MEMORY_EVERY_N;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MEMORY_EVERY_N;
}

export interface MemoryRow {
  summary: string;
  message_count: number;
}

/** Reads the current memory summary for a (user, character), or null if none yet. */
export async function getMemory(
  supabase: SupabaseClient<Database>,
  userId: string,
  characterId: string
): Promise<MemoryRow | null> {
  const { data } = await supabase
    .from('memory_summaries')
    .select('summary, message_count')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .maybeSingle();
  return data ?? null;
}

/** Produces an updated memory from the previous memory + recent conversation. */
async function summarize(
  previousMemory: string,
  recent: { role: 'user' | 'assistant'; content: string }[],
  characterName: string
): Promise<string> {
  const transcript = recent
    .map((m) => `${m.role === 'user' ? 'User' : characterName}: ${m.content}`)
    .join('\n');

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You maintain a concise, evolving memory for an AI companion about the person it talks to. ' +
        'Given the previous memory and the recent conversation, write an updated memory capturing what ' +
        'matters: key facts about the user, how they seem to be feeling day to day, ongoing situations, ' +
        'and things they care about or are working toward. Write about the user in the third person. ' +
        'Be concise — a few short sentences up to a short paragraph. Output only the memory text, with ' +
        'no preamble.\n' +
        'CRITICAL SAFETY RULE: never record anything about self-harm, suicide, crisis, abuse, or the ' +
        "user's safety — not from the conversation and not carried over from the previous memory. If any " +
        'such content appears in the previous memory or the conversation, leave it out of the summary ' +
        'entirely. Never write that the companion should check on, follow up on, or worry about the ' +
        "user's safety or wellbeing. If nothing else is worth remembering, return a brief neutral summary.",
    },
    {
      role: 'user',
      content: `Previous memory:\n${previousMemory || '(none yet)'}\n\nRecent conversation:\n${transcript}\n\nUpdated memory:`,
    },
  ];

  const result = await generateReply({ messages });
  return result.text;
}

export interface RefreshMemoryParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  characterId: string;
  conversationId: string;
  currentMemory: MemoryRow | null;
  characterName: string;
}

/**
 * Regenerates the memory summary if at least N new messages have accumulated since the
 * last summary. Never throws — a memory hiccup must not break the chat turn.
 */
export async function maybeRefreshMemory(params: RefreshMemoryParams): Promise<void> {
  const { supabase, userId, characterId, conversationId, currentMemory, characterName } = params;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);
  const total = count ?? 0;
  const covered = currentMemory?.message_count ?? 0;

  if (total - covered < memoryEveryN()) {
    return;
  }

  const { data: recent } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .eq('flagged', false)
    .order('created_at', { ascending: false })
    .limit(40);
  const chronological = (recent ?? []).reverse();

  let newSummary: string;
  try {
    newSummary = await summarize(currentMemory?.summary ?? '', chronological, characterName);
  } catch (error) {
    console.error('[memory] summarization failed (skipping refresh):', error);
    return;
  }

  const { error: upsertErr } = await supabase.from('memory_summaries').upsert(
    {
      user_id: userId,
      character_id: characterId,
      summary: newSummary,
      message_count: total,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,character_id' }
  );
  if (upsertErr) {
    console.error('[memory] failed to store summary:', upsertErr);
  }
}
