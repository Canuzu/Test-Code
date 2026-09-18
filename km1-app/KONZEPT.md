# KM1 Training App — technisches Konzept

Stand: 18. September 2026. Grundlage für die Umsetzung, kein fertiger Plan in
Stein. Alles, was hier als Entscheidung steht, lässt sich noch ändern, solange
noch kein Code darauf aufbaut.

## 1. Was die App ist

Eine Lern-App für Kinder, Jugendliche und ihre Eltern. Im Mittelpunkt stehen
Videos: wie man flankt, dribbelt, passt, den Ball annimmt, abschließt. Dazu
Bildreihen und kurze Schrittanleitungen, die auf dem Platz nachzumachen sind.

Drei Regeln, die alles andere bestimmen:

1. **Nur KM1 lädt hoch.** Niemand von außen kann Videos einstellen. Das ist
   keine Einstellung in der App, sondern eine Regel in der Datenbank.
2. **Jeder kann zuschauen**, ein Teil der Videos kostenlos, der Rest mit Abo.
3. **Gleiches Gesicht wie die Website.** Dieselben Farben, dieselben Schriften,
   dasselbe Logo, dieselbe Pyramide.

Dass keine fremden Uploads möglich sind, ist nebenbei ein echter Vorteil: Apple
verlangt für Apps mit nutzergenerierten Inhalten Meldefunktion, Moderation und
Blockieren von Nutzern (App Review Guideline 1.2). Das entfällt komplett.

## 2. Architektur

```
  Expo / React Native App  ──────►  Supabase
   (iOS + Android)                   ├── Auth        Konten, Passwort, Apple-Login
        │                            ├── Postgres    Videos, Fortschritt, Rechte
        │                            ├── Storage     die Videodateien
        │                            └── Edge Funcs  signierte Links, Webhooks
        │
        └──────►  RevenueCat  ──────►  App Store / Play Store
                (Abo-Status)           (die eigentliche Zahlung)
```

**Expo (React Native)** — eine Codebasis für beide Plattformen, gebaut wird über
EAS in der Cloud, ein Mac ist nicht nötig. React kennen wir aus der Website.

**Supabase** — liegt schon im Repo (`supabase/`), also dieselbe Technik wie beim
bestehenden Projekt: Postgres mit Row Level Security, Dateispeicher, kleine
Serverfunktionen.

**RevenueCat** — nimmt den Abo-Kram ab (Kaufbelege prüfen, Verlängerung,
Kündigung, Wiederherstellen). Kostenlos, bis das Abo 2.500 $ Umsatz im Monat
macht.

## 3. Datenmodell

```sql
-- Wer darf was. Jeder Account bekommt genau eine Zeile.
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  rolle       text not null default 'spieler'   -- 'spieler' | 'trainer'
                check (rolle in ('spieler','trainer')),
  ebene       int  not null default 1,          -- 1..4, die KM1-Pyramide
  erstellt_am timestamptz default now()
);

-- Ein Video. 'frei' entscheidet über die PRO-Schranke.
create table videos (
  id           uuid primary key default gen_random_uuid(),
  titel        text not null,
  beschreibung text,
  kategorie    text not null,                   -- flanken, dribbling, passen, ...
  ebene        int  not null check (ebene between 1 and 4),
  dauer_sek    int,
  frei         boolean not null default false,  -- false = nur mit KM1 PRO
  pfad         text not null,                   -- Datei im Storage
  poster_pfad  text,
  status       text not null default 'entwurf'  -- 'entwurf' | 'live'
                 check (status in ('entwurf','live')),
  reihenfolge  int,
  erstellt_am  timestamptz default now()
);

-- Die Schritte unter dem Video. Eigene Tabelle, weil sie sortiert sind
-- und später auch einzeln verlinkt werden sollen (Sprung ins Video).
create table video_schritte (
  id        uuid primary key default gen_random_uuid(),
  video_id  uuid not null references videos on delete cascade,
  nr        int  not null,
  text      text not null,
  sekunde   int                                  -- Kapitelmarke, optional
);

-- Fortschritt. Gehört dem Kind, nicht uns.
create table fortschritt (
  user_id     uuid not null references auth.users on delete cascade,
  video_id    uuid not null references videos on delete cascade,
  sekunde     int not null default 0,            -- wo es stehen geblieben ist
  abgehakt    boolean not null default false,    -- "auf dem Platz geschafft"
  geaendert   timestamptz default now(),
  primary key (user_id, video_id)
);

-- Abo-Status, gefüllt vom RevenueCat-Webhook. Die App liest nur.
create table abos (
  user_id   uuid primary key references auth.users on delete cascade,
  aktiv     boolean not null default false,
  bis       timestamptz,
  quelle    text                                 -- 'app_store' | 'play_store'
);
```

