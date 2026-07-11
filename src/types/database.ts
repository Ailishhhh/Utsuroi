/**
 * database.ts — types describing our Supabase database schema.
 *
 * Phase 1 has no application tables yet (auth uses Supabase's built-in `auth.users`),
 * so this is an intentionally empty placeholder that still satisfies the typing that
 * `createClient<Database>()` expects.
 *
 * Once we add real tables, REPLACE this file with generated types:
 *     npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * That keeps our client types in sync with the actual schema automatically.
 */
export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
