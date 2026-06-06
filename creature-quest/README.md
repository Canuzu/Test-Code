# 🐾 Beastlings Quest

Ein eigenständiges **Monster-Sammel-Abenteuer** im Stil klassischer
Taschenmonster-RPGs – mit komplett eigenen Kreaturen, eigener Welt und
eigenem Namen (keine fremden Marken). Läuft direkt im Browser
(React + Vite, HTML5/Canvas, Retro-Pixelart).

> Dieses Projekt ist **unabhängig** vom übrigen Inhalt des Repos und liegt
> komplett im Ordner `creature-quest/`.

## ✨ Features (erster voller Wurf)

- 🌲 **Naturwelt** mit drei verbundenen Gebieten: Heimatwiese → Flüsterwald →
  Kristallhöhle (Kachel-Karten mit hohem Gras & Begegnungen).
- ⚔️ **6 Elementtypen** (Feuer, Wasser, Pflanze, Elektro, Erde, Luft) mit
  Stärke-/Schwäche-Matrix.
- 🎮 **Klassisch rundenbasierte Kämpfe**: Attacken, Typeneffektivität,
  Volltreffer, Status-Attacken (Angriff/Verteidigung stärken).
- 🐣 **33 Kreaturen** inklusive **3 Startern** mit je dreistufiger Entwicklung
  (Entwicklung per Level).
- 🎯 **Fangen** mit Fangkugeln (Chance abhängig von Rest-HP, Seltenheit & Level).
- 📈 **EP & Level-Aufstieg**, neue Attacken lernen, automatische Entwicklung.
- 📖 **Beastdex** (gesehen / gefangen), 👥 **Team-Verwaltung** (+ Lager-Box).
- 🎒 **Beutel & Items**: Tränke (Heilen), Beleber, drei Fangkugel-Stufen mit
  unterschiedlicher Fangchance – nutzbar im Kampf und außerhalb.
- 🛒 **Naturladen & Geld**: Siege bringen Taler, dafür kaufst du Items.
- 💾 **Auto-Speichern** im Browser (`localStorage`) – Fortschritt bleibt erhalten.
- 🎨 **Prozedurale Pixel-Sprites**: jede Kreatur bekommt einen eindeutigen,
  reproduzierbaren 16×16-Sprite (Palette nach Typ).
- 📱 Steuerung per **Tastatur** (Pfeiltasten / WASD) **und Touch-D-Pad**.

## 🚀 Schnellstart

```bash
cd creature-quest
npm install
npm run dev      # Entwicklungsserver, meist http://localhost:5173
```

Produktions-Build:

```bash
npm run build
npm run preview
```

## 🗂️ Projektstruktur

```
creature-quest/
├─ src/
│  ├─ data/        # types, moves, creatures (Beastdex), world (Karten)
│  ├─ engine/      # rng, sprite, creatures (Level/Evolution), battle, save
│  ├─ components/  # Title, StarterSelect, Overworld, BattleScreen, Party, Dex
│  ├─ App.jsx      # Screen-Steuerung, Bewegung, Begegnungen, Speichern
│  └─ main.jsx
└─ index.html
```

## 🎯 So spielt es sich

1. **Neues Abenteuer** starten und einen von drei Startern wählen.
2. Mit Pfeiltasten/WASD (oder dem D-Pad) durch die Gebiete laufen.
3. Im **hohen Gras** (gestreifte Kacheln) erscheinen wilde Kreaturen.
4. Im Kampf **kämpfen**, **fangen**, **Team wechseln** oder **fliehen**.
5. Gelbe Pfeil-Kacheln sind **Übergänge** zwischen den Gebieten.
6. Fortschritt wird **automatisch gespeichert**.

## 🧭 Ideen für die nächsten Schritte

- Mehr Gebiete, Wasserflächen zum Begehen, NPCs & Story
- Trainerkämpfe & ein „Arena"-Boss pro Gebiet
- Items/Beutel (Tränke, bessere Fangkugeln), Händler
- Sound & Musik, Animationen im Kampf
- Mehr Kreaturen und Doppel-Typen

Sag einfach, woran wir als Nächstes arbeiten sollen – das Fundament steht. 🙌
