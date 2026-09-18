# KM1 Training — die App

Lern-App zur [KM1 Fußballschule](https://km1-training.de): Videos, Tutorials und
Bildreihen zu Technik und Athletik. Für iOS und Android, mit Freemium-Abo.
Hochladen darf ausschließlich der KM1-Account, alle anderen sehen nur zu.

## Was hier liegt

| Pfad | Inhalt |
| --- | --- |
| `prototyp/` | Bedienbarer Klick-Prototyp (eine HTML-Datei, kein Build nötig) |
| `KONZEPT.md` | Technisches Konzept: Architektur, Datenmodell, Abo, App Store |

## Prototyp ansehen

```bash
cd km1-app/prototyp && python3 -m http.server 8080
# danach http://localhost:8080 öffnen
```

Der Prototyp startet als Gast, ohne Konto: die freien Videos laufen sofort. Er
zeigt die vier Bereiche der App (Start, Technik, Pyramide, Profil), den
Videoplayer als Attrappe, die Challenge "Schlag den Coach", die PRO-Schranke und
den Trainerbereich zum Hochladen. Dazu Zeitlupe und Fünf-Sekunden-Sprung im
Player, die Pyramide als Fortschrittsanzeige, den Elternbereich und die
Trainingserinnerung. Über die Schalter links lässt sich Dunkelmodus, Anmeldung,
Trainer-Ansicht und PRO umschalten.

Design, Logo und Schriften sind aus der Website übernommen: Anton für die großen
Versalzeilen, Chivo für den Text, JetBrains Mono für Marken und Zahlen,
Köln-Rot `#C81E14` als einziger Akzent. Hell ist die Grundeinstellung, Dunkel
liegt im Profil unter "Darstellung".

## Stand

Prototyp steht, die echte App ist noch nicht begonnen. Nächster Schritt und
offene Entscheidungen stehen am Ende von `KONZEPT.md`.
