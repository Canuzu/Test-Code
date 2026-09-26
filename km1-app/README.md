# KM1 Training — die App

Lern-App zur [KM1 Fußballschule](https://km1-training.de): Videos, Tutorials und
Bildreihen zu Technik und Athletik, dazu Teams für Trainer, Talente mit Laufbahn
für Scouts und Seiten für Profis und Vereine. Für iOS und Android, mit
Freemium-Abo. Jedes Kind ist geschützt: Wer mit Kindern arbeitet, trägt den
Haken von KM1, und Videos von Kindern sehen nur Team, Familie und geprüfte Konten.

## Was hier liegt

| Pfad | Inhalt |
| --- | --- |
| `app/` | Die App. Installierbare Web-App, läuft im Browser und auf dem Startbildschirm |
| `icon/` | App-Symbol und Markenbilder, dazu `bauen.py`, das sie aus dem Logo erzeugt |
| `original/` | Der erste Entwurf der App, als Studie zum Vergleichen |
| `apple/` | Dieselbe App im Stil von Apple, als Designstudie |
| `mischung/` | Die Mischung: der Aufbau von Apple mit dem Charakter von KM1 |
| `mischung2/` | Nur noch eine Weiterleitung: die Mischung 2 ist seit September 2026 die App |
| `artefakt.py` | Macht aus `app/` (oder mit `original`, `apple`, `mischung` aus den Studien) die Fassung für die Vorschau auf claude.ai |
| `mobile/` | Die echte App für iPhone und Android (Expo), noch nach dem ersten Entwurf |
| `supabase/` | Datenbank, Regeln, Startdaten und ihr Test |
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

Wer die frühere Mischung 2 unter `…/km1-app/mischung2/` auf dem Startbildschirm
hat, landet über eine Weiterleitung in der App. Am besten legt man sie einmal
neu von `…/km1-app/` aus dorthin.

## Die Studien

Neben der App liegen drei frühere Fassungen, zum Vergleichen. Sie haben keinen
Service Worker und bekommen keine neuen Funktionen.

- **Erster Entwurf** unter <https://canuzu.github.io/Test-Code/km1-app/original/>:
  Anton, Chivo und JetBrains Mono wie auf der Website, dunkles Grün, rote Akzente.
- **Apple-Stil** unter <https://canuzu.github.io/Test-Code/km1-app/apple/>:
  Systemschrift, große Überschriften, blaue Knöpfe, Tableiste aus Glas.
- **Mischung** unter <https://canuzu.github.io/Test-Code/km1-app/mischung/>:
  achtzig Teile Apple, zwanzig Teile KM1.

Die App selbst ist aus der Mischung entstanden, farbiger und ruhiger: Die
Vorschaubilder tragen die Farbe ihrer Ebene, Anton steht nur in den großen
Titeln, Zahlen stehen in der runden Systemschrift.

## Die Funktionen

Alle lassen sich antippen, die Namen in der Vorführung sind erfunden:

| Funktion | Wo |
| --- | --- |
| Rollen und Haken | Spieler, Eltern, Trainer, Akademie, Verein, Profi, Scout und KM1. Wer mit Kindern arbeitet oder sie sichtet, bekommt den blauen Haken erst nach einer Prüfung. |
| Einladungen | Vereine und Akademien prüft KM1 selbst. Sie laden ihre Trainer, Scouts und Profis mit einem Code ein und bürgen für sie, der Haken ist dann sofort da. Wer keinen Code hat, reicht Belege ein. KM1 sieht jede Einladung und kann jeden Haken wieder entziehen. |
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

Die Sicht für die Vorführung wechselt man über die Ebene oben rechts. Was eine
Rolle tut, sehen die anderen: Luis lädt hoch, Sandra gibt frei, Tim zählt nach
und gibt Feedback.

## Was drin ist

Die App ist die reine Kundenansicht: kein Erklärtext, keine Schalter. Jeder
Zustand ist über die App selbst erreichbar, genau wie später im Betrieb:

| Zustand | Weg dorthin |
| --- | --- |
| Gast | So startet die App |
| Mit Konto | Start → *Konto anlegen*, oder ein Video mit Konto-Abzeichen antippen |
| KM1 PRO | Eine Profi-Einheit antippen → *Mit KM1 Pro ansehen* → *7 Tage gratis testen* |
| Dunkle Fassung | Profil → *Darstellung* |
| Mit Einladung | *Konto anlegen* → Trainer, Scout oder Profi → *Mit Einladung* → *Vorführung: Code einsetzen*. Neue Codes legen Akademie und Verein unter Profil → *Leute einladen* an. |
| Eine andere Rolle | Oben rechts auf die Ebene tippen und eine Sicht wählen, oder beim Anlegen des Kontos die Rolle wählen |
| KM1 selbst | Beim Anmelden eine E-Mail mit „kader" verwenden, etwa `kader@km1-training.de`. Die Rolle hängt am Konto, nicht an einem Schalter. |

Der Videoplayer ist eine Attrappe: die Leiste läuft, es liegt aber noch kein
Video dahinter. Alles andere reagiert wie in einer fertigen App.

Logo und Farben kommen von der Website: Anton für die großen Titel, die
Systemschrift (auf Apple-Geräten SF Pro, sonst Inter) für den Text, JetBrains
Mono für die rote Zeile über den Titeln, Köln-Rot `#C81E14` für alles, was man
antippen kann. Hell ist die Grundeinstellung, Dunkel liegt im Profil unter
„Darstellung".

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
