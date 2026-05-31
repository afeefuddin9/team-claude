# CLAUDE.md — Team Claude Project Record
### Lead with Tribe · AI Platform Implementation · Permanent Project Log

> This file is the single source of truth for the Team Claude project.
> Update it whenever something changes — new features, decisions, deployments.

---

## 📌 Project Summary

**Project name:** Team Claude  
**Purpose:** Shared Claude AI workspace where all 7–12 Lead with Tribe team members can see each other's conversations, continue each other's chats, and work across 7 organised workspaces — without losing context.  
**Status:** ✅ Code complete · ⏳ Awaiting deployment  
**Owner:** Mohammed (Lead with Tribe)  
**Started:** May 2026  
**Built with help from:** Claude (Anthropic) via claude.ai

---

## 🔗 Live Links (fill in after deployment)

| What | URL | Status |
|------|-----|--------|
| Live app | `https://____________.vercel.app` | ⏳ pending |
| Custom domain | `https://____________` | ⏳ optional |
| GitHub repo | `https://github.com/____________` | ✅ pushed |
| Vercel project | `https://vercel.com/____________` | ⏳ pending |
| Supabase project | `https://app.supabase.com/project/____________` | ⏳ pending |
| Anthropic console | `https://console.anthropic.com` | ⏳ pending |

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + React 18 | App UI and routing |
| Styling | Custom CSS (globals.css) | Claude.ai-inspired dark/light theme |
| Backend | Next.js API Routes (serverless) | Proxies Claude API calls securely |
| Database | Supabase (PostgreSQL) | Stores all conversations + messages + workspaces |
| Realtime | Supabase Realtime | Live sync across all team members |
| AI | Anthropic Claude API | Powers all chat responses |
| Hosting | Vercel | Deploys and serves the app |
| Auth | None (name-only) | Simple — just enter your name |

---

## 📁 File Structure

```
team-claude/
├── pages/
│   ├── index.js              ← Main app (entire UI, state, Supabase calls)
│   ├── _app.js               ← Next.js wrapper, global CSS import
│   └── api/
│       └── chat.js           ← Serverless function — Claude API proxy
│                                (API key never exposed to browser)
├── lib/
│   └── supabase.js           ← Supabase client initialisation
├── styles/
│   └── globals.css           ← All styles, Claude.ai-inspired design system
│                                Dark + light mode via CSS variables
├── supabase/
│   └── schema.sql            ← Run once in Supabase SQL Editor
│                                Creates: workspaces, conversations, messages tables
├── .env.example              ← Copy to .env.local, fill in keys
├── next.config.js            ← Next.js config, team name env
├── package.json              ← Dependencies: next, react, @anthropic-ai/sdk, @supabase/supabase-js
├── DEPLOYMENT_GUIDE.md       ← Full step-by-step setup guide
├── CLAUDE.md                 ← This file — permanent project record
└── README.md                 ← Technical reference
```

---

## 🔑 Environment Variables

Add these to Vercel → Settings → Environment Variables:

| Variable | Example Value | Required | Notes |
|----------|--------------|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | ✅ Yes | Get from console.anthropic.com — use `sk-placeholder` until purchased |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ✅ Yes | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | ✅ Yes | From Supabase → Settings → API |
| `NEXT_PUBLIC_TEAM_NAME` | `Lead with Tribe` | ✅ Yes | Displays in the UI |
| `CLAUDE_MODEL` | `claude-sonnet-4-5` | ✅ Yes | See model options below |

### Claude model options
| Model ID | Speed | Quality | Estimated monthly cost (team of 10) |
|----------|-------|---------|--------------------------------------|
| `claude-haiku-4-5` | Fastest | Good | ~$1–3 |
| `claude-sonnet-4-5` | Fast | Great ⭐ recommended | ~$5–15 |
| `claude-opus-4-5` | Slower | Best | ~$20–60 |

---

## 🗂️ Workspaces

All 7 workspaces are seeded automatically when you run `schema.sql`. They can also be added/edited/deleted from the app UI — no code changes needed.

| ID | Label | Colour | Claude System Prompt |
|----|-------|--------|---------------------|
| `marketing` | Marketing & Content | #CF5C7E | Expert marketing strategist |
| `dev` | Development / Tech | #4A9EE0 | Senior software engineer |
| `ops` | Operations | #2BAE8E | Operations and process expert |
| `client` | Client Work | #E0943A | Professional account manager |
| `leadership` | Leadership | #9B8AE0 | Strategic business advisor |
| `general` | General / Experiments | #8A8680 | General helpful assistant |
| `events` | Upcoming Events | #E07050 | Expert event planner |

### Adding new workspaces (no code needed)
1. Open the app
2. Click **+** next to "Workspaces" in the sidebar
3. Enter name, pick colour, optionally add Claude instructions
4. Click **Add workspace** — live for everyone instantly

---

## 🗄️ Database Schema

### `workspaces` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Slug, e.g. `marketing` |
| `label` | text | Display name |
| `color` | text | Hex colour |
| `prompt` | text | System prompt for Claude |
| `sort_order` | integer | Sidebar order |
| `created_at` | timestamptz | When created |

