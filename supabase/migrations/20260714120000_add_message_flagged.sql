-- 20260714120000_add_message_flagged.sql
-- Marks crisis turns so they can be excluded from the recent-history window replayed
-- to the model. Crisis messages (the user message that tripped the safety layer and the
-- crisis response) are still STORED — just not replayed as normal conversational context,
-- which otherwise makes later benign messages read oddly.

alter table public.messages
  add column if not exists flagged boolean not null default false;
