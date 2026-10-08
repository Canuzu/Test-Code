# Arbeitsweise in km1-app

## Pull Requests

**Nach jeder fertigen Änderung an der App selbst einen Pull Request öffnen,
ohne vorher zu fragen.** Can hat das ausdrücklich so gewünscht.

Der Grund: die App liegt unter
<https://canuzu.github.io/Test-Code/km1-app/> und wird von GitHub Pages nur
aus `main` gebaut. Ohne Merge kommt eine Änderung nie auf dem Handy an. Der
Pull Request ist der einzige Weg dorthin, weil die Umgebung `github-pages`
keine Deployments von Feature-Branches annimmt.

Ablauf:

1. Änderung bauen und prüfen (siehe unten).
2. `artefakt.py` laufen lassen und das Artefakt neu veröffentlichen.
3. Committen und auf `claude/fussballcamp-learning-app-lch7q7` pushen.
4. Pull Request öffnen, Beschreibung auf Deutsch, mit dem, was sich für einen
   Nutzer ändert — nicht mit einer Liste geänderter Zeilen.
5. Auf die Ereignisse des Pull Requests horchen und rote Läufe selbst
   reparieren.

Ist der letzte Pull Request schon gemerged, wird der Branch frisch von `main`
aufgesetzt (`git checkout -B <branch> origin/main`) und ein **neuer** Pull
Request geöffnet. Ein gemergter Pull Request nimmt keine neuen Commits mehr
auf.

**Gemerged wird nicht von hier aus.** Den Merge macht Can.

## Vor jedem Push prüfen

- Die Skriptblöcke aus `app/index.html` herausziehen und mit `node --check`
  prüfen. Die Datei ist ein einzelnes HTML-Dokument; ein Tippfehler im
  JavaScript fällt sonst erst auf dem Handy auf.
- Die geänderte Stelle mit Playwright in einem Telefonfenster (390 × 844)
  ansehen, nicht nur den Code lesen.
- `app/sw.js`: bei jeder Änderung an der App die Zahl in `VERSION` erhöhen.
  Sonst behalten installierte Geräte die alte Fassung aus dem Zwischenspeicher.
- Geänderte echte App (`mobile/`): `npm run pruefen` dort, und die Regeln der
  Datenbank mit `npm test` in `supabase/tests/`. Beides läuft auch in der CI
  (`.github/workflows/km1-app.yml`).

## Die App in `app/`

Seit September 2026 ist die frühere „Mischung 2“ die App. Wer von der App
spricht, meint `app/`; das Wort Mischung braucht es dafür nicht mehr.

Gestaltung: der Aufbau von Apple mit dem Charakter von KM1.

- Die Vorschaubilder tragen die Farbe ihrer Ebene mit weißen Linien, leicht
  aufgeraut wie Kreide.
- Anton nur für die großen Titel (Seiten, große Karte, Kacheln, Videos).
  Zahlen, Preise, Initialen und die Namen in der Pyramide stehen in der
  runden Systemschrift, Text in SF Pro oder Inter.
- Die rote Zeile in JetBrains Mono nur über den Titeln einer Seite. Auf
  Kacheln ein ruhiges rotes Wort.
- Rote Knöpfe ohne Leuchten.

Rollen, Teams, Videos, Laufbahn, Folgen und Nachrichten stehen in einem
zweiten Skript am Ende von `app/index.html`, mit eigenen Klickfängern.
Gezeichnet wird erst am Ende dieses Skripts, weil die Startseite seine Rollen
und Daten braucht.

- Die Beispielwelt `W` gehört allen Rollen gemeinsam. Was eine Rolle tut,
  sieht die nächste, nachdem man die Sicht über die Ebene oben rechts
  gewechselt hat.
- Die Vorführung (Wahl der Sicht, gestrichelte Knöpfe `.demo`) sieht nur,
  wer `?vorfuehrung` an die Adresse hängt; der Schalter liegt in `VORF`. Die
  Vorschau auf claude.ai setzt `KM1_VORFUEHRUNG` und zeigt sie immer. Für
  echte Nutzer öffnet die Ebene oben rechts den Weg durch die Pyramide
  (`sheetWeg`), bei Rollen ohne Ebene das Profil. Nichts, was nur zum
  Zeigen da ist, darf ohne Vorführung zu sehen sein.
