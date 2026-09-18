# KM1 Training App — technisches Konzept

Stand: 18. September 2026, zweite Fassung. Grundlage für die Umsetzung, kein
Plan in Stein. Alles hier lässt sich ändern, solange noch kein Code darauf
aufbaut.

## 1. Was die App ist

Eine Lern-App für Kinder, Jugendliche und ihre Eltern. Im Mittelpunkt stehen
Videos: wie man flankt, dribbelt, passt, den Ball annimmt, abschließt. Dazu
Bildreihen und kurze Schrittanleitungen, die auf dem Platz nachzumachen sind.

Fünf Regeln, die alles andere bestimmen:

1. **Nur KM1 lädt hoch.** Niemand von außen kann Videos einstellen. Das ist
   keine Einstellung in der App, sondern eine Regel in der Datenbank.
2. **Zuschauen geht ohne Konto.** Die freien Videos laufen sofort, ohne
   Anmeldung und ohne E-Mail. Ein Konto braucht nur, wer Fortschritt gespeichert
   haben will oder KM1 PRO bucht.
3. **Ein Teil ist kostenlos**, der Rest mit Abo.
4. **Videos lassen sich nicht herunterladen.** Sie laufen nur in der App.
5. **Gleiches Gesicht wie die Website.** Dieselben Farben, Schriften, dasselbe
   Logo, dieselbe Pyramide — in einer hellen und einer dunklen Fassung.

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
-- Wer darf was. Entsteht erst bei der Anmeldung; Gäste haben keine Zeile.
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

-- Fortschritt. Gehört dem Kind, nicht uns. Gäste haben keinen.
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

-- Gäste (Rolle 'anon') sehen nur die freien Videos.
create policy "freie videos fuer alle" on videos
  for select to anon
  using (status = 'live' and frei = true);

-- Angemeldete sehen alle Einträge, die live sind. Ob ein PRO-Video auch
-- abspielbar ist, entscheidet die Funktion 'video-url', nicht diese Regel.
create policy "videos fuer angemeldete" on videos
  for select to authenticated
  using (status = 'live');

-- Anlegen, ändern, löschen darf nur, wer in profiles als Trainer steht.
create policy "videos schreiben" on videos
  for all to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.rolle = 'trainer')
  );
