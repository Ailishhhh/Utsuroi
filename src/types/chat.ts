/**
 * chat.ts — types for the chat API response (mirrors the backend's /api/chat shape).
 */

/** A crisis helpline / resource returned by the backend safety layer. */
export interface CrisisResource {
  region: string;
  name: string;
  contact: string;
}

/** The /api/chat success response. `safety: 'crisis'` means the safety layer fired. */
export interface ChatResponse {
  reply: string;
  provider?: string;
  model?: string;
  safety?: 'crisis';
  resources?: CrisisResource[];
}
