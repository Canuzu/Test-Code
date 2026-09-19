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
2. **Drei Stufen, nicht zwei.** Die Hälfte der Videos läuft ohne Anmeldung, die
   andere Hälfte nach einer kostenlosen Anmeldung.
3. **Geld kostet nur eine Sache: die Profi-Einheiten**, gedreht mit aktiven
   Profispielern. Das Abo verkauft keinen Zugang zu *mehr* Videos, sondern zu
   Menschen, an die sonst niemand herankommt.
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
  zugang       text not null default 'offen'     -- wer es sehen darf
                 check (zugang in ('offen','konto','pro')),
  gast         text,                             -- bei Profi-Einheiten: wer vor der Kamera steht
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

-- Gäste (Rolle 'anon') sehen nur die offene Stufe.
create policy "offene videos fuer alle" on videos
  for select to anon
  using (status = 'live' and zugang = 'offen');

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

- **Stufe `offen`** liegt in einem öffentlichen Bucket, direkt abspielbar, auch
  ohne Konto.
- **Stufe `konto`** und **Stufe `pro`** liegen in privaten Buckets. Die App
  bittet eine kleine Serverfunktion (`video-url`) um einen Abspiellink. Die
  Funktion prüft: bei `konto`, ob überhaupt jemand angemeldet ist, bei `pro`
  zusätzlich in `abos`, ob das Abo läuft. Der Link gilt 60 Minuten und dann
  nicht mehr.

Die mittlere Stufe ist technisch fast geschenkt und bringt das, was einer
Fußballschule am meisten fehlt: **die E-Mail-Adressen der Eltern.** Das ist die
Liste, über die im Frühjahr die Camps voll werden.

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

**Bezahlt wird nur eine Sache: die Profi-Einheiten.** Videos, in denen ein
aktiver Profispieler zeigt, wie er es macht — den Freistoß, die Flanke unter
Druck, den ersten Kontakt im Strafraum, dazu ein Tag im Profialltag. Alles, was
Kader und das Trainerteam selbst zeigen, bleibt kostenlos.

Das ist ein besseres Geschäft als "mehr vom Gleichen", weil es nichts ist, was
ein anderes Video im Netz ersetzt. Technik-Tutorials gibt es tausende. Einen
Zweitligaspieler, der einem Zehnjährigen seine Freistoßroutine erklärt, gibt es
nicht umsonst.

| Stufe | Was man sieht | Preis |
| --- | --- | --- |
| Ohne Anmeldung | Die Hälfte der Videos, sofort | 0 € |
| Kostenloses Konto | Die andere Hälfte, dazu Fortschritt und Merkliste | 0 € |
| KM1 PRO | Die Einheiten mit Profispielern | 6,99 € / Monat, 59 € / Jahr |

**Apple schreibt In-App-Kauf vor.** Digitale Inhalte in einer iOS-App müssen über
Apple abgerechnet werden, nicht über Stripe. Apple behält 30 %, über das *Small
Business Program* (unter 1 Million $ Jahresumsatz) dauerhaft 15 %. Das trifft
hier zu.

### Drei Dinge, die an diesem Modell hängen

**Zum Start ist das Abo leer.** Solange keine Profi-Einheit gedreht ist, gibt es
nichts zu verkaufen. Der Plan dazu: die App mit den kostenlosen Videos
veröffentlichen und das Abo erst scharf schalten, wenn drei bis vier Einheiten
stehen. Ein Abo mit einem einzigen Video verbrennt die Kündigungsquote, und
Apple lehnt ein Abo ohne erkennbaren Gegenwert auch schon mal ab.

**Ohne Unterschrift kein Video.** Jeder Profi muss schriftlich zustimmen, dass
sein Bild in einem kostenpflichtigen Produkt verwendet wird — eine
Einverständniserklärung mit Zweck, Dauer und Widerruf. Bei Spielern unter
Vertrag kann zusätzlich der Verein mitreden, weil Marketingrechte oft beim Klub
liegen. Und wer in einem Bezahlprodukt auftritt, fragt eher nach einem Honorar
oder einer Beteiligung als bei einem Gefallen fürs Camp. Das ist der einzige
Teil des Plans, der von Dritten abhängt — also der, der zuerst geklärt gehört.

**Das Versprechen "jeden Monat ein neuer Profi" ist ein Vertrag.** Wer es
einmal schreibt, muss es halten, sonst kündigen die Leute im dritten Monat.
Sicherer, solange die Reihe jung ist: "regelmäßig neue Einheiten" und dann
lieber öfter liefern als angekündigt.

