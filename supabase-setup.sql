-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Pins: one row per place
create table pins (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  description text,
  visit_date  date,
  is_future   boolean not null default false,
  owner       text not null default 'both', -- 'both' | 'zac' | 'reese'
  lat         double precision not null,
  lng         double precision not null
);

-- Migration for projects created before the owner column existed:
-- alter table pins add column if not exists owner text not null default 'both';

-- Photos attached to a pin (files live in the pin-photos storage bucket)
create table pin_photos (
  id           uuid primary key default gen_random_uuid(),
  pin_id       uuid not null references pins(id) on delete cascade,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

-- Row-level security: the site uses the public anon key, so allow
-- read/write from the browser (the app itself gates edits with a password)
alter table pins enable row level security;
alter table pin_photos enable row level security;

create policy "anyone can read pins"    on pins       for select using (true);
create policy "anyone can add pins"     on pins       for insert with check (true);
create policy "anyone can delete pins"  on pins       for delete using (true);
create policy "anyone can read photos"  on pin_photos for select using (true);
create policy "anyone can add photos"   on pin_photos for insert with check (true);
create policy "anyone can delete photos" on pin_photos for delete using (true);

-- Public storage bucket for the photos
insert into storage.buckets (id, name, public) values ('pin-photos', 'pin-photos', true);

create policy "anyone can view pin photos"   on storage.objects for select using (bucket_id = 'pin-photos');
create policy "anyone can upload pin photos" on storage.objects for insert with check (bucket_id = 'pin-photos');
create policy "anyone can delete pin photos" on storage.objects for delete using (bucket_id = 'pin-photos');
