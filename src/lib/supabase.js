import { createClient } from '@supabase/supabase-js';

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null when env vars aren't set — the map page shows a setup notice instead
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const MAP_PASSWORD = import.meta.env.VITE_MAP_PASSWORD || '';

export const PHOTO_BUCKET = 'pin-photos';

export const photoUrl = (path) =>
  supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
