-- =====================================================================
-- KM1 Training — die Datenbank.
--
-- Drei Zugangsstufen, und die Datenbank setzt sie durch, nicht die App:
--
--   offen   jeder, auch ohne Konto
--   konto   jeder mit kostenlosem Konto
--   pro     nur mit laufendem Abo (oder als Trainer)
--
-- Wer die App auseinandernimmt und mit dem öffentlichen Schlüssel direkt
-- gegen die Datenbank spricht, bekommt trotzdem nur, was ihm zusteht.
-- Die Beschreibungen aller Videos sind für alle lesbar, weil die App
-- gesperrte Videos als Vorgeschmack zeigt. Geschützt sind die Schritte
-- und die Videodatei selbst.
--
-- Einspielen: im Supabase-Dashboard unter „SQL Editor" den ganzen Inhalt
-- dieser Datei einfügen und ausführen. Danach seed.sql genauso.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profile. Entstehen automatisch mit dem Konto, siehe neues_konto().
-- ---------------------------------------------------------------------
create table public.profiles (
  id                          uuid primary key references auth.users on delete cascade,
  vorname                     text not null default 'Spieler'
                                check (char_length(vorname) between 1 and 40),
  rolle                       text not null default 'spieler'
                                check (rolle in ('spieler', 'trainer')),
  ebene                       int  not null default 1 check (ebene between 1 and 4),
  -- Nur das Jahr, nicht das Datum: mehr braucht die Altersgrenze nicht.
  geburtsjahr                 int  check (geburtsjahr between 1900 and 2100),
  -- Unter 16 Jahren willigen die Eltern ein (DSGVO Art. 8). Das Konto
  -- läuft dann auf die E-Mail der Eltern, und die Bestätigungsmail geht
  -- an sie. Hier steht, wann und in welcher Fassung eingewilligt wurde.
  eltern_einwilligung_am      timestamptz,
  eltern_einwilligung_fassung text,
  erstellt_am                 timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Videos und ihre Schritte.
-- ---------------------------------------------------------------------
create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  titel        text not null,
  beschreibung text not null default '',
  fehler       text not null default '',          -- „Häufiger Fehler"
  kategorie    text not null check (kategorie in
                 ('dribbling','passen','flanken','schuss','annahme','athletik','torwart','taktik')),
  ebene        int  not null check (ebene between 1 and 4),
  -- Platz im Pfad der Ebene, W1 bis W5. Leer heißt: nicht im Pfad.
  woche        int  check (woche between 1 and 12),
  dauer_sek    int  not null default 0 check (dauer_sek >= 0),
  zugang       text not null default 'offen' check (zugang in ('offen','konto','pro')),
  gast         text,                              -- bei Profi-Einheiten
  neu          boolean not null default false,
  bild         text,                              -- Vorschaubild; leer heißt Kreidezeichnung
  -- Die Datei. Bei „offen" im öffentlichen Speicher, sonst im geschützten.
  pfad         text,
  status       text not null default 'entwurf' check (status in ('entwurf','live')),
  reihenfolge  int  not null default 0,
  erstellt_am  timestamptz not null default now(),
  unique (ebene, woche)
);

create table public.video_schritte (
  video_id uuid not null references public.videos on delete cascade,
  nr       int  not null check (nr >= 1),
  text     text not null,
  sekunde  int  check (sekunde >= 0),             -- Kapitelmarke
  primary key (video_id, nr)
);

