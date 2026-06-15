# Velora Saga — Wesen-Abenteuer

Ein eigenständiges 2D-Monster-Sammel-RPG (Canvas/HTML5, **ohne externe Abhängigkeiten**),
inspiriert von der Spielstruktur klassischer Sammel-RPGs, aber mit komplett **eigener
Welt, eigenen Wesen, Namen, Story und Begriffen**.

## Spielen

Einfach **`index.html` im Browser öffnen** — kein Build, keine Installation, kein Server nötig.
Die Bilddateien liegen daneben im Ordner `assets/`, daher das Projekt am besten als Ganzes
ausliefern (oder über GitHub Pages, siehe `.github/workflows/pages.yml`).

## Grafik

Die Optik basiert auf **stilkonsistenter 16-bit-Pixel-Art** (eine gemeinsame Stil-Formel für
alle Motive). Enthalten sind:

- **18 Wesen-Sprites** (inkl. aller Entwicklungen) mit transparentem Hintergrund — verwendet in
  Kämpfen, Starterwahl, Team-Übersicht, Wesen-Lexikon und auf dem Titelbild.
- **Kampf-Hintergründe** für Wiese, Höhle und Orden-Basis (Finale).
- **Welt-Texturen** (Gras, Weg, Wasser, Höhlenboden), die in der Overworld **nahtlos**
  an Weltkoordinaten verankert gekachelt werden.
- **UI** mit einheitlichen tiefen Indigo-Panels und cremefarbenem Text.

Fehlt eine Bilddatei, fällt das Spiel automatisch auf die eingebauten **prozeduralen Sprites/Tiles**
zurück — es startet also auch ohne `assets/`.

## Animationen (Pokémon-Schwarz-Feeling)

- **Kampf:** weicher Kampfstart-Blitz, einfliegende Wesen, ständiges Idle-„Atmen", Angriffs-Vorstoß
  des Angreifers, Treffer-Blinken des Getroffenen, Bildschirm-Shake (skaliert mit Effektivität),
  typgefärbte Partikel-Bursts, sanft sinkende KP-Balken und KO-Absink-Animation.
- **Welt:** wiegendes Hochgras, schimmerndes Wasser, animierte Lauf-Frames, Wetter (Regen/Schnee/
  Nebel/Sonne) und weiche Tag/Nacht-Lichtfarben.
- **Spielgefühl:** **X/Shift gedrückt halten = rennen** (~1,75× Tempo) für flüssigere Wege.

## Kampfmechanik (Tiefe)

- **Volltreffer** (~1/16, ×1,5), **Statuswert-Stufen** (Angriff/Verteidigung/Tempo, −6…+6) über
  Attacken wie Drohblick/Härten/Flinkschritt/Kraftruf.
- **Statuszustände:** Gift, Paralyse, Schlaf, **Verbrennung** (Schaden/Runde + schwächt physisch),
  **Frost** (festgefroren, taut zufällig auf), **Verwirrung** (flüchtig, kann sich selbst treffen).
- **Fähigkeiten** je Typ: Lodermut/Wucherung/Sturzbach (Typ-Boost bei wenig KP), Robustheit
  (überlebt K.O. aus voller KP), Statik (Berührung kann paralysieren), Aufwind (Tempo), Wachsamkeit
  (schlafimmun) — sichtbar im Wesen-Detail.
- **Wetter wirkt im Kampf** (Regen↑Wasser/↓Feuer, Sonne umgekehrt, Schnee↑Gestein) und eine
  **zielgerichtete Gegner-KI** wählt Attacken nach erwarteter Wirkung.

## Projektstruktur

```
velora-saga/
  index.html              das komplette Spiel (Canvas + Logik, ohne Abhängigkeiten)
  assets/
    creatures/*.png       18 Wesen-Sprites (transparent)
    bg/*.png              3 Kampf-Hintergründe
    tiles/*.png           4 nahtlose Welt-Texturen
  scripts/
    process_assets.py     Nachbearbeitung der generierten Bilder (Key-out, Skalierung)
    smoke-velora.mjs      Node-Smoke-Test
  design/assets.csv       Asset-Manifest (Rolle → Datei → Beschreibung)
```

## Test

Zwei Node-Tests, beide laufen als Gate im GitHub-Pages-Workflow vor jedem Deploy:

```
node scripts/smoke-velora.mjs   # Skript kompiliert? 18 Arten? alle PNGs gültig?
node scripts/headless-run.mjs    # bootet das Spiel mit Canvas-/DOM-Stubs und
                                 # fährt Titel- + Kampf-Animationsframes ohne Fehler
```

Der Headless-Lauf führt das echte Spiel-Skript aus (gestubbter 2D-Context, Image,
localStorage, AudioContext) und treibt u. a. die Kampf-Animationen über viele Frames —
fängt also Laufzeitfehler, die ein reiner Kompilier-Check übersieht.

## Steuerung

| Aktion | Tasten |
|---|---|
| Bewegen | Pfeiltasten oder **WASD** |
| Rennen (gedrückt halten) | **X** / **Shift** / **K** |
| Bestätigen / Interagieren | **Leertaste** oder **Enter** |
| Abbrechen / Zurück | **X** / **Esc** (Backspace) |
| Hauptmenü | **Esc** oder **M** |

Auf Touch-Geräten erscheint ein Bildschirm-Steuerkreuz automatisch.

## Enthaltene Systeme

- **Welt:** Heimatdorf Moosheim, Pfad 1 (Wald/Wiese), Städte Lindgrün & Wogenfels mit je einer
  Prüfhalle, Höhle Felsschlucht, Orden-Basis (Finale). NPCs, Heilstation, Wesen-Laden.
- **Tag/Nacht-Zyklus** (Bildschirm-Tönung) und **Jahreszeiten** (Frühling/Sommer/Herbst/Winter):
  ändern Optik (z. B. Schnee im Winter) und die wilden Wesen je Route.
- **18 eigene Wesen** in 7 Typen (Normal, Pflanze, Feuer, Wasser, Elektro, Gestein, Flug),
  inkl. 3 Starter mit Entwicklung und Typen-Effektivitätstabelle.
- **Rundenkämpfe:** Angriff, Beutel, Wesen wechseln, Fliehen; KP-Balken, Status (Gift/Paralyse/Schlaf),
  EXP, Level-Aufstieg, Entwicklung, **Fangkugel**-Mechanik (Fangrate abhängig von KP & Status),
  Trainer-Kämpfe mit festen Teams, Hallenleiter mit **Emblem**-Belohnung, finaler Boss.
- **Menüs:** Team-Übersicht & Wesen-Details, Beutel/Items, **Wesen-Lexikon** (gesehen/gefangen),
  Regions-Karte, Speichern.
- **Speichern** im Browser (`localStorage`), Fortsetzen über das Titelbild.
- **Chiptune-Musik** (Overworld/Stadt/Kampf/Boss/Höhle) und SFX über die WebAudio-API.

## Ziel

Vom Startdorf bis zur Orden-Basis: Wesen fangen, zwei Prüfhallen meistern und die
Antagonisten-Gruppe **Orden Nyx** und ihre Anführerin **Nox** besiegen.

> Alle Bezeichnungen (Region, Orte, Wesen, Figuren, Organisation, Begriffe wie
> „Fangkugel", „Wesen-Lexikon", „Prüfhalle", „Emblem") sind frei erfunden.
