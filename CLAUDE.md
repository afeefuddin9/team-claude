# CLAUDE.md — Team Claude Project Record
### Lead with Tribe · Internal AI Platform

---

## Project Overview

**What it is:** A shared Claude AI workspace for the Lead with Tribe team (7–12 members).
Every conversation is visible to the whole team, organised across 7 workspaces.
Anyone can continue any teammate's conversation. No context gets lost.

**Why it was built:** The team was using Claude.ai individually — context was siloed between
teammates. This app fixes that with a shared interface powered by the Anthropic API.

**Live URL:** _(add after deployment)_
**GitHub repo:** _(add after creation)_
**Deployed on:** Vercel · **Database:** Supabase · **AI:** Anthropic API

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + React 18 | UI framework |
| Styling | Custom CSS (Claude.ai-inspired) | Dark/light mode, responsive |
| AI | Anthropic API (claude-sonnet-4-5) | Streaming chat completions |
| Database | Supabase (PostgreSQL + Realtime) | Shared storage, live sync |
| Hosting | Vercel | Deployment + serverless functions |
| Auth | Name-only (internal tool) | Simple team access, no passwords |

---

## File Structure

```
team-claude/
├── CLAUDE.md                  ← Project record (Claude Code reads this)
├── README.md                  ← Full deployment guide
├── package.json
├── next.config.js
├── .env.example               ← Copy to .env.local and fill in
├── .gitignore
├── pages/
│   ├── index.js               ← Full app UI + workspace management
│   ├── _app.js
│   └── api/chat.js            ← Anthropic API proxy (key stays server-side)
├── lib/supabase.js            ← Supabase client
├── styles/globals.css         ← Design system (Claude.ai inspired)
└── supabase/schema.sql        ← Run once in Supabase SQL Editor
```

---

## Environment Variables

```env
ANTHROPIC_API_KEY              # console.anthropic.com → API Keys
NEXT_PUBLIC_SUPABASE_URL       # supabase.com → Project → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Same page → anon public key
NEXT_PUBLIC_TEAM_NAME          # Lead with Tribe
CLAUDE_MODEL                   # claude-sonnet-4-5
```

---

## Database Tables (Supabase)

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `workspaces` | id, label, color, prompt, sort_order | Workspace definitions (UI-editable) |
| `conversations` | id, title, workspace, author_name, author_color | Chat threads |
| `messages` | id, conversation_id, role, content, author_name | Individual messages |

---

## Default Workspaces

| Workspace | Colour | Claude instructions |
|-----------|--------|---------------------|
| Marketing & Content | #CF5C7E | Marketing strategist |
| Development / Tech | #4A9EE0 | Senior software engineer |
| Operations | #2BAE8E | Operations expert |
| Client Work | #E0943A | Account manager |
| Leadership | #9B8AE0 | Strategic advisor |
| General / Experiments | #8A8680 | General assistant |
| Upcoming Events | #E07050 | Event planner |

**Adding workspaces from the UI:** Click `+` next to "Workspaces" in the sidebar.
No code changes needed — editable by any team member.

---

## Key Features

- All conversations shared across the team automatically
- 7 workspaces (add/edit/delete from the UI — no code needed)
- Each workspace has custom Claude instructions
- Streaming responses with markdown rendering
- Anyone can continue any teammate's conversation
- Real-time sync via Supabase Realtime
- Dark + light mode (follows OS preference)
- Mobile responsive
- Claude.ai-inspired interface

---

## Deployment History

| Date | Version | Notes |
|------|---------|-------|
| _(pending)_ | v1.0 | Initial deployment — all features |

---

## Future Improvements

- [ ] Supabase Auth for private conversations
- [ ] Full-text search across message content
- [ ] Export conversation to PDF/Notion
- [ ] File attachment support
- [ ] Usage/cost dashboard per workspace
- [ ] Conversation pinning and tagging

---

## Accounts

| Service | Notes |
|---------|-------|
| Anthropic | console.anthropic.com — API billing |
| Supabase | supabase.com — database |
| Vercel | vercel.com — hosting |
| GitHub | github.com — code repo |

---

## Cost Estimate

~10 team members, moderate use:
- claude-haiku-4-5: ~$1–5/month
- **claude-sonnet-4-5 (recommended): ~$5–20/month**
- claude-opus-4-5: ~$30–80/month

Monitor at: console.anthropic.com → Usage

---

## Quick Commands

```bash
npm install && npm run dev      # Local dev (localhost:3000)
git add . && git commit -m "change" && git push   # Deploy update
```