-- ---------------------------------------------------------------------
-- Was dem Nutzer gehört: Fortschritt, Merkliste, Challenges, Abo.
-- Alles hängt am Konto und verschwindet mit ihm.
-- ---------------------------------------------------------------------
create table public.fortschritt (
  user_id     uuid not null references auth.users on delete cascade,
  video_id    uuid not null references public.videos on delete cascade,
  sekunde     int  not null default 0 check (sekunde >= 0),  -- wo es stehen blieb
  abgehakt_am timestamptz,                                    -- „auf dem Platz geschafft"
  geaendert   timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.merkliste (
  user_id  uuid not null references auth.users on delete cascade,
  video_id uuid not null references public.videos on delete cascade,
  am       timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.challenge_ergebnisse (
  user_id   uuid not null references auth.users on delete cascade,
  challenge text not null check (char_length(challenge) between 1 and 40),
  am        timestamptz not null default now(),
  primary key (user_id, challenge)
);

-- Abo-Status. Später füllt ihn der Webhook von RevenueCat mit dem
-- Dienstschlüssel. Die App liest nur.
create table public.abos (
  user_id uuid primary key references auth.users on delete cascade,
  aktiv   boolean not null default false,
  bis     timestamptz,
  quelle  text check (quelle in ('app_store','play_store','gutschein'))
);

create index fortschritt_abgehakt on public.fortschritt (user_id, abgehakt_am);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen. security definer, damit sie über den Regeln stehen,
-- und mit leerem search_path, damit niemand sie umlenken kann.
-- ---------------------------------------------------------------------
create function public.ist_trainer()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.rolle = 'trainer');
$$;

create function public.hat_abo()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.abos a
                 where a.user_id = auth.uid() and a.aktiv
                   and (a.bis is null or a.bis > now()));
$$;

-- Darf der aktuelle Nutzer dieses Video ansehen? Die eine Stelle, an der
-- die drei Stufen entschieden werden.
create function public.darf_sehen(v uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when public.ist_trainer() then true
    else coalesce((
      select case x.zugang
               when 'offen' then true
               when 'konto' then auth.uid() is not null
               when 'pro'   then public.hat_abo()
             end
      from public.videos x where x.id = v and x.status = 'live'
    ), false)
  end;
$$;

-- Dasselbe für eine Datei im Speicher, über ihren Pfad.
create function public.darf_datei_sehen(datei text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.videos x
                 where x.pfad = datei and public.darf_sehen(x.id));
$$;

-- ---------------------------------------------------------------------
-- Ein neues Konto bekommt sein Profil. Unter 16 Jahren nur mit
-- Einwilligung der Eltern: ohne sie wird das Konto gar nicht erst
-- angelegt. Geprüft wird vorsichtig nach Jahrgang — wer in diesem Jahr
-- 16 wird, braucht sie noch.
-- ---------------------------------------------------------------------
create function public.neues_konto()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  daten    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  jahrgang int   := nullif(daten->>'geburtsjahr', '')::int;
  eltern   boolean := coalesce((daten->>'eltern_einwilligung')::boolean, false);
begin
  if jahrgang is not null
     and extract(year from now())::int - jahrgang < 17
     and not eltern then
    raise exception 'Unter 16 Jahren legen die Eltern das Konto an.'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, vorname, geburtsjahr,
                               eltern_einwilligung_am, eltern_einwilligung_fassung)
  values (
    new.id,
    coalesce(nullif(left(trim(daten->>'vorname'), 40), ''), 'Spieler'),
    jahrgang,
    case when eltern then now() end,
    case when eltern then nullif(daten->>'einwilligung_fassung', '') end
  );
  return new;
end;
$$;

create trigger bei_neuem_konto
  after insert on auth.users
  for each row execute function public.neues_konto();

-- Wer sich mit Google anmeldet, hat beim Anlegen noch kein Alter
-- angegeben. Das holt die App hier nach. Unter 16 geht das nur mit
-- einem Konto, das die Eltern angelegt haben.
create function public.profil_ergaenzen(p_vorname text, p_geburtsjahr int)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet.' using errcode = '42501';
  end if;
  if p_geburtsjahr is null or p_geburtsjahr not between 1900 and extract(year from now())::int then
    raise exception 'Ungültiger Jahrgang.' using errcode = '22023';
  end if;
  if extract(year from now())::int - p_geburtsjahr < 17
     and not exists (select 1 from public.profiles
                     where id = auth.uid() and eltern_einwilligung_am is not null) then
    raise exception 'Unter 16 Jahren legen die Eltern das Konto an.'
      using errcode = 'P0001';
  end if;
  update public.profiles
     set vorname = coalesce(nullif(left(trim(p_vorname), 40), ''), vorname),
         geburtsjahr = p_geburtsjahr
   where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- Aufstieg. Die Ebene setzt der Server, nicht die App: aufgestiegen wird,