- Drei Regeln gelten überall: geprüft wird, wer mit Kindern arbeitet oder sie
  sichtet; kein Video eines Kindes steht im offenen Netz, unter 16 geben die
  Eltern jedes Video frei, und dann sehen es nur Team, Familie und von KM1
  geprüfte Konten; kein Fremder schreibt einem Kind, Kinder unter 16
  schreiben nur mit Trainer, Team und Eltern, und die Eltern lesen mit.
- Den Haken vergibt KM1 an Vereine und Akademien selbst. Trainer, Scouts und
  Profis bekommen ihn über die Einladung ihres Vereins, der mit seinem Code
  für sie bürgt, oder über Belege, die KM1 prüft. Ob ein Code gilt, steht
  allein in `einladungGueltig(code, rolle)`, die Codes in `W.einladungen`.
- Übersicht vor Vollständigkeit, wie bei Duolingo, Strava oder Instagram:
  - Die Startseite zeigt unter „Für dich“ höchstens fünf Blöcke: Hinweise in
    einer Karte, die große Karte „Heute“ mit dem Wochenziel, neue Videos, die
    Challenge und einen einzigen Werbeplatz. Alles von anderen (Neuigkeiten,
    Profis und Vereine, Beiträge) steht unter „Folge ich“.
  - „Heute“ gibt genau eine Antwort (`startKarte`): die Hausaufgabe vom
    Trainer, dann das angefangene Video, dann die nächste Einheit im Plan,
    sonst der nächste Schritt auf dem Weg. Was dort steht, steht nicht noch
    einmal in den Hinweisen.
  - Kinder bekommen auf der Startseite keine Werbung für ein Abo
    (`werbeplatz`).
  - Das Profil zeigt das Ich und die eigenen Sachen. Alles, was man einstellt
    statt benutzt, liegt hinter dem Zahnrad oben rechts
    (`sheetEinstellungen`).
  - Lange Seiten bekommen einen Umschalter oben (`teamWahl`), statt alles
    untereinander zu stapeln.
  - Was jemand entscheiden soll, steht auf der Seite als kurze Zeile. Die
    Karte mit Erklärung und den beiden Knöpfen kommt im Blatt dahinter
    (`sheetFreigabe`, `sheetEntscheid`).
  - Ein Erklärtext steht nur dort, wo jemand etwas entscheidet, und gibt dort
    ein Versprechen. Alles andere kommt hinter ein kleines i neben der
    Überschrift (`infoKnopf`).
- Zum ersten Start, zu Plänen, Selbstaufnahme, Camp und Fehlerzuständen:
  - Der erste Start fragt Rolle, Jahrgang und Trainingszeit
    (`erstSchritte(r)`), nur für Gäste und nur einmal (`km1-erster-start` im
    Speicher des Geräts). Oben stehen Spieler, Eltern und Trainer, die
    übrigen Rollen hinter „Etwas anderes“ (`rollenKnoepfe`), beim Anlegen
    des Kontos genauso. Ein Jahrgang ist nie vorausgewählt.
  - Die Trainingspläne stehen in `PLAENE`, die erste Woche ist mit Konto frei
    (`planWocheFrei(w)`). `CAMP` und `PLAENE` liest
    `supabase/werkzeug/startdaten.mjs` für Datenbank und Handy-App; nach einer
    Änderung dort das Werkzeug laufen lassen.
  - Die Selbstaufnahme verlässt das Gerät nie. Kein Upload, auch nicht später
    „nur zum Speichern“: Dafür gibt es die Videos der Spieler mit Freigabe.
  - Ein Camp bucht nur ein Erwachsener, bezahlt wird bei KM1, nicht über den
    App Store.
  - Kein Netz, ein Video, das nicht lädt, und das Anhalten beim Sperren
    fängt der Player selbst ab (`playerFehler`, `netzZeigen`).
- Die Handy-App in `mobile/` zieht jede Änderung hier nach, im selben Stil.
  Was sie noch nicht hat, steht in `mobile/README.md`.
