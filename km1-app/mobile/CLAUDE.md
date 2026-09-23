@AGENTS.md

# KM1 Training — Arbeitsweise in mobile/

Es gilt alles aus `../CLAUDE.md`: Deutsch in Code, Commits und Doku, ein Pull
Request nach jeder fertigen Änderung, gemerged wird von Can.

- **Vor jedem Push:** `npm run pruefen` (Typen, Linter, Tests). Geänderte
  Bildschirme im Browser ansehen: `npx expo export --platform web`, dann mit
  Playwright bei 390 × 844.
- **Pakete nur mit `npx expo install`**, damit sie zu SDK 57 passen.
- **Der Prototyp bleibt die Vorlage.** Farben, Abstände und Texte kommen aus
  `../app/index.html`. Wer dort etwas ändert, zieht es hier nach, und
  umgekehrt.
- **Die Videos kommen aus dem Prototyp:** `node ../supabase/werkzeug/startdaten.mjs`
  schreibt `src/daten/katalog.json` und `../supabase/seed.sql`. Beide nicht
  von Hand ändern.
