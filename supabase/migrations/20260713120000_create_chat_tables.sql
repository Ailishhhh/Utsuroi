-- 20260713120000_create_chat_tables.sql
-- Chat data model: conversations, messages, memory_summaries.
--
-- Row-Level Security is enabled on every table from creation. Each policy restricts
-- rows to their owner (user_id = auth.uid()). The backend queries Supabase with the
-- CALLER'S JWT, so these policies are the actual access enforcement — no service_role
-- key is used anywhere.

-- ---------------------------------------------------------------------------
-- conversations — one ongoing conversation per (user, character).
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, character_id)
);

alter table public.conversations enable row level security;

create policy "Users manage their own conversations"
  on public.conversations
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- messages — turns within a conversation. user_id is denormalized so every table
-- shares the same simple RLS rule.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

-- Fetch a conversation's turns in order.
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Users manage their own messages"
  on public.messages
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- memory_summaries — one rolling text summary per (user, character). No vectors.
-- message_count tracks how many messages the current summary covers (for the
-- "regenerate every N" cadence).
-- ---------------------------------------------------------------------------
create table if not exists public.memory_summaries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  character_id  uuid not null references public.characters (id) on delete cascade,
  summary       text not null default '',
  message_count integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (user_id, character_id)
);

alter table public.memory_summaries enable row level security;

create policy "Users manage their own memory summaries"
  on public.memory_summaries
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
