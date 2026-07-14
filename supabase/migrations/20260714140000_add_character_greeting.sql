-- 20260714140000_add_character_greeting.sql
-- Static, hand-written opening greeting per character. Inserted as the first message of
-- a newly-created conversation (never runs through the model or safety layer). Nullable:
-- a character with no greeting simply gets no opening message.

alter table public.characters
  add column if not exists greeting text;
