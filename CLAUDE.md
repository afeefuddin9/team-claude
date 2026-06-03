# CLAUDE.md — Team Claude Project Record

> Lead with Tribe · Internal AI Platform · Last updated: June 2026

---

## Project Status

| Phase   | Status         | Description                                        |
| ------- | -------------- | -------------------------------------------------- |
| Phase 1 | ✅ COMPLETE    | Core shared workspace — deployed, live, team-ready |
| Phase 2 | 🔨 IN PLANNING | Auth, private chats, multi-model AI, export/import |

---

## What is this project?

**Team Claude** is a shared AI workspace built for Lead with Tribe (7–12 members).
Started as a Claude-only shared chat tool. Growing into a full multi-model AI platform
with authentication, private conversations, and cross-platform chat import/export.

---

## ✅ Phase 1 — COMPLETED (June 2026)

### Delivered

- [x] 7 shared workspaces (Marketing, Dev, Ops, Client, Leadership, General, Events)
- [x] All conversations visible to the whole team automatically
- [x] Anyone can open and continue any teammate's conversation
- [x] Workspaces fully manageable from the UI (add/edit/delete — no code changes)
- [x] Real-time sync via Supabase Realtime
- [x] Claude.ai-inspired dark/light interface with streaming responses
- [x] Each workspace has its own Claude system prompt
- [x] Mobile responsive layout
- [x] Deployed to Vercel + Supabase connected
- [x] GitHub repo → auto-deploy on every push

### Infrastructure

| Service       | Account     | Region              | Plan                |
| ------------- | ----------- | ------------------- | ------------------- |
| Vercel        | afeefuddin9 | Global CDN          | Hobby (Free)        |
| Supabase      | team-claude | ap-south-1 (Mumbai) | Free tier           |
| GitHub        | afeefuddin9 | —                   | —                   |
| Anthropic API | —           | —                   | ⏳ Pending purchase |

### Supabase Project Details

- **Project ID:** bzlfsgzdlsmcsxovnsoz
- **Project URL:** https://bzlfsgzdlsmcsxovnsoz.supabase.co
- **Region:** South Asia (Mumbai) — ap-south-1

### Current Environment Variables (Vercel)

| Variable                        | Status                                 |
| ------------------------------- | -------------------------------------- |
| `ANTHROPIC_API_KEY`             | ⏳ Placeholder — update when purchased |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅ Set                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set                                 |
| `NEXT_PUBLIC_TEAM_NAME`         | ✅ Lead with Tribe                     |
| `CLAUDE_MODEL`                  | ✅ claude-sonnet-4-5                   |

---

## 🔨 Phase 2 — IN PLANNING (Starting June 2026)

### Scope

1. **Authentication** — @leadwithtribe.com email-only access
2. **Private conversations** — per-user privacy toggle
3. **Multi-model AI** — Claude + GPT-4o + Gemini + Meta Llama in one interface
4. **Export / Import** — export chats, import from other AI platforms, upload CLAUDE.md as knowledge base

### New Environment Variables Needed (Phase 2)

| Variable                    | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `OPENAI_API_KEY`            | GPT-4o / GPT-4                                      |
| `GOOGLE_GEMINI_API_KEY`     | Gemini Pro / Flash                                  |
| `META_LLAMA_API_KEY`        | Llama via Together.ai or Groq                       |
| `NEXT_PUBLIC_SUPABASE_URL`  | Already set ✅                                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Needed for auth admin operations (server-side only) |

### Database Changes (Phase 2)

New columns on `conversations`:

- `is_private` (boolean) — hide from other team members
- `owner_id` (uuid) — links to auth user
- `ai_model` (text) — which model was used e.g. `claude-sonnet-4-5`

New tables:

- `profiles` — stores name, colour, role per authenticated user
- `knowledge_base` — uploaded documents per workspace

New Supabase Auth:

- Magic link login restricted to @leadwithtribe.com domain
- RLS policies updated to respect privacy and ownership

