/**
 * character.ts — backend copy of the character shape.
 *
 * Mirrors the app's src/types/character.ts and the `characters` table (snake_case to
 * match the DB row exactly). The backend and app are separate deployables, so this
 * type is duplicated rather than shared via a package — a deliberate, small cost to
 * avoid monorepo tooling. If the schema changes, update both.
 */

export interface SampleExchange {
  user: string;
  reply: string;
}

export interface SpeechPattern {
  rhythm?: string;
  verbal_tics?: string;
  happy?: string;
  tired_low?: string;
  teasing?: string;
  something_wrong?: string;
  punctuation?: string;
}

export interface CharacterProfile {
  age_presented: string;
  backstory: string;
  personality: string[];
  speech_pattern: SpeechPattern;
  never_say: string[];
  signature_trait: string;
  sample_exchanges: SampleExchange[];
  safety_notes: string;
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  essence: string;
  category_tag: string;
  persona_lean: string | null;
  sort_order: number;
  is_active: boolean;
  profile: CharacterProfile;
  created_at: string;
}
