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
| `praesentation/` | Die App als Präsentation in 22 Folien, liegt unter `…/km1-app/praesentation/` |
| `praesentation-quelle/` | Die Quellen der Präsentation und `bauen.py`, das daraus `praesentation/index.html` macht |
| `artefakt.py` | Macht aus `app/` (oder mit `original`, `apple`, `mischung` aus den Studien) die Fassung für die Vorschau auf claude.ai |
| `mobile/` | Die echte App für iPhone und Android (Expo), im Stil der App; die Bereiche für Teams und Scouting folgen |
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

## Die Präsentation

Unter <https://canuzu.github.io/Test-Code/km1-app/praesentation/> liegt die App
als Präsentation in 22 Folien, für Gespräche mit Vereinen, Eltern und Partnern.
Weiter geht es mit → oder der Leertaste, zurück mit ←. F schaltet auf
Vollbild, N zeigt die Notizen für den Vortrag, O alle Folien, T den Ton. Auf
der Folie „Live“ läuft die echte App aus `app/` im Telefon; die Werte, die sie
dafür im Speicher des Geräts setzt, legt die Präsentation danach zurück.

Gebaut wird sie aus `praesentation-quelle/`: `python3 bauen.py` schreibt
`praesentation/index.html`. Mit `--eine-datei <ziel>` entsteht zusätzlich eine
einzelne Datei mit allen Bildern und Schriften, die ohne Netz aufgeht. Die
Bildschirmfotos in `praesentation/img/` stammen aus der App; ändert sich ein
Bildschirm sichtbar, gehört ein neues Foto hinein.

## Aufgeräumt

Jede Seite hat eine Aufgabe, gebaut nach dem Vorbild erfolgreicher Apps:

- **Start:** Die große Karte „Heute“ gibt genau eine Antwort darauf, was
  dran ist: zuerst die Hausaufgabe vom Trainer, dann das angefangene Video,
  dann die nächste Einheit im Plan, sonst der nächste Schritt auf dem eigenen
  Weg. Darüber höchstens drei Hinweise, darunter neue Videos, die Challenge
  und ein einziger Werbeplatz; Kinder sehen dort keine Werbung für Pro.
  Neuigkeiten, Profis, Vereine und ihre Beiträge stehen unter „Folge ich“.
- **Menü unten:** Wer selbst trainiert, hat Start, Üben, Team und Profil;
  ohne Konto nur Start, Üben und Profil. Eltern haben Start, Familie, Üben und
  Profil, die Videos ihres Kindes stehen in der Familie. Die Pyramide ist der
  „Weg“: Er öffnet sich über die Ebene oben rechts und im Profil.
- **Profil:** Das Ich, die eigenen Sachen und das Abo als eine Zeile. Alles
  zum Einstellen liegt hinter dem Zahnrad oben rechts.
- **Team:** Ein Umschalter statt einer langen Seite, beim Trainer etwa
  „Übersicht · Spieler · Beiträge“, bei den Eltern „Übersicht · Videos ·
  Laufbahn · Schutz“. Was jemand entscheiden soll (Freigaben, Beitritte,
  Laufbahn bestätigen), steht als kurze Zeile da; entschieden wird im Blatt
  dahinter.
- **Erklärungen:** Ein kleines i neben der Überschrift statt Text unter jedem
  Block. Nur wo jemand entscheidet, etwa beim Hochladen oder Freigeben, steht
  der Satz direkt da.

## Die Funktionen

Alle lassen sich antippen, die Namen in der Vorführung sind erfunden:

