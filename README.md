# personal-brand-strategist — sample UI

Minimal Next.js example app that demonstrates a small UI + a server API route. Deployable to **Vercel** and **Render**. Includes Supabase placeholders so you can wire your DB later.

## Quick start (local)
1. Copy env example: `cp .env.example .env.local` and fill values
2. Install & run:
   - `npm install`
   - `npm run dev`
3. Open http://localhost:3000

## Supabase setup (optional)
- Create a Supabase project and copy these keys from Project → Settings → API:
  - `SUPABASE_URL`
  - `anon` (public) key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` (server) key → `SUPABASE_SERVICE_ROLE_KEY`

- Run the SQL migration in `supabase/migrations/001_init.sql` (SQL editor) to create the onboarding schema and demo user.

- Example tables created by the migration:
  - `users`, `profiles`, `business_models`, `niche_positioning`, `user_platforms`, `content_preferences`, `posting_plan`, `content_ideas`

- Set env vars in deployment dashboards (see below).

- To create the `messages` table used in the demo (optional):

  CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );

- After running migrations, open the app and complete onboarding — the Dashboard uses the stored data and can generate AI strategy (server-side).

## Deploy: Vercel
1. Import this repository into Vercel.
2. Add environment variables in Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Build command: `npm run build` (Vercel auto-detects Next.js)

## Deploy: Render
1. Create a new **Web Service** on Render and connect your Git repo.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add the same environment variables on Render's dashboard (mark `SUPABASE_SERVICE_ROLE_KEY` as secret).

## What I added
- `pages/` — Next.js UI + serverless API (`/api/messages`)
- `vercel.json`, `render.yaml` — deployment helpers
- `.env.example`, `README.md` — environment and instructions

---
If you want, I can push this to a GitHub repo, open a PR, or deploy to Vercel/Render for you — tell me which action to take next.