-- FlyerTrack cloud state for the existing project:
-- https://impotgazkxuiztdhuszs.supabase.co
create table if not exists public.flyer_tracker_state (
  id text primary key default 'primary',
  owner_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);


alter table public.flyer_tracker_state enable row level security;

create policy "Users can read their tracker state"
  on public.flyer_tracker_state for select to authenticated
  using (auth.uid() = owner_id);

create policy "Users can create their tracker state"
  on public.flyer_tracker_state for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update their tracker state"
  on public.flyer_tracker_state for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Run this once in Supabase SQL Editor. Enable Anonymous Sign-Ins in
-- Authentication > Providers so this offline-first prototype can sync without
-- collecting unnecessary personal information.
