# KM1 Training — die App

Lern-App zur [KM1 Fußballschule](https://km1-training.de): Videos, Tutorials und
Bildreihen zu Technik und Athletik. Für iOS und Android, mit Freemium-Abo.
Hochladen darf ausschließlich der KM1-Account, alle anderen sehen nur zu.

## Was hier liegt

| Pfad | Inhalt |
| --- | --- |
| `app/` | Die App. Installierbare Web-App, läuft im Browser und auf dem Startbildschirm |
| `icon/` | App-Symbol und Markenbilder, dazu `bauen.py`, das sie aus dem Logo erzeugt |
| `artefakt.py` | Macht aus `app/` die Fassung für die Vorschau auf claude.ai |
| `KONZEPT.md` | Architektur, Datenmodell, Abo, Designsystem, App Store |
| `WEG_ZUR_ZEHN.md` | Was zwischen dem heutigen Stand und einem fertigen Produkt liegt |
| `VEROEFFENTLICHUNG.md` | Der Weg in die Stores: Vorlaufzeiten, Reihenfolge, Stolpersteine |

## Auf dem Handy installieren

Die App liegt unter **<https://canuzu.github.io/Test-Code/km1-app/>**.

**iPhone:** in **Safari** öffnen (nicht Chrome), unten auf *Teilen*, dann
*Zum Home-Bildschirm*. Danach liegt KM1 mit eigenem Symbol zwischen den anderen
Apps und startet im Vollbild, ohne Browserleisten.

**Android:** in Chrome öffnen, im Menü *App installieren* oder
*Zum Startbildschirm hinzufügen*.

Nach dem ersten Start läuft die App auch ohne Netz: ein Service Worker legt
Seite, Bilder und Schriften lokal ab. Bei einer neuen Fassung die Zahl in
`app/sw.js` (`VERSION`) erhöhen, sonst behalten installierte Geräte die alte.

## Was drin ist

Die App ist die reine Kundenansicht: kein Erklärtext, keine Schalter. Jeder
Zustand ist über die App selbst erreichbar, genau wie später im Betrieb:

| Zustand | Weg dorthin |
| --- | --- |
| Gast | So startet die App |
| Mit Konto | Start → *Konto anlegen*, oder ein Video mit Konto-Abzeichen antippen |
| KM1 PRO | Eine Profi-Einheit antippen → *Mit KM1 Pro ansehen* → *7 Tage gratis testen* |
| Dunkle Fassung | Profil → *Darstellung* |
| Trainerbereich | Beim Anmelden eine E-Mail mit „kader" verwenden, etwa `kader@km1-training.de`. Die Trainerrolle hängt am Konto, nicht an einem Schalter. |

Der Videoplayer ist eine Attrappe: die Leiste läuft, es liegt aber noch kein
Video dahinter. Alles andere reagiert wie in einer fertigen App.

Design, Logo und Schriften sind aus der Website übernommen: Anton für die großen
Versalzeilen, Chivo für den Text, JetBrains Mono für Marken und Zahlen,
Köln-Rot `#C81E14` als einziger Akzent. Hell ist die Grundeinstellung, Dunkel
liegt im Profil unter „Darstellung".

## Örtlich ausprobieren

```bash
cd km1-app/app && python3 -m http.server 8080
# danach http://localhost:8080 öffnen
```

Ein Service Worker braucht `http://` oder `https://`, über `file://` läuft er
nicht.

## Stand

Prototyp steht, die echte App ist noch nicht begonnen. Nächster Schritt und
offene Entscheidungen stehen am Ende von `KONZEPT.md`.
