/**
 * character.ts — domain types for the companion characters.
 *
 * These mirror the `characters` table (see supabase/migrations) and the shape of its
 * `profile` jsonb column. Field names are snake_case to match the database exactly, so
 * rows returned by Supabase map directly with no renaming (and so they line up with
 * `supabase gen types` output if we adopt it later).
 *
 * The authored source of truth for the content is docs/characters/*.md.
 */

/** One few-shot example of how a character responds. */
export interface SampleExchange {
  user: string;
  reply: string;
}

/** How a character writes, broken down by mood/context. Fields are optional because
 *  not every character defines every register. */
export interface SpeechPattern {
  rhythm?: string;
  verbal_tics?: string;
  happy?: string;
  tired_low?: string;
  teasing?: string;
  something_wrong?: string;
  punctuation?: string;
}

/** The rich persona detail stored in the `profile` jsonb column. */
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

/** A full character row as stored in and returned from the database. */
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
