# KM1 Training — die echte App

Die App für iPhone und Android, gebaut mit Expo (SDK 57) aus dem ersten
Entwurf des Prototyps, der heute in `../original/index.html` liegt. Alles
dahinter ist echt: Videos mit dem Player des Systems, Konten auf dem Server,
Erinnerungen als Mitteilung auf dem Handy.

Die Web-App in `../app/` ist seit September 2026 die frühere Mischung 2, mit
Rollen, Teams, Videos und Laufbahn. Diese Fassung zieht als Nächstes nach.

## Zwei Modi

| | ohne Server (Vorschau) | mit Server |
| --- | --- | --- |
| Konten | bleiben auf dem Gerät | Supabase, mit E-Mail-Bestätigung |
| Unter 16 | Elternschritt wie mit Server | Konto läuft auf die E-Mail der Eltern |
| Fortschritt, Merkliste | auf dem Gerät | in der Datenbank |
| Videos | Testvideo | aus dem Speicher, sonst Testvideo |
| Pro | zum Ansehen freischaltbar, ohne Zahlung | aus der Tabelle `abos` |

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

## Wo was liegt

| Pfad | Inhalt |
| --- | --- |
| `src/app/` | Die Bildschirme, ein Dateiname je Adresse (Expo Router) |
| `src/app/(tabs)/` | Start, Technik, Pyramide, Profil |
| `src/daten/aktionen.ts` | Alles, was die App tut: Anmelden, Abhaken, Löschen |
| `src/daten/zustand.ts` | Der Zustand an einer Stelle |
| `src/daten/katalog.ts` | Ebenen, Kategorien, Challenges, Preise, Texte |
| `src/daten/katalog.json` | Die Videos ohne Server, erzeugt aus dem Prototyp |
| `src/lib/thema.ts` | Farben, Schriften, Höhen aus dem Prototyp |
| `src/lib/erinnerung.ts` | Die Trainingserinnerung als Mitteilung |
| `src/ui/` | Bausteine: Karten, Knöpfe, Pyramide, Player |
| `src/__tests__/` | Tests für Erinnerung, Zeit und Fortschritt |
