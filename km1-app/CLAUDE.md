# Arbeitsweise in km1-app

## Pull Requests

**Nach jeder fertigen Änderung an der App selbst einen Pull Request öffnen,
ohne vorher zu fragen.** Can hat das ausdrücklich so gewünscht.

Der Grund: die App liegt unter
<https://canuzu.github.io/Test-Code/km1-app/> und wird von GitHub Pages nur
aus `main` gebaut. Ohne Merge kommt eine Änderung nie auf dem Handy an. Der
Pull Request ist der einzige Weg dorthin, weil die Umgebung `github-pages`
keine Deployments von Feature-Branches annimmt.

Ablauf:

1. Änderung bauen und prüfen (siehe unten).
2. `artefakt.py` laufen lassen und das Artefakt neu veröffentlichen.
3. Committen und auf `claude/fussballcamp-learning-app-lch7q7` pushen.
4. Pull Request öffnen, Beschreibung auf Deutsch, mit dem, was sich für einen
   Nutzer ändert — nicht mit einer Liste geänderter Zeilen.
5. Auf die Ereignisse des Pull Requests horchen und rote Läufe selbst
   reparieren.

Ist der letzte Pull Request schon gemerged, wird der Branch frisch von `main`
aufgesetzt (`git checkout -B <branch> origin/main`) und ein **neuer** Pull
Request geöffnet. Ein gemergter Pull Request nimmt keine neuen Commits mehr
auf.

**Gemerged wird nicht von hier aus.** Den Merge macht Can.

## Vor jedem Push prüfen

- Die Skriptblöcke aus `app/index.html` herausziehen und mit `node --check`
  prüfen. Die Datei ist ein einzelnes HTML-Dokument; ein Tippfehler im
  JavaScript fällt sonst erst auf dem Handy auf.
- Die geänderte Stelle mit Playwright in einem Telefonfenster (390 × 844)
  ansehen, nicht nur den Code lesen.
- `app/sw.js`: bei jeder Änderung an der App die Zahl in `VERSION` erhöhen.
  Sonst behalten installierte Geräte die alte Fassung aus dem Zwischenspeicher.

## Sprache

Code-Kommentare, Commits, Pull Requests und die Dokumentation sind auf
Deutsch, in ganzen Sätzen, ohne Abkürzungen und ohne Füllwörter. Umlaute in
Commit-Nachrichten werden umschrieben (ae, oe, ue), im übrigen Text nicht.

## Wo was liegt

| Datei | Inhalt |
| --- | --- |
| `app/index.html` | Die ganze App: Aufbau, Gestaltung, Verhalten in einem Dokument |
| `app/sw.js` | Service Worker, `VERSION` bei jeder Änderung erhöhen |
| `artefakt.py` | Macht aus `app/index.html` die Fassung für die Vorschau auf claude.ai |
| `KONZEPT.md` | Architektur, Datenmodell, Abo, Designsystem, Weg ins App Store |
| `WEG_ZUR_ZEHN.md` | Was zwischen dem heutigen Stand und einem fertigen Produkt liegt |