| Funktion | Wo |
| --- | --- |
| Rollen und Haken | Spieler, Eltern, Trainer, Akademie, Verein, Profi, Scout und KM1. Wer mit Kindern arbeitet oder sie sichtet, bekommt den blauen Haken erst nach einer Prüfung. |
| Einladungen | Vereine und Akademien prüft KM1 selbst. Sie laden ihre Trainer, Scouts und Profis mit einem Code ein und bürgen für sie, der Haken ist dann sofort da. Wer keinen Code hat, reicht Belege ein. KM1 sieht jede Einladung und kann jeden Haken wieder entziehen. |
| Menüs pro Rolle | Spieler haben Üben und Team, Eltern Familie und Üben, Trainer Team, Videos und Übungen, Akademien Teams und Talente, Vereine Seite und Nachwuchs, Scouts Talente, Beobachtet und Berichte, KM1 Prüfen, Inhalte und Meldungen. |
| KM1 Team | Abo für Trainer und Akademien: Team per Code, Hausaufgaben, Fortschritt jedes Spielers, Rangliste |
| Videos | Jeder lädt hoch, im Bereich Videos. Kinder wählen Trainer, Team, KM1 oder ihr Profil. Unter 16 geben die Eltern jedes Video frei, dann sehen es Team, Familie und geprüfte Konten. Ab 16 sieht ein Profilvideo jeder in KM1. Öffentlich posten nur geprüfte Konten. Feedback mit Zeitmarken. |
| Reaktionen | Drei feste Zeichen statt Kommentaren, schreiben dürfen nur geprüfte Trainer. Melden und Blockieren an jedem Beitrag. |
| Teilen | Eine Karte im Hochformat für WhatsApp-Status und Instagram-Story |
| Neuigkeiten | Nur von KM1, auf der Startseite unter „Folge ich“ und als Liste |
| Talente und Laufbahn | Spielerprofil mit Videos, Laufbahn und den Einheiten bei KM1. Stationen tragen die Eltern ein, der Trainer bestätigt, jede Angabe zeigt ihre Quelle. Scouts beobachten Spieler und schreiben Berichte, Kontakt nur über Eltern oder Akademie. |
| Profis und Vereine | Eigene Rollen mit Prüfung und einer öffentlichen Seite. Der Profi Niklas Hartwig und der FC Rheinstadt sind erfunden. |
| Folgen | Seiten von Profis, Vereinen, Akademien, Trainern und KM1. Kindern unter 16 folgt nur das eigene Team. |
| Nachrichten | Mit Regeln: Kinder unter 16 schreiben nur mit Trainer, Mitspielern und Eltern, die Eltern lesen mit. Eltern derselben Mannschaft schreiben sich direkt. Profis und Vereine bekommen Anfragen von geprüften Konten, Fans folgen ihnen und schreiben nicht. |
| Erster Start | Drei Fragen: wer man ist, welcher Jahrgang, wann trainiert wird. Oben stehen Spieler, Eltern und Trainer, die übrigen Rollen hinter „Etwas anderes“. Der Jahrgang ist nie vorausgewählt und wählt die Ebene, die Zeit wird zur Erinnerung. Alles lässt sich überspringen und bleibt auf dem Gerät. |
| Trainingspläne | Sechs Wochen, drei Einheiten pro Woche, zum Abhaken. Die erste Woche ist mit Konto frei, die übrigen mit Pro. Die nächste Einheit steht oben auf der Startseite. |
| Selbstaufnahme | Unter jedem Video „Mit mir vergleichen“: filmen und sich direkt unter Kader sehen, in Zeitlupe und Bild für Bild. Das eigene Video bleibt auf dem Handy. |
| Camp buchen | Kinder, Geschwisterrabatt, Notfallnummer, Fotos nur mit Zustimmung, verbindlich mit Buchungsnummer. Bezahlt wird direkt bei KM1, nicht über den App Store. Kinder fragen ihre Eltern. |
| Fehlerzustände | Ohne Netz eine ruhige Leiste unten, ein Video, das nicht lädt, bekommt „Erneut versuchen“, und beim Sperren oder bei einem Anruf hält es an derselben Stelle an. |

Die Vorführung ist für echte Nutzer unsichtbar. Sie kommt mit `?vorfuehrung`
am Ende der Adresse,
<https://canuzu.github.io/Test-Code/km1-app/?vorfuehrung>, und bleibt
auf dem Gerät an, bis man sie im Blatt „Aus welcher Sicht?“ ausschaltet. In
der Vorschau auf claude.ai ist sie immer an. Dann wechselt man die Sicht über
die Ebene oben rechts. Was eine Rolle tut, sehen die anderen: Luis lädt hoch,
Sandra gibt frei, Tim zählt nach und gibt Feedback.