```

Selbst wer die App auseinandernimmt und mit dem öffentlichen Schlüssel direkt
gegen die Datenbank spricht, bekommt beim Hochladen ein Nein. Denselben Schutz
bekommt der Dateispeicher: der PRO-Bucket ist privat, der Upload-Pfad verlangt
dieselbe Trainer-Prüfung.

### Warum die PRO-Schranke nicht in der App sitzt

Ein Schloss, das nur die App zeichnet, ist kein Schloss. Deshalb:

- **Freie Videos** liegen in einem öffentlichen Bucket, direkt abspielbar, auch
  ohne Konto.
- **PRO-Videos** liegen in einem privaten Bucket. Die App bittet eine kleine
  Serverfunktion (`video-url`) um einen Abspiellink. Die Funktion schaut in
  `abos` nach und gibt den Link nur heraus, wenn das Abo aktiv ist. Der Link
  gilt 60 Minuten und dann nicht mehr.

## 4. Videos: Speicher, Schutz und Kosten

Start mit **Supabase Storage**, weil es zu allem anderen passt und billig ist.

Grobe Rechnung für den Anfang (100 Videos, je 5 Minuten, 1080p ≈ 250 MB):

| Posten | Menge | Kosten |
| --- | --- | --- |
| Speicher | 25 GB | ca. 0,50 $ / Monat |
| Auslieferung | 500 GB / Monat | ca. 45 $ / Monat |
| Supabase Pro | Grundgebühr | 25 $ / Monat (enthält 250 GB) |

Die Auslieferung wächst mit dem Erfolg. Ab etwa 1.000 aktiven Zuschauern lohnt
der Wechsel zu **Cloudflare Stream** (5 $ pro 1.000 gespeicherte Minuten, 1 $ pro
1.000 gesehene Minuten, dafür automatische Qualitätsstufen). Der Wechsel betrifft
nur das Feld `pfad` und die Funktion `video-url`, nicht die App.

**Vor dem Hochladen komprimieren.** 1080p mit H.264 bei etwa 3 Mbit/s reicht für
Fußballtechnik vollkommen und spart zwei Drittel der Kosten.

### Kein Download

Entschieden: die Videos laufen nur in der App, es gibt keine Offline-Funktion.
Was das technisch bedeutet, ehrlich gesagt:

- **Kein Download-Knopf, keine Offline-Ablage.** Das ist der einfache Teil.
- **Kurzlebige Links.** Jeder Abspiellink gilt 60 Minuten und ist an den Nutzer
  gebunden. Ein weitergegebener Link ist am nächsten Tag tot.
- **HLS statt einer MP4-Datei.** Eine MP4-Datei ist eine Datei: wer den Link
  hat, kann sie in dieser Stunde speichern. HLS zerlegt das Video in hunderte
  kleine Stücke, die man einzeln nichts nützen. Das ist der eigentliche Grund,
  **früher zu Cloudflare Stream zu wechseln als die Kosten es verlangen** — dort
  ist HLS der Normalfall, bei Supabase Storage müssten wir es selbst bauen.
- **Wirklich dicht wird es nur mit DRM** (FairPlay bei Apple, Widevine bei
  Google). Das kostet extra, macht die Entwicklung deutlich aufwendiger und
  lohnt sich erst, wenn Videos tatsächlich auftauchen, wo sie nicht hingehören.
  Mein Vorschlag: erst einmal ohne, aber mit HLS, damit die Hürde hoch genug ist.

Wer ein Video unbedingt mitschneiden will, filmt am Ende den Bildschirm ab. Das
verhindert auch Netflix nicht. Ziel ist, dass niemand es *versehentlich* oder
*bequem* tun kann.

## 5. Das Abo

**Apple schreibt In-App-Kauf vor.** Digitale Inhalte in einer iOS-App müssen über
Apple abgerechnet werden, nicht über Stripe. Apple behält 30 %, ab dem zweiten
Jahr eines Abonnenten 15 %. Wer unter 1 Million $ Jahresumsatz bleibt, kommt über
das *Small Business Program* dauerhaft auf 15 % — das trifft hier zu.

Vorschlag für den Zuschnitt (noch nicht entschieden):

| | Frei, ohne Konto | KM1 PRO |
| --- | --- | --- |
| Videos | Foundational (Ebene 1) und Grundlagen aus Ebene 2 | alle vier Ebenen |
| Trainingspfade | Ebene 1 | alle |
| Neue Einheit pro Woche | — | ja |
| Wochenplan | — | ja |
| Camps und Challenges | sichtbar | früher Zugang |

Preis im Prototyp: 6,99 € im Monat, 59 € im Jahr, sieben Tage gratis. Das sind
Platzhalter. Zum Vergleich: eine Einzelstunde im Fördertraining kostet ein
Vielfaches davon.

Wichtig bei Kindern: Der Kauf läuft über die Apple-ID der Eltern. Der Text vor
dem Kauf muss Preis, Laufzeit und Kündigung klar nennen, sonst lehnt Apple ab.

## 6. Darstellung: hell und dunkel

**Hell ist die Grundeinstellung**, dunkel eine Option im Profil, dazu
"Automatisch" für alle, die ihr Handy abends umstellen.

Beides sind eigene Fassungen, kein abgedunkeltes Hell: eigene Flächen, eigene
Linien, eigene Kontraste, genau wie auf der Website. Die Farben liegen als
Tokens an einer Stelle, umgeschaltet wird über ein Attribut am Wurzelelement.
In React Native übernimmt das ein Theme-Objekt mit denselben Namen.

Zwei Dinge wechseln dabei mit:

- **Das Logo.** Schwarz auf hellem Grund, weiß auf dunklem.
- **Die Kreidezeichnungen** der Vorschaubilder. Dunkle Linien auf hellem Papier,
  helle Linien auf dunklem Grund. Die echten Videostandbilder bleiben in beiden
  Fassungen gleich.

## 7. Wie Kader hochlädt

Zwei Wege, beide sinnvoll:

- **In der App**, Trainerbereich: Video auswählen, Titel, Kategorie, Ebene, frei
  oder PRO, Beschreibung, veröffentlichen. Gut für den schnellen Clip direkt vom
  Platz. So steht es im Prototyp.
- **Später eine kleine Web-Konsole** für mehrere Videos auf einmal, Schritte
  tippen sich am Rechner angenehmer. Passt als eigener Ordner ins Repo.

Uploads laufen als *resumable upload*, damit ein Handy im Funkloch nicht von
vorn anfangen muss.

## 8. Der Startkatalog

Unter etwa 15 Videos wirkt die App leer. Die 20 Videos aus dem Prototyp sind ein
Vorschlag für die Aufnahmeliste: pro Ebene fünf Einheiten, alle Kategorien
abgedeckt, die Hälfte frei.

| Ebene | Videos | frei |
| --- | --- | --- |
| Foundational (U6–U13) | Erste Berührung · Flacher Pass · Abstoppen und andribbeln · Koordinationsleiter · Torwart-Grundstellung | alle 5 |
| Development (U8–U15) | Flanke mit der Innenseite · Übersteiger · Vollspann flach · Ballmitnahme im Sprint · Kopfball-Timing | 4 von 5 |
| Performance (U17/U19) | Doppelpass · Innenrist-Flanke · 1 gegen 1 · Diagonalball · Rumpfstabilität | 0 |
| Professional (Profis) | Anlaufen im 4-3-3 · Schnittstellenpass · Kurze Ecke · Abschluss unter Müdigkeit · Regeneration | 0 |

Aufwand: etwa vier Drehtage. Ein Video braucht drei Einstellungen (Erklärung,
Demo in Normalgeschwindigkeit, Demo in Zeitlupe) und dauert fertig fünf bis zehn
Minuten. Die Schrittanleitungen entstehen beim Schnitt, nicht beim Dreh.

## 9. Reihenfolge der Arbeit

| Phase | Inhalt | Ergebnis |
| --- | --- | --- |
| 1 | Expo-Projekt, Design-System (hell und dunkel), Navigation, Screens mit festen Daten | App läuft auf deinem Handy |
| 2 | Supabase: Tabellen, RLS, Gastzugang, Konten, echte Videos | Videos kommen aus der Datenbank |
| 3 | Trainerbereich: Upload, bearbeiten, veröffentlichen | Kader füllt die App selbst |
| 4 | RevenueCat, PRO-Schranke, Kauf | Abo funktioniert |
| 5 | Store-Vorbereitung, TestFlight, Einreichung | App ist draußen |

Phase 1 bis 3 ergeben schon eine App, die sich verschicken lässt (TestFlight),
auch ohne Abo.

## 10. Der Weg ins App Store

Was gebraucht wird, in der Reihenfolge, in der es nötig wird:

1. **Apple Developer Program**, 99 $ im Jahr. Als Firma (KM1) mit D-U-N-S-Nummer,
   nicht als Privatperson — sonst steht dein Klarname im Store. Die D-U-N-S zu
   bekommen dauert ein bis zwei Wochen, also früh anfangen.
2. **Google Play**, einmalig 25 $.
3. **Datenschutzerklärung** mit eigener URL, eigener Abschnitt für die App.
4. **App Privacy Report** im App Store. Je weniger, desto einfacher: kein
   Tracking, keine Werbe-SDKs, nur E-Mail, Vorname und Fortschritt.
5. **Konto löschen** muss in der App möglich sein (Guideline 5.1.1). Kein
   "schreib uns eine Mail", ein Knopf.
6. **Sign in with Apple**, sobald ein anderer Drittanbieter-Login angeboten wird.
7. **Altersfreigabe**. Vorschlag 4+. Die Kategorie "Kids" bewusst *nicht* wählen:
   sie verbietet externe Links und verlangt einen Elternbereich vor jedem Kauf.
8. **Screenshots** für alle geforderten Gerätegrößen, dazu ein Vorschauvideo.

Für Deutschland dazu: Impressum in der App, Widerrufsbelehrung beim Abo und
Einwilligung der Eltern für Nutzer unter 16 Jahren (DSGVO Art. 8).

Erfahrungswert: die erste Prüfung dauert ein bis drei Tage, Ablehnungen in der
ersten Runde sind normal und meistens formal.

## 11. Vorschläge, noch nicht entschieden

Sortiert nach Verhältnis von Nutzen zu Aufwand. Keiner davon ist beschlossen.

**Inhalt**

- **Kapitelmarken im Video.** Die Schritte unter dem Video springen an die
  richtige Stelle. Aus einem Video werden vier nachschlagbare Antworten. Das
  Datenmodell kann es schon (`video_schritte.sekunde`).
- **Zeitlupe und Wiederholung.** Ein Knopf für halbe Geschwindigkeit und einer,
  der die letzten fünf Sekunden noch einmal zeigt. Für Technikvideos wichtiger
  als jede andere Spielerei.
- **"Übung der Woche" als Mitteilung.** Mittwoch und Samstag, an den
  Trainingstagen. Der beste Grund, warum jemand die App wieder öffnet.
- **Trainingspläne zum Mitnehmen.** Sechs Wochen, drei Einheiten pro Woche, als
  Liste zum Abhaken. Das ist das stärkste PRO-Argument, stärker als "mehr Videos".
- **Ein Elternbereich.** Eine Seite, die erklärt, was das Kind gerade übt und
  warum. Eltern zahlen das Abo, nicht die Kinder.

**Gestaltung**

- **Echte Standbilder statt Kreidezeichnungen.** Die Zeichnungen sind ein guter
  Platzhalter und funktionieren in beiden Fassungen, aber ein Standbild aus dem
  Video zeigt mehr. Vorschlag: Standbild als Vorschau, Zeichnung als Erklärbild
  im Video.
- **Die Pyramide als Fortschrittsanzeige.** Aktuell zeigt sie die Struktur.
  Sie könnte zeigen, wie weit ein Kind ist: die eigene Ebene leuchtet, die
  nächste ist angedeutet. Aus einer Grafik wird ein Ziel.
- **Serien und Marken statt Punkte.** Keine Abzeichen, keine Sterne. "Sechs Tage
  in Folge" und "43, Kaders Marke" passen zur Marke, Spielkram nicht.
- **Ein Begrüßungsablauf.** Drei Fragen beim ersten Start: Wie alt, welche
  Position, wie oft in der Woche. Danach ist die Startseite passend gefüllt,
  statt für alle gleich zu sein. Ohne Konto, rein auf dem Gerät.
- **Suche nach Problem, nicht nach Kategorie.** "Meine Flanken kommen nicht an"
  statt "Flanken". Kinder suchen nach ihrem Problem.

**Technik**

- **HLS von Anfang an** (siehe Abschnitt 4). Macht den Start schneller und das
  Mitschneiden schwerer.
- **Eine Webversion derselben App.** Expo kann auch Web. Damit hätte KM1 eine
  Videoseite unter km1-training.de/training, ohne zweite Codebasis.
- **Warteliste und Camp-Anmeldung in der App.** Auf der Website gibt es die
  Warteliste schon. In der App wäre sie zwei Tippen entfernt statt eines
  Browserwechsels.

## 12. Was noch offen ist

- **Der Zuschnitt Frei gegen PRO** aus Abschnitt 5: passt die Aufteilung so?
- **Gehen die Kinder der Camps mit Namen in die App?** Wenn ja, brauchen wir eine
  Einwilligung der Eltern und ein eigenes Kapitel im Datenschutz.
- **Android gleichzeitig oder später?** Der Code kann beides, die Store-Arbeit
  fällt trotzdem zweimal an.
- **Wer schneidet die Videos?** Das ist der eigentliche Engpass, nicht die App.
