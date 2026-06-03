-- ════════════════════════════════════════════════════
--  Team Claude — Schema v3 (Phase 2)
--  Run in: Supabase Dashboard → SQL Editor → New query
--
--  If upgrading from v2: run the ALTER TABLE section only.
--  If fresh install: run everything.
-- ════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── Workspaces ────────────────────────────────────────
create table if not exists workspaces (
  id          text        primary key,
  label       text        not null,
  color       text        not null default '#888780',
  prompt      text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz default now()
);

insert into workspaces (id, label, color, prompt, sort_order) values
  ('marketing',  'Marketing & Content',   '#CF5C7E', 'You are an expert marketing and content strategist. Help with campaigns, copywriting, audience research, and brand voice.', 1),
  ('dev',        'Development / Tech',    '#4A9EE0', 'You are a senior software engineer. Help with code, architecture, debugging, and technical documentation.', 2),
  ('ops',        'Operations',            '#2BAE8E', 'You are an operations expert. Help with SOPs, checklists, workflow optimisation, and process documentation.', 3),
  ('client',     'Client Work',           '#E0943A', 'You are a professional account manager. Help with client communications, proposals, and meeting notes.', 4),
  ('leadership', 'Leadership',            '#9B8AE0', 'You are a strategic business advisor. Help with OKRs, strategy, and leadership challenges.', 5),
  ('general',    'General / Experiments', '#8A8680', 'You are a helpful assistant. Help with any task clearly and thoroughly.', 6),
  ('events',     'Upcoming Events',       '#E07050', 'You are an expert event planner. Help with timelines, logistics, and guest communications.', 7)
on conflict (id) do nothing;

-- ── Conversations ─────────────────────────────────────
create table if not exists conversations (
  id             uuid        default uuid_generate_v4() primary key,
  title          text        not null default 'New conversation',
  workspace      text        not null default 'general',
  author_name    text        not null,
  author_color   text        not null default '#D97757',
  preview        text        default '',
  message_count  integer     default 0,
  -- Phase 2 additions
  owner_id       uuid        references auth.users(id) on delete set null,
  is_private     boolean     default false,
  model_used     text        default 'claude-sonnet-4-5',
  provider       text        default 'claude',
  is_model_locked boolean    default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── Messages ──────────────────────────────────────────
create table if not exists messages (
  id               uuid        default uuid_generate_v4() primary key,
  conversation_id  uuid        not null references conversations(id) on delete cascade,
  role             text        not null check (role in ('user', 'assistant')),
  content          text        not null default '',
  author_name      text,
  author_color     text,
  -- Phase 2 additions
  model_used       text,
  provider         text,
  created_at       timestamptz default now()
);

-- ── ALTER for existing v2 databases (safe to re-run) ──
alter table conversations add column if not exists owner_id       uuid references auth.users(id) on delete set null;
alter table conversations add column if not exists is_private     boolean default false;
alter table conversations add column if not exists model_used     text default 'claude-sonnet-4-5';
alter table conversations add column if not exists provider       text default 'claude';
alter table conversations add column if not exists is_model_locked boolean default false;
alter table messages      add column if not exists model_used     text;
alter table messages      add column if not exists provider       text;

-- ── Indexes ───────────────────────────────────────────
create index if not exists idx_convs_updated   on conversations(updated_at desc);
create index if not exists idx_convs_workspace on conversations(workspace);
create index if not exists idx_convs_owner     on conversations(owner_id);
create index if not exists idx_msgs_conv       on messages(conversation_id, created_at asc);
create index if not exists idx_ws_sort         on workspaces(sort_order asc);

-- ── Auto-update updated_at ────────────────────────────
create or replace function _update_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists convs_updated_at on conversations;
create trigger convs_updated_at
  before update on conversations
  for each row execute function _update_timestamp();

-- ── RLS ───────────────────────────────────────────────
alter table conversations enable row level security;
alter table messages       enable row level security;
alter table workspaces     enable row level security;

-- Drop old open policies
drop policy if exists "open_conversations" on conversations;
drop policy if exists "open_messages"      on messages;
drop policy if exists "open_workspaces"    on workspaces;

-- Conversations: visible if public OR you own it
create policy "select_conversations" on conversations for select
  using ( is_private = false OR owner_id = auth.uid() OR owner_id IS NULL );

create policy "insert_conversations" on conversations for insert
  with check (true);

create policy "update_conversations" on conversations for update
  using ( owner_id = auth.uid() OR owner_id IS NULL );

create policy "delete_conversations" on conversations for delete
  using ( owner_id = auth.uid() OR owner_id IS NULL );

-- Messages: visible if parent conversation is visible
create policy "select_messages" on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and ( c.is_private = false OR c.owner_id = auth.uid() OR c.owner_id IS NULL )
    )
  );

create policy "insert_messages" on messages for insert with check (true);
create policy "update_messages" on messages for update using (true);

-- Workspaces: open to all authenticated users
create policy "all_workspaces" on workspaces for all using (true) with check (true);

-- ── Realtime ──────────────────────────────────────────
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table workspaces;
