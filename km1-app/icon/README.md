# App-Symbol und Markenbilder

Gewählt ist: **heller Grund, Figur in Schwarz.** Damit ist das Symbol genau das
Logo, das KM1 schon hat — nur freigestellt, mit geglätteten Kanten und in 1024
statt 142 Pixeln.

| Datei | Wofür | Größe |
| --- | --- | --- |
| `km1-symbol-1024.png` | App Store, Expo `icon` | 1024 × 1024 |
| `km1-symbol-512.png` | Play-Store-Eintrag | 512 × 512 |
| `km1-symbol-48.png` | Web, Lesezeichen | 48 × 48 |
| `android-vordergrund-1024.png` | adaptives Symbol, Figur | 1024 × 1024, transparent |
| `android-hintergrund-1024.png` | adaptives Symbol, Grund | 1024 × 1024 |
| `android-mitteilung-96.png` | Statusleiste Android | 96 × 96, weiß auf transparent |
| `wortmarke-schwarz.png` | Logo für die helle Fassung | 1461 × 543, transparent |
| `wortmarke-weiss.png` | Logo für die dunkle Fassung | 1461 × 543, transparent |
| `startbildschirm-hell-1242x2688.png` | Start beim Öffnen, hell | 1242 × 2688 |
| `startbildschirm-dunkel-1242x2688.png` | Start beim Öffnen, dunkel | 1242 × 2688 |

`spieler-glatt.png` ist die freigestellte Figur als Graustufenmaske. Daraus
lässt sich jede weitere Variante bauen.

## Neu bauen

```bash
cd km1-app/icon
python3 bauen.py                 # das gewählte Symbol und alles drumherum
python3 bauen.py --entwuerfe     # zusätzlich die drei Entwürfe von der Auswahl
```

Braucht nur Pillow (`pip install Pillow`). Farben und Größen stehen oben im
Skript: `SCHWARZ`, `GRUND_INNEN`, `GRUND_AUSSEN`, `HOEHE`.

## In Expo eintragen

```json
{
  "expo": {
    "icon": "./assets/km1-symbol-1024.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-vordergrund-1024.png",
        "backgroundImage": "./assets/android-hintergrund-1024.png"
      }
    },
    "splash": {
      "image": "./assets/startbildschirm-hell-1242x2688.png",
      "resizeMode": "cover",
      "backgroundColor": "#FCFDFB"
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/android-mitteilung-96.png",
        "color": "#C81E14"
      }]
    ]
  }
}
```

## Zwei Entscheidungen

**Keine Schrift im Symbol.** „KM1" wäre bei 40 Pixeln ein grauer Fleck. Apple
rät selbst davon ab — der Name steht ohnehin direkt darunter. Eine Figur
erkennt man auch dann noch, wenn man sie nicht mehr lesen kann.

**Der Grund ist kein reines Weiß**, sondern ein sehr leichter Verlauf ins
Grünliche (`#FCFDFB` → `#E0E8DE`). Das gibt dem Symbol Körper. Reines Weiß
sähe zwischen anderen Symbolen aus wie ein Loch.

**Für Android muss die Figur kleiner stehen** als auf dem iOS-Symbol: das
System schneidet außen weg, je nach Hersteller rund, eckig oder als Tropfen.
Deshalb `HOEHE_ADAPTIV = .48` gegenüber `HOEHE = .70`.