### Die Regeln in der Datenbank (RLS)

Das ist der Kern der Anforderung "nur der Besitzer lädt hoch". Die App fragt
nicht höflich nach, die Datenbank lässt es schlicht nicht zu:

```sql
alter table videos enable row level security;

-- Sehen darf jeder Angemeldete alle Videos, die live sind.
create policy "videos lesen" on videos
  for select using (status = 'live');

-- Anlegen, ändern, löschen darf nur, wer in profiles als Trainer steht.
create policy "videos schreiben" on videos
  for all using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.rolle = 'trainer')
  );
```

Selbst wer die App auseinandernimmt und mit dem öffentlichen Schlüssel direkt
gegen die Datenbank spricht, bekommt beim Hochladen ein Nein. Denselben Schutz
bekommt der Dateispeicher: der Bucket ist privat, der Upload-Pfad verlangt
dieselbe Trainer-Prüfung.

### Warum die PRO-Schranke nicht in der App sitzt

Ein Schloss, das nur die App zeichnet, ist kein Schloss. Deshalb:

- **Freie Videos** liegen in einem öffentlichen Bucket, direkt abspielbar.
- **PRO-Videos** liegen in einem privaten Bucket. Die App bittet eine kleine
  Serverfunktion (`video-url`) um einen Abspiellink. Die Funktion schaut in
  `abos` nach und gibt den Link nur heraus, wenn das Abo aktiv ist. Der Link
  gilt 60 Minuten und dann nicht mehr.

## 4. Videos: Speicher und Kosten

Start mit **Supabase Storage**, weil es zu allem anderen passt und billig ist.

Grobe Rechnung für den Anfang (100 Videos, je 5 Minuten, 1080p ≈ 250 MB):

| Posten | Menge | Kosten |
| --- | --- | --- |
| Speicher | 25 GB | ca. 0,50 $ / Monat |
| Auslieferung | 500 GB / Monat | ca. 45 $ / Monat |
| Supabase Pro | Grundgebühr | 25 $ / Monat (enthält 250 GB) |

Die Auslieferung ist der Posten, der mit dem Erfolg wächst. Ab etwa 1.000 aktiven
Zuschauern lohnt der Wechsel zu **Cloudflare Stream** (5 $ pro 1.000 gespeicherte
Minuten, 1 $ pro 1.000 gesehene Minuten, dafür automatische Qualitätsstufen).
Der Wechsel betrifft nur das Feld `pfad` und die Funktion `video-url`, nicht die
App. Deshalb ist es kein Fehler, klein anzufangen.

**Vor dem Hochladen komprimieren.** 1080p mit H.264 bei etwa 3 Mbit/s reicht für
Fußballtechnik vollkommen und spart zwei Drittel der Kosten.

## 5. Das Abo

**Apple schreibt In-App-Kauf vor.** Digitale Inhalte in einer iOS-App müssen über
Apple abgerechnet werden, nicht über Stripe. Apple behält 30 %, ab dem zweiten
Jahr eines Abonnenten 15 %. Wer unter 1 Million $ Jahresumsatz bleibt, kommt über
das *Small Business Program* dauerhaft auf 15 % — das trifft hier zu.

Vorschlag für den Zuschnitt:

| | Frei | KM1 PRO |
| --- | --- | --- |
| Videos | Foundational (Ebene 1) und Grundlagen aus Ebene 2 | alle vier Ebenen |
| Trainingspfade | Ebene 1 | alle |
| Neue Einheit pro Woche | — | ja |
| Offline speichern | — | ja |
| Camps und Challenges | sichtbar | früher Zugang |

Preis im Prototyp: 6,99 € im Monat, 59 € im Jahr, sieben Tage gratis. Das sind
Platzhalter. Zum Vergleich: eine Einzelstunde im Fördertraining kostet ein
Vielfaches davon, das Abo muss sich daran nicht messen.

Wichtig bei Kindern: Der Kauf läuft über die Apple-ID der Eltern. Der Text vor
dem Kauf muss Preis, Laufzeit und Kündigung klar nennen, sonst lehnt Apple ab.

