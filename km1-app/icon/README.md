# App-Symbol

Drei Entwürfe, alle aus der Spielerfigur des bestehenden KM1-Logos.

| Datei | Entwurf | Grund | Figur |
| --- | --- | --- | --- |
| `a-flutlicht-1024.png` | Flutlicht | Grün-Schwarz | Weiß |
| `b-koeln-1024.png` | Köln | Köln-Rot | Weiß |
| `c-kreide-1024.png` | Kreide | Hell | Köln-Rot |

`spieler-glatt.png` ist die freigestellte Figur mit geglätteten Kanten
(Graustufen-Maske, 1420 × 1680). Damit lässt sich jede weitere Variante bauen.

## Neu bauen

```bash
cd km1-app/icon && python3 bauen.py
```

Braucht nur Pillow (`pip install Pillow`). Farben und Größen stehen oben im
Skript.

## Was die Stores verlangen

- **App Store:** eine Datei mit 1024 × 1024, ohne Transparenz, ohne runde
  Ecken. Die Rundung macht iOS selbst. Genau das liegt hier.
- **Play Store:** 512 × 512 für den Eintrag, dazu ein *adaptives* Symbol aus
  zwei Schichten (Vorder- und Hintergrund), damit Android es rund, eckig oder
  als Tropfen ausschneiden kann. Die Figur muss dafür in der mittleren
  Zone bleiben, etwa 66 Prozent der Kantenlänge.
- **Mitteilungen auf Android:** eine weiße Silhouette auf durchsichtigem Grund,
  einfarbig.

Die beiden letzten Punkte baue ich, sobald ein Entwurf ausgewählt ist.

## Warum keine Schrift im Symbol

„KM1" wäre bei 40 Pixeln ein grauer Fleck. Apple rät selbst davon ab, Wörter
ins Symbol zu setzen — der Name steht ohnehin darunter. Eine Figur erkennt man
auch dann noch, wenn man sie nicht mehr lesen kann.
