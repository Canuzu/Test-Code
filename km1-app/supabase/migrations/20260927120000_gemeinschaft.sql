-- =====================================================================
-- KM1 Training — die Gemeinschaft.
--
-- Baut auf 20260923120000_grundlage.sql auf und bringt alles auf den
-- Server, was die App seitdem kann: Rollen mit Haken, Einladungen der
-- Vereine, Familien, Teams mit Hausaufgaben, Videos mit Freigabe der
-- Eltern, Nachrichten nach festen Regeln, Laufbahn, Scouting, Meldungen,
-- Seiten zum Folgen, Trainingspläne und Campbuchungen.
--
-- Drei Regeln gelten überall, und hier setzt sie die Datenbank durch,
-- nicht die App:
--
--   1. Geprüft wird, wer mit Kindern arbeitet oder sie sichtet. Den Haken
--      vergibt KM1 an Vereine und Akademien selbst; Trainer, Scouts und
--      Profis bekommen ihn über die Einladung ihres Vereins oder über
--      Belege, die KM1 prüft.
--   2. Kein Video eines Kindes steht im offenen Netz. Unter 16 geben die
--      Eltern jedes Video frei, und dann sehen es nur Team, Familie und
--      geprüfte Konten. Ab 16 sieht ein Video auf dem Profil jeder, der in
--      KM1 angemeldet ist. Gäste sehen keines.
--   3. Kein Fremder schreibt einem Kind. Unter 16 schreiben Kinder nur mit
--      Trainer, Team, Eltern und KM1, und die Eltern lesen mit.
--
-- Die Namen der Regeln folgen der App: schreib_recht() entspricht
-- schreibRecht(von, an), darf_upload_sehen() entspricht darfSehen(u).
-- Neue Regeln kommen an genau diese Stellen.
--
-- Einspielen wie die Grundlage: im SQL Editor ausführen, danach seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Rollen und Haken
-- ---------------------------------------------------------------------
-- Bisher hieß Kader „trainer". Trainer sind jetzt die Trainer einer
-- Mannschaft; wer für KM1 arbeitet, hat die Rolle „km1".
alter table public.profiles drop constraint profiles_rolle_check;
update public.profiles set rolle = 'km1' where rolle = 'trainer';
alter table public.profiles add constraint profiles_rolle_check
  check (rolle in ('spieler','eltern','trainer','akademie','verein','profi','scout','km1'));

alter table public.profiles
  -- Der Haken: wann, auf welchem Weg, und bei einer Einladung, wer bürgt.
  add column geprueft_am    timestamptz,
  add column geprueft_ueber text check (geprueft_ueber in ('belege','einladung')),
  add column buerge         uuid references public.profiles on delete set null;

-- Mit diesem Code verbinden Eltern ihr Konto mit dem ihres Kindes. Er
-- steht in einer eigenen Tabelle, die nur das Kind selbst liest: sonst
-- könnte jeder, der das Profil sieht, sich als Elternteil verbinden.
create table public.kind_codes (
  kind_id uuid primary key references auth.users on delete cascade,
  code    text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
);

-- Wer nicht selbst übt, hat einen längeren Namen: „Akademie Rheinblick".
alter table public.profiles drop constraint profiles_vorname_check;
alter table public.profiles add constraint profiles_vorname_check check (char_length(vorname) between 1 and 60);

-- Das Abo bekommt eine Art: Pro für Spieler und Eltern, Team für einen
-- Trainer, Akademie für bis zu zehn Mannschaften. Mit Team und Akademie
-- sind die Profi-Einheiten für die ganze Mannschaft frei.
alter table public.abos add column art text not null default 'pro'
  check (art in ('pro','team','akademie'));

create function public.meine_rolle()
returns text language sql stable security definer set search_path = ''
as $$ select rolle from public.profiles where id = auth.uid(); $$;

create function public.rolle_von(u uuid)
returns text language sql stable security definer set search_path = ''
as $$ select rolle from public.profiles where id = u; $$;

create function public.ist_km1()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.meine_rolle() = 'km1', false); $$;

-- Der alte Name bleibt, weil die Regeln der Grundlage ihn benutzen. Er
-- meint jetzt KM1 selbst: Videos schreiben, alles sehen.
create or replace function public.ist_trainer()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.ist_km1(); $$;

create function public.pruef_rolle(r text)
returns boolean language sql immutable
as $$ select r in ('trainer','akademie','verein','profi','scout'); $$;

-- Trägt dieses Konto den Haken? KM1 immer.
create function public.ist_geprueft(u uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.rolle = 'km1' or (public.pruef_rolle(p.rolle) and p.geprueft_am is not null)
                   from public.profiles p where p.id = u), false);
$$;

-- Das Alter nach Jahrgang. Ein Spieler ohne Jahrgang gilt als Kind:
-- im Zweifel die strengere Regel.
create function public.alter_von(u uuid)
returns int language sql stable security definer set search_path = ''
as $$ select extract(year from now())::int - geburtsjahr from public.profiles where id = u; $$;

create function public.ist_kind(u uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.rolle = 'spieler' and coalesce(extract(year from now())::int - p.geburtsjahr < 16, true)
                   from public.profiles p where p.id = u), false);
$$;

create function public.minderjaehrig(u uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.rolle = 'spieler' and coalesce(extract(year from now())::int - p.geburtsjahr < 18, true)
                   from public.profiles p where p.id = u), false);
$$;

-- Ein neues Konto bekommt seine Rolle aus der Anmeldung. KM1 wählt
-- niemand selbst, und den Haken gibt es nie beim Anlegen.
create or replace function public.neues_konto()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  daten    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  jahrgang int   := nullif(daten->>'geburtsjahr', '')::int;
  eltern   boolean := coalesce((daten->>'eltern_einwilligung')::boolean, false);
  r        text  := coalesce(nullif(daten->>'rolle', ''), 'spieler');
begin
  if r not in ('spieler','eltern','trainer','akademie','verein','profi','scout') then
    raise exception 'Diese Rolle gibt es beim Anlegen nicht.' using errcode = '22023';
  end if;
  if r = 'spieler' and jahrgang is not null
     and extract(year from now())::int - jahrgang < 17
     and not eltern then
    raise exception 'Unter 16 Jahren legen die Eltern das Konto an.'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, vorname, rolle, geburtsjahr,
                               eltern_einwilligung_am, eltern_einwilligung_fassung)
  values (
    new.id,
    coalesce(nullif(left(trim(daten->>'vorname'), 60), ''), 'Spieler'),
    r,
    jahrgang,
    case when eltern then now() end,
    case when eltern then nullif(daten->>'einwilligung_fassung', '') end
  );
  if r = 'spieler' then
    insert into public.kind_codes (kind_id) values (new.id);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Familie
-- ---------------------------------------------------------------------
create table public.familie (
  eltern_id uuid not null references auth.users on delete cascade,
  kind_id   uuid not null references auth.users on delete cascade,
  am        timestamptz not null default now(),
  primary key (eltern_id, kind_id),
  check (eltern_id <> kind_id)
);

create function public.ist_eltern_von(e uuid, k uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.familie f where f.eltern_id = e and f.kind_id = k); $$;

