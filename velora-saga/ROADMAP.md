# Velora Saga → Ziel: Spiel auf „Pokémon Schwarz"-Niveau

Dieses Dokument ist die **vollständige Lückenliste + Fahrplan**, um aus dem aktuellen
Stand ein Spiel zu machen, das Pokémon Schwarz (Gen 5) in **Umfang, Tiefe und Politur**
ebenbürtig ist — als **eigenständiges** Spiel (kein Nintendo-IP-Klon).

---

## 0. Ehrliche Einordnung (bitte zuerst lesen)

- **Kein 1:1-Klon:** Pokémon/Unova/Charaktere sind geschützt. Wir bauen ein Spiel der
  **gleichen Klasse** mit eigener Welt (Velora), eigenen Wesen, eigener Story.
- **Aufwand:** Gen 5 ist das Werk eines Profistudios über Jahre. Realistisch sind das
  **viele Iterationen** (Meilensteine unten). Jeder Meilenstein ist für sich spielbar & getestet.
- **Voraussetzungen, die NICHT vom Code abhängen:**
  - **Deploy muss sichtbar sein** (Blocker #0). Sonst sehen wir Fortschritt nicht.
  - **Video-Freigabe** (`generate_video`) in einer **frisch gestarteten** Session — nötig für
    echte animierte Sprites (das Gen-5-Markenzeichen).

---

## 1. Ist-Stand (was bereits existiert)

Einzeldatei `index.html` (Canvas, 480×320, ohne Abhängigkeiten):
- 22 Wesen (generierte 16-bit-Sprites + prozeduraler Fallback), mehrere Entwicklungslinien.
- 7 Typen, Typentabelle; Rundenkämpfe; Status (Gift/Para/Schlaf/Verbrennung/Frost/Verwirrung);
  Statuswert-Stufen; einfache Fähigkeiten je Typ; Volltreffer; Wetter mit Kampfwirkung.
- 19 Karten, 4 Prüfhallen, Finale; NPCs/Trainer; Heilstation/Shop; Fangkugel (animiert).
- Code-Animationen (Idle/Angriff/Treffer/KO), Attacken-Effekte, Kampf-Kino-Intro, Gen5-ähnliche UI.
- Tag/Nacht-Licht, Jahreszeiten, Wetterpartikel; Lexikon; Speichern (localStorage); Chiptune-Audio.
- Tests: Smoke + Headless-Run (Welt-Integrität, Mechanik-Asserts).

**Bewertung:** solide Indie-Basis (~Gen-1-Mechanik + etwas Gen-3/5-Politur). Für „Schwarz-Niveau"
fehlt **Größenordnung** in fast allen Achsen + ein **tragfähiges Engine-Fundament**.

---

## 2. Lückenliste (was zu Gen-5-Niveau fehlt)

### A. Engine & Projektstruktur  ⭐ (Fundament — zuerst)
- [ ] Weg von der 140-KB-Einzeldatei → **modulares, datengetriebenes Projekt** (Vite-Build).
- [ ] **Daten in JSON**: `species.json`, `moves.json`, `abilities.json`, `items.json`,
      `maps/*.json`, `encounters.json`, `trainers.json`, `dialog/*.json`.
- [ ] **Engine-Empfehlung: Phaser 3** (reife 2D-Engine: Tilemaps/Tiled-Import, Sprite-Sheets &
      Animationen, Kamera, Audio-Mixer, Szenen, Input inkl. Gamepad) → spart Monate Eigenbau.
- [ ] **Tiled-Map-Pipeline** (echte Tilesets, Layer, Kollision, Warps, Events) statt ASCII-Grids.
- [ ] Szenen-/State-Manager, Event-/Skript-System für Cutscenes.

### B. Kampfsystem (volle Gen-5-Tiefe)
- [ ] **Physisch/Spezial-Split** + getrennte Sp.Ang/Sp.Vert (aktuell nur Atk/Def).
- [ ] **17 Typen** (aktuell 7): + Kampf, Gift, Boden, Käfer, Geist, Stahl, Drache, Unlicht, Eis, Psycho …
- [ ] **Echte Fähigkeiten** (~100+ mit Effekten) statt 7 Typ-Defaults.
- [ ] **Getragene Items** (Beeren, Brillen, Überreste …), **Wesen/Naturen/DVs/FP**, EXP-Kurven je Art.
- [ ] **Mehr Attacken** (mehrturnig, Priorität, Mehrfachtreffer, Rückstoß, Absorption, Feld-/Wetter-/
      Entry-Hazards, Stat-Tricks, Schutz/Konter), Genauigkeit/Fluchtwert-Stufen, Krit-Stufen.
- [ ] **Doppelkämpfe** (Gen-5-Standard) + Trainer-Doppelduelle.
- [ ] Echte Gen-5-**Schadensformel** inkl. aller Modifikatoren.
- [ ] Schlauere, rollenbasierte **Gegner-KI** (Wechsel-Logik, Item-Nutzung, Setup).

### C. Wesen & Daten (Content-Masse)
- [ ] **~120–150 eigene Wesen** mit 2–3-stufigen Linien (aktuell 22), je mit Lernsets, Dex-Text,
      Geschlecht, Schillern (Shiny), **Cry/Ruf**.
- [ ] **Front- UND Back-Sprites**, jeweils **animiert** (Idle-Loop) — via Video-Pipeline.
- [ ] **TMs/VMs**, Lehrer-Attacken, Zuchtsystem (Daycare, Eier, Vererbung) — optional Endgame.

### D. Welt & Karten
- [ ] Große, zusammenhängende Region: **~15 Orte + ~20 Routen** + Höhlen/Wälder/Türme/Siegesstraße.
- [ ] Hochwertige **Tilesets** (animierte Tiles: Wasser, Blumen, Türen), Innenräume, Möbel.
- [ ] **8 Arenen** + Top-4 + Champion + **Postgame**-Areal.
- [ ] Versteckte Items, NPC-Tagesabläufe, Schilder, Item-Bälle, Angeln, Surfen/Reiten.

### E. Story, Events & Cutscenes
- [ ] **Skript-/Event-Engine** (bewegte NPCs, Kamerafahrten, Trigger, Flags, Bedingungen).
- [ ] Durchgehende **Hauptstory** (Antagonisten-Organisation, Rivale, N-artige Figur, Wendepunkte).
- [ ] **Dialog mit Porträts**, benannte Figuren, Übergänge, Item-/Erhalt-Events.

### F. Präsentation (Grafik/Animation)
- [ ] **Animierte Wesen-Sprites** (Gen-5-Kern) — braucht `generate_video`.
- [ ] **Attacken-spezifische Animationen pro Move** (nicht nur pro Typ) + Kampf-Hintergründe je Terrain.
- [ ] Spieler/NPC mit **Geh-/Lauf-/Rad-Animation**, 8-Richtungs-Feeling, Schatten, Reflexionen.
- [ ] Wetter/Tageszeit bereits da → ausbauen (Gewitter, Nebelbänke, Lichtshafts).
- [ ] Übergänge (Arena-Eingang, Kampfstart-Wirbel), Bildschirm-Effekte, Partikelsystem.

### G. Audio
- [ ] **Pro-Areal-BGM** + mehrere Kampfthemen (wild/Trainer/Arena/Boss/Champion), Sieg-Jingles.
- [ ] **Cries pro Wesen**, reichhaltige SFX (UI, Treffer je Typ, Umgebung). (Higgsfield-Audio möglich.)

### H. UX & Systeme
- [ ] **PC-Box-System** (Lagern/Ordnen/Suchen), volle **Bag mit Taschen**.
- [ ] **Town Map**, Lauf-/Rad-Umschaltung, Optionen (Texttempo, Kampfstil, Lautstärke).
- [ ] **Dex** mit Suche/Sortierung/Fundorte; Trainerpass/Embleme; Quest-/Aufgaben-Log.
- [ ] Mehrere **Speicherstände**, Auto-Save-Option.

### I. Plattform
- [ ] Touch + **Gamepad** (Phaser-Input) + Tastatur; responsives Layout; PWA-Installierbarkeit.

---

## 3. Schnellster Weg zum Ziel (Meilenstein-Plan)

> Reihenfolge ist bewusst: erst sehen/iterieren können, dann Fundament, dann Masse.

- **M0 — Infrastruktur & Sichtbarkeit** (Blocker zuerst)
  - Deploy zuverlässig sichtbar machen (Pages-Quelle/Cache prüfen; Build-Artefakt verifizieren).
  - Projekt-Restruktur: Vite + (empfohlen) **Phaser 3**, Daten als JSON, CI-Tests behalten.
  - Bestehende Inhalte (22 Wesen, Karten, Mechanik) ins neue Format migrieren.
- **M1 — Kampf-Engine vollständig**: Phys/Spez-Split, 17 Typen, Fähigkeiten/Items, Wetter/Terrain/
  Hazards, Doppelkämpfe, korrekte Formel, starke KI. (Headless-Battle-Tests.)
- **M2 — Content-Pipeline**: Video-Sprite-Pipeline (animiert, Front/Back), Cries, Massen-Generierung
  von Wesen/Moves/TMs; Daten-Validierung im Test.
- **M3 — Welt-Ausbau**: Tiled-Tilesets, 8 Arenen + Top-4, viele Routen/Orte, versteckte Items.
- **M4 — Story & Cutscenes**: Event-Engine, Hauptstory, Porträt-Dialoge, Bosse, Endgame.
- **M5 — UX-Systeme**: PC-Box, Town Map, Dex-Suche, Optionen, mehrere Speicherstände, Gamepad.
- **M6 — Politur & Balancing & QA**: Move-Animationen, Audio-Feinschliff, Performance, Playtests.

**Empfehlung:** M0 (inkl. Phaser-Restruktur) ist der Hebel mit dem größten Tempo-Gewinn — ohne
tragfähiges Fundament wird jeder weitere Inhalt langsamer und fehleranfälliger.

---

## 4. Tech-Entscheidung (meine Empfehlung)

| Option | Für | Gegen |
|---|---|---|
| **Vanilla weiter** (heutiger Ansatz) | kein Umbau | skaliert schlecht zu Gen-5-Masse; Tilemaps/Animation/Audio alles Eigenbau |
| **Vite + Phaser 3** ✅ empfohlen | Tilemaps, Sprite-Animation, Audio, Kamera, Gamepad „out of the box"; schnellster Weg zur Qualität | einmaliger Restruktur-Aufwand (M0) |

Web bleibt die Plattform (kein Native). Assets weiter via Higgsfield (Bilder ✓, Video nach Freigabe).

---

## 5. Master-Prompt (für eine frische Session auf `main`)

> Kopiervorlage, damit sofort zielgerichtet gearbeitet wird:

```
Baue „Velora Saga" zu einem eigenständigen Monster-Sammel-RPG auf Pokémon-Schwarz-Niveau aus
(eigene Welt/Wesen/Story, kein Nintendo-IP). Arbeite in Meilensteinen, jeder für sich spielbar,
getestet (Smoke + Headless) und sichtbar deployt.

M0 ZUERST: (1) Stelle sicher, dass GitHub-Pages-Deploy die Änderungen wirklich live zeigt
(Pages-Quelle = GitHub Actions, Cache/Artefakt verifizieren). (2) Strukturiere das Projekt um auf
Vite + Phaser 3 mit datengetriebenem Inhalt (species/moves/abilities/items/maps als JSON) und
behalte CI-Tests. (3) Migriere die bestehenden 22 Wesen, Karten und Mechaniken ins neue Format.

Danach M1 Kampf-Engine (Phys/Spez-Split, 17 Typen, echte Fähigkeiten & getragene Items,
Wetter/Terrain/Hazards, Doppelkämpfe, korrekte Gen-5-Schadensformel, starke KI),
M2 Content-Pipeline (animierte Front/Back-Sprites via generate_video, Cries, viele Wesen/Moves/TMs),
M3 Welt (Tiled-Tilesets, 8 Arenen + Top-4, Routen/Orte/Höhlen, versteckte Items),
M4 Story/Cutscene-Engine (Antagonisten, Rivale, Bosse, Endgame, Porträt-Dialoge),
M5 UX (PC-Box, Town Map, Dex-Suche, Optionen, Gamepad, mehrere Speicherstände),
M6 Politur/Balancing/QA.

Regeln: stilkonsistente 16-bit-Pixel-Art (eine STYLE-FORMULA, byte-identisch in alle Prompts);
Higgsfield für Assets (Bilder + Video); nach jeder Stufe committen, korrekt nach main pushen
(Push-Erfolg per Exit-Code prüfen, nicht per Text!) und Deploy bestätigen.
```

---

## 6. Offene Blocker / was ich von dir brauche

1. **Deploy-Sichtbarkeit (Blocker #0):** Bitte einmal in **Inkognito** öffnen:
   `https://canuzu.github.io/Test-Code/velora-saga/?v=11` — falls weiter alt, müssen wir die
   **Pages-Einstellungen** prüfen (Settings → Pages: Quelle = „GitHub Actions"). Ich verifiziere
   parallel, dass der letzte Deploy-Run wirklich durchlief.
2. **Video-Freigabe** in einer **neu gestarteten** Session (auf `main`), dann „video frei".
3. **Go für die Phaser-Restruktur (M0)?** Das ist der einmalige Umbau, der danach alles beschleunigt.
   (Ich empfehle: ja.)

> Tempo entsteht, wenn Blocker #0 (Sehen) und das Fundament (M0) zuerst stehen.
> Danach lässt sich Content (Wesen, Routen, Story) in großen Schritten draufsetzen.
