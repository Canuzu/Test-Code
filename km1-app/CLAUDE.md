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
- Geänderte echte App (`mobile/`): `npm run pruefen` dort, und die Regeln der
  Datenbank mit `npm test` in `supabase/tests/`. Beides läuft auch in der CI
  (`.github/workflows/km1-app.yml`).

## Die Designstudie in `apple/`

`apple/` ist eine Kopie der App mit einem Design im Stil von Apple, zum
Vergleichen. Sie ersetzt nichts: `app/` bleibt die Hauptfassung, und eine
Änderung an `app/` wird nicht automatisch in `apple/` nachgezogen.

- Logik und Texte sind dieselben wie in `app/index.html`. Neu sind der Stil,
  die Zeichen und der Aufbau einiger Bildschirme.
- Kein Service Worker. So kommt sich die Studie nicht mit dem Speicher der
  Hauptfassung in die Quere, und `VERSION` in `app/sw.js` bleibt unberührt.
- Die Schrift ist auf Apple-Geräten SF Pro vom Gerät, sonst Inter aus
  `apple/fonts/`.
- Vorschau auf claude.ai: `python3 artefakt.py apple`, veröffentlicht als
  eigenes Artefakt mit den Dateien aus `apple/fonts/` und `apple/img/`.

## Die Mischung in `mischung/`

`mischung/` ist die dritte Fassung: achtzig Teile aus `apple/`, zwanzig Teile
aus `app/`. Aufbau, Listen, Glas und Bewegung kommen aus der Apple-Studie.
Aus der Hauptfassung kommen Anton in Versalien für die großen Titel und
Zahlen, Köln-Rot als Akzent, die rote Zeile in JetBrains Mono über den
Überschriften, die Kreidezeichnungen auf dem grünen Brett, die grünlichen
Grautöne und der Ball in der Tableiste.

- Entstanden als Kopie von `apple/index.html`. Was dort geändert wird, zieht
  nicht von selbst nach.
- Kein Service Worker, aus demselben Grund wie in `apple/`.
- Vorschau auf claude.ai: `python3 artefakt.py mischung`, mit den Dateien aus
  `mischung/fonts/` und `mischung/img/`.

## Die Mischung 2 in `mischung2/`

`mischung2/` ist die vierte Fassung: die Mischung, farbiger und ruhiger.
Entstanden als Kopie von `mischung/index.html`, mit diesen Unterschieden:

- Die Vorschaubilder tragen wieder die Farbe ihrer Ebene mit weißen
  Linien, wie in `apple/`. Die Linien bleiben leicht aufgeraut wie Kreide.
- Anton nur noch für die großen Titel (Seiten, große Karte, Kacheln,
  Videos). Zahlen, Preise, Initialen und die Namen in der Pyramide stehen
  in der runden Systemschrift.
- Die rote Zeile in JetBrains Mono nur noch über den Titeln einer Seite,
  mit weniger Buchstabenabstand. Auf Kacheln ein ruhiges rotes Wort.
- Rote Knöpfe ohne Leuchten.

Dazu hat nur die Mischung 2 die Funktionen für die Präsentation: Rollen mit
Haken, KM1 Team, geschützte Videos mit Feedback, feste Reaktionen mit Melden
und Blockieren, Teilen als Status, Neuigkeiten und Talente mit Scouts. Sie
stehen in einem zweiten Skript am Ende von `mischung2/index.html`, mit einem
eigenen Klickfänger. Gezeichnet wird erst am Ende dieses Skripts, weil die
Startseite seine Rollen und Daten braucht.

- Die Beispielwelt `W` gehört allen Rollen gemeinsam. Was eine Rolle tut,
  sieht die nächste, nachdem man die Sicht über die Ebene oben rechts
  gewechselt hat.
- Drei Regeln gelten überall: geprüft wird, wer mit Kindern arbeitet oder sie
  sichtet; kein Video eines Kindes ist öffentlich, unter 16 geben die Eltern
  frei; niemand schreibt einem Kind direkt.
- Die Namen sind erfunden und gehören zu einer Geschichte: Luis (U13), seine
  Mutter Sandra, Trainer Tim Hoffmann, die Akademie Rheinblick, Scout Marco
  Berger und Kader für KM1.

Vorschau auf claude.ai: `python3 artefakt.py mischung2`.

## Sprache

Code-Kommentare, Commits, Pull Requests und die Dokumentation sind auf
Deutsch, in ganzen Sätzen, ohne Abkürzungen und ohne Füllwörter. Umlaute in
Commit-Nachrichten werden umschrieben (ae, oe, ue), im übrigen Text nicht.

## Wo was liegt

| Datei | Inhalt |
| --- | --- |
| `app/index.html` | Die ganze App: Aufbau, Gestaltung, Verhalten in einem Dokument |
| `app/sw.js` | Service Worker, `VERSION` bei jeder Änderung erhöhen |
| `apple/index.html` | Designstudie im Stil von Apple: dieselbe App, anderes Design, liegt unter `…/km1-app/apple/` |
| `mischung/index.html` | Die Mischung aus Apple-Stil und KM1-Charakter, liegt unter `…/km1-app/mischung/` |
| `mischung2/index.html` | Die Mischung 2, farbiger und ruhiger, liegt unter `…/km1-app/mischung2/` |
| `artefakt.py` | Macht aus `app/index.html` die Fassung für die Vorschau auf claude.ai, mit `apple`, `mischung` oder `mischung2` aus den Studien |
| `KONZEPT.md` | Architektur, Datenmodell, Abo, Designsystem, Weg ins App Store |
| `WEG_ZUR_ZEHN.md` | Was zwischen dem heutigen Stand und einem fertigen Produkt liegt |
| `mobile/` | Die echte App für iPhone und Android (Expo), siehe `mobile/README.md` |
| `supabase/` | Datenbank, Regeln, Startdaten und ihr Test, siehe `supabase/README.md` |
| `STORE.md`, `store/` | Texte, Angaben und Bildentwürfe für App Store und Google Play |