## 6. Das Designsystem

Die App soll aussehen wie eine App, die man im Store kauft, nicht wie ein
Entwurf. Was einen Entwurf verrät, sind drei Dinge, und alle drei sind
Entscheidungen, keine Geschmacksfragen:

1. **Alles ist ein Rechteck mit Haarlinie.** Keine Höhe, keine Ebenen, kein
   Material. Echte Apps arbeiten mit Flächen, die übereinander liegen.
2. **Die Schrift ist zu klein und zu leise.** 13-Pixel-Text und 10-Pixel-Labels
   liest niemand auf einem Platz im Gegenlicht.
3. **Überall winzige Versalien in Monospace.** Das sieht aus wie ein Dashboard,
   nicht wie eine Trainings-App.

Also gilt:

### Schriftgrößen

| Rolle | Größe | Schnitt |
| --- | --- | --- |
| Überschrift Bildschirm | 37 px | Anton, Versalien |
| Abschnittsüberschrift | 23 px | Anton, Versalien |
| Titel im Held | 22,5 px | Anton, Versalien |
| Fließtext | 17 px | Chivo 450 |
| Kartentitel | 15,5 px | Chivo 700 |
| Sekundärtext | 15,5 px | Chivo 450 |
| Beschriftung | 13,5 px | Chivo 600 |
| Kleingedrucktes | 13,5 px | Chivo 450 |

**Nichts unter 12 Pixel.** Monospace trägt nur noch drei Dinge: die Zeile über
einer Überschrift, Zahlen (Dauer, Zähler, Uhrzeit) und die Wochenmarken im
Pfad. Knöpfe, Beschriftungen und Listen laufen in normaler Schreibweise, nicht
in Versalien.

### Farben

Beide Fassungen sind vollständig, keine ist die abgedunkelte andere. Hell ist
die Grundeinstellung, Dunkel liegt im Profil, dazu "Automatisch" für alle, die
ihr Handy abends umstellen.

| Token | Hell | Dunkel |
| --- | --- | --- |
| Grund | `#EEF2ED` | `#060C0A` |
| Fläche | `#FFFFFF` | `#101C18` |
| Schrift | `#0A1411` | `#F2F5F1` |
| Schrift, leiser | `#53645D` | `#94A79E` |
| Akzent | `#C81E14` | `#DE2F25` |
| Ebene 1 bis 4 | `#0D7C75` `#3C8329` `#A9630A` `#C81E14` | `#2FA8A0` `#5FB04A` `#E8952F` `#E0342A` |

Rot ist der einzige Akzent und wird sparsam eingesetzt: ein Hauptknopf pro
Bildschirm, der aktive Reiter, die Schrittnummern. Die vier Ebenenfarben
gehören der Pyramide und den Fortschrittsanzeigen, sonst nichts.

### Höhe und Form

- **Radien:** Karten 18 px, Bilder 14 px, Knöpfe 14 px, Chips 11 px.
- **Drei Höhenstufen** statt Rahmen: leicht (Karten in Ruhe), deutlich
  (angehobene Karten, der Held, Mitteilungen), sehr hoch (das Gerät selbst).
  In der dunklen Fassung kommt eine feine helle Innenkante dazu — das ist der
  Trick, der dunkle Oberflächen teuer aussehen lässt.
- **Knöpfe sind 54 Pixel hoch** und werfen einen rot getönten Schatten.
- **Antippen drückt.** Jede Karte, jeder Knopf geht beim Drücken auf 98 bis 99
  Prozent. Ohne diese Rückmeldung fühlt sich eine App tot an.

### Bilder

Die Fotos der Marke sind Flutlichtaufnahmen bei Nacht. Damit die gezeichneten
Vorschaubilder danebenstehen können, sind **die Kreidezeichnungen in beiden
Fassungen dunkel**: heller Kreidestrich auf tiefem Rasengrün, die Bewegung in
Köln-Rot. Eine helle Zeichnung neben einem Nachtfoto sieht aus wie ein
Platzhalter.

Oben auf der Startseite steht ein **Held**: ein Bild über die volle Breite,
darauf der Titel in Anton und ein roter Abspielknopf. Das ist das Erste, was
jemand sieht, und es ist ein Bild, keine Liste.

### Was die Kleinigkeiten ausmachen

Statusleiste mit Uhrzeit und Symbolen, der Home-Balken unten, die Kopfzeile,
die erst beim Scrollen einen Schatten bekommt, die Reiterleiste mit weicher
Pille hinter dem aktiven Symbol. Nichts davon ist Funktion. Zusammen sind sie
der Unterschied zwischen "sieht aus wie eine Webseite" und "sieht aus wie eine
App".

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

