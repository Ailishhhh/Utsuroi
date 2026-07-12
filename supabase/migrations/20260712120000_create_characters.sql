-- 20260712120000_create_characters.sql
-- Creates the `characters` catalog table with Row-Level Security enabled from day one.
--
-- Characters are authored in docs/characters/*.md (the human source of truth) and
-- seeded into this table via supabase/seed.sql.

create table if not exists public.characters (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  essence      text not null,
  category_tag text not null,
  persona_lean text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  profile      jsonb not null,
  created_at   timestamptz not null default now()
);

comment on table public.characters is
  'Companion characters. Authored in docs/characters/*.md. profile jsonb holds persona detail: age_presented, backstory, personality, speech_pattern, never_say, signature_trait, sample_exchanges, safety_notes.';

-- Row-Level Security: on from creation (Utsuroi rule — every table gets RLS immediately).
alter table public.characters enable row level security;

-- Signed-in users may READ the catalog. There is intentionally no write policy for the
-- anon/authenticated roles, so client-side inserts/updates/deletes are blocked. Seeding
-- and edits happen only with elevated privileges (service_role / SQL editor), which
-- bypass RLS.
drop policy if exists "Authenticated users can read characters" on public.characters;
create policy "Authenticated users can read characters"
  on public.characters
  for select
  to authenticated
  using (true);