## 6. Der Weg ins App Store

Was gebraucht wird, in der Reihenfolge, in der es nötig wird:

1. **Apple Developer Program**, 99 $ im Jahr. Als Firma (KM1) mit D-U-N-S-Nummer,
   nicht als Privatperson — sonst steht dein Klarname im Store. Die D-U-N-S zu
   bekommen dauert ein bis zwei Wochen, also früh anfangen.
2. **Google Play**, einmalig 25 $.
3. **Datenschutzerklärung** mit eigener URL. Die von km1-training.de reicht
   nicht, die App braucht einen eigenen Abschnitt.
4. **App Privacy Report** im App Store ("welche Daten sammelt ihr"). Je weniger,
   desto einfacher. Vorschlag: kein Tracking, keine Werbe-SDKs, nur E-Mail und
   Fortschritt.
5. **Konto löschen** muss in der App möglich sein (Guideline 5.1.1). Kein
   "schreib uns eine Mail", ein Knopf.
6. **Sign in with Apple**, sobald ein anderer Drittanbieter-Login angeboten wird
   (Google, Facebook). Wenn wir nur E-Mail anbieten, entfällt es.
7. **Altersfreigabe**. Vorschlag 4+. Die Kategorie "Kids" bewusst *nicht* wählen:
   sie verbietet externe Links und verlangt einen Elternbereich vor jedem Kauf.
8. **Screenshots** für alle geforderten Gerätegrößen, dazu ein Vorschauvideo —
   das kann derselbe Flutlicht-Clip sein wie auf der Website.

Für Deutschland dazu: Impressum in der App, Widerrufsbelehrung beim Abo und
Einwilligung der Eltern für Nutzer unter 16 Jahren (DSGVO Art. 8).

Erfahrungswert: die erste Prüfung dauert ein bis drei Tage, Ablehnungen in der
ersten Runde sind normal und meistens formal.

## 7. Wie Kader hochlädt

Zwei Wege, beide sinnvoll:

- **In der App**, Trainerbereich: Video auswählen, Titel, Kategorie, Ebene, frei
  oder PRO, Beschreibung, veröffentlichen. Gut für den schnellen Clip direkt vom
  Platz. So steht es im Prototyp.
- **Später eine kleine Web-Konsole** für mehrere Videos auf einmal, Schritte
  tippen sich am Rechner angenehmer. Passt als eigener Ordner ins Repo.

Uploads laufen als *resumable upload*, damit ein Handy im Funkloch nicht von
vorn anfangen muss.

## 8. Reihenfolge der Arbeit

| Phase | Inhalt | Ergebnis |
| --- | --- | --- |
| 1 | Expo-Projekt, Design-System, Navigation, Screens mit festen Daten | App läuft auf deinem Handy |
| 2 | Supabase: Tabellen, RLS, Konten, echte Videos | Videos kommen aus der Datenbank |
| 3 | Trainerbereich: Upload, bearbeiten, veröffentlichen | Kader füllt die App selbst |
| 4 | RevenueCat, PRO-Schranke, Kauf | Abo funktioniert |
| 5 | Store-Vorbereitung, Testflight, Einreichung | App ist draußen |

Phase 1 bis 3 ergeben schon eine App, die sich verschicken lässt (TestFlight),
auch ohne Abo.

## 9. Was noch entschieden werden muss

- **Konto ja oder nein zum Zuschauen?** Ohne Konto ist die Hürde niedriger, mit
  Konto merkt sich die App den Fortschritt. Vorschlag: freie Videos ohne Konto,
  Konto erst für Fortschritt und PRO.
- **Wie viele Videos zum Start?** Unter 15 wirkt die App leer. Welche 15 hat
  Kader schon im Kasten?
- **Gehen die Kinder der Camps mit Namen in die App?** Wenn ja, brauchen wir eine
  Einwilligung der Eltern und ein eigenes Kapitel im Datenschutz.
- **"Schlag den Coach" in der App?** Als Ansehen und Abhaken sofort machbar. Mit
  eingeschickten Videos der Kinder wird daraus ein Moderationsthema mit allem,
  was Apple dafür verlangt — dann wäre die Regel "nur KM1 lädt hoch" aufgeweicht.
  Vorschlag: erst einmal ohne Einsendungen.
- **Android gleichzeitig oder später?** Der Code kann beides, die Store-Arbeit
  fällt trotzdem zweimal an.
