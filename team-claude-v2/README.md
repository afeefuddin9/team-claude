# Team Claude — Lead with Tribe
### Shared Claude workspace · 7 workspaces · All chats visible to the whole team

---

## What this does
- Every conversation is shared with your entire team automatically
- 7 workspaces: Marketing, Development, Operations, Client Work, Leadership, General, Events
- Anyone can open and continue any teammate's conversation
- Real-time sync — new chats appear for everyone instantly
- Claude.ai-inspired interface (dark/light mode, streaming responses)
- Each workspace has its own system prompt so Claude responds appropriately

---

## Before you start — what you need

| What | Where to get it | Cost |
|------|----------------|------|
| Anthropic API key | console.anthropic.com | Pay-per-use (~$5–20/month for a team) |
| Supabase project | supabase.com | Free tier is enough |
| Vercel account | vercel.com | Free |
| GitHub account | github.com | Free |

---

## Step 1 — Get your Anthropic API key

1. Go to **https://console.anthropic.com**
2. Create an account (separate from your Claude.ai account)
3. Go to **API Keys** → click **Create Key**
4. Copy the key — it starts with `sk-ant-…`
5. Go to **Billing** → add a credit card
6. Add $10 credit to start (more than enough for months of team use)

---

## Step 2 — Set up Supabase (free database)

1. Go to **https://supabase.com** → **New project**
2. Choose a name (e.g. `team-claude`) and a strong database password
3. Select the region closest to your team
4. Wait ~2 minutes for the project to set up
5. Go to **SQL Editor** → **New query**
6. Copy the entire contents of `supabase/schema.sql` and paste it in
7. Click **Run** — you should see "Success. No rows returned"
8. Go to **Settings** → **API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## Step 3 — Deploy to Vercel

### Option A — GitHub (recommended, easiest updates)

1. Create a new **private** repository on GitHub
2. Upload all these files to it (or use `git push`)
3. Go to **https://vercel.com** → **New Project**
4. Import your GitHub repository
5. In the **Environment Variables** section, add:

```
ANTHROPIC_API_KEY          = sk-ant-your-key-here
NEXT_PUBLIC_SUPABASE_URL   = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
NEXT_PUBLIC_TEAM_NAME      = Lead with Tribe
CLAUDE_MODEL               = claude-sonnet-4-5
```

6. Click **Deploy** — Vercel builds and deploys automatically (~2 min)
7. Your app URL will be something like `https://team-claude-xyz.vercel.app`

### Option B — Vercel CLI (fastest)

```bash
npm install -g vercel
cd team-claude
cp .env.example .env.local
# Edit .env.local and fill in your keys
vercel
# Follow prompts, then add env vars in the Vercel dashboard
```

---

## Step 4 — Share with your team

1. Copy your Vercel URL (e.g. `https://team-claude-yourteam.vercel.app`)
2. Send it to all 7–12 team members via Slack/WhatsApp/email
3. Each person opens the URL, enters their name, and they're in
4. All conversations are immediately visible to everyone

**Tip:** Bookmark it in your team's browser, pin it in Slack, or add it to your Notion home page.

---

## Step 5 — Custom domain (optional, looks more professional)

1. In Vercel → your project → **Settings** → **Domains**
2. Add a domain like `claude.leadwithtribe.com`
3. Follow Vercel's DNS instructions (usually takes < 5 minutes)

---

## Running locally (for development)

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## Workspace system prompts

Each workspace automatically gives Claude a different context. You can edit these in `pages/api/chat.js`:

| Workspace | Claude behaves as… |
|-----------|-------------------|
| Marketing & Content | Expert marketing strategist |
| Development / Tech | Senior software engineer |
| Operations | Operations and process expert |
| Client Work | Professional account manager |
| Leadership | Strategic business advisor |
| General | General helpful assistant |
| Upcoming Events | Expert event planner |

---

## Changing the Claude model

Edit `CLAUDE_MODEL` in your Vercel environment variables:

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `claude-haiku-4-5` | Fastest | Good | Cheapest |
| `claude-sonnet-4-5` | Fast | Great | Mid (recommended) |
| `claude-opus-4-5` | Slower | Best | Higher |

After changing, redeploy: Vercel → your project → **Redeploy**.

---

## Adding a new workspace

1. Edit `WORKSPACES` array in `pages/index.js` — add your new workspace
2. Add a system prompt for it in `pages/api/chat.js` in the `systemPrompts` object
3. Push to GitHub — Vercel redeploys automatically

---

## Estimated costs

For 10 team members having ~20 conversations/day:

| Model | Monthly API cost |
|-------|----------------|
| Haiku | ~$1–3 |
| Sonnet (recommended) | ~$5–15 |
| Opus | ~$20–60 |

Monitor usage at **console.anthropic.com → Usage**.

---

## Troubleshooting

**"ANTHROPIC_API_KEY is not set"**
→ Add the env variable in Vercel → Settings → Environment Variables → Redeploy

**"Could not create conversation"**
→ Check Supabase is configured. Go to Supabase → SQL Editor and re-run `schema.sql`

**Conversations not syncing in real-time**
→ Check Supabase → Database → Replication — `conversations` table should be in the publication

**API errors in chat**
→ Check console.anthropic.com → you may have hit a rate limit or run out of credits

---

## File structure

```
team-claude/
├── pages/
│   ├── index.js          ← Main app (UI, state, Supabase calls)
│   ├── _app.js           ← Next.js app wrapper
│   └── api/
│       └── chat.js       ← Claude API proxy (keeps your API key secure)
├── lib/
│   └── supabase.js       ← Supabase client
├── styles/
│   └── globals.css       ← All styles (Claude.ai-inspired)
├── supabase/
│   └── schema.sql        ← Run once in Supabase SQL Editor
├── .env.example          ← Copy to .env.local and fill in
├── next.config.js
├── package.json
└── README.md             ← You are here
```

---

Built for Lead with Tribe · Powered by Anthropic Claude + Supabase + Vercel