-- wenn jedes Video im Pfad der eigenen Ebene abgehakt ist. Gibt die neue
-- Ebene zurück, oder die alte, wenn noch etwas fehlt.
-- ---------------------------------------------------------------------
create function public.aufsteigen()
returns int language plpgsql security definer set search_path = ''
as $$
declare
  jetzt int;
  offen int;
begin
  select ebene into jetzt from public.profiles where id = auth.uid();
  if jetzt is null then
    raise exception 'Nicht angemeldet.' using errcode = '42501';
  end if;
  if jetzt >= 4 then return jetzt; end if;

  select count(*) into offen
    from public.videos v
   where v.ebene = jetzt and v.woche is not null and v.status = 'live'
     and not exists (select 1 from public.fortschritt f
                     where f.user_id = auth.uid() and f.video_id = v.id
                       and f.abgehakt_am is not null);
  if offen > 0 then return jetzt; end if;

  update public.profiles set ebene = jetzt + 1 where id = auth.uid();
  return jetzt + 1;
end;
$$;

-- ---------------------------------------------------------------------
-- Konto löschen, mit allem, was dranhängt. Apple verlangt, dass das in
-- der App geht (Richtlinie 5.1.1). Das Löschen des Nutzers nimmt über
-- „on delete cascade" Profil, Fortschritt, Merkliste und Abo mit.
-- ---------------------------------------------------------------------
create function public.konto_loeschen()
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet.' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- Regeln (Row Level Security).
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.videos               enable row level security;
alter table public.video_schritte       enable row level security;
alter table public.fortschritt          enable row level security;
alter table public.merkliste            enable row level security;
alter table public.challenge_ergebnisse enable row level security;
alter table public.abos                 enable row level security;

-- Profil: nur das eigene. Ändern darf man nur den Vornamen; Rolle und
-- Ebene setzen ausschließlich die Funktionen oben.
create policy "eigenes profil lesen" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "eigenes profil aendern" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (vorname) on public.profiles to authenticated;

-- Videos: was live ist, sehen alle — als Karte mit Beschreibung. Ob es
-- abspielbar ist, entscheidet darf_sehen().
create policy "live videos lesen" on public.videos
  for select to anon, authenticated using (status = 'live' or public.ist_trainer());
create policy "trainer schreibt videos" on public.videos
  for all to authenticated using (public.ist_trainer()) with check (public.ist_trainer());

-- Schritte nur für die, die das Video sehen dürfen.
create policy "schritte nach stufe" on public.video_schritte
  for select to anon, authenticated using (public.darf_sehen(video_id));
create policy "trainer schreibt schritte" on public.video_schritte
  for all to authenticated using (public.ist_trainer()) with check (public.ist_trainer());

-- Fortschritt: nur der eigene, und nur für Videos, die man sehen darf.
create policy "eigener fortschritt" on public.fortschritt
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.darf_sehen(video_id));

create policy "eigene merkliste" on public.merkliste
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigene challenges" on public.challenge_ergebnisse
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Abo: lesen ja, schreiben nie. Das macht nur der Dienstschlüssel.
create policy "eigenes abo lesen" on public.abos
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.abos from anon, authenticated;

-- Die Funktionen dürfen nur angemeldete Nutzer aufrufen, darf_sehen
-- auch Gäste (für die offene Stufe).
revoke execute on function public.profil_ergaenzen(text, int), public.aufsteigen(),
                           public.konto_loeschen() from public, anon;
grant  execute on function public.profil_ergaenzen(text, int), public.aufsteigen(),
                           public.konto_loeschen() to authenticated;
revoke execute on function public.neues_konto() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Speicher. Zwei Eimer: „offen" ist öffentlich und direkt abspielbar,
-- „geschuetzt" gibt Dateien nur über einen signierten Link heraus, und
-- den bekommt nur, wer das Video sehen darf. Der Link gilt eine Stunde.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('videos-offen', 'videos-offen', true),
       ('videos-geschuetzt', 'videos-geschuetzt', false)
on conflict (id) do nothing;

create policy "geschuetzte videos nach stufe" on storage.objects
  for select to authenticated
  using (bucket_id = 'videos-geschuetzt' and public.darf_datei_sehen(name));

create policy "trainer laedt hoch" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('videos-offen', 'videos-geschuetzt') and public.ist_trainer());
