/**
 * chat.ts — app-side client for the Utsuroi chat backend.
 *
 * Calls POST {apiBaseUrl}/api/chat with the user's Supabase session token as a Bearer
 * (the backend verifies it and runs everything under RLS). No provider/model/prompt
 * details live here — the backend owns all of that. Friendly errors only; nothing raw.
 */

import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { ChatResponse } from '@/types/chat';

export type SendMessageResult = { data: ChatResponse; error: null } | { data: null; error: string };

/** Sends a message to a character and returns the reply (or a crisis payload). */
export async function sendMessage(
  characterId: string,
  message: string
): Promise<SendMessageResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { data: null, error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ characterId, message }),
    });

    const json = (await response.json().catch(() => null)) as
      (ChatResponse & { error?: string }) | null;

    if (!response.ok || !json) {
      return { data: null, error: json?.error ?? 'Something went wrong. Please try again.' };
    }
    return { data: json, error: null };
  } catch {
    return { data: null, error: "Couldn't reach the server. Check your connection and try again." };
  }
}
