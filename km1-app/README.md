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

Der Prototyp ist die reine Kundenansicht: kein Erklärtext, keine Schalter, kein
Hinweis darauf, dass es ein Entwurf ist. So sieht ein Besucher die App.

Jeder Zustand ist über die App selbst erreichbar, genau wie später im Betrieb:

| Zustand | Weg dorthin |
| --- | --- |
| Gast | So startet die App |
| Mit Konto | Start → *Konto anlegen*, oder ein Video mit Konto-Abzeichen antippen |
| KM1 PRO | Eine Profi-Einheit antippen → *Pro ansehen* → *7 Tage gratis testen* |
| Dunkle Fassung | Profil → *Darstellung* |
| Trainerbereich | Beim Anmelden eine E-Mail mit „kader" verwenden, etwa `kader@km1-training.de`. Die Trainerrolle hängt am Konto, nicht an einem Schalter. |

Der Videoplayer ist eine Attrappe: die Leiste läuft, es liegt aber noch kein
Video dahinter. Alles andere reagiert wie in einer fertigen App.

Design, Logo und Schriften sind aus der Website übernommen: Anton für die großen
Versalzeilen, Chivo für den Text, JetBrains Mono für Marken und Zahlen,
Köln-Rot `#C81E14` als einziger Akzent. Hell ist die Grundeinstellung, Dunkel
liegt im Profil unter „Darstellung".

## Stand

Prototyp steht, die echte App ist noch nicht begonnen. Nächster Schritt und
offene Entscheidungen stehen am Ende von `KONZEPT.md`.
