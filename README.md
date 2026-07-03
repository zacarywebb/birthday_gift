# birthday-quest 💕

A little site for Reese: landing page → typewriter letter → floating songs & letters → **Our Adventures map**.

## Running locally

```bash
npm install
npm run dev
```

## Setting up the map (one-time)

The map page (`/map`) stores pins and photos in [Supabase](https://supabase.com) (free tier).

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free account → New project).
2. **Run the setup script**: in the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase-setup.sql`](supabase-setup.sql), and click Run. This creates the `pins` and `pin_photos` tables and the `pin-photos` storage bucket.
3. **Get your keys**: dashboard → **Settings → API Keys**. Copy `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (the one starting with `sb_publishable_`). Never use the `SUPABASE_SECRET_KEY` in this project — it bypasses all security and must not ship in a website.
4. **Create `.env`** in this folder (copy from [`.env.example`](.env.example)):

   ```
   VITE_SUPABASE_URL=<your SUPABASE_URL>
   VITE_SUPABASE_ANON_KEY=<your SUPABASE_PUBLISHABLE_KEY>
   VITE_MAP_PASSWORD=pick-something-cute
   ```

5. Restart `npm run dev` — the map at `/map` is now live.

### Deploying on Vercel

Add the same three environment variables in Vercel: **Project → Settings → Environment Variables**, then redeploy. `vercel.json` already handles the client-side routes (so `/map` and `/letters` work on refresh).

### How the password works

Anyone can *view* the map, but adding pins/photos (and deleting) prompts for `VITE_MAP_PASSWORD` once per session. Note this is a soft gate — it deters visitors, but it isn't bank-grade security (the password ships inside the site's JavaScript). For a two-person site with an unlisted URL, that's plenty.
