-- Das Nötigste von Supabase, damit die Migration in einer leeren
-- Postgres-Datenbank läuft: die drei Rollen, auth.users mit auth.uid(),
-- und die beiden Tabellen des Speichers. Nur für den Test.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;

create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets,
  name text
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert on storage.objects to anon, authenticated;

-- So vergibt Supabase die Rechte: erst alles, die Regeln schränken ein.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
