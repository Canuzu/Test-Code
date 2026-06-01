-- Phase 1 backend: accounts + cloud sync. See docs/BACKEND.md.
-- Apply once per project: Supabase Dashboard → SQL Editor → paste → Run
-- (or `supabase db push`). Re-runnable (idempotent).

-- 1) Profiles -- one row per auth user; `plan` is the flag a future Stripe
--    webhook flips, and that pro.js will read instead of the current always-true.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  plan       text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Cloud sync -- key/value document store, one row per (user, bucket). The app
--    mirrors its per-game localStorage buckets (watchlist, portfolio/collection,
--    sold, notes, tags, alerts, buylist, settings) here. RLS ensures each user
--    only ever reads/writes their own rows.
create table if not exists public.user_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  k          text not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, k)
);

alter table public.user_state enable row level security;
drop policy if exists "user_state: all own" on public.user_state;
create policy "user_state: all own" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
