# DEPLOYMENT.md — Step-by-Step Setup Guide
> Team Claude · Lead with Tribe
> Estimated time: 20–30 minutes total

---

## Overview — What you're setting up

```
Your computer (code) → GitHub (storage) → Vercel (hosts the app)
                                               ↕
                                          Supabase (database)
                                               ↕
                                        Anthropic API (Claude AI)
```

---

## What you need before starting

- [ ] The `team-claude-final` folder (downloaded and unzipped)
- [ ] A GitHub account — github.com (free)
- [ ] A Vercel account — vercel.com (free, sign up with GitHub)
- [ ] A Supabase account — supabase.com (free)
- [ ] An Anthropic API account — console.anthropic.com (pay-per-use, add later)

---

# PART 1 — GitHub (15 minutes)

## Step 1 · Install Git on your computer

**Check if you already have it:**
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
git --version
```
If you see a version number, skip to Step 2.

**If not installed:**
- Mac: https://git-scm.com/download/mac
- Windows: https://git-scm.com/download/win
- Install with all default settings

---

## Step 2 · Create a GitHub account

1. Go to **https://github.com**
2. Click **Sign up**
3. Choose a username (e.g. `leadwithtribe` or your name)
4. Use your work email
5. Verify your email

---

## Step 3 · Create a new repository on GitHub

1. Once logged in, click the **+** button (top right) → **New repository**
2. Fill in:
   - **Repository name:** `team-claude`
   - **Description:** `Shared Claude AI workspace for Lead with Tribe`
   - **Visibility:** Select **Private** (keeps your code private)
   - **Do NOT** tick "Add a README file" (we already have one)
3. Click **Create repository**
4. You'll see a page with setup instructions — keep this tab open, you need the repo URL

---

## Step 4 · Push the code to GitHub

Open Terminal (Mac) or Command Prompt (Windows).

**Navigate to the project folder:**
```bash
# Mac — replace with your actual path
cd ~/Downloads/team-claude-final

# Windows
cd C:\Users\YourName\Downloads\team-claude-final
```

**Set up git and push:**
```bash
# 1. Initialise git
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "Initial commit — Team Claude app"

# 4. Connect to your GitHub repo
#    Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/team-claude.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

**You'll be asked for GitHub credentials:**
- Username: your GitHub username
- Password: use a Personal Access Token (not your password)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  - Tick: `repo` scope
  - Copy the token and paste it as your password

**Verify it worked:** Refresh your GitHub repo page — you should see all the files listed.

---

# PART 2 — Supabase (10 minutes)

## Step 5 · Create a Supabase project

1. Go to **https://supabase.com**
2. Click **Start your project** → sign up with GitHub (easiest)
3. Click **New project**
4. Fill in:
   - **Organisation:** your name or Lead with Tribe
   - **Project name:** `team-claude`
   - **Database password:** create a strong password and **save it somewhere safe**
   - **Region:** choose the one closest to your team (e.g. EU West for UK/Europe)
