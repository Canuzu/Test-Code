-- KartenwertDE – Supabase Schema
-- Ausführen im Supabase SQL-Editor (supabase.com → dein Projekt → SQL Editor)
-- Optional: Authentication > Settings > "Confirm email" deaktivieren für einfacheres Testen

-- ── 1. Profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text,
  shop_name   text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles using (auth.uid() = id) with check (auth.uid() = id);

-- ── 2. Teams ───────────────────────────────────────────────────────────────
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  owner_id     uuid references public.profiles(id) on delete cascade not null,
  invite_code  text unique default upper(substring(md5(random()::text), 1, 6)),
  created_at   timestamptz default now()
);
alter table public.teams enable row level security;
create policy "teams_member_select" on public.teams for select using (
  owner_id = auth.uid() or
  id in (select team_id from public.team_members where user_id = auth.uid())
);
create policy "teams_owner_insert" on public.teams for insert with check (owner_id = auth.uid());
create policy "teams_owner_delete" on public.teams for delete using (owner_id = auth.uid());

-- ── 3. Team-Mitglieder ─────────────────────────────────────────────────────
create table if not exists public.team_members (
  team_id  uuid references public.teams(id)    on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  role     text not null default 'member' check (role in ('owner','admin','member')),
  primary key (team_id, user_id)
);
alter table public.team_members enable row level security;
create policy "tm_select" on public.team_members for select using (
  user_id = auth.uid() or
  team_id in (select team_id from public.team_members where user_id = auth.uid())
);
create policy "tm_insert" on public.team_members for insert with check (
  user_id = auth.uid() or
  team_id in (select id from public.teams where owner_id = auth.uid())
);
create policy "tm_delete" on public.team_members for delete using (
  user_id = auth.uid() or
  team_id in (select id from public.teams where owner_id = auth.uid())
);

-- ── 4. Datenspeicher (Watchlist, Portfolio, etc.) ──────────────────────────
create table if not exists public.user_store (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid   not null,
  owner_type  text   not null check (owner_type in ('user','team')),
  key         text   not null,
  value       jsonb,
  updated_at  timestamptz default now(),
  unique (owner_id, owner_type, key)
);
alter table public.user_store enable row level security;

create policy "store_access" on public.user_store using (
  (owner_type = 'user'  and owner_id = auth.uid()) or
  (owner_type = 'team'  and owner_id in (
    select team_id from public.team_members where user_id = auth.uid()
  ))
) with check (
  (owner_type = 'user'  and owner_id = auth.uid()) or
  (owner_type = 'team'  and owner_id in (
    select team_id from public.team_members where user_id = auth.uid()
  ))
);

-- ── 5. Trigger: Profil beim Signup anlegen ─────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, shop_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'shop_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