- Jede Rolle hat ihr eigenes Menü, festgelegt in `tabsFuer()`: Spieler
  Start, Üben, Team, Profil; Gäste ohne Team; Eltern Start, Familie, Üben,
  Profil. Wer ein Video sieht, steht allein in `darfSehen(u)`.
- Wer wem schreiben darf, steht allein in `schreibRecht(von, an)`. Neue
  Regeln kommen dorthin und in das Blatt „Wer wem schreiben darf"
  (`sheetRegeln`), sonst nirgends.
- Die Namen sind erfunden und gehören zu einer Geschichte: Luis (U13), seine
  Mutter Sandra, Anja als Mutter seines Mitspielers Finn, Trainer Tim
  Hoffmann, die Akademie Rheinblick, Scout Marco Berger, der FC Rheinstadt
  mit seinem Torwart Niklas Hartwig und Kader für KM1. Echte Profis und
  Vereine kommen nur mit ihrer Zustimmung hinein, nie als ausgedachtes
  Profil unter echtem Namen.

Vorschau auf claude.ai: `python3 artefakt.py`, veröffentlicht als Artefakt
„KM1 Training“ mit den Dateien aus `app/fonts/` und `app/img/`.

## Die Studien in `original/`, `apple/` und `mischung/`

Frühere Fassungen, zum Vergleichen. Sie bekommen keine neuen Funktionen, und
keine hat einen Service Worker: So kommen sie sich nicht mit dem Speicher der
App in die Quere, und `VERSION` in `app/sw.js` bleibt unberührt.

- `original/` ist der erste Entwurf, bis September 2026 die App: Anton, Chivo
  und JetBrains Mono wie auf der Website.
- `apple/` ist dieselbe App im Stil von Apple: Systemschrift, große
  Überschriften, blaue Knöpfe, Tableiste aus Glas.
- `mischung/` nimmt achtzig Teile aus `apple/` und zwanzig aus dem ersten
  Entwurf. Aus ihr ist die App entstanden.
- `mischung2/` enthält nur noch eine Weiterleitung auf die App, für alte Links
  und Symbole auf dem Startbildschirm.

Vorschau auf claude.ai: `python3 artefakt.py original`, `apple` oder
`mischung`.

## Sprache

Code-Kommentare, Commits, Pull Requests und die Dokumentation sind auf
Deutsch, in ganzen Sätzen, ohne Abkürzungen und ohne Füllwörter. Umlaute in
Commit-Nachrichten werden umschrieben (ae, oe, ue), im übrigen Text nicht.

## Wo was liegt

| Datei | Inhalt |
| --- | --- |
| `app/index.html` | Die ganze App: Aufbau, Gestaltung, Verhalten in einem Dokument |
| `app/sw.js` | Service Worker, `VERSION` bei jeder Änderung erhöhen |
| `original/index.html` | Der erste Entwurf, als Studie unter `…/km1-app/original/` |
| `apple/index.html` | Designstudie im Stil von Apple, liegt unter `…/km1-app/apple/` |
| `mischung/index.html` | Die Mischung aus Apple-Stil und KM1-Charakter, liegt unter `…/km1-app/mischung/` |
| `mischung2/index.html` | Nur eine Weiterleitung auf die App |
| `praesentation/` | Die App als Präsentation in 22 Folien, liegt unter `…/km1-app/praesentation/`; gebaut aus `praesentation-quelle/` mit `python3 bauen.py` |
| `artefakt.py` | Macht aus `app/index.html` die Fassung für die Vorschau auf claude.ai, mit `original`, `apple` oder `mischung` aus den Studien |
| `KONZEPT.md` | Architektur, Datenmodell, Abo, Designsystem, Weg ins App Store |
| `WEG_ZUR_ZEHN.md` | Was zwischen dem heutigen Stand und einem fertigen Produkt liegt |
| `mobile/` | Die echte App für iPhone und Android (Expo), siehe `mobile/README.md` |
| `supabase/` | Datenbank, Regeln, Startdaten und ihr Test, siehe `supabase/README.md` |
| `STORE.md`, `store/` | Texte, Angaben und Bildentwürfe für App Store und Google Play |