5. Click **Create new project**
6. Wait 1–2 minutes while it sets up (you'll see a loading screen)

---

## Step 6 · Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from your project folder in any text editor (Notepad, TextEdit, VS Code)
4. Copy **everything** in that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
7. You should see: ✅ **"Success. No rows returned"**

This creates your 3 tables (workspaces, conversations, messages) and seeds the 7 default workspaces.

---

## Step 7 · Get your Supabase credentials

1. In Supabase, click **Settings** (gear icon, bottom left sidebar)
2. Click **API**
3. Copy and save these two values (you'll need them in Part 3):
   - **Project URL** — looks like: `https://abcdefghijkl.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

# PART 3 — Vercel (10 minutes)

## Step 8 · Create a Vercel account

1. Go to **https://vercel.com**
2. Click **Sign Up** → **Continue with GitHub**
3. Authorise Vercel to access your GitHub

---

## Step 9 · Import your project

1. In Vercel dashboard, click **Add New** → **Project**
2. You'll see a list of your GitHub repos — find `team-claude` and click **Import**
3. On the configuration screen:
   - **Framework Preset:** should auto-detect as "Next.js" ✅
   - **Root Directory:** leave as `./`
   - **Build settings:** leave as default

---

## Step 10 · Add environment variables

This is the most important step. Still on the configuration screen, scroll down to **Environment Variables** and add these one by one:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-placeholder` *(add real key later)* |
| `CLAUDE_MODEL` | `claude-sonnet-4-5` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL from Step 7 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key from Step 7 |
| `NEXT_PUBLIC_TEAM_NAME` | `Lead with Tribe` |

**How to add each one:**
1. Type the name in the "Name" field
2. Paste the value in the "Value" field
3. Click **Add** → repeat for each

---

## Step 11 · Deploy

1. Click **Deploy**
2. Watch the build log — it takes about 2 minutes
3. When you see 🎉 **"Congratulations!"** — your app is live!
4. Click **Visit** to open your app URL (something like `https://team-claude-abc.vercel.app`)
5. You'll see the setup screen — enter your name, and you're in!

**Test it:**
- Create a new chat in any workspace
- Try sending a message — you'll see "API key not configured yet" (expected, we haven't added the real key)
- The UI, workspaces, and sidebar should all work perfectly

---

# PART 4 — Add the Anthropic API key (when ready)

## Step 12 · Get your Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign up with your email (separate from Claude.ai account)
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Go to **Billing** → **Add credit card** → add $10 starter credit

---

## Step 13 · Update the API key in Vercel

1. Go to **https://vercel.com** → your `team-claude` project
2. Click **Settings** → **Environment Variables**
3. Find `ANTHROPIC_API_KEY` → click the three dots → **Edit**
4. Replace `sk-placeholder` with your real key
5. Click **Save**
6. Go back to the main project page → click **Redeploy** → **Redeploy** (confirm)
7. Wait ~2 minutes for it to rebuild
8. Open your app and try sending a message — it should work! 🎉

---

# PART 5 — Share with your team

## Step 14 · Share the app URL

1. Copy your Vercel URL (e.g. `https://team-claude-abc.vercel.app`)
2. Send to all 7–12 team members
3. Each person goes to the URL, enters their name, and they're in
4. All conversations are immediately visible to everyone

**Tip — set a custom domain:**
1. Vercel → project → Settings → Domains
2. Add `claude.leadwithtribe.com` (or similar)
3. Follow Vercel's DNS instructions
4. Takes about 10 minutes to go live

---

# PART 6 — Future updates

## How to update the app

Any time you want to change something in the code:

```bash
# Make your changes to the files, then:
cd ~/Downloads/team-claude-final

git add .
git commit -m "describe what you changed"
git push origin main
```

Vercel detects the push and auto-deploys in ~2 minutes. No dashboard needed.

---

## Quick reference — key URLs

| Service | URL | What for |
|---------|-----|---------|
| Your app | `your-vercel-url.vercel.app` | Share with team |
| GitHub | `github.com/YOUR_USERNAME/team-claude` | Code storage |
| Vercel | `vercel.com/dashboard` | Env vars, redeploy |
| Supabase | `supabase.com/dashboard` | View database, run SQL |
| Anthropic Console | `console.anthropic.com` | API key, usage/billing |

---

## Checklist summary

**GitHub**
- [ ] Git installed on your computer
- [ ] GitHub account created
- [ ] Private repo `team-claude` created
- [ ] Code pushed to GitHub

**Supabase**
- [ ] Supabase account created
- [ ] New project created
- [ ] `schema.sql` run successfully
- [ ] Project URL + anon key copied

**Vercel**
- [ ] Vercel account created (via GitHub)
- [ ] Project imported from GitHub
- [ ] All 5 environment variables added
- [ ] First deployment succeeded
- [ ] App URL works and shows setup screen

**Anthropic (when ready)**
- [ ] console.anthropic.com account created
- [ ] API key generated
- [ ] Billing credit added
- [ ] `ANTHROPIC_API_KEY` updated in Vercel
- [ ] Redeployed
- [ ] Tested — messages work ✅

**Team rollout**
- [ ] App URL shared with all team members
- [ ] Each person has entered their name and joined
- [ ] Custom domain set up (optional)
- [ ] `CLAUDE.md` updated with live URLs

---

## Need help?

If you get stuck at any step, bring the error message back to Claude and we'll fix it together.

Most common issues:
- **Build fails in Vercel** → check that all 5 env vars are added correctly
- **"Cannot read properties of null"** → Supabase keys not set or schema not run
- **git push asks for password** → use a Personal Access Token, not your GitHub password
