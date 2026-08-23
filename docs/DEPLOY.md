# Deploying UpgradeChess (Vercel + Supabase Google sign-in)

The app is a static Vite build. Hosting needs nothing but a static host; **cloud sync and Google sign-in are optional** and use Supabase (free tier is plenty: one JSON row per user).

## 1. Vercel (hosting)

1. Push the repo to GitHub (already done) and go to https://vercel.com/new → **Import** `budhap-dev/UpgradeChess`.
2. Framework preset: **Vite** (auto-detected; `vercel.json` in the repo sets the SPA rewrite and cache headers). Build command `npm run build`, output `dist`.
3. (Optional, for sync) add Environment Variables — see step 3 below — then **Deploy**.
4. You get `https://<project>.vercel.app`. Open it on your phone → browser menu → *Add to Home Screen* to install the PWA.

Every push to `main` redeploys; pull requests get preview URLs.

## 2. Supabase project (database + auth)

1. https://supabase.com → **New project** (any region; note the database password).
2. **SQL Editor** → paste and run [`docs/supabase.sql`](supabase.sql). It creates `public.user_data` with row-level security so each user can only read/write their own row.
3. **Project Settings → API**: copy the **Project URL** and the **anon public key**.

## 3. Google sign-in

1. Google Cloud Console → https://console.cloud.google.com/apis/credentials → **Create credentials → OAuth client ID** (type *Web application*).
   - If asked, configure the OAuth consent screen first (External, app name "UpgradeChess", your email; add yourself as a test user while in Testing).
   - **Authorized JavaScript origins**: `https://<project>.vercel.app` (and `http://localhost:5173` for dev).
   - **Authorized redirect URIs**: `https://<your-supabase-ref>.supabase.co/auth/v1/callback` (shown in Supabase under Authentication → Providers → Google).
2. Supabase → **Authentication → Providers → Google**: enable, paste the Client ID and Client Secret, save.
3. Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://<project>.vercel.app`
   - Redirect URLs: add `https://<project>.vercel.app/**` and `http://localhost:5173/**` (and `https://*-<team>.vercel.app/**` if you want previews to work).

## 4. Environment variables

In Vercel → Project → **Settings → Environment Variables** (Production + Preview), and locally in a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Redeploy. The Settings page now shows **Account & sync → Sign in with Google**.

## How sync works

- Signed out: everything lives in the browser's IndexedDB (as before). Export/Import JSON in Settings moves it manually.
- Signed in: on sign-in the app **merges** the cloud copy with the local one (union of puzzles/XP/games by stable keys; newest rating; mastered beats in-progress; newest settings), writes the result to both, then **auto-pushes** the local DB ~4 s after any change. "Sync now" forces a round-trip.
- Data is one JSONB row per user (`user_data`), protected by RLS; the anon key is safe to ship in the client.

## Local development with sync

```
cp .env.example .env   # fill in the two values
npm run dev            # http://localhost:5173
```