-- Eltern geben den Code aus der App ihres Kindes ein.
create function public.kind_verbinden(p_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare k uuid;
begin
  if public.meine_rolle() is distinct from 'eltern' then
    raise exception 'Nur ein Elternkonto verbindet sich mit einem Kind.' using errcode = '42501';
  end if;
  select kind_id into k from public.kind_codes where code = upper(trim(p_code));
  if k is null then
    raise exception 'Diesen Code gibt es nicht.' using errcode = 'P0002';
  end if;
  insert into public.familie (eltern_id, kind_id) values (auth.uid(), k) on conflict do nothing;
  return k;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Prüfung durch KM1
-- ---------------------------------------------------------------------
-- Von einem Beleg wird nur gespeichert, dass er vorlag und von wann.
-- Das Dokument selbst nicht, auch nicht das Führungszeugnis.
create table public.pruefungen (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  belege         text[] not null check (cardinality(belege) between 1 and 10),
  eingereicht_am timestamptz not null default now(),
  status         text not null default 'offen' check (status in ('offen','angenommen','abgelehnt')),
  begruendung    text,
  entschieden_von uuid references auth.users on delete set null,
  entschieden_am timestamptz
);

create function public.pruefung_entscheiden(p uuid, ja boolean, p_begruendung text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare u uuid;
begin
  if not public.ist_km1() then
    raise exception 'Nur KM1 vergibt den Haken.' using errcode = '42501';
  end if;
  update public.pruefungen
     set status = case when ja then 'angenommen' else 'abgelehnt' end,
         begruendung = p_begruendung, entschieden_von = auth.uid(), entschieden_am = now()
   where id = p and status = 'offen'
  returning user_id into u;
  if u is null then
    raise exception 'Diese Prüfung ist nicht offen.' using errcode = 'P0002';
  end if;
  if ja then
    update public.profiles set geprueft_am = now(), geprueft_ueber = 'belege', buerge = null where id = u;
  end if;
end;
$$;

-- KM1 kann jeden Haken wieder entziehen, etwa nach einer Meldung.
create function public.haken_entziehen(u uuid, p_begruendung text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.ist_km1() then
    raise exception 'Nur KM1 entzieht den Haken.' using errcode = '42501';
  end if;
  update public.profiles set geprueft_am = null, geprueft_ueber = null where id = u;
  update public.einladungen set entzogen_am = now(), entzogen_grund = p_begruendung
   where genutzt_von = u and entzogen_am is null;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Einladungen: der Verein bürgt
-- ---------------------------------------------------------------------
create table public.einladungen (
  code          text primary key,
  von           uuid not null references auth.users on delete cascade,
  rolle         text not null check (rolle in ('trainer','scout','profi')),
  fuer          text not null default '' check (char_length(fuer) <= 60),
  -- Was der Verein bestätigt hat: das erweiterte Führungszeugnis
  -- gesehen, beim Profi den Profikader.
  bestaetigt    text not null check (bestaetigt in ('fuehrungszeugnis','profikader')),
  erstellt_am   timestamptz not null default now(),
  genutzt_von   uuid references auth.users on delete set null,
  genutzt_am    timestamptz,
  entzogen_am   timestamptz,
  entzogen_grund text
);

create function public.einladung_erstellen(p_rolle text, p_fuer text, p_bestaetigt boolean)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  r text := public.meine_rolle();
  z text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  vorsilbe text;
  c text;
begin
  if r not in ('akademie','verein') or not public.ist_geprueft(auth.uid()) then
    raise exception 'Einladen können nur Vereine und Akademien mit Haken.' using errcode = '42501';
  end if;
  if p_rolle not in ('trainer','scout','profi') or (r = 'akademie' and p_rolle = 'profi') then
    raise exception 'Diese Rolle kann % nicht einladen.', r using errcode = '22023';
  end if;
  if not coalesce(p_bestaetigt, false) then
    raise exception 'Ohne Bestätigung gibt es keinen Code.' using errcode = '22023';
  end if;
  select upper(rpad(left(regexp_replace(vorname, '[^A-Za-z]', '', 'g'), 3), 3, 'X')) into vorsilbe
    from public.profiles where id = auth.uid();
  loop
    c := vorsilbe || '-' || upper(left(p_rolle, 1)) || '-';
    for i in 1..4 loop
      c := c || substr(z, 1 + floor(random() * length(z))::int, 1);
    end loop;
    exit when not exists (select 1 from public.einladungen where code = c);
  end loop;
  insert into public.einladungen (code, von, rolle, fuer, bestaetigt)
  values (c, auth.uid(), p_rolle, left(coalesce(trim(p_fuer), ''), 60),
          case when p_rolle = 'profi' then 'profikader' else 'fuehrungszeugnis' end);
  return c;
end;
$$;

-- Einlösen: gleiche Rolle, noch nicht benutzt, nicht entzogen. Danach
-- trägt das Konto den Haken, und der Verein steht als Bürge daneben.
create function public.einladung_einloesen(p_code text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  e public.einladungen;
  name text;
begin
  select * into e from public.einladungen
   where upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')) = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'))
   for update;
  if e.code is null or e.entzogen_am is not null then
    raise exception 'Diesen Code gibt es nicht.' using errcode = 'P0002';
  end if;
  if e.genutzt_von is not null then
    raise exception 'Dieser Code ist schon benutzt. Jeder Code gilt für eine Person.' using errcode = 'P0001';
  end if;
  if public.meine_rolle() is distinct from e.rolle then
    raise exception 'Der Code ist für eine andere Rolle gedacht.' using errcode = 'P0001';
  end if;
  update public.einladungen set genutzt_von = auth.uid(), genutzt_am = now() where code = e.code;
  update public.profiles set geprueft_am = now(), geprueft_ueber = 'einladung', buerge = e.von
   where id = auth.uid();
  select vorname into name from public.profiles where id = e.von;
  return name;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Teams und Hausaufgaben
-- ---------------------------------------------------------------------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  verein      text not null default '' check (char_length(verein) <= 60),
  trainer_id  uuid not null references auth.users on delete cascade,
  code        text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  erstellt_am timestamptz not null default now()
);

create table public.team_mitglieder (
  team_id    uuid not null references public.teams on delete cascade,
  spieler_id uuid not null references auth.users on delete cascade,
  status     text not null default 'angefragt' check (status in ('angefragt','dabei')),
  am         timestamptz not null default now(),
  primary key (team_id, spieler_id)
);

create function public.trainer_von(t uuid)
returns uuid language sql stable security definer set search_path = ''
as $$ select trainer_id from public.teams where id = t; $$;

create function public.im_team(u uuid, t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.team_mitglieder m where m.team_id = t and m.spieler_id = u and m.status = 'dabei'); $$;

-- Gehören zwei Konten zu derselben Mannschaft? Als Spieler oder als ihr
-- Trainer mit Haken.
create function public.selbes_team(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.teams t
     where (public.im_team(a, t.id) or (t.trainer_id = a and public.ist_geprueft(a)))
       and (public.im_team(b, t.id) or (t.trainer_id = b and public.ist_geprueft(b)))
  );
$$;

-- Die Mannschaft eines Elternteils ist die seines Kindes.
create function public.eltern_im_team(e uuid, t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.familie f where f.eltern_id = e and public.im_team(f.kind_id, t));
$$;

create function public.team_beitreten(p_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare t uuid;
begin
  if public.meine_rolle() is distinct from 'spieler' then
    raise exception 'Beitreten können nur Spieler.' using errcode = '42501';
  end if;
  select id into t from public.teams where code = upper(trim(p_code));
  if t is null then
    raise exception 'Diesen Code gibt es nicht.' using errcode = 'P0002';
  end if;
  if not public.ist_geprueft(public.trainer_von(t)) then
    raise exception 'Der Trainer hat den Haken noch nicht.' using errcode = 'P0001';
  end if;
  insert into public.team_mitglieder (team_id, spieler_id) values (t, auth.uid()) on conflict do nothing;
  return t;
end;
$$;

-- Aufnehmen muss der Trainer selbst, auch mit Code.
create function public.mitglied_entscheiden(t uuid, s uuid, ja boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if public.trainer_von(t) is distinct from auth.uid() or not public.ist_geprueft(auth.uid()) then
    raise exception 'Das entscheidet der Trainer der Mannschaft.' using errcode = '42501';
  end if;
  if ja then
    update public.team_mitglieder set status = 'dabei', am = now() where team_id = t and spieler_id = s;
  else
    delete from public.team_mitglieder where team_id = t and spieler_id = s;
  end if;
end;
$$;

create table public.hausaufgaben (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams on delete cascade,
  video_id    uuid not null references public.videos on delete cascade,
  bis         date not null,
  notiz       text not null default '' check (char_length(notiz) <= 200),
  erstellt_am timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Videos von Spielern, mit Freigabe der Eltern
-- ---------------------------------------------------------------------
-- sicht: für wen es gedacht ist. trainer = nur der eigene Trainer,
-- team = die Mannschaft, km1 = Feedback von KM1, profil = das eigene
-- Profil. eltern_status: unter 16 geben die Eltern jedes Video frei.
create table public.uploads (
  id             uuid primary key default gen_random_uuid(),
  von            uuid not null references auth.users on delete cascade,
  team_id        uuid references public.teams on delete set null,
  sicht          text not null check (sicht in ('trainer','team','km1','profil')),
  eltern_status  text not null default 'frei' check (eltern_status in ('wartet','frei','abgelehnt')),
  titel          text not null default '' check (char_length(titel) <= 80),
  kategorie      text,
  pfad           text,
  dauer_sek      int check (dauer_sek >= 0),
  -- Bei der Challenge: die gezählte Zahl. Sie zählt erst, wenn der
  -- Trainer sie im Video nachgezählt hat.
  zahl           int check (zahl between 0 and 999),
  zahl_bestaetigt boolean not null default false,
  hochgeladen_von uuid not null default auth.uid() references auth.users on delete set null,
  erstellt_am    timestamptz not null default now()
);

create table public.einstellungen_kind (
  kind_id          uuid primary key references auth.users on delete cascade,
  upload_freigabe  boolean not null default true
);

-- Lädt ein Kind unter 16 selbst hoch, wartet das Video auf die Eltern,
-- es sei denn, sie haben die Freigabe ausgeschaltet. Laden die Eltern
-- selbst hoch, gilt es als freigegeben.
create function public.upload_vorbereiten()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.hochgeladen_von := auth.uid();
  new.zahl_bestaetigt := false;
  if public.ist_kind(new.von) and not public.ist_eltern_von(auth.uid(), new.von)
     and coalesce((select upload_freigabe from public.einstellungen_kind where kind_id = new.von), true) then
    new.eltern_status := 'wartet';
  else
    new.eltern_status := 'frei';
  end if;
  return new;
end;
$$;
create trigger bei_neuem_upload before insert on public.uploads
  for each row execute function public.upload_vorbereiten();

-- Wer ein Video sieht. Die eine Stelle, wie darfSehen(u) in der App.
create function public.darf_upload_sehen(p_von uuid, p_team uuid, p_sicht text, p_status text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  ich uuid := auth.uid();
  trainer boolean;
  team boolean;
begin
  if ich is null then return false; end if;                      -- nie im offenen Netz
  if ich = p_von or public.ist_eltern_von(ich, p_von) then return true; end if;
  if p_status <> 'frei' then return false; end if;
  if public.ist_km1() then return true; end if;
  if p_sicht = 'km1' then return false; end if;
  trainer := p_team is not null and public.trainer_von(p_team) = ich and public.ist_geprueft(ich);
  if p_sicht = 'trainer' then return trainer; end if;
  team := trainer or (p_team is not null and (public.im_team(ich, p_team) or public.eltern_im_team(ich, p_team)));
  if p_sicht = 'team' then return team; end if;
  -- Auf dem Profil
  return team or public.ist_geprueft(ich) or coalesce(public.alter_von(p_von) >= 16, false);
end;
$$;

create function public.upload_freigeben(u uuid, ja boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.uploads x where x.id = u and public.ist_eltern_von(auth.uid(), x.von)) then
    raise exception 'Freigeben können nur die Eltern.' using errcode = '42501';
  end if;
  update public.uploads set eltern_status = case when ja then 'frei' else 'abgelehnt' end where id = u;
end;
$$;

create function public.zahl_bestaetigen(u uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.uploads x
                  where x.id = u and x.team_id is not null
                    and public.trainer_von(x.team_id) = auth.uid() and public.ist_geprueft(auth.uid())) then
    raise exception 'Bestätigen kann nur der Trainer der Mannschaft.' using errcode = '42501';
  end if;
  update public.uploads set zahl_bestaetigt = true where id = u;
end;
$$;

-- Feedback mit Zeitmarke. Schreiben darf der Trainer der Mannschaft,
-- bei Videos an KM1 nur KM1. Kinder bekommen keine Kommentare von Fremden.
create table public.feedback (
  id        uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads on delete cascade,
  von       uuid not null default auth.uid() references auth.users on delete cascade,
  sekunde   int  not null default 0 check (sekunde >= 0),
  text      text not null check (char_length(text) between 1 and 500),
  am        timestamptz not null default now()
);

create function public.darf_feedback_geben(u uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.uploads x
     where x.id = u and x.eltern_status = 'frei'
       and ((x.sicht = 'km1' and public.ist_km1())
         or (x.sicht <> 'km1' and x.team_id is not null
             and public.trainer_von(x.team_id) = auth.uid() and public.ist_geprueft(auth.uid())))
  );
$$;

-- Drei feste Zeichen statt Kommentaren.
create table public.reaktionen (
  ziel    uuid not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  art     text not null check (art in ('feuer','klatsch','ball')),
  am      timestamptz not null default now(),
  primary key (ziel, user_id, art)
);

-- ---------------------------------------------------------------------
-- 7. Folgen, Blockieren und Beiträge
-- ---------------------------------------------------------------------
create table public.folgen (
  fan   uuid not null default auth.uid() references auth.users on delete cascade,
  seite uuid not null references auth.users on delete cascade,
  am    timestamptz not null default now(),
  primary key (fan, seite),
  check (fan <> seite)
);

create table public.blockiert (
  wer uuid not null default auth.uid() references auth.users on delete cascade,
  wen uuid not null references auth.users on delete cascade,
  am  timestamptz not null default now(),
  primary key (wer, wen)
);

create function public.gegenseitig(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.folgen where fan = a and seite = b)
     and exists (select 1 from public.folgen where fan = b and seite = a);
$$;

-- Wie viele folgen, ohne zu verraten, wer.
create function public.follower(seite uuid)
returns int language sql stable security definer set search_path = ''
as $$ select count(*)::int from public.folgen f where f.seite = follower.seite; $$;

-- Öffentlich posten nur geprüfte Konten. Öffentlich heißt: für alle in
-- KM1, nicht im offenen Netz.
create table public.beitraege (
  id          uuid primary key default gen_random_uuid(),
  von         uuid not null default auth.uid() references auth.users on delete cascade,
  text        text not null check (char_length(text) between 1 and 1000),
  pfad        text,
  erstellt_am timestamptz not null default now()
);

create table public.neuigkeiten (
  id          uuid primary key default gen_random_uuid(),
  art         text not null default 'news',
  titel       text not null check (char_length(titel) between 1 and 120),
  text        text not null default '',
  bild        text,
  erstellt_am timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Nachrichten
-- ---------------------------------------------------------------------
-- Wer wem schreiben darf, wie schreibRecht(von, an) in der App:
-- 'direkt', 'anfrage' (der andere entscheidet) oder 'nein'.
create function public.schreib_recht(von uuid, an uuid)
returns text language plpgsql stable security definer set search_path = ''
as $$
declare
  ra text := public.rolle_von(von);
  rb text := public.rolle_von(an);
  kind uuid; andere uuid; ro text;
begin
  if von is null or an is null or von = an or ra is null or rb is null then return 'nein'; end if;
  if exists (select 1 from public.blockiert where (wer = an and wen = von) or (wer = von and wen = an)) then
    return 'nein';
  end if;

  -- 1. Kinder unter 16: die eigenen Eltern, Trainer und Mitspieler, KM1.
  if public.ist_kind(von) or public.ist_kind(an) then
    kind := case when public.ist_kind(an) then an else von end;
    andere := case when kind = an then von else an end;
    ro := public.rolle_von(andere);
    if public.ist_eltern_von(andere, kind) then return 'direkt'; end if;
    if public.selbes_team(kind, andere) and (ro = 'spieler' or (ro = 'trainer' and public.ist_geprueft(andere))) then
      return 'direkt';
    end if;
    if ro = 'km1' then return 'direkt'; end if;
    return 'nein';
  end if;

  -- 2. Spieler von 16 bis 17: Scouts und Vereine nur über die Eltern oder
  --    die Akademie, alle anderen nur, wenn man sich gegenseitig folgt.
  if public.minderjaehrig(an) and not public.selbes_team(von, an) and ra <> 'km1' then
    if ra in ('scout','verein') then return 'nein'; end if;
    if not public.gegenseitig(von, an) then return 'nein'; end if;
  end if;

  if public.selbes_team(von, an) then return 'direkt'; end if;
  -- 3. KM1 ist für alle da.
  if ra = 'km1' or rb = 'km1' then return 'direkt'; end if;
  -- 4. Profis und Vereine haben kein offenes Postfach.
  if rb in ('profi','verein') then
    if ra in ('profi','verein') and public.ist_geprueft(von) then return 'direkt'; end if;
    if public.ist_geprueft(von) then return 'anfrage'; end if;
    return 'nein';
  end if;
  -- 5. Eltern und der Trainer ihres Kindes, Eltern derselben Mannschaft.
  if ra = 'eltern' and rb = 'trainer' and exists (
       select 1 from public.teams t where t.trainer_id = an and public.eltern_im_team(von, t.id)) then
    return 'direkt';
  end if;
  if rb = 'eltern' and ra = 'trainer' and exists (
       select 1 from public.teams t where t.trainer_id = von and public.eltern_im_team(an, t.id)) then
    return 'direkt';
  end if;
  if ra = 'eltern' and rb = 'eltern' and exists (
       select 1 from public.teams t where public.eltern_im_team(von, t.id) and public.eltern_im_team(an, t.id)) then
    return 'direkt';
  end if;
  -- 6. Geprüfte untereinander, 7. wer sich gegenseitig folgt.
  if public.ist_geprueft(von) and public.ist_geprueft(an) then return 'direkt'; end if;
  if public.gegenseitig(von, an) then return 'direkt'; end if;
  -- 8. Geprüfte an alle anderen: als Anfrage.
  if public.ist_geprueft(von) then return 'anfrage'; end if;
  return 'nein';
end;
$$;

create table public.chats (
  id          uuid primary key default gen_random_uuid(),
  a           uuid not null references auth.users on delete cascade,  -- wer angefangen hat
  b           uuid not null references auth.users on delete cascade,
  status      text not null check (status in ('offen','anfrage','abgelehnt')),
  erstellt_am timestamptz not null default now(),
  check (a <> b)
);
create unique index chats_paar on public.chats (least(a, b), greatest(a, b));

create table public.nachrichten (
  id      uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats on delete cascade,
  von     uuid not null default auth.uid() references auth.users on delete cascade,
  text    text not null check (char_length(text) between 1 and 2000),
  am      timestamptz not null default now()
);

create function public.chat_starten(an uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  weg text := public.schreib_recht(auth.uid(), an);
  c uuid;
begin
  if weg = 'nein' then
    raise exception 'Hier darfst du nicht schreiben.' using errcode = '42501';
  end if;
  select id into c from public.chats where least(a, b) = least(auth.uid(), an) and greatest(a, b) = greatest(auth.uid(), an);
  if c is not null then return c; end if;
  insert into public.chats (a, b, status) values (auth.uid(), an, case when weg = 'direkt' then 'offen' else 'anfrage' end)
  returning id into c;
  return c;
end;
$$;

-- Wer eine Anfrage bekommt, entscheidet, ob daraus ein Chat wird.
create function public.anfrage_entscheiden(c uuid, ja boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.chats set status = case when ja then 'offen' else 'abgelehnt' end
   where id = c and b = auth.uid() and status = 'anfrage';
  if not found then
    raise exception 'Diese Anfrage gibt es nicht.' using errcode = 'P0002';
  end if;
end;
$$;

-- Wer einen Chat lesen darf: die beiden, und unter 16 die Eltern.
create function public.darf_chat_lesen(c uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.chats x where x.id = c and (
      auth.uid() in (x.a, x.b)
      or (public.ist_kind(x.a) and public.ist_eltern_von(auth.uid(), x.a))
      or (public.ist_kind(x.b) and public.ist_eltern_von(auth.uid(), x.b))
    ));
$$;

-- Schreiben: nur im eigenen Chat, bei einer Anfrage nur wer angefangen
-- hat, und nur, solange die Regel es noch erlaubt (etwa nach Blockieren).
create function public.darf_im_chat_schreiben(c uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.chats x where x.id = c and auth.uid() in (x.a, x.b)
      and (x.status = 'offen' or (x.status = 'anfrage' and x.a = auth.uid()))
      and public.schreib_recht(auth.uid(), case when x.a = auth.uid() then x.b else x.a end) <> 'nein');
$$;

-- ---------------------------------------------------------------------
-- 9. Laufbahn und Talentprofil
-- ---------------------------------------------------------------------
create table public.stationen (
  id              uuid primary key default gen_random_uuid(),
  spieler_id      uuid not null references auth.users on delete cascade,
  verein          text not null check (char_length(verein) between 1 and 60),
  team            text not null default '' check (char_length(team) <= 40),
  von_jahr        int  not null check (von_jahr between 2000 and 2100),
  bis_jahr        int  check (bis_jahr between 2000 and 2100),
  -- Woher die Angabe stammt. Jede Station zeigt ihre Quelle.
  quelle          text not null check (quelle in ('eltern','selbst','trainer','km1')),
  eingetragen_von uuid not null default auth.uid() references auth.users on delete set null,
  bestaetigt_von  uuid references auth.users on delete set null,
  bestaetigt_am   timestamptz
);

-- Wer eine Station eintragen darf: unter 16 die Eltern, ab 16 der Spieler
-- selbst, der Trainer mit Haken und KM1.
create function public.darf_station_eintragen(s uuid, q text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case q
    when 'eltern'  then public.ist_eltern_von(auth.uid(), s)
    when 'selbst'  then auth.uid() = s and not public.ist_kind(s)
    when 'trainer' then public.selbes_team(auth.uid(), s) and public.rolle_von(auth.uid()) = 'trainer'
    when 'km1'     then public.ist_km1()
    else false end;
$$;

create function public.station_bestaetigen(st uuid, ja boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare s uuid;
begin
  select spieler_id into s from public.stationen where id = st;
  if s is null then
    raise exception 'Diese Station gibt es nicht.' using errcode = 'P0002';
  end if;
  if not (public.ist_km1() or (public.rolle_von(auth.uid()) in ('trainer','akademie') and public.ist_geprueft(auth.uid())
                               and public.selbes_team(auth.uid(), s))) then
    raise exception 'Bestätigen kann nur der Trainer mit Haken.' using errcode = '42501';
  end if;
  if ja then
    update public.stationen set bestaetigt_von = auth.uid(), bestaetigt_am = now() where id = st;
  end if;
end;
$$;

create table public.talentprofile (
  spieler_id      uuid primary key references auth.users on delete cascade,
  position        text check (position in ('Tor','Abwehr','Mittelfeld','Sturm')),
  fuss            text check (fuss in ('Links','Rechts','Beide')),
  freigabe        text not null default 'privat' check (freigabe in ('privat','scouts')),
  freigegeben_von uuid references auth.users on delete set null,
  freigegeben_am  timestamptz
);

-- Unter 16 geben die Eltern das Talentprofil frei, ab 16 der Spieler.
create function public.talentprofil_freigeben(s uuid, frei boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not (public.ist_eltern_von(auth.uid(), s) or (auth.uid() = s and not public.ist_kind(s))) then
    raise exception 'Unter 16 geben die Eltern das Talentprofil frei.' using errcode = '42501';
  end if;
  insert into public.talentprofile (spieler_id, freigabe, freigegeben_von, freigegeben_am)
  values (s, case when frei then 'scouts' else 'privat' end, auth.uid(), now())
  on conflict (spieler_id) do update
    set freigabe = excluded.freigabe, freigegeben_von = excluded.freigegeben_von, freigegeben_am = excluded.freigegeben_am;
end;
$$;

-- Wen ein Scout sieht: ab 16, oder jünger mit Freigabe der Eltern.
create function public.scout_darf_sehen(s uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.rolle_von(auth.uid()) = 'scout' and public.ist_geprueft(auth.uid())
     and (coalesce(public.alter_von(s) >= 16, false)
          or exists (select 1 from public.talentprofile t where t.spieler_id = s and t.freigabe = 'scouts'));
$$;

create table public.beobachtet (
  scout_id   uuid not null default auth.uid() references auth.users on delete cascade,
  spieler_id uuid not null references auth.users on delete cascade,
  am         timestamptz not null default now(),
  primary key (scout_id, spieler_id)
);

create table public.scout_berichte (
  id          uuid primary key default gen_random_uuid(),
  scout_id    uuid not null default auth.uid() references auth.users on delete cascade,
  spieler_id  uuid not null references auth.users on delete cascade,
  text        text not null check (char_length(text) between 1 and 2000),
  empfehlung  text not null check (empfehlung in ('beobachten','probe','kein')),
  geteilt     boolean not null default false,   -- mit Eltern und Akademie
  am          timestamptz not null default now()
);

-- Kontakt nur über Eltern oder Akademie, nie an den Spieler selbst. Bis
-- 18 gehen Anfragen an die Eltern.
create table public.kontakt_anfragen (
  id          uuid primary key default gen_random_uuid(),
  scout_id    uuid not null default auth.uid() references auth.users on delete cascade,
  spieler_id  uuid not null references auth.users on delete cascade,
  status      text not null default 'offen' check (status in ('offen','angenommen','abgelehnt')),
  nachricht   text not null default '' check (char_length(nachricht) <= 500),
  am          timestamptz not null default now()
);

create function public.kontakt_entscheiden(k uuid, ja boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.kontakt_anfragen set status = case when ja then 'angenommen' else 'abgelehnt' end
   where id = k and status = 'offen'
     and (public.ist_eltern_von(auth.uid(), spieler_id)
          or (auth.uid() = spieler_id and not public.minderjaehrig(spieler_id)));
  if not found then
    raise exception 'Das entscheiden die Eltern.' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Meldungen
-- ---------------------------------------------------------------------
-- Jede Meldung sieht sich KM1 innerhalb von 24 Stunden an. Wer gemeldet
-- hat, bleibt für alle anderen unbekannt.
create table public.meldungen (
  id          uuid primary key default gen_random_uuid(),
  von         uuid not null default auth.uid() references auth.users on delete cascade,
  ziel_art    text not null check (ziel_art in ('upload','beitrag','nachricht','profil')),
  ziel_id     uuid not null,
  grund       text not null check (char_length(grund) between 1 and 500),
  am          timestamptz not null default now(),
  erledigt_am timestamptz,
  entscheidung text check (entscheidung in ('entfernt','bleibt'))
);

-- ---------------------------------------------------------------------
-- 11. Trainingspläne
-- ---------------------------------------------------------------------
-- Sechs Wochen, drei Einheiten pro Woche. Die erste Woche ist mit Konto
-- frei, die übrigen gehören zu Pro (oder zu KM1 Team für die Mannschaft).
create table public.plaene (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  titel       text not null,
  ebene       int  not null check (ebene between 1 and 4),
  fuer        text not null default '',
  satz        text not null default '',
  minuten     int  not null default 20,
  reihenfolge int  not null default 0
);

create table public.plan_einheiten (
  plan_id  text not null references public.plaene on delete cascade,
  woche    int  not null check (woche between 1 and 12),
  nr       int  not null check (nr between 1 and 3),
  video_id uuid not null references public.videos on delete cascade,
  aufgabe  text not null,
  primary key (plan_id, woche, nr)
);

create table public.plan_laufend (
  user_id      uuid primary key references auth.users on delete cascade,
  plan_id      text not null references public.plaene on delete cascade,
  gestartet_am timestamptz not null default now()
);

create table public.plan_fortschritt (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  plan_id text not null,
  woche   int  not null,
  nr      int  not null,
  am      timestamptz not null default now(),
  primary key (user_id, plan_id, woche, nr),
  foreign key (plan_id, woche, nr) references public.plan_einheiten on delete cascade
);

create function public.plan_woche_frei(w int)
returns boolean language sql stable security definer set search_path = ''
as $$ select (w = 1 and auth.uid() is not null) or public.hat_abo() or public.ist_km1(); $$;

-- ---------------------------------------------------------------------
-- 12. Camps
-- ---------------------------------------------------------------------
-- Ein Camp ist eine Leistung auf dem Platz. Bezahlt wird direkt bei KM1
-- über einen Zahlungsanbieter, nicht über den App Store. Den Status
-- „bezahlt" setzt nur dessen Webhook mit dem Dienstschlüssel.
create table public.camps (
  id                      text primary key check (id ~ '^[a-z0-9-]+$'),
  titel                   text not null,
  von                     date not null,
  bis                     date not null,
  preis_cent              int  not null check (preis_cent > 0),
  geschwister_rabatt_cent int  not null default 0 check (geschwister_rabatt_cent >= 0),
  plaetze                 int  not null check (plaetze > 0),
  jahrgang_von            int  not null,
  jahrgang_bis            int  not null
);

create table public.camp_buchungen (
  id         uuid primary key default gen_random_uuid(),
  camp_id    text not null references public.camps on delete restrict,
  eltern_id  uuid not null references auth.users on delete cascade,
  nr         text not null unique,
  -- Vorname, Jahrgang und Hinweise je Kind. Nicht mehr.
  kinder     jsonb not null check (jsonb_typeof(kinder) = 'array' and jsonb_array_length(kinder) between 1 and 3),
  notfall    text not null check (char_length(notfall) between 6 and 30),
  fotos      boolean not null default false,          -- ohne Zustimmung kein Foto
  zahlung    text not null check (zahlung in ('karte','paypal','lastschrift')),
  summe_cent int  not null,
  status     text not null default 'reserviert' check (status in ('reserviert','bezahlt','storniert')),
  am         timestamptz not null default now()
);

-- Buchen kann nur ein Erwachsener. Konten von Kindern unter 16 laufen auf
-- die E-Mail der Eltern (so legt die Handy-App sie an); über ein solches
-- Konto bucht deshalb auch ein Elternteil, aber nur mit der ausdrücklichen
-- Bestätigung, erziehungsberechtigt zu sein. Die Plätze werden unter einer
-- Sperre gezählt, damit zwei gleichzeitige Buchungen nicht denselben Platz
-- bekommen.
create function public.camp_buchen(p_camp text, p_kinder jsonb, p_notfall text, p_fotos boolean, p_zahlung text,
                                   p_erziehungsberechtigt boolean default false)
returns table (nr text, summe_cent int) language plpgsql security definer set search_path = ''
as $$
declare
  c public.camps;
  belegt int;
  n int := jsonb_array_length(p_kinder);
  summe int;
  neu text;
begin
  if public.minderjaehrig(auth.uid())
     and not (coalesce(p_erziehungsberechtigt, false)
              and exists (select 1 from public.profiles p where p.id = auth.uid() and p.eltern_einwilligung_am is not null)) then
    raise exception 'Camps bucht ein Erwachsener.' using errcode = '42501';
  end if;
  select * into c from public.camps where id = p_camp for update;
  if c.id is null then
    raise exception 'Dieses Camp gibt es nicht.' using errcode = 'P0002';
  end if;
  if exists (select 1 from jsonb_array_elements(p_kinder) k
              where coalesce(trim(k->>'vorname'), '') = ''
                 or coalesce((k->>'jahrgang')::int, 0) not between c.jahrgang_von and c.jahrgang_bis) then
    raise exception 'Vorname und ein passender Jahrgang für jedes Kind.' using errcode = '22023';
  end if;
  select coalesce(sum(jsonb_array_length(b.kinder)), 0) into belegt
    from public.camp_buchungen b where b.camp_id = c.id and b.status <> 'storniert';
  if belegt + n > c.plaetze then
    raise exception 'Nicht mehr genug Plätze frei.' using errcode = 'P0001';
  end if;
  summe := n * c.preis_cent - (n - 1) * c.geschwister_rabatt_cent;
  neu := 'HC-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  insert into public.camp_buchungen (camp_id, eltern_id, nr, kinder, notfall, fotos, zahlung, summe_cent)
  values (c.id, auth.uid(), neu, p_kinder, trim(p_notfall), coalesce(p_fotos, false), p_zahlung, summe);
  return query select neu, summe;
end;
$$;

create function public.camp_plaetze_frei(p_camp text)
returns int language sql stable security definer set search_path = ''
as $$
  select c.plaetze - coalesce((select sum(jsonb_array_length(b.kinder))::int from public.camp_buchungen b
                                where b.camp_id = c.id and b.status <> 'storniert'), 0)
    from public.camps c where c.id = p_camp;
$$;

-- ---------------------------------------------------------------------
-- 13. Das Abo gilt auch über die Mannschaft
-- ---------------------------------------------------------------------
create or replace function public.hat_abo()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.abos a
                  where a.user_id = auth.uid() and a.aktiv and (a.bis is null or a.bis > now()))
      or exists (select 1 from public.team_mitglieder m
                   join public.teams t on t.id = m.team_id
                   join public.abos a on a.user_id = t.trainer_id
                  where m.spieler_id = auth.uid() and m.status = 'dabei'
                    and a.aktiv and a.art in ('team','akademie') and (a.bis is null or a.bis > now()));
$$;

-- ---------------------------------------------------------------------
-- 14. Regeln (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.kind_codes         enable row level security;
alter table public.familie            enable row level security;
alter table public.pruefungen         enable row level security;
alter table public.einladungen        enable row level security;
alter table public.teams              enable row level security;
alter table public.team_mitglieder    enable row level security;
alter table public.hausaufgaben       enable row level security;
alter table public.uploads            enable row level security;
alter table public.einstellungen_kind enable row level security;
alter table public.feedback           enable row level security;
alter table public.reaktionen         enable row level security;
alter table public.folgen             enable row level security;
alter table public.blockiert          enable row level security;
alter table public.beitraege          enable row level security;
alter table public.neuigkeiten        enable row level security;
alter table public.chats              enable row level security;
alter table public.nachrichten        enable row level security;
alter table public.stationen          enable row level security;
alter table public.talentprofile      enable row level security;
alter table public.beobachtet         enable row level security;
alter table public.scout_berichte     enable row level security;
alter table public.kontakt_anfragen   enable row level security;
alter table public.meldungen          enable row level security;
alter table public.plaene             enable row level security;
alter table public.plan_einheiten     enable row level security;
alter table public.plan_laufend       enable row level security;
alter table public.plan_fortschritt   enable row level security;
alter table public.camps              enable row level security;
alter table public.camp_buchungen     enable row level security;

-- Das volle Profil: das eigene, dazu Eltern und Kind gegenseitig,
-- Mitspieler und Trainer derselben Mannschaft und KM1. Alle anderen sehen
-- über profil_kurz() nur Name, Rolle und Haken, und nur, wenn es einen
-- Grund gibt: eine Seite zum Folgen oder ein Talent für einen Scout.
create policy "profile in reichweite" on public.profiles
  for select to authenticated using (
    public.ist_km1()
    or public.ist_eltern_von(auth.uid(), id) or public.ist_eltern_von(id, auth.uid())
    or public.selbes_team(auth.uid(), id));

create function public.profil_kurz(u uuid)
returns table (id uuid, vorname text, rolle text, geprueft boolean)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.vorname, p.rolle, public.ist_geprueft(p.id)
    from public.profiles p
   where p.id = u and auth.uid() is not null
     and (p.id = auth.uid() or public.ist_geprueft(p.id) or public.scout_darf_sehen(p.id)
          or public.ist_km1() or public.selbes_team(auth.uid(), p.id)
          or public.ist_eltern_von(auth.uid(), p.id) or public.ist_eltern_von(p.id, auth.uid()));
$$;

-- Den Verbindungscode liest nur das Kind selbst.
create policy "eigener kind code" on public.kind_codes
  for select to authenticated using (kind_id = auth.uid());
revoke insert, update, delete on public.kind_codes from anon, authenticated;

-- Familie: beide Seiten sehen die Verbindung. Angelegt wird sie nur über
-- kind_verbinden(), gelöst von den Eltern.
create policy "eigene familie" on public.familie
  for select to authenticated using (auth.uid() in (eltern_id, kind_id) or public.ist_km1());
create policy "eltern loesen" on public.familie
  for delete to authenticated using (eltern_id = auth.uid());
revoke insert, update on public.familie from anon, authenticated;

create policy "eigene pruefung" on public.pruefungen
  for select to authenticated using (user_id = auth.uid() or public.ist_km1());
create policy "pruefung einreichen" on public.pruefungen
  for insert to authenticated with check (
    user_id = auth.uid() and status = 'offen' and entschieden_von is null
    and public.pruef_rolle(public.meine_rolle()));
revoke update, delete on public.pruefungen from anon, authenticated;

create policy "eigene einladungen" on public.einladungen
  for select to authenticated using (von = auth.uid() or genutzt_von = auth.uid() or public.ist_km1());
revoke insert, update, delete on public.einladungen from anon, authenticated;

create policy "teams in reichweite" on public.teams
  for select to authenticated using (
    trainer_id = auth.uid() or public.im_team(auth.uid(), id) or public.eltern_im_team(auth.uid(), id) or public.ist_km1());
create policy "trainer mit haken legt an" on public.teams
  for insert to authenticated with check (
    trainer_id = auth.uid() and public.meine_rolle() = 'trainer' and public.ist_geprueft(auth.uid()));
create policy "trainer aendert" on public.teams
  for update to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
create policy "trainer loescht" on public.teams
  for delete to authenticated using (trainer_id = auth.uid());

create policy "mitglieder in reichweite" on public.team_mitglieder
  for select to authenticated using (
    spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id)
    or public.trainer_von(team_id) = auth.uid() or public.im_team(auth.uid(), team_id) or public.ist_km1());
create policy "selbst austreten" on public.team_mitglieder
  for delete to authenticated using (spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id));
revoke insert, update on public.team_mitglieder from anon, authenticated;

create policy "hausaufgaben der mannschaft" on public.hausaufgaben
  for select to authenticated using (
    public.trainer_von(team_id) = auth.uid() or public.im_team(auth.uid(), team_id)
    or public.eltern_im_team(auth.uid(), team_id) or public.ist_km1());
create policy "trainer gibt auf" on public.hausaufgaben
  for all to authenticated
  using (public.trainer_von(team_id) = auth.uid())
  with check (public.trainer_von(team_id) = auth.uid() and public.ist_geprueft(auth.uid()));

create policy "uploads nach regel" on public.uploads
  for select to authenticated using (public.darf_upload_sehen(von, team_id, sicht, eltern_status));
create policy "eigene oder des kindes hochladen" on public.uploads
  for insert to authenticated with check (
    (von = auth.uid() or public.ist_eltern_von(auth.uid(), von))
    and (team_id is null or public.im_team(von, team_id)));
create policy "eigene loeschen" on public.uploads
  for delete to authenticated using (von = auth.uid() or public.ist_eltern_von(auth.uid(), von));
revoke update on public.uploads from anon, authenticated;

create policy "eltern stellen ein" on public.einstellungen_kind
  for all to authenticated
  using (public.ist_eltern_von(auth.uid(), kind_id) or kind_id = auth.uid())
  with check (public.ist_eltern_von(auth.uid(), kind_id));

create policy "feedback lesen" on public.feedback
  for select to authenticated using (exists (
    select 1 from public.uploads x where x.id = upload_id
       and public.darf_upload_sehen(x.von, x.team_id, x.sicht, x.eltern_status)));
create policy "feedback schreiben" on public.feedback
  for insert to authenticated with check (von = auth.uid() and public.darf_feedback_geben(upload_id));

create policy "reaktionen lesen" on public.reaktionen
  for select to authenticated using (true);
create policy "eigene reaktionen" on public.reaktionen
  for insert to authenticated with check (user_id = auth.uid());
create policy "eigene reaktionen loeschen" on public.reaktionen
  for delete to authenticated using (user_id = auth.uid());

-- Folgen: Kindern unter 16 folgt nur das eigene Team.
create policy "eigenes folgen lesen" on public.folgen
  for select to authenticated using (auth.uid() in (fan, seite) or public.ist_km1());
create policy "folgen" on public.folgen
  for insert to authenticated with check (
    fan = auth.uid() and (not public.ist_kind(seite) or public.selbes_team(auth.uid(), seite)));
create policy "entfolgen" on public.folgen
  for delete to authenticated using (fan = auth.uid());

create policy "eigene blockierungen" on public.blockiert
  for all to authenticated using (wer = auth.uid()) with check (wer = auth.uid());

create policy "beitraege fuer alle in km1" on public.beitraege
  for select to authenticated using (true);
create policy "gepruefte posten" on public.beitraege
  for insert to authenticated with check (
    von = auth.uid() and public.ist_geprueft(auth.uid())
    and public.meine_rolle() in ('trainer','akademie','verein','profi','km1'));
create policy "eigene beitraege loeschen" on public.beitraege
  for delete to authenticated using (von = auth.uid() or public.ist_km1());

create policy "neuigkeiten lesen" on public.neuigkeiten
  for select to anon, authenticated using (true);
create policy "km1 schreibt neuigkeiten" on public.neuigkeiten
  for all to authenticated using (public.ist_km1()) with check (public.ist_km1());

create policy "chats lesen" on public.chats
  for select to authenticated using (public.darf_chat_lesen(id));
revoke insert, update, delete on public.chats from anon, authenticated;

create policy "nachrichten lesen" on public.nachrichten
  for select to authenticated using (public.darf_chat_lesen(chat_id));
create policy "nachrichten schreiben" on public.nachrichten
  for insert to authenticated with check (von = auth.uid() and public.darf_im_chat_schreiben(chat_id));
revoke update, delete on public.nachrichten from anon, authenticated;

create policy "laufbahn in reichweite" on public.stationen
  for select to authenticated using (
    spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id)
    or public.selbes_team(auth.uid(), spieler_id) or public.ist_km1() or public.scout_darf_sehen(spieler_id));
create policy "station eintragen" on public.stationen
  for insert to authenticated with check (
    eingetragen_von = auth.uid() and bestaetigt_von is null and bestaetigt_am is null
    and public.darf_station_eintragen(spieler_id, quelle));
create policy "eigene station loeschen" on public.stationen
  for delete to authenticated using (eingetragen_von = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id));
revoke update on public.stationen from anon, authenticated;

create policy "talentprofil in reichweite" on public.talentprofile
  for select to authenticated using (
    spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id)
    or public.selbes_team(auth.uid(), spieler_id) or public.ist_km1() or public.scout_darf_sehen(spieler_id));
create policy "position und fuss" on public.talentprofile
  for update to authenticated
  using (spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id))
  with check (spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id));
create policy "talentprofil anlegen" on public.talentprofile
  for insert to authenticated with check (
    (spieler_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id))
    and freigabe = 'privat' and freigegeben_von is null and freigegeben_am is null);
revoke delete on public.talentprofile from anon, authenticated;
-- Freigeben geht nur über talentprofil_freigeben(), ändern nur Position und Fuß.
revoke update on public.talentprofile from authenticated;
grant update (position, fuss) on public.talentprofile to authenticated;

create policy "eigene beobachtung" on public.beobachtet
  for select to authenticated using (scout_id = auth.uid());
create policy "beobachten" on public.beobachtet
  for insert to authenticated with check (scout_id = auth.uid() and public.scout_darf_sehen(spieler_id));
create policy "nicht mehr beobachten" on public.beobachtet
  for delete to authenticated using (scout_id = auth.uid());

create policy "berichte lesen" on public.scout_berichte
  for select to authenticated using (
    scout_id = auth.uid() or public.ist_km1()
    or (geteilt and public.ist_eltern_von(auth.uid(), spieler_id)));
create policy "bericht schreiben" on public.scout_berichte
  for insert to authenticated with check (scout_id = auth.uid() and public.scout_darf_sehen(spieler_id));
create policy "eigenen bericht aendern" on public.scout_berichte
  for update to authenticated using (scout_id = auth.uid()) with check (scout_id = auth.uid());

create policy "kontakt lesen" on public.kontakt_anfragen
  for select to authenticated using (
    scout_id = auth.uid() or public.ist_eltern_von(auth.uid(), spieler_id)
    or (spieler_id = auth.uid() and not public.minderjaehrig(spieler_id)) or public.ist_km1());
create policy "kontakt anfragen" on public.kontakt_anfragen
  for insert to authenticated with check (scout_id = auth.uid() and status = 'offen' and public.scout_darf_sehen(spieler_id));
revoke update, delete on public.kontakt_anfragen from anon, authenticated;

create policy "melden" on public.meldungen
  for insert to authenticated with check (von = auth.uid() and erledigt_am is null and entscheidung is null);
create policy "meldungen lesen" on public.meldungen
  for select to authenticated using (von = auth.uid() or public.ist_km1());
create policy "km1 entscheidet" on public.meldungen
  for update to authenticated using (public.ist_km1()) with check (public.ist_km1());

create policy "plaene lesen" on public.plaene
  for select to anon, authenticated using (true);
create policy "km1 schreibt plaene" on public.plaene
  for all to authenticated using (public.ist_km1()) with check (public.ist_km1());
-- Die Aufgaben der ersten Woche sehen alle als Vorgeschmack, die übrigen
-- nur mit Pro. Welche Videos drin sind, steht ohnehin in videos.
create policy "einheiten nach woche" on public.plan_einheiten
  for select to anon, authenticated using (woche = 1 or public.plan_woche_frei(woche));
create policy "km1 schreibt einheiten" on public.plan_einheiten
  for all to authenticated using (public.ist_km1()) with check (public.ist_km1());

create policy "eigener plan" on public.plan_laufend
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigener planfortschritt" on public.plan_fortschritt
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.plan_woche_frei(woche));

create policy "camps lesen" on public.camps
  for select to anon, authenticated using (true);
create policy "km1 schreibt camps" on public.camps
  for all to authenticated using (public.ist_km1()) with check (public.ist_km1());
create policy "eigene buchungen" on public.camp_buchungen
  for select to authenticated using (eltern_id = auth.uid() or public.ist_km1());
revoke insert, update, delete on public.camp_buchungen from anon, authenticated;

-- Videos schreibt nur KM1: die Regeln der Grundlage laufen über
-- ist_trainer(), das jetzt KM1 meint.

-- ---------------------------------------------------------------------
-- 15. Rechte der Funktionen
-- ---------------------------------------------------------------------
revoke execute on function
  public.kind_verbinden(text), public.pruefung_entscheiden(uuid, boolean, text),
  public.haken_entziehen(uuid, text), public.einladung_erstellen(text, text, boolean),
  public.einladung_einloesen(text), public.team_beitreten(text),
  public.mitglied_entscheiden(uuid, uuid, boolean), public.upload_freigeben(uuid, boolean),
  public.zahl_bestaetigen(uuid), public.chat_starten(uuid), public.anfrage_entscheiden(uuid, boolean),
  public.station_bestaetigen(uuid, boolean), public.talentprofil_freigeben(uuid, boolean),
  public.kontakt_entscheiden(uuid, boolean), public.camp_buchen(text, jsonb, text, boolean, text, boolean),
  public.profil_kurz(uuid)
  from public, anon;
grant execute on function
  public.kind_verbinden(text), public.pruefung_entscheiden(uuid, boolean, text),
  public.haken_entziehen(uuid, text), public.einladung_erstellen(text, text, boolean),
  public.einladung_einloesen(text), public.team_beitreten(text),
  public.mitglied_entscheiden(uuid, uuid, boolean), public.upload_freigeben(uuid, boolean),
  public.zahl_bestaetigen(uuid), public.chat_starten(uuid), public.anfrage_entscheiden(uuid, boolean),
  public.station_bestaetigen(uuid, boolean), public.talentprofil_freigeben(uuid, boolean),
  public.kontakt_entscheiden(uuid, boolean), public.camp_buchen(text, jsonb, text, boolean, text, boolean),
  public.profil_kurz(uuid)
  to authenticated;
revoke execute on function public.upload_vorbereiten() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 16. Speicher für die Videos der Spieler
-- ---------------------------------------------------------------------
-- Privat. Jeder legt nur in seinem eigenen Ordner ab (Eltern auch in dem
-- des Kindes), und herausgegeben wird eine Datei nur über einen
-- signierten Link an die, die das Video sehen dürfen.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

create function public.darf_upload_datei_sehen(datei text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.uploads x
                  where x.pfad = datei and public.darf_upload_sehen(x.von, x.team_id, x.sicht, x.eltern_status));
$$;

create policy "upload dateien nach regel" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and public.darf_upload_datei_sehen(name));

create policy "eigene upload dateien" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.ist_eltern_von(auth.uid(), nullif(split_part(name, '/', 1), '')::uuid)));
