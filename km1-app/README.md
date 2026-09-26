# KM1 Training — die App

Lern-App zur [KM1 Fußballschule](https://km1-training.de): Videos, Tutorials und
Bildreihen zu Technik und Athletik. Für iOS und Android, mit Freemium-Abo.
Hochladen darf ausschließlich der KM1-Account, alle anderen sehen nur zu.

## Was hier liegt

| Pfad | Inhalt |
| --- | --- |
| `app/` | Die App. Installierbare Web-App, läuft im Browser und auf dem Startbildschirm |
| `icon/` | App-Symbol und Markenbilder, dazu `bauen.py`, das sie aus dem Logo erzeugt |
| `apple/` | Dieselbe App im Stil von Apple, als Designstudie zum Vergleichen |
| `mischung/` | Die Mischung: der Aufbau von Apple mit dem Charakter von KM1 |
| `mischung2/` | Die Mischung 2: farbige Vorschaubilder wie bei Apple, Anton nur für die großen Titel |
| `artefakt.py` | Macht aus `app/` (oder mit `apple` aus `apple/`) die Fassung für die Vorschau auf claude.ai |
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

### Die Designstudie im Stil von Apple

Unter **<https://canuzu.github.io/Test-Code/km1-app/apple/>** liegt dieselbe App
in einem Design, das sich an apple.com und an den Apps auf dem iPhone
orientiert: Systemschrift, große Überschriften, blaue Knöpfe, eine schwebende
Tableiste aus Glas, Listen wie in den Einstellungen. Inhalte und Abläufe sind
dieselben. Im Profil führt „Zum Originaldesign" zurück.

### Die Mischung

Unter **<https://canuzu.github.io/Test-Code/km1-app/mischung/>** liegt die dritte
Fassung: achtzig Teile Apple, zwanzig Teile KM1. Aufbau und Bedienung wie in der
Apple-Studie, dazu die großen Titel in Anton, Köln-Rot als Akzent, die rote
Zeile über den Überschriften und die Kreidezeichnungen auf dem grünen Brett.
Im Profil führen zwei Zeilen zu den anderen beiden Fassungen.

### Die Mischung 2

Unter **<https://canuzu.github.io/Test-Code/km1-app/mischung2/>** liegt die vierte
Fassung: die Mischung, farbiger und ruhiger. Die Vorschaubilder tragen wieder die
Farbe ihrer Ebene, Anton steht nur noch in den großen Titeln, Zahlen stehen in
der runden Systemschrift. Im Profil führen Zeilen zu allen anderen Fassungen.

Nur die Mischung 2 hat dazu die Funktionen für die Präsentation. Alle lassen
sich antippen, die Namen darin sind erfunden:

| Funktion | Wo |
| --- | --- |
| Rollen und Haken | Spieler, Eltern, Trainer, Akademie, Verein, Profi, Scout und KM1. Wer mit Kindern arbeitet oder sie sichtet, bekommt den blauen Haken erst nach der Prüfung durch KM1. |
| Menüs pro Rolle | Spieler üben (Technik, Team, Pyramide), Eltern haben Familie und Videos, Trainer Team, Videos und Übungen, Akademien Teams und Talente, Vereine Seite und Nachwuchs, Scouts Talente, Beobachtet und Berichte, KM1 Prüfen, Inhalte und Meldungen. |
| KM1 Team | Abo für Trainer und Akademien: Team per Code, Hausaufgaben, Fortschritt jedes Spielers, Rangliste |
| Videos | Jeder lädt hoch, im Bereich Videos. Kinder wählen Trainer, Team, KM1 oder ihr Profil. Unter 16 geben die Eltern jedes Video frei, dann sehen es Team, Familie und geprüfte Konten. Ab 16 sieht ein Profilvideo jeder in KM1. Öffentlich posten nur geprüfte Konten. Feedback mit Zeitmarken. |
| Reaktionen | Drei feste Zeichen statt Kommentaren, schreiben dürfen nur geprüfte Trainer. Melden und Blockieren an jedem Beitrag. |
| Teilen | Eine Karte im Hochformat für WhatsApp-Status und Instagram-Story |
| Neuigkeiten | Nur von KM1, auf der Startseite und als Liste |
| Talente und Laufbahn | Spielerprofil mit Videos, Laufbahn und den Einheiten bei KM1. Stationen tragen die Eltern ein, der Trainer bestätigt, jede Angabe zeigt ihre Quelle. Scouts beobachten Spieler und schreiben Berichte, Kontakt nur über Eltern oder Akademie. |
| Profis und Vereine | Eigene Rollen mit Prüfung und einer öffentlichen Seite. Der Profi Niklas Hartwig und der FC Rheinstadt sind erfunden. |
| Folgen | Seiten von Profis, Vereinen, Akademien, Trainern und KM1. Kindern unter 16 folgt nur das eigene Team. |
| Nachrichten | Mit Regeln: Kinder unter 16 schreiben nur mit Trainer, Mitspielern und Eltern, die Eltern lesen mit. Eltern derselben Mannschaft schreiben sich direkt. Profis und Vereine bekommen Anfragen von geprüften Konten, Fans folgen ihnen und schreiben nicht. |

Die Sicht wechselt man über die Ebene oben rechts. Was eine Rolle tut, sehen die
anderen: Luis lädt hoch, Sandra gibt frei, Tim zählt nach und gibt Feedback.

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
