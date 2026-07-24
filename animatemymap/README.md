# 🌍 MapCinema — Cinematic Map Studio

Kinoreife Karten-Animationen direkt im Browser erstellen — kostenlos, ohne Installation
und ohne API-Schlüssel. Inspiriert von AnimateMyMap, aber offen, ausbaubar und
komplett gratis.

## ✨ Funktionen (v1)

- **🎬 Kamerafahrten (Keyframes):** Ansicht einrichten (Zoom, Neigung, Drehung) und als
  Keyframe speichern. Die Tour fliegt per `flyTo` sanft durch alle Keyframes.
- **🌍 Länder hervorheben:** Länder auf der Karte anklicken, jede in eigener Farbe.
- **📍 Marker & Pins:** Punkte mit Emoji/Flagge und Beschriftung setzen.
- **🧭 Route:** animierte Linie zwischen den Markern.
- **🔎 Ortssuche:** direkt zu jedem Ort fliegen (Geocoding via OpenStreetMap/Nominatim).
- **🎨 3 dunkle Kartenstile** (Nacht / Mono / Neon) + echter **3D-Globus**.
- **📐 Format-Guides** (16:9, 9:16, 1:1) für Social-Media-Videos.
- **💾 Speichern / Export / Import** als JSON, Auto-Save im Browser (localStorage).
- **✨ Demo-Tour** zum sofortigen Ausprobieren.

## 🧱 Technik

- [MapLibre GL JS](https://maplibre.org/) — Open-Source-Karten-Engine (Globus, `flyTo`)
- Freie Länder-Vektordaten von MapLibre demotiles
- Geocoding: OpenStreetMap Nominatim
- Reines HTML/CSS/JS — kein Build-Schritt nötig

## ▶️ Starten

Einfach `index.html` in einem Browser öffnen — oder lokal servieren:

```bash
cd animatemymap
python3 -m http.server 8000
# → http://localhost:8000
```

> Für die Ortssuche und die Kartendaten wird eine Internetverbindung benötigt
> (die Vektor-Tiles und das Geocoding werden zur Laufzeit geladen).

## 🗺️ Bedienung

1. **Kamera-Tab:** Karte positionieren → *„Aktuelle Ansicht als Keyframe"*. Mehrere
   Keyframes ergeben die Tour. **▶ Tour abspielen** (oder Leertaste).
2. **Länder-Tab:** Farbe wählen, Länder anklicken.
3. **Marker-Tab:** *Marker-Modus* an → auf die Karte klicken. Emoji & Text in der Liste
   editieren. Optional *Route* aktivieren.

## 🚧 Nächste Ausbaustufen (geplant)

- 🎥 **Video-Export** (MP4/WebM) direkt im Browser
- ⏱️ Timeline mit Ease-Kurven und Titel-Einblendungen pro Keyframe
- 🔆 Länder nacheinander „aufleuchten" lassen während der Tour
- 🎵 Musik-Upload & Audio-Sync
- 🌗 Helle & kartografische Themes
