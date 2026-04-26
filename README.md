# Five Year Plan Dashboard

A two-user (Marco + Jordan) plan dashboard tracking income targets and milestones across both businesses (Marco Wang Co. and Flowe) over a 5-year horizon.

## Stack

- Next.js 14 (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS + shadcn/ui
- Recharts for visualizations
- Deploys to Vercel

## Setup

### 1. Create Supabase project

1. Go to https://supabase.com and create a new project
2. Once created, go to Settings → API and copy:
   - `Project URL` → this becomes `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this becomes `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the database schema

1. In Supabase, go to SQL Editor
2. Open `supabase/schema.sql` from this repo
3. Paste the entire contents into the SQL editor and run it
4. This creates all tables, RLS policies, and seeds initial milestone data

### 3. Add allowed users

In `supabase/schema.sql` there's a section near the bottom for adding allowed user emails. Update with your actual emails before running, or run this separately afterward:

```sql
INSERT INTO allowed_users (email, display_name) VALUES
  ('marco@example.com', 'Marco'),
  ('jordan@example.com', 'Jordan');
```

### 4. Configure auth

1. In Supabase, go to Authentication → Providers
2. Enable Email provider
3. Under Email templates, configure magic link emails
4. Under URL Configuration, set:
   - Site URL: `http://localhost:3000` (for dev) or your Vercel URL
   - Redirect URLs: add `http://localhost:3000/api/auth/callback` and your prod equivalent

### 5. Local development

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

npm install
npm run dev
```

Visit http://localhost:3000

### 6. Deploy to Vercel

```bash
# Push to GitHub first
git init
git add .
git commit -m "initial dashboard"
git remote add origin <your-repo-url>
git push -u origin main

# Then in Vercel:
# 1. Import the GitHub repo
# 2. Add environment variables (same as .env.local)
# 3. Deploy
```

After deploy, update Supabase Auth URL Configuration with your Vercel URL.

## Initial data

The schema seeds:
- Marco Wang Co. milestones (9 from initial roadmap)
- Flowe milestones (9 from initial roadmap)
- 5-year income targets per business per year
- Income streams (Photography, Photobox, Wefts, Salon, Booth Rental)

You can edit milestones, add sub-tasks, and enter monthly actuals through the UI.

## Editing income targets

Income targets are in the `income_targets` table. Edit directly via Supabase Table Editor, or extend the UI to support inline editing (not built in v1).

## Adding more users

Add email to `allowed_users` table. They sign in with magic link. RLS policies grant full read/write to anyone in `allowed_users`.

## Architecture notes

- All authenticated users see all data (this is a household dashboard, not a multi-tenant SaaS)
- Income entries are append-only (one row per month per stream); you can edit existing rows
- Milestones support nested sub-tasks via `milestone_subtasks` table
- Progress percentages calculate client-side from milestone status
