-- 20260714130000_memory_summaries_user_cascade.sql
-- Guarantee memory_summaries is wiped when the account (its auth.users row) is deleted,
-- regardless of the constraint's current state in a given database. Crisis-containing
-- summaries must never be left orphaned behind a deleted account.
--
-- Idempotent: drops the existing user_id FK (whatever its options) and re-adds it with
-- ON DELETE CASCADE.

alter table public.memory_summaries
  drop constraint if exists memory_summaries_user_id_fkey;

alter table public.memory_summaries
  add constraint memory_summaries_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