---

## Tech Stack

| Layer        | Technology                       | Purpose                              |
| ------------ | -------------------------------- | ------------------------------------ |
| Frontend     | Next.js 14 + React 18            | UI framework                         |
| Styling      | Custom CSS (Claude.ai-inspired)  | Dark/light theme                     |
| Backend      | Next.js API Routes               | AI API proxies (all models)          |
| Database     | Supabase (PostgreSQL)            | Shared storage + realtime + auth     |
| Auth         | Supabase Auth                    | Email magic link, domain restriction |
| AI — Phase 1 | Anthropic Claude                 | Chat completions                     |
| AI — Phase 2 | Claude + OpenAI + Gemini + Llama | Multi-model                          |
| Hosting      | Vercel                           | Deployment + CDN                     |
| Source       | GitHub                           | Version control                      |

---

## File Structure (Phase 2 additions)

```
team-claude/
├── pages/
│   ├── index.js              ← Main app
│   ├── login.js              ← NEW: Auth screen (magic link)
│   ├── _app.js
│   └── api/
│       ├── chat.js           ← Updated: routes to correct AI model
│       ├── auth/             ← NEW: auth helpers
│       └── export.js         ← NEW: conversation export
├── lib/
│   ├── supabase.js
│   ├── models.js             ← NEW: model configs + routing
│   └── auth.js               ← NEW: auth helpers
├── middleware.js             ← NEW: protect routes, check auth
├── supabase/
│   ├── schema.sql            ← Phase 1 (already run ✅)
│   └── schema-phase2.sql     ← NEW: auth + privacy + profiles
├── styles/
│   └── globals.css
├── CLAUDE.md                 ← This file
└── README.md
```

---

## Useful Links

| Resource            | URL                                                 |
| ------------------- | --------------------------------------------------- |
| Live app            | _(add Vercel URL)_                                  |
| GitHub repo         | github.com/afeefuddin9/team-claude                  |
| Vercel dashboard    | vercel.com/afeefuddin9/team-claude                  |
| Supabase dashboard  | supabase.com/dashboard/project/bzlfsgzdlsmcsxovnsoz |
| Anthropic console   | console.anthropic.com                               |
| OpenAI console      | platform.openai.com                                 |
| Google AI Studio    | aistudio.google.com                                 |
| Together.ai (Llama) | api.together.xyz                                    |

---

## Change Log

| Date     | Phase   | Change                                                |
| -------- | ------- | ----------------------------------------------------- |
| Jun 2026 | Phase 1 | v1 — Initial build, 7 workspaces                      |
| Jun 2026 | Phase 1 | v2 — Dynamic workspaces from UI, placeholder API key  |
| Jun 2026 | Phase 1 | ✅ Deployed to Vercel — live and running              |
| Jun 2026 | Phase 2 | Planning started — Auth, multi-model, privacy, export |

---

_Single source of truth for Team Claude at Lead with Tribe.
Built with Claude AI (claude.ai). Continue this project by sharing this CLAUDE.md
with Claude in a new conversation to resume from exactly this point._

---

## Phase 2 — IN PLANNING

> Started: June 2026 · Status: Architecture & planning phase

### Phase 2 Features Confirmed

| #   | Feature                                                      | Status   |
| --- | ------------------------------------------------------------ | -------- |
| 1   | Authentication — @leadwithtribe.com email only               | Planning |
| 2   | Private conversations                                        | Planning |
| 3   | Multi-AI model support (Claude, Gemini, ChatGPT, Meta/Llama) | Planning |
| 4   | File upload (CLAUDE.md context) + conversation export/import | Planning |

### Phase 2 New Environment Variables (to be added)

