# Deploying UpgradeChess (Vercel + Neon Google sign-in)

The app is a static Vite build. Hosting needs nothing but a static host; **cloud sync and Google sign-in are optional** and use Neon (Postgres + Neon Auth + Data API; the free tier is plenty: one JSON row per user).

## 1. Vercel (hosting)

1. Push the repo to GitHub (already done) and go to https://vercel.com/new → **Import** `budhap-dev/UpgradeChess`.
2. Framework preset: **Vite** (auto-detected; `vercel.json` in the repo sets the SPA rewrite and cache headers). Build command `npm run build`, output `dist`.
3. (Optional, for sync) add Environment Variables — see step 3 below — then **Deploy**.
4. You get `https://<project>.vercel.app`. Open it on your phone → browser menu → *Add to Home Screen* to install the PWA.

Every push to `main` redeploys; pull requests get preview URLs.

## 2. Neon project (database + auth)

1. https://console.neon.tech → **New project** (any region, Postgres default, database `neondb`).
2. Project → **Auth** → enable **Neon Auth**. Copy the **Auth URL** (`https://ep-….neonauth.<region>.aws.neon.tech/neondb/auth`).
3. Project → **Data API** → enable it with **Neon Auth** as the JWT provider. Copy the **Data API URL** (`https://ep-….apirest.<region>.aws.neon.tech/neondb/rest/v1`).
4. **SQL Editor** → paste and run [`docs/neon.sql`](neon.sql). It creates `public.user_data` with row-level security so each user can only read/write their own row (`auth.user_id()` = the signed-in user's id from the JWT).

## 3. Google sign-in

Neon Auth ships shared Google credentials that work out of the box for testing. For production use your own:

1. Google Cloud Console → https://console.cloud.google.com/apis/credentials → **Create credentials → OAuth client ID** (type *Web application*), or reuse the existing UpgradeChess client.
   - If asked, configure the OAuth consent screen first (External, app name "UpgradeChess", your email; add yourself as a test user while in Testing).
   - **Authorized JavaScript origins**: `https://<project>.vercel.app` (and `http://localhost:5173` for dev).
   - **Authorized redirect URIs**: the Google callback URL shown in Neon → **Auth → OAuth providers → Google** (it lives on the `neonauth` host). Remove the old `supabase.co/auth/v1/callback` entry once Neon works.
2. Neon → **Auth → OAuth providers → Google**: switch to custom credentials, paste the Client ID and Client Secret, save.
3. Neon → **Auth → Domains** (trusted / redirect domains): add `https://<project>.vercel.app` and `http://localhost:5173` (and preview domains if you want previews to work). Sign-in redirects back to `/settings` on these origins.

## 4. Environment variables

In Vercel → Project → **Settings → Environment Variables** (Production + Preview), and locally in a `.env` file (see `.env.example`):

```
VITE_NEON_AUTH_URL=https://ep-….neonauth.<region>.aws.neon.tech/neondb/auth
VITE_NEON_DATA_API_URL=https://ep-….apirest.<region>.aws.neon.tech/neondb/rest/v1
```

Delete the old `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` variables, then redeploy. The Settings page shows **Account & sync → Sign in with Google**.

## How sync works

- Signed out: everything lives in the browser's IndexedDB (as before). Export/Import JSON in Settings moves it manually.
- Signed in: on sign-in the app **merges** the cloud copy with the local one (union of puzzles/XP/games by stable keys; newest rating; mastered beats in-progress; newest settings), writes the result to both, then **auto-pushes** the local DB ~4 s after any change. "Sync now" forces a round-trip.
- Data is one JSONB row per user (`user_data`), protected by RLS. The browser talks to the Neon Data API with the user's Neon Auth JWT; both URLs are public and safe to ship in the client.
- Moving from Supabase: user ids change, so everyone signs in once more. Nothing is lost — on that first sign-in the device's local progress is pushed to Neon and merged as usual.

## Local development with sync

```
cp .env.example .env   # fill in the two Neon URLs
npm run dev            # http://localhost:5173
```