## Was drin ist

Die App ist die reine Kundenansicht: kein Erklärtext, keine Schalter. Jeder
Zustand ist über die App selbst erreichbar, genau wie später im Betrieb:

| Zustand | Weg dorthin |
| --- | --- |
| Erster Start | So startet die App beim allerersten Öffnen. Noch einmal: Profil → Zahnrad → *Einführung ansehen* |
| Gast | Nach den drei Fragen oder mit *Überspringen* |
| Mit Konto | Start → *Konto anlegen*, oder ein Video mit Konto-Abzeichen antippen |
| KM1 PRO | Eine Profi-Einheit antippen → *Mit KM1 Pro ansehen* → *7 Tage gratis testen* |
| Dunkle Fassung | Profil → Zahnrad oben rechts → *Darstellung* |
| Trainingsplan | Üben → *Trainingspläne* → einen Plan antippen → *Plan starten* |
| Dein Weg | Oben rechts auf die Ebene tippen, oder Profil → *Mein Weg* |
| Selbstaufnahme | Ein Video öffnen → *Mit mir vergleichen* → *Jetzt filmen* oder *Video auswählen* |
| Camp buchen | Start → Karte *Herbstcamp Köln* → *Platz buchen*. Der Werbeplatz wechselt täglich mit dem Abo; steht dort Pro, führt Folge ich → *Neu bei KM1* → Herbstcamp → *Zum Camp* dorthin. Als Spieler steht dort *Meine Eltern fragen*. |
| Kein Netz | Den Flugmodus einschalten, während die App offen ist |
| Jede Rolle ausprobieren | In der Testphase bis zum Start: *Konto anlegen* → Rolle wählen, unter *Etwas anderes* auch Akademie, Verein, Profi, Scout und KM1. Kein Code, keine Belege, der Haken ist sofort da. |
| Beispielkonten | Profil → Zahnrad → *Vorführung*, oder `?vorfuehrung` an die Adresse hängen, dann oben rechts eine Sicht wählen |
| Mit Einladung | Mit `?testphase=aus` in der Adresse: *Konto anlegen* → Trainer, oder unter *Etwas anderes* Scout oder Profi → *Mit Einladung* → den Code eingeben, in der Vorführung *Vorführung: Code einsetzen*. Neue Codes legen Akademie und Verein unter Profil → *Leute einladen* an. |
| Eine andere Rolle | Beim Anlegen des Kontos die Rolle wählen. In der Vorführung oben rechts auf die Ebene tippen und eine Sicht wählen. |
| KM1 selbst | In der Testphase unter *Etwas anderes* → KM1. Nach dem Start nur mit einer E-Mail von KM1, etwa `kader@km1-training.de`: Die Rolle hängt am Konto, nicht an einem Schalter. |

Der Videoplayer ist eine Attrappe: die Leiste läuft, es liegt aber noch kein
Video dahinter. Alles andere reagiert wie in einer fertigen App.

Logo und Farben kommen von der Website: Anton für die großen Titel, die
Systemschrift (auf Apple-Geräten SF Pro, sonst Inter) für den Text, JetBrains
Mono für die rote Zeile über den Titeln, Köln-Rot `#C81E14` für alles, was man
antippen kann. Hell ist die Grundeinstellung, Dunkel liegt im Profil hinter dem
Zahnrad unter „Darstellung".

## Örtlich ausprobieren

```bash
cd km1-app/app && python3 -m http.server 8080
# danach http://localhost:8080 öffnen
```

Ein Service Worker braucht `http://` oder `https://`, über `file://` läuft er
nicht.

## Stand

Die App im Browser ist vollständig bedienbar, die echte App in `mobile/` hat
denselben Stand bei allem, was Kinder und Eltern brauchen, und der Server in
`supabase/` setzt alle Regeln durch, ist aber noch nicht eingespielt. Was bis
zu einem fertigen Produkt fehlt, steht in `WEG_ZUR_ZEHN.md`.