| Variable               | Purpose                 | Where to get             |
| ---------------------- | ----------------------- | ------------------------ |
| `OPENAI_API_KEY`       | ChatGPT / GPT-4o        | platform.openai.com      |
| `GEMINI_API_KEY`       | Google Gemini           | aistudio.google.com      |
| `META_API_KEY`         | Meta Llama models       | groq.com or together.ai  |
| `NEXTAUTH_SECRET`      | Auth session encryption | auto-generated           |
| `NEXTAUTH_URL`         | Your Vercel URL         | your Vercel app URL      |
| `GOOGLE_CLIENT_ID`     | Google OAuth login      | console.cloud.google.com |
| `GOOGLE_CLIENT_SECRET` | Google OAuth login      | console.cloud.google.com |

### Phase 2 Database Changes (new columns + tables)

**conversations table — new columns:**

- `model` (text) — which AI model was used e.g. `claude-sonnet-4-5`
- `model_provider` (text) — `anthropic` / `openai` / `google` / `meta`
- `is_private` (boolean) — only visible to creator
- `user_id` (uuid) — linked to auth user

**New table: `profiles`**

- `id` (uuid) — matches Supabase auth user ID
- `name`, `email`, `avatar_url`, `color`
- `created_at`

**New table: `conversation_files`**

- `id` (uuid), `conversation_id` (FK), `file_name`, `file_content`, `file_type`, `uploaded_by`

### Phase 2 Architecture Decisions

- **Auth:** Supabase Auth + Google OAuth restricted to @leadwithtribe.com domain
- **Multi-model routing:** Single `/api/chat` route with provider switch (no extra routes)
- **Meta AI:** Via Groq API (fastest, free tier, supports Llama 3.3)
- **File context:** Uploaded markdown/text injected as system context for that conversation
- **Export:** Client-side PDF/Markdown generation (no extra backend needed)

### Open Questions (answered before dev starts)

- [ ] Does your team use Google Workspace for @leadwithtribe.com emails? (determines OAuth setup)
- [ ] Model selector: per conversation (set at start) or switchable mid-chat?
- [ ] Do you have a Groq account for Meta/Llama, or prefer Together AI?

---

---

## Phase 2 — IN PLANNING

> Started: June 2026 | Status: Architecture & planning phase

### Phase 2 Scope

| #   | Feature                                     | Complexity | Depends On                   |
| --- | ------------------------------------------- | ---------- | ---------------------------- |
| 2.1 | Authentication (@leadwithtribe.com)         | High       | Supabase Auth + Google OAuth |
| 2.2 | Private conversations                       | Medium     | Auth (needs user identity)   |
| 2.3 | Multi-model AI (Claude, Gemini, GPT, Llama) | High       | New API keys                 |
| 2.4 | Import / Export conversations               | Medium     | Auth + DB schema update      |

### New Environment Variables Needed (Phase 2)

| Variable            | Purpose                 | Where to get                        |
| ------------------- | ----------------------- | ----------------------------------- |
| `GEMINI_API_KEY`    | Google Gemini models    | aistudio.google.com                 |
| `OPENAI_API_KEY`    | GPT-4o, GPT-4o-mini     | platform.openai.com                 |
| `GROQ_API_KEY`      | Meta Llama (free, fast) | console.groq.com                    |
| `NEXTAUTH_SECRET`   | Auth token signing      | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL`      | Auth callback URL       | Your Vercel URL                     |
| `TEAM_EMAIL_DOMAIN` | Restrict login to org   | `leadwithtribe.com`                 |

### DB Schema Changes (Phase 2)

**New: `users` table** (managed by Supabase Auth)

- id, email, name, avatar_url, created_at

**Updated: `conversations` table**

- Add: `owner_id` (FK → users.id)
- Add: `is_private` (boolean, default false)
- Add: `model_used` (e.g. claude-sonnet-4-5)
- Add: `provider` (claude / gemini / openai / groq)

**Updated: `messages` table**

- Add: `model_used` (which model generated this response)
- Add: `provider` (which provider)

### Architecture Changes (Phase 2)

Current: Single `/api/chat.js` → Anthropic only
Phase 2: Unified `/api/chat.js` with provider routing

```
/api/chat
  ├── provider=claude  → Anthropic SDK (streaming)
  ├── provider=gemini  → Google GenAI SDK (streaming)
  ├── provider=openai  → OpenAI SDK (streaming)
  └── provider=groq    → Groq SDK → Llama models (streaming)
