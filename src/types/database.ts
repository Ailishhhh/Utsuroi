/**
 * database.ts — types describing our Supabase database schema.
 *
 * Phase 1 has no application tables yet (auth uses Supabase's built-in `auth.users`),
 * so this is an intentionally empty placeholder that still satisfies the typing that
 * `createClient<Database>()` expects.
 *
 * As the schema grows we can switch to fully generated types:
 *     npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * For now the tables are hand-written to match the SQL migrations exactly.
 */
import type { Character, CharacterProfile } from '@/types/character';

/** Columns clients may set when inserting a character (seeding is done via SQL, but
 *  the type documents the writable shape). Server-defaulted columns are optional. */
type CharacterInsert = {
  id?: string;
  slug: string;
  name: string;
  essence: string;
  category_tag: string;
  persona_lean?: string | null;
  sort_order?: number;
  is_active?: boolean;
  profile: CharacterProfile;
  greeting?: string | null;
  created_at?: string;
};

export interface Database {
  public: {
    Tables: {
      characters: {
        Row: Character;
        Insert: CharacterInsert;
        Update: Partial<CharacterInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
