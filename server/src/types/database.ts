/**
 * database.ts — backend types for the Supabase schema (matches the SQL migrations).
 * Used to type the Supabase client so queries are checked against real columns.
 */

import type { Character, CharacterProfile } from './character';

type Timestamptz = string;

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
  created_at?: Timestamptz;
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
      conversations: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          created_at: Timestamptz;
          updated_at: Timestamptz;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          created_at?: Timestamptz;
          updated_at?: Timestamptz;
        };
        Update: { updated_at?: Timestamptz };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: Timestamptz;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: Timestamptz;
        };
        Update: Partial<{ content: string }>;
        Relationships: [];
      };
      memory_summaries: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          summary: string;
          message_count: number;
          updated_at: Timestamptz;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          summary?: string;
          message_count?: number;
          updated_at?: Timestamptz;
        };
        Update: Partial<{ summary: string; message_count: number; updated_at: Timestamptz }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