```

---

_Phase 2 development to begin after team testing of Phase 1 is complete_

---

## Phase 2 — IN PROGRESS

> Started: June 2026 | v3 codebase

### Phase 2 Features Built

| Feature                                | Status      | Notes                                              |
| -------------------------------------- | ----------- | -------------------------------------------------- |
| Google OAuth auth (@leadwithtribe.com) | ✅ Built    | Requires Supabase + Google Cloud setup (see below) |
| Private conversations                  | ✅ Built    | Toggle in chat header — owner only                 |
| Multi-model AI (Claude/Gemini/Groq)    | ✅ Built    | Model picker with lock/unlock in input area        |
| Import/Export                          | ⏳ Phase 2B | Planned next                                       |

### New Files in v3

| File                          | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `pages/auth/callback.js`      | Handles Google OAuth redirect, domain check             |
| Updated `pages/index.js`      | Auth screen, model picker, private toggle, lock feature |
| Updated `pages/api/chat.js`   | Routes to Claude / Gemini / Groq                        |
| Updated `lib/supabase.js`     | PKCE auth flow                                          |
| Updated `supabase/schema.sql` | New columns + RLS policies                              |

### New Env Vars (add to Vercel)

| Variable                        | Value                                                   |
| ------------------------------- | ------------------------------------------------------- |
| `GEMINI_API_KEY`                | From aistudio.google.com (REGENERATE — old key exposed) |
| `GROQ_API_KEY`                  | From console.groq.com (REGENERATE — old key exposed)    |
| `NEXT_PUBLIC_TEAM_EMAIL_DOMAIN` | `leadwithtribe.com`                                     |

### ⚠ Security Note

API keys were shared in a chat conversation. Both must be regenerated:

- Gemini: aistudio.google.com → API Keys → delete old → create new
- Groq: console.groq.com → API Keys → delete old → create new

### Supabase Auth Setup Required (manual steps)

Before v3 auth works, complete these steps in the Supabase and Google Cloud dashboards:

**Step 1 — Google Cloud Console**

1. console.cloud.google.com → New project (or use existing)
2. APIs & Services → OAuth consent screen → External → fill details
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web application
5. Authorised redirect URI: `https://bzlfsgzdlsmcsxovnsoz.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

**Step 2 — Supabase Auth**

1. Supabase dashboard → Authentication → Providers → Google → Enable
2. Paste Client ID and Client Secret
3. Save

**Step 3 — Supabase Site URL**

1. Supabase → Authentication → URL Configuration
2. Site URL: your Vercel URL (e.g. https://team-claude-xyz.vercel.app)
3. Redirect URLs: add `https://team-claude-xyz.vercel.app/auth/callback`

**Step 4 — Run schema migration**
Run the ALTER TABLE section of `supabase/schema.sql` in SQL Editor to add new columns to existing tables.

### AI Models Available in v3

| Model            | Provider  | Badge     | Cost             |
| ---------------- | --------- | --------- | ---------------- |
| Claude Haiku     | Anthropic | Fastest   | API billing      |
| Claude Sonnet    | Anthropic | Balanced  | API billing      |
| Claude Opus      | Anthropic | Powerful  | API billing      |
| Gemini 2.0 Flash | Google    | Fast      | Free tier        |
| Gemini 1.5 Flash | Google    | Free      | Free tier        |
| Gemini 1.5 Pro   | Google    | Capable   | Billing required |
| Llama 3.3 70B    | Groq      | Free      | Free tier        |
| Llama 3.1 8B     | Groq      | Free·Fast | Free tier        |
