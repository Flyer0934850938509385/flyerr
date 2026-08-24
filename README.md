# FlyerTrack

Offline-first flyer delivery tracking for carrier and employer portals.

## Run locally

```bash
cp .env.example .env
# Put the Supabase publishable/anon key in .env as SUPABASE_ANON_KEY
npm start
```

Open `http://localhost:4173`.

## Supabase setup

This app is configured for the existing project:

`https://impotgazkxuiztdhuszs.supabase.co`

Run [supabase/schema.sql](supabase/schema.sql) once in the Supabase SQL Editor. Enable Anonymous Sign-Ins under Authentication > Providers. Put only the browser-safe publishable/anon key in `.env`:

```env
SUPABASE_URL=https://impotgazkxuiztdhuszs.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Never put a service-role key, secret key, database password, or private credential in `.env.example`, frontend code, or git. `.env` is ignored.

## Storage and sync

The carrier saves immediately to browser `localStorage` and IndexedDB, then synchronizes the complete state to the Supabase `flyer_tracker_state` table when online. RLS limits cloud rows to the authenticated Supabase user. If Supabase is unavailable or not configured, the local Node state fallback keeps the app usable offline.
# flyerr
flyerr