### `conversations` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `title` | text | Auto-set from first message |
| `workspace` | text | FK to workspaces.id |
| `author_name` | text | Who started it |
| `author_color` | text | Their avatar colour |
| `preview` | text | Last response snippet |
| `message_count` | integer | Total messages |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updates on change |

### `messages` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `conversation_id` | uuid (FK) | Links to conversations |
| `role` | text | `user` or `assistant` |
| `content` | text | Full message text |
| `author_name` | text | For user messages |
| `author_color` | text | For user messages |
| `created_at` | timestamptz | |

---

## 🚀 Deployment Checklist

### Phase 1 — Deploy without API key (test first)
- [ ] Code pushed to GitHub repo
- [ ] Supabase account created at supabase.com
- [ ] New Supabase project created (`team-claude`)
- [ ] `supabase/schema.sql` run in Supabase SQL Editor
- [ ] Supabase Project URL copied
- [ ] Supabase anon key copied
- [ ] Vercel account created at vercel.com (sign in with GitHub)
- [ ] GitHub repo imported into Vercel
- [ ] All 5 environment variables added (with `sk-placeholder` for API key)
- [ ] Vercel deployment successful ✅
- [ ] App opens at Vercel URL
- [ ] Can join workspace, see all workspaces
- [ ] Team URL shared with all members
- [ ] Sending a message shows "API key not configured" (expected ✅)

### Phase 2 — Activate Claude (after purchasing)
- [ ] Anthropic account created at console.anthropic.com
- [ ] Credit card added to Anthropic billing
- [ ] $10 initial credit added
- [ ] API key generated (`sk-ant-api03-...`)
- [ ] `ANTHROPIC_API_KEY` updated in Vercel env vars
- [ ] Vercel redeployment triggered
- [ ] Test message gets real Claude response ✅
- [ ] All team members notified

### Phase 3 — Polish (optional)
- [ ] Custom domain set up (e.g. `ai.leadwithtribe.com`)
- [ ] Team walkthrough session held
- [ ] Bookmark/pin shared in Slack or Notion

---

## 💬 Project Conversation History

A log of key decisions made during this project.

---

### Session 1 — Initial discussion (May 2026)

**Problem identified:**
- Lead with Tribe team of 7–12 all use Claude independently
- No visibility into other team members' conversations
- Context gets lost between team members
- If someone builds something useful in Claude, others can't see or continue it

**Options evaluated:**
1. Claude Teams Plan (native) — chats private by default, manual sharing only
2. Deployable web app (custom) — full auto-sharing, chosen ✅
3. Downloadable HTML file — no real shared storage

**Decision:** Build a custom Next.js app using Anthropic API + Supabase for shared persistent storage.

---

### Session 2 — UI and workspace design

**Decisions made:**
- Interface modelled closely on Claude.ai (dark/light mode, same message layout)
- 7 workspaces matching team structure from internal PDF guide:
  Marketing, Development, Operations, Client Work, Leadership, General, Events
- Each workspace has its own Claude system prompt so responses are contextually appropriate
- "Continuing" badge shown when a team member picks up someone else's chat
- No login system — just name entry (sufficient for internal team tool)

---

### Session 3 — Bug fixes and v2

**Issues fixed:**
- Join button not working → fixed by setting React state immediately, storage as best-effort async
- Claude API "Failed to fetch" in chat widget → root cause: Claude.ai sandboxes artifact iframes; solution is proper deployment outside sandbox
- Workspace picker → moved workspaces to Supabase database, editable from UI

**Features added in v2:**
- Dynamic workspaces stored in Supabase (not hardcoded)
- Add/Edit/Delete workspaces from sidebar UI with name, colour, custom Claude instructions
- Workspace-specific system prompts passed to Claude API
- Placeholder API key support so app can be tested before purchasing

---

### Session 4 — Deployment guide (current)

**Deliverables:**
- `DEPLOYMENT_GUIDE.md` — full step-by-step guide for Supabase + Vercel setup
- `CLAUDE.md` — this file, permanent project record
- `team-claude-v2.zip` — final deployable code

**Outstanding:**
- User to create Supabase + Vercel accounts and deploy
- API key to be purchased after confirming deployment works

---

## 🔮 Potential Future Features

Ideas discussed or suggested for future development:

| Feature | Priority | Notes |
|---------|----------|-------|
| Custom domain | Medium | e.g. `ai.leadwithtribe.com` |
| Conversation tagging | Low | Tag chats with topics/projects |
| @mention team members | Low | Notify teammates about a chat |
| Export chat to PDF/Doc | Medium | Share outside the app |
| Admin panel | Low | Manage members, see usage stats |
| Per-workspace knowledge base | High | Upload docs Claude references in that workspace |
| Conversation reactions/bookmarks | Low | Star useful chats |
| Usage dashboard | Medium | Track team API spend by workspace |
| Mobile app (PWA) | Low | Add to home screen on phone |

---

## 📞 Support & Contacts

| Resource | Link |
|----------|------|
| Anthropic API docs | https://docs.anthropic.com |
| Anthropic support | https://support.anthropic.com |
| Supabase docs | https://supabase.com/docs |
| Vercel docs | https://vercel.com/docs |
| Next.js docs | https://nextjs.org/docs |
| Deployment guide | `DEPLOYMENT_GUIDE.md` in this repo |

---

*Last updated: May 2026 · Team Claude v2 · Lead with Tribe*