Von diesen 20 läuft die Hälfte ohne Anmeldung, die andere Hälfte nach einer
kostenlosen Anmeldung. Welches Video in welcher Stufe liegt, steht in der App
an einer Stelle und lässt sich jederzeit umhängen.

Aufwand: etwa vier Drehtage. Ein Video braucht drei Einstellungen (Erklärung,
Demo in Normalgeschwindigkeit, Demo in Zeitlupe) und dauert fertig fünf bis zehn
Minuten. Die Schrittanleitungen entstehen beim Schnitt, nicht beim Dreh.

### Die Profi-Reihe

Der Teil, der Geld kostet, und damit der Teil, der am besten sein muss. Der
Vorschlag aus dem Prototyp:

| Einheit | Gast | Länge |
| --- | --- | --- |
| Der Freistoß über die Mauer | Profi, 2. Bundesliga | 14:20 |
| Flanken unter Gegnerdruck | Profi, 3. Liga | 12:40 |
| Der erste Kontakt im Strafraum | Stürmer, 2. Bundesliga | 11:15 |
| Körper vor Ball: der saubere Zweikampf | Innenverteidiger, 3. Liga | 10:05 |
| Torwart: Strafraumbeherrschung | Torwart, 2. Bundesliga | 13:30 |
| Ein Tag im Profialltag | Profi, 2. Bundesliga | 16:50 |

Drei Dinge, die bei diesen Drehs anders laufen als bei den eigenen:

- **Die Zeit des Profis ist knapp.** Plan für 90 Minuten, nicht für einen Tag,
  und in diesen 90 Minuten zwei bis drei Einheiten abdrehen. Fragenliste vorher
  schreiben, nicht vor Ort überlegen.
- **Länger ist hier richtig.** Bei den eigenen Videos gilt: kurz. Bei den
  Profi-Einheiten will man zusehen, wie jemand erzählt. Zehn bis fünfzehn
  Minuten sind kein Fehler, sie sind das Produkt.
- **"Ein Tag im Profialltag" schlägt jede Technikeinheit.** Kinder wollen
  wissen, wie es *ist*. Das ist der Clip, den sie ihren Eltern zeigen — und
  damit der, der das Abo verkauft.

## 9. Reihenfolge der Arbeit

| Phase | Inhalt | Ergebnis |
| --- | --- | --- |
| 1 | Expo-Projekt, Design-System (hell und dunkel), Navigation, Screens mit festen Daten | App läuft auf deinem Handy |
| 2 | Supabase: Tabellen, RLS, Gastzugang, Konten, echte Videos | Videos kommen aus der Datenbank |
| 3 | Trainerbereich: Upload, bearbeiten, veröffentlichen | Kader füllt die App selbst |
| 4 | RevenueCat, PRO-Schranke, Kauf | Abo funktioniert, scharf geschaltet erst mit drei Profi-Einheiten |
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

## 11. Entschieden und im Prototyp

Vier Vorschläge sind beschlossen und im Prototyp bedienbar. Was sie in der
echten App bedeuten:

### Zeitlupe und fünf Sekunden zurück

Unter dem Video zwei Knöpfe: *5 Sekunden* springt zurück, *Tempo* schaltet
zwischen 1×, 0,75× und 0,5×. Für Technikvideos die einzigen zwei Knöpfe, die
wirklich zählen — eine Bewegung dreimal langsam sehen, ohne auf der Zeitleiste
herumzutippen.

Technisch geschenkt: `expo-video` setzt Abspielrate und Position direkt, auch
bei HLS. Die gewählte Geschwindigkeit bleibt über Videos hinweg stehen; wer
einmal Zeitlupe will, will sie meistens wieder.

### Elternbereich

Eigene Seite im Profil, dazu ein Link unter der Abo-Seite. Sie erklärt, was das
Kind gerade übt und warum, wie viel Zeit sinnvoll ist, wobei Eltern helfen
können, was gespeichert wird und was was kostet.

Ein Detail, das Absicht ist: **dieser Bereich siezt**, der Rest der App duzt.
Hier liest jemand anderes mit, und dieser Jemand entscheidet über das Abo.

Für die App-Prüfung ist die Seite nebenbei nützlich: sie erklärt die
Datenverwendung in einfachen Worten. Das hilft beim Privacy-Label.

### Die Pyramide zeigt den Fortschritt

