-- ════════════════════════════════════════════════════
--  Team Claude — Supabase Schema  (v2)
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── Workspaces (editable from the UI) ─────────────
create table if not exists workspaces (
  id          text        primary key,           -- slug, e.g. "marketing"
  label       text        not null,              -- display name
  color       text        not null default '#888780',
  prompt      text        not null default '',   -- system prompt for Claude
  sort_order  integer     not null default 0,
  created_at  timestamptz default now()
);

-- Seed the 7 default workspaces (skip if already exist)
insert into workspaces (id, label, color, prompt, sort_order) values
  ('marketing',  'Marketing & Content',
   '#CF5C7E',
   'You are an expert marketing and content strategist for a professional team. Help with campaigns, copywriting, audience research, social media, brand voice, and content planning. Be creative and results-focused.',
   1),
  ('dev',        'Development / Tech',
   '#4A9EE0',
   'You are a senior software engineer. Help with code reviews, architecture decisions, debugging, best practices, and technical documentation. Give clear, working code examples.',
   2),
  ('ops',        'Operations',
   '#2BAE8E',
   'You are an operations and process expert. Help with SOPs, checklists, workflow optimisation, resource planning, and process documentation. Be structured and practical.',
   3),
  ('client',     'Client Work',
   '#E0943A',
   'You are a professional account manager and client success expert. Help with client communications, proposals, meeting notes, briefs, and relationship management. Be professional and clear.',
   4),
  ('leadership', 'Leadership',
   '#9B8AE0',
   'You are a strategic business advisor. Help with OKRs, strategy, decision-making frameworks, team management, and leadership challenges. Be strategic and insightful.',
   5),
  ('general',    'General / Experiments',
   '#8A8680',
   'You are a helpful, knowledgeable AI assistant. Help with any task clearly and thoroughly.',
   6),
  ('events',     'Upcoming Events',
   '#E07050',
   'You are an expert event planner and coordinator. Help with event planning, timelines, vendor management, logistics, guest communications, and run-of-show documents.',
   7)
on conflict (id) do nothing;

-- ── Conversations ─────────────────────────────────
create table if not exists conversations (
  id            uuid        default uuid_generate_v4() primary key,
  title         text        not null default 'New conversation',
  workspace     text        not null default 'general',
  author_name   text        not null,
  author_color  text        not null default '#D97757',
  preview       text        default '',
  message_count integer     default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Messages ──────────────────────────────────────
create table if not exists messages (
  id               uuid        default uuid_generate_v4() primary key,
  conversation_id  uuid        not null references conversations(id) on delete cascade,
  role             text        not null check (role in ('user', 'assistant')),
  content          text        not null default '',
  author_name      text,
  author_color     text,
  created_at       timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────
create index if not exists idx_convs_updated   on conversations(updated_at desc);
create index if not exists idx_convs_workspace on conversations(workspace);
create index if not exists idx_msgs_conv       on messages(conversation_id, created_at asc);
create index if not exists idx_ws_sort         on workspaces(sort_order asc);

-- ── Auto-update updated_at ────────────────────────
create or replace function _update_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists convs_updated_at on conversations;
create trigger convs_updated_at
  before update on conversations
  for each row execute function _update_timestamp();

-- ── Row Level Security (open — internal team tool) ─
alter table conversations enable row level security;
alter table messages       enable row level security;
alter table workspaces     enable row level security;

drop policy if exists "open_conversations" on conversations;
drop policy if exists "open_messages"      on messages;
drop policy if exists "open_workspaces"    on workspaces;

create policy "open_conversations" on conversations for all using (true) with check (true);
create policy "open_messages"      on messages       for all using (true) with check (true);
create policy "open_workspaces"    on workspaces     for all using (true) with check (true);

-- ── Realtime ──────────────────────────────────────
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table workspaces;
