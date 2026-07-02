# Monsterwald – Retro-RPG (Gen-5-Stil)

Ein kleines, komplett eigenständiges 2D-Retro-RPG im Stil der DS-Ära
(Pokémon Schwarz/Weiß) – eine einzige HTML-Datei ohne Abhängigkeiten.

## Spielen

`index.html` einfach im Browser öffnen – kein Build, kein Server nötig.

## Features

- **Zwei-Screen-DS-Layout**: oben die Spielwelt (Canvas, 256×192, pixelated),
  unten das Touch-/Menü-Panel.
- **Overworld**: Grid-basierte Karte (Dorf mit Haus, Teich, Schild, Zäunen,
  Blumen) mit sanfter Tile-zu-Tile-Bewegung, Kollision und Kamera-Follow.
- **Hohes Gras** mit Zufallskämpfen (14 % pro Schritt).
- **Rundenbasiertes Kampfsystem**: Gegner oben rechts, eigenes Monster unten
  links, animierte HP-Leisten (grün/gelb/rot), Typewriter-Textbox,
  Typen-Effektivität (Feuer/Wasser/Pflanze), Volltreffer, STAB.
- **Menü**: ANGRIFF (2 Attacken) und FLUCHT – per Maus/Touch oder komplett
  per Tastatur.
- **Fortschritt**: EP, Level-Ups mit Statuswerten; Heilung an der Haustür;
  bei Niederlage erwachst du zu Hause.
- **Retro-Sound** über WebAudio (keine Assets).

## Steuerung

| Taste | Aktion |
|---|---|
| Pfeiltasten / WASD | Bewegen bzw. Menü-Auswahl |
| Enter / Leertaste / Z | Bestätigen, Schilder lesen, Text weiterblättern |
| X / Esc | Zurück im Kampfmenü |

## Code-Struktur (alles in `index.html`)

Der Code ist in klar getrennte Module gegliedert:
`DATA` (Karte, Monster, Attacken, Typen-Chart) · `SPRITES` (Pixel-Art als
String-Raster) · `SFX` (WebAudio) · `INPUT` · `TEXTBOX` · `OVERWORLD` ·
`BATTLE` (Skript-Queue-Interpreter für den Kampfablauf) · `UI` (unterer
Screen) · `GAME LOOP`.

In der Browser-Konsole steht `game.debug` für Tests bereit
(z. B. `game.debug.beginBattle()`).