Jede Ebene füllt sich von unten, so weit ihr Pfad abgehakt ist, und trägt ihren
Stand als Zahl ("3 / 5"). Die eigene Ebene steht in voller Linie, die nächste
gestrichelt: angedeutet, aber noch nicht deins. Aus einem Schaubild wird ein
Ziel.

Kostet keine neue Tabelle, der Stand rechnet sich aus `fortschritt`. Gäste
sehen die Pyramide ohne Füllung, mit einem Satz dazu, was ein Konto daraus
macht.

### Erinnerung ans Training

Im Profil: an oder aus, Wochentage, Uhrzeit. Voreingestellt Mittwoch und
Samstag um 17 Uhr, dazu eine Vorschau, wie die Mitteilung auf dem
Sperrbildschirm aussieht.

Das sind **lokale** Mitteilungen über `expo-notifications`: kein Server, keine
Push-Zertifikate, kein Konto nötig. Wichtig für die Prüfung und für die Nerven
der Nutzer: die Erlaubnis wird erst gefragt, wenn jemand die Erinnerung
einschaltet, nicht beim ersten Start.

## 12. Vorschläge, noch offen

Sortiert nach Verhältnis von Nutzen zu Aufwand. Keiner davon ist beschlossen.

**Inhalt**

- **Kapitelmarken im Video.** Die Schritte unter dem Video springen an die
  richtige Stelle. Aus einem Video werden vier nachschlagbare Antworten. Das
  Datenmodell kann es schon (`video_schritte.sekunde`), und mit der Zeitlupe
  zusammen wäre es der komplette Werkzeugkasten zum Üben.
- **Trainingspläne zum Mitnehmen.** Sechs Wochen, drei Einheiten pro Woche, als
  Liste zum Abhaken. Das stärkste PRO-Argument, stärker als "mehr Videos".
- **Suche nach Problem, nicht nach Kategorie.** "Meine Flanken kommen nicht an"
  statt "Flanken". Kinder suchen nach ihrem Problem.

**Gestaltung**

- **Echte Standbilder statt Kreidezeichnungen.** Die Zeichnungen sind ein guter
  Platzhalter und funktionieren in beiden Fassungen, aber ein Standbild aus dem
  Video zeigt mehr. Vorschlag: Standbild als Vorschau, Zeichnung als Erklärbild
  im Video.
- **Ein Begrüßungsablauf.** Drei Fragen beim ersten Start: Wie alt, welche
  Position, wie oft in der Woche. Danach ist die Startseite passend gefüllt,
  statt für alle gleich zu sein. Ohne Konto, rein auf dem Gerät.
- **Keine Abzeichen und Sterne.** Serien und Marken passen zu KM1, Spielkram
  nicht. Der Prototyp hält sich schon daran ("6 Tage Serie", "Kaders Marke").

**Technik**

- **HLS von Anfang an** (siehe Abschnitt 4). Macht den Start schneller und das
  Mitschneiden schwerer.
- **Eine Webversion derselben App.** Expo kann auch Web. Damit hätte KM1 eine
  Videoseite unter km1-training.de/training, ohne zweite Codebasis.
- **Warteliste und Camp-Anmeldung in der App.** Auf der Website gibt es die
  Warteliste schon. In der App wäre sie zwei Tippen entfernt statt eines
  Browserwechsels.

## 13. Was noch offen ist

- **Welche Profis sagen zu, und zu welchen Bedingungen?** Das ist ab jetzt der
  kritische Pfad. Die App kann fertig sein, ohne Gäste gibt es trotzdem nichts
  zu verkaufen. Drei Zusagen reichen für den Start, und die erste Frage an jeden
  ist nicht "machst du mit", sondern "darf das in einem Bezahlprodukt laufen".
- **Bleibt es bei 6,99 € im Monat?** Nach oben ist der Preis später schwer zu
  korrigieren: bestehende Abos müssen einer Erhöhung aktiv zustimmen, sonst
  laufen sie zum alten Preis weiter. Lieber einmal richtig ansetzen.
- **Was passiert mit der Reihe, wenn ein Monat ausfällt?** Eine Antwort darauf
  gehört in den Abo-Text, bevor der erste Kunde sie stellt.
- **Gehen die Kinder der Camps mit Namen in die App?** Wenn ja, brauchen wir eine
  Einwilligung der Eltern und ein eigenes Kapitel im Datenschutz.
- **Android gleichzeitig oder später?** Der Code kann beides, die Store-Arbeit
  fällt trotzdem zweimal an.

Der Videoschnitt ist keine offene Frage mehr: das macht Kader selbst. Damit
hängt der Start nur noch an den Zusagen der Gäste und an der App.
