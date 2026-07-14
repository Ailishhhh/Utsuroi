/**
 * character.ts — backend copy of the character shape.
 *
 * Mirrors the app's src/types/character.ts and the `characters` table (snake_case to
 * match the DB row exactly). The backend and app are separate deployables, so this
 * type is duplicated rather than shared via a package — a deliberate, small cost to
 * avoid monorepo tooling. If the schema changes, update both.
 */

// NOTE: these are `type` aliases (not `interface`) on purpose. supabase-js requires a
// table's Row to satisfy `Record<string, unknown>`, which object-literal `type`s do but
// `interface`s do not — using an interface here silently degrades the whole typed schema
// to `never`.

export type SampleExchange = {
  user: string;
  reply: string;
};

export type SpeechPattern = {
  rhythm?: string;
  verbal_tics?: string;
  happy?: string;
  tired_low?: string;
  teasing?: string;
  something_wrong?: string;
  punctuation?: string;
};

export type CharacterProfile = {
  age_presented: string;
  backstory: string;
  personality: string[];
  speech_pattern: SpeechPattern;
  never_say: string[];
  signature_trait: string;
  sample_exchanges: SampleExchange[];
  safety_notes: string;
};

export type Character = {
  id: string;
  slug: string;
  name: string;
  essence: string;
  category_tag: string;
  persona_lean: string | null;
  sort_order: number;
  is_active: boolean;
  profile: CharacterProfile;
  greeting: string | null;
  created_at: string;
};
