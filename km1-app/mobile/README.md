# KM1 Training — die echte App

Die App für iPhone und Android, gebaut mit Expo (SDK 57). Gestaltung und
Texte kommen aus der App im Browser (`../app/index.html`): Farben, Inter für
den Text, Anton für die großen Titel, Knöpfe als Pillen. Alles dahinter ist
echt: Videos mit dem Player des Systems, Konten auf dem Server, Erinnerungen
als Mitteilung auf dem Handy.

## Was sie kann

- **Start** mit „Für dich“ (höchstens fünf Blöcke: Hinweise, die große Karte
  „Heute“ mit einer einzigen Aufgabe, neue Videos, die Challenge, ein
  Werbeplatz ohne Abo-Werbung für Kinder) und „Folge ich“ (Neuigkeiten von
  KM1).
- **Erster Start** mit drei Fragen: Rolle, Jahrgang, Trainingszeit. Oben
  stehen Spieler, Eltern und Trainer, der Rest hinter „Etwas anderes“. Der
  Jahrgang ist nie vorausgewählt; er wählt die Ebene, die Zeit wird zur
  Erinnerung.
- **Üben** mit den Trainingsplänen oben, Suche und Filtern.
- **Dein Weg** durch die Pyramide, über die Ebene oben rechts und im Profil.
- **Trainingspläne**: sechs Wochen, drei Einheiten, erste Woche mit Konto frei.
- **Video** mit Kapiteln, Zeitlupe, Abhaken, Merkliste und „Mit mir
  vergleichen“: filmen oder ein Video wählen, dann untereinander mit Kader,
  Zeitlupe in drei Stufen, Bild für Bild. Das eigene Video wird nicht
  hochgeladen.
- **Camp buchen** mit Geschwisterrabatt, Notfallnummer und Fotofreigabe.
  Ein Konto unter 16 läuft auf die E-Mail der Eltern; darüber bucht ein
  Elternteil mit ausdrücklicher Bestätigung. Wer selbst ein Kind ist und kein
  solches Konto hat, fragt seine Eltern über das Teilen-Menü.
- **Profil** mit dem Ich, den Zahlen, dem laufenden Plan und den eigenen
  Sachen; alles zum Einstellen hinter dem Zahnrad.
- **Fehlerzustände**: Leiste ohne Netz, ein Video lädt von allein nach, wenn
  das Netz zurück ist, „Erneut versuchen“, wenn es nicht lädt, und Anhalten
  mit gemerkter Stelle bei Sperrbildschirm und Anruf.

Noch nicht hier, nur in der App im Browser: die Bereiche für Trainer,
Akademien, Vereine, Profis und Scouts mit Teams, Uploads, Feedback,
Nachrichten, Laufbahn und Scouting. Der Server dafür steht
(`../supabase/migrations/20260927120000_gemeinschaft.sql`), die Bildschirme
kommen als Nächstes.

## Zwei Modi

| | ohne Server (Vorschau) | mit Server |
| --- | --- | --- |
| Konten | bleiben auf dem Gerät | Supabase, mit E-Mail-Bestätigung |
| Unter 16 | Elternschritt wie mit Server | Konto läuft auf die E-Mail der Eltern |
| Fortschritt, Merkliste | auf dem Gerät | in der Datenbank |
| Videos | Testvideo | aus dem Speicher, sonst Testvideo |
| Pro | zum Ansehen freischaltbar, ohne Zahlung | aus der Tabelle `abos` |
| Trainingsplan | auf dem Gerät | `plan_laufend`, `plan_fortschritt` |
| Campbuchung | auf dem Gerät, mit Buchungsnummer | `camp_buchen()`, zählt die Plätze |
| Neuigkeiten | was in der App neu ist | Tabelle `neuigkeiten` |

Der Server ist verbunden, sobald diese beiden Umgebungsvariablen gesetzt
sind. Beide sind öffentlich; was sie dürfen, regelt die Datenbank.

```
EXPO_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<öffentlicher Schlüssel>
```

Optional: `EXPO_PUBLIC_TESTVIDEO_URL` ersetzt das Testvideo.

## Starten

```sh
npm ci
npx expo start
```

Den QR-Code mit der App **Expo Go** scannen (iPhone und Android). Ein
Entwicklerkonto bei Apple oder Google braucht es dafür nicht.

Ohne eigenen Rechner geht es über EAS Update: `npx eas-cli update --branch
vorschau` lädt die App zu Expo hoch, und Expo Go öffnet sie über einen Link.
Das braucht ein `EXPO_TOKEN`.

## Prüfen

```sh
npm run pruefen      # Typen, Linter, Tests
```

Die CI (`.github/workflows/km1-app.yml`) führt dasselbe bei jedem Pull Request
aus, dazu die Regeln der Datenbank.

## Was noch fehlt, bevor es in die Stores geht

- **Echte Käufe** über RevenueCat. Braucht die Konten bei Apple und Google.
- **„Mit Apple anmelden"**. Braucht das Apple-Entwicklerkonto. Der Knopf ist
  da und sagt das.
- **Die echten Videos** und die Sekunden der Kapitel.
- **Das zweite App-Symbol** (Flutlicht für Pro) braucht einen eigenen Build,
  in Expo Go geht es nicht.
- **Der Upload für Trainer.** Bis dahin im Supabase-Dashboard, siehe
  `../supabase/README.md`.
- **Ein Zahlungsanbieter für die Camps.** Bis dahin steht jede Buchung auf
  „reserviert".

## Wo was liegt

| Pfad | Inhalt |
| --- | --- |
| `src/app/` | Die Bildschirme, ein Dateiname je Adresse (Expo Router) |
| `src/app/(tabs)/` | Start, Üben (`technik.tsx`), Profil |
| `src/app/weg.tsx` | Der Weg durch die Pyramide |
| `src/daten/aktionen.ts` | Alles, was die App tut: Anmelden, Abhaken, Löschen |
| `src/daten/zustand.ts` | Der Zustand an einer Stelle |
| `src/daten/katalog.ts` | Ebenen, Kategorien, Challenges, Preise, Texte |
| `src/daten/katalog.json` | Die Videos ohne Server, erzeugt aus dem Prototyp |
| `src/daten/plaene.ts`, `plaene.json` | Die Trainingspläne und ihr Stand, die Pläne erzeugt aus der App im Browser |
| `src/daten/camp.ts`, `camp.json` | Preis, Plätze und Prüfung der Campbuchung, die Zahlen erzeugt aus der App im Browser |
| `src/daten/einfuehrung.ts` | Die drei Fragen beim ersten Start |
| `src/daten/gemeinschaft.ts` | Neuigkeiten für „Folge ich“ |
| `src/lib/thema.ts` | Farben, Schriften, Höhen aus der App im Browser |
| `src/lib/erinnerung.ts` | Die Trainingserinnerung als Mitteilung |
| `src/ui/` | Bausteine: Karten, Knöpfe, Pyramide, Player |
| `src/__tests__/` | Tests für Erinnerung, Zeit, Fortschritt, Pläne, Camp und den ersten Start |
