@AGENTS.md

# KM1 Training — Arbeitsweise in mobile/

Es gilt alles aus `../CLAUDE.md`: Deutsch in Code, Commits und Doku, ein Pull
Request nach jeder fertigen Änderung, gemerged wird von Can.

- **Vor jedem Push:** `npm run pruefen` (Typen, Linter, Tests). Geänderte
  Bildschirme im Browser ansehen: `npx expo export --platform web`, dann mit
  Playwright bei 390 × 844.
- **Pakete nur mit `npx expo install`**, damit sie zu SDK 57 passen.
- **Die App im Browser bleibt die Vorlage.** Farben, Abstände und Texte kommen
  aus `../app/index.html`. Die Tokens stehen in `src/lib/thema.ts`, die
  Bausteine (Knopf, Wahl, Zeile, Raster, Ring) in `src/ui/Bausteine.tsx`.
- **Die Daten kommen aus der App im Browser:** `node ../supabase/werkzeug/startdaten.mjs`
  schreibt `src/daten/katalog.json`, `plaene.json`, `camp.json` und
  `../supabase/seed.sql`. Keine davon von Hand ändern.
- **Regeln wie auf dem Server.** Wer ein Camp buchen darf oder welche Planwoche
  frei ist, steht in `src/daten/aktionen.ts` und `plaene.ts` genauso wie in der
  Datenbank. Ändert sich eine Regel, ändern sich beide, und ein Test dazu.
