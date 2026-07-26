# Historische Grenzdaten (gebündelt)

Diese GeoJSON-Dateien sind die historischen Weltgrenzen pro Epoche und werden
**fest mit der App ausgeliefert** (gleiche Domain), damit die Zeitreise immer
funktioniert — auch wenn externe Server/CDNs auf einem Gerät nicht erreichbar sind.

- **Quelle:** [historical-basemaps](https://github.com/aourednik/historical-basemaps)
  von André Ourednik.
- **Lizenz:** CC-BY-SA 4.0.
- **Bearbeitung:** Die Geometrien wurden mit `mapshaper` vereinfacht
  (Douglas-Peucker, Koordinaten gerundet), um die Ladezeit auf Mobilgeräten
  gering zu halten. Der inhaltliche Grenzverlauf bleibt erhalten.

Jede Datei entspricht einem Jahr: `world_<jahr>.geojson` (n. Chr.) bzw.
`world_bc<jahr>.geojson` (v. Chr.).
