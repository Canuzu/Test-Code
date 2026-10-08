# Der Weg zur Zehn

Eine ehrliche Bestandsaufnahme der KM1-Training-App und was zwischen dem
heutigen Stand und einem fertigen Produkt liegt. Sortiert danach, was eine
Zehn wirklich blockiert — nicht danach, was am schnellsten gebaut ist.

**Stand:** 28. September 2026. Die App ist vollständig bedienbar und liegt
installierbar unter <https://canuzu.github.io/Test-Code/km1-app/>. Die echte App
für iPhone und Android (`mobile/`) hat denselben Stand bei allem, was ein Kind
und seine Eltern brauchen. Der Server (`supabase/`) ist geschrieben und
getestet, aber noch nicht eingespielt. Es fehlen die Videos, die Store-Konten
und die Rechtstexte.

### Auf einen Blick

| Erledigt | Offen |
| --- | --- |
| Kapitel im Video, Weiterschauen, Zeitlupe | Die Videos selbst (1.1) |
| Selbstaufnahme mit Vergleich (2.2) | Echte Käufe über RevenueCat, „Mit Apple anmelden" (1.2) |
| Trainingspläne (2.3) | Server einspielen, Zahlungsanbieter für Camps (1.2) |
| Drei Fragen beim ersten Start (3) | Rechtstexte, auch für Camp und Gemeinschaft (1.3) |
| Kein Netz, Video lädt nicht, Anruf und Sperre (4) | Moderation und Prüfung organisieren (6) |
| Camp in der App buchen (5.6) | Teams, Uploads, Chats und Scouting in der Handy-App (1.2) |
| Rollen, Teams, Laufbahn, Folgen und Nachrichten mit Regeln, auf dem Server durchgesetzt (6) | Suche nach Problem (2.5), „Wer ist Kader?" (2.6) |

In der Tabelle nennen die Zahlen in Klammern den Abschnitt. Im Text steht in
Klammern meine grobe Schätzung des Aufwands. *KONZEPT §12* heißt: steht dort
schon als Vorschlag, hier nur eingeordnet.

---

## 1. Die harten Blocker

Ohne diese vier Punkte gibt es keine Zehn, egal wie gut alles andere wird.

### 1.1 Es gibt keine Videos

Das ist mit Abstand der größte Punkt. Eine Lern-App ohne Inhalt ist eine leere
Hülle, egal wie gut der Player ist.

Zwanzig Videos klingt nach wenig. Bei fünf bis acht Minuten Länge, mehreren
Kameraeinstellungen und sauberem Schnitt sind das realistisch **40 bis 60
Stunden Arbeit** — plus Drehtage, die vom Wetter abhängen.

**Mein Rat: acht richtig gute statt zwanzig mittelmäßige.** Lieber eine
Kategorie vollständig — zum Beispiel Ballannahme mit vier Videos, die
aufeinander aufbauen — als vier Kategorien angerissen. Eine vollständige
Kategorie ist ein Produkt, vier angerissene sind eine Baustelle.

Für jedes Video braucht es:

- eine Fassung in Normalgeschwindigkeit und eine in Zeitlupe
- mindestens zwei Einstellungen (Totale für die Bewegung, nah für den Fuß)
- ein Standbild, das als Vorschau taugt
- die vier Schritte als Text, mit Sekundenangabe für die Kapitelmarken

### 1.2 Hinter der App liegt noch nichts

Aktuell ist alles Attrappe: keine Konten, keine Datenbank, keine Zahlungen,
kein Upload. Das ist die zweite Hälfte der Arbeit und ungefähr so groß wie die
erste.

| Was | Warum | Aufwand |
| --- | --- | --- |
| Supabase aufsetzen, Tabellen, RLS-Regeln | Die drei Zugangsstufen müssen auf dem Server durchgesetzt werden, nicht in der App | 2–3 Tage |
| Videos in privaten Buckets, signierte Links | Sonst liegt jedes Profi-Video offen im Netz | 1–2 Tage |
| Konten, Anmeldung, Kontolöschung | Apple-Pflicht, siehe 1.4 | 2–3 Tage |
| RevenueCat und Apple-Abo | Zahlungen laufen zwingend über Apple | 3–4 Tage |
| Expo-App aus dem Prototyp | Der Prototyp ist Web, der Store braucht eine echte App | 1–2 Wochen |

Dazu ein Apple-Entwicklerkonto (99 € im Jahr) und, falls Android gleichzeitig
kommt, ein Google-Play-Konto (einmalig 25 $).

**Stand 23. September:** Gebaut ist die Expo-App (`mobile/`) und der Server
(`supabase/`): Konten mit Elternfreigabe unter 16, Fortschritt, Merkliste,
Konto löschen, geschützte Videolinks, Erinnerungen als Mitteilung, der
Player mit Kapiteln und Zeitlupe.

**Stand 28. September:** Der Server kennt jetzt alles, was die App zeigt:
acht Rollen, Familie, Prüfung und Haken, Einladungen, Teams mit
Hausaufgaben, Uploads mit Freigabe der Eltern, Feedback, Folgen,
Beiträge, Nachrichten nach denselben Regeln wie in der App, Laufbahn,
Talentprofile und Scouting, Meldungen, Trainingspläne und Campbuchungen.
36 Tests prüfen die Regeln gegen eine echte Datenbank. Die Handy-App hat
dazu Startseite, Profil, Einstellungen, Pläne, den ersten Start, die
Selbstaufnahme, die Campbuchung und die Fehlerzustände bekommen.

Offen:

- Die Datenbank einspielen (`supabase/README.md`, Schritt 2).
- Die Teile, die an den Store-Konten hängen: echte Käufe über RevenueCat
  und „Mit Apple anmelden".
- Ein Zahlungsanbieter für die Camps (etwa Stripe oder Mollie). Die
  Buchung steht bis dahin auf „reserviert"; „bezahlt" setzt später nur
  dessen Rückmeldung.
- In der Handy-App die Bereiche für Trainer, Akademien, Vereine, Profis
  und Scouts: Teams, Uploads, Chats, Laufbahn und Scouting. Der Server
  dafür steht, die Bildschirme gibt es bisher nur in der App im Browser.
  Das ist die größte Baustelle der Handy-App (2–3 Wochen).

### 1.3 Rechtliches

Daran scheitert die Store-Freigabe zuerst, und daran kann man nachträglich
nichts reparieren.

- **Impressum, Datenschutzerklärung, AGB, Widerrufsbelehrung.** Bei einem Abo
  ist die Widerrufsbelehrung Pflicht, nicht Kür.
- **Einverständniserklärungen der Profis** — schriftlich, mit ausdrücklicher
  Erlaubnis zur kommerziellen Nutzung in einem Bezahlprodukt. Die erste Frage
  an jeden Gast ist nicht „machst du mit", sondern „darf das in einem
  Bezahlprodukt laufen".
- **Kinder im Bild.** Wenn Kinder aus den Camps zu sehen sind: Einwilligung
  der Eltern, jede einzeln, schriftlich, widerrufbar. Dazu ein eigenes Kapitel
  in der Datenschutzerklärung.
- **Namen von Kindern in der App** (Bestenlisten, Camp-Seiten) brauchen
  dieselbe Einwilligung. Im Zweifel: Vorname und erster Buchstabe des
  Nachnamens.

- **Camps.** Teilnahmebedingungen mit Storno, Haftung und Aufsicht, dazu der
  Vertrag mit dem Zahlungsanbieter. Ob bei einem Camp mit festem Termin ein
  Widerrufsrecht gilt, gehört ausdrücklich in die Prüfung durch den Anwalt.
  Über das Konto eines Kindes unter 16 bucht in der Handy-App ein Elternteil,
  weil das Konto auf dessen E-Mail läuft; die Buchung bestätigt ausdrücklich,
  dass ein Erziehungsberechtigter bucht.
- **Die Gemeinschaft.** Nutzungsbedingungen mit Verhaltensregeln, ein Meldeweg
  und eine Begründung, wenn KM1 etwas sperrt (das verlangt der Digital
  Services Act), dazu die Prüfung mit Führungszeugnis. Siehe Abschnitt 6.

Das dauert länger, als man denkt, und läuft parallel zu allem anderen. Anfangen
lohnt sich jetzt.

### 1.4 Apple-Pflichten, die viele übersehen

- **Kontolöschung in der App.** Wer ein Konto anlegen kann, muss es in der App
  auch wieder löschen können — nicht per E-Mail, nicht auf der Website. Apple
  lehnt ohne das ab, ausnahmslos.
- **Kids Category.** Für eine App für U6 bis U13 ist die Einstufung eine
  bewusste Entscheidung. In der Kinderkategorie gelten härtere Regeln: kein
  Tracking, keine Werbung von Dritten, externe Links nur hinter einer
  Elternschranke. Das betrifft auch den Link zur Camp-Anmeldung.
- **Abo-Regeln.** Preis, Laufzeit, Verlängerung und Kündigung müssen *vor* dem
  Kauf sichtbar sein, mit Links zu AGB und Datenschutz auf derselben Seite.
- **„Mit Apple anmelden".** Sobald eine andere Anmeldung über Dritte angeboten
  wird (Google, Facebook), muss Apple als gleichwertige Möglichkeit daneben
  stehen. Wer nur E-Mail anbietet, ist fein raus.

---

## 2. Inhaltlich: von „nett" zu „unverzichtbar"

### 2.1 Kapitelmarken im Video *(KONZEPT §12)*

Die vier Schritte unter dem Video springen an die passende Stelle. Aus einem
Video werden vier nachschlagbare Antworten. Zusammen mit der Zeitlupe und den
Fünf-Sekunden-Sprüngen ist das der komplette Werkzeugkasten zum Üben.

**Erledigt.** Jeder Schritt trägt seine Zeit und springt beim Antippen dorthin;
der Schritt, bei dem der Player gerade steht, ist hervorgehoben. Bis die Videos
geschnitten sind, verteilt die App die Schritte gleichmäßig über die Laufzeit —
beim Hochladen trägt Kader die echte Sekunde ein.

### 2.2 Selbstaufnahme mit Vergleich — nur auf dem Gerät

Das Kind filmt sich mit der Handykamera, und die App zeigt das eigene Video
neben dem Coach-Video, beide mit Zeitlupe, beide scrubbar.

**Nichts wird hochgeladen, nichts verlässt das Handy.** Damit ist das
Datenschutzproblem weg, bevor es entsteht — keine Einwilligung, keine
Moderation, keine Haftung. Technisch ist es eine lokale Datei in einem zweiten
Player.

Das ist der Unterschied zwischen „Video geguckt" und „besser geworden". Keine
deutsche Fußball-App macht das ordentlich. Wenn ein Punkt aus dieser Liste die
App von neun auf zehn hebt, dann dieser.

**Erledigt**, im Browser und in der Handy-App: filmen oder ein Video wählen,
dann steht man direkt unter Kader, mit Zeitlupe in drei Stufen, Bild für Bild
und einem Regler. Kaders Seite kann bei jedem Schritt der Übung anfangen. Im
Browser zeigt sie bis zum Dreh das Standbild, in der Handy-App läuft Kaders
Video im selben Takt mit.

### 2.3 Trainingspläne statt Videosammlung *(KONZEPT §12)*

Sechs Wochen, drei Einheiten pro Woche, als Liste zum Abhaken.

Das ist das stärkste Abo-Argument, das es gibt — stärker als „mehr Videos". Ein
Plan hat einen Anfang und ein Ende, eine Videosammlung hat das nicht. Wer in
Woche vier ist, kündigt nicht.

**Erledigt:** drei Pläne (Grundlagen, Dribbling, Flanke und Abschluss), die
erste Woche mit Konto frei, die übrigen fünf mit Pro. Wer einen Plan hat,
sieht dessen nächste Einheit oben auf der Startseite. **Offen ist der Inhalt:**
Die Pläne sind aus den vorhandenen Videos zusammengestellt. Kader sollte jede
Aufgabe einmal lesen und ändern, was er auf dem Platz anders machen würde; sie
stehen in `PLAENE` in `app/index.html`.

### 2.4 „Weiterschauen" — **erledigt**

Die Karte oben auf der Startseite zeigt das angefangene Video mit Restzeit und
Fortschritt; beim Öffnen steigt der Player an derselben Stelle wieder ein. Ist
nichts angefangen, schlägt sie das nächste offene Video der eigenen Ebene vor.

### 2.5 Suche nach Problem statt nach Kategorie *(KONZEPT §12)*

„Meine Flanken kommen nicht an" statt „Flanken". So denken Kinder, und so
suchen sie. Umsetzbar als Liste von zwanzig Problemsätzen, die auf Videos
zeigen — kein Suchalgorithmus nötig. (1 Tag)

### 2.6 Wer ist Kader?

Eltern zahlen, Kinder gucken. Es braucht eine Seite, die in dreißig Sekunden
erklärt, warum ausgerechnet dieser Trainer: Lizenzen, Jahre, Vereine, zwei
Sätze von Eltern, ein Foto, das nicht gestellt wirkt.

Der Elternbereich erklärt heute die Methodik. Er erklärt noch nicht das
Vertrauen. (1 Tag, plus deine Texte)

---

## 3. Gestaltung

- **Echte Standbilder statt Kreidezeichnungen.** Die Zeichnungen sind ein guter
  Platzhalter und funktionieren in hell wie dunkel, aber ein echtes Standbild
  aus dem Video verkauft besser. Vorschlag: Standbild als Vorschau, Zeichnung
  als Erklärbild *im* Video. *(KONZEPT §12)*
- **Hochformat mitdenken.** Kinder gucken 9:16. Mindestens die Challenge und
  kurze Technikclips sollten hochkant sein. 16:9 auf dem Handy wirkt wie „von
  Erwachsenen für Erwachsene" — und genau das ist die Zielgruppe nicht.
- **Ein Begrüßungsablauf.** ~~Drei Fragen beim ersten Start.~~ **Erledigt**,
  mit anderen Fragen als ursprünglich gedacht: wer man ist (Spieler, Eltern,
  Trainer und die übrigen Rollen), welcher Jahrgang und wann trainiert wird.
  Der Jahrgang wählt die Ebene, die Zeit wird zur Erinnerung, die Rolle steht
  beim Anlegen des Kontos schon da. Alles lässt sich überspringen und bleibt
  auf dem Gerät. Die Position haben wir weggelassen: Mit acht Videos würde sie
  nichts an der Startseite ändern.
- **Haptik.** ~~Kurzes Vibrieren beim Abhaken, beim Sprung im Video, beim
  Ebenenaufstieg.~~ **Erledigt** — acht Muster, siehe KONZEPT §11. Im Web nur
  auf Android zu spüren; auf dem iPhone erst in der echten App, dort dafür
  besser als auf jedem Android-Gerät.

---

## 4. Das Handwerk, an dem man eine Zehn erkennt

Diese Punkte sieht niemand auf einem Werbebild. Sie sind trotzdem der
Unterschied zwischen einer Sieben und einer Zehn, weil sie in genau den
Momenten auftreten, in denen jemand entscheidet, ob eine App gut ist.

- **Ladezustände.** **Erledigt:** Die Videothek zeigt beim Laden Platzhalter,
  und in der Handy-App dreht sich der Player, bis das Video da ist.
- **Kein Netz.** **Erledigt:** Unten steht eine ruhige Leiste, der Player sagt,
  dass es am Netz liegt, und lädt von allein, sobald das Netz zurück ist.
- **Video lässt sich nicht laden.** **Erledigt:** eine Meldung und ein Knopf
  zum Erneutversuchen, der auch einen neuen Abspiellink holt.
- **Leere Suche, leere Merkliste, leere Startseite beim ersten Start.**
  **Erledigt;** der erste Start fragt jetzt drei Dinge, statt leer zu beginnen.
- **Barrierefreiheit.** Beschriftungen für den Screenreader stehen an allen
  Knöpfen. **Offen:** ein Durchgang mit VoiceOver und TalkBack auf echten
  Geräten und mit der größten Systemschrift.
- **Was passiert bei Anruf oder Sperrbildschirm?** **Erledigt:** Das Video hält
  an, merkt sich die Stelle und sagt beim Zurückkommen, wo es steht. In der
  Handy-App läuft es im Bild im Bild weiter, dafür ist es da.

Was davon auf echten Geräten hält, zeigt erst der Test mit TestFlight und der
internen Testspur von Google Play.

---

## 5. Geschäftlich

### 5.1 Vereine statt Eltern

Ein Verein mit 200 Jugendspielern zahlt lieber einmal 500 € im Jahr als 200
Eltern einzeln 6,99 € im Monat. Andere Vertriebsarbeit, aber deutlich weniger
Marketingdruck — und du kennst die Vereine in Köln bereits.

**Das ist möglicherweise das eigentliche Geschäft.** Technisch braucht es dafür
Sammellizenzen: ein Code, den der Verein verteilt.

**Stand:** KM1 Team ist angelegt. Das Abo eines Trainers oder einer Akademie
gilt für die ganze Mannschaft, auf dem Server über `hat_abo()`. Offen ist der
Kauf selbst: Ein Vereinsabo läuft nicht über den App Store, sondern per
Rechnung, und braucht dafür eine eigene Seite außerhalb der App.

### 5.2 Probezeit statt Bezahlschranke

Sieben Tage kostenlos, dann automatisch weiter. Konvertiert bei Abos deutlich
besser als „jetzt kaufen", und Apple unterstützt es eingebaut.

### 5.3 Familienfreigabe

Zwei Geschwister, ein Abo. Verhindert Frust und geteilte Passwörter.

### 5.4 Das Monatsversprechen vorsichtiger formulieren

„Jeden Monat ein neuer Profi" ist ein Vertrag, kein Marketingsatz. Wenn ein
Monat ausfällt, kündigen Leute — und zwar zu Recht.

Besser: „regelmäßig neue Gäste" — und dann öfter liefern als versprochen. Die
Antwort auf „was passiert, wenn ein Monat ausfällt" gehört in den Abo-Text,
bevor der erste Kunde sie stellt.

### 5.5 Der Preis

6,99 € im Monat ist gesetzt, aber nach oben später schwer zu korrigieren:
bestehende Abos müssen einer Erhöhung aktiv zustimmen, sonst laufen sie zum
alten Preis weiter. Lieber einmal richtig ansetzen. Ein Jahresabo mit zwei
Freimonaten ist der übliche Weg, den Durchschnittsumsatz pro Kunde zu heben.

### 5.6 Camps in der App buchen — **erledigt**

Das Camp lässt sich direkt in der App buchen: Kinder mit Jahrgang und
Hinweisen, Geschwisterrabatt, Notfallnummer, Fotos nur mit Zustimmung,
verbindlich mit Buchungsnummer. Bezahlt wird direkt bei KM1, nicht über den
App Store: Ein Camp ist eine Leistung auf dem Platz, dafür gilt die Abgabe an
Apple nicht. Kinder fragen ihre Eltern, statt selbst zu buchen. Die Plätze
zählt der Server unter einer Sperre, damit keiner doppelt vergeben wird.

Offen: der Zahlungsanbieter (1.2) und die Teilnahmebedingungen (1.3).

---

## 6. Was ich bewusst weglassen würde

- **Keine Abzeichen, Sterne oder Münzen.** Die Pyramide und die Serie reichen.
  KM1 ist eine Fußballschule, kein Spiel. *(KONZEPT §12 hält sich schon daran)*
- ~~**Kein Chat, keine Kommentare, keine Community.**~~ **Diese Entscheidung
  hat sich geändert.** Mit Teams, Trainern, Profis und Scouts ist KM1 mehr als
  eine Videothek geworden, und dafür braucht es Nachrichten und Beiträge. Drei
  Regeln gelten überall, in der App wie auf dem Server: Wer mit Kindern
  arbeitet oder sie sichtet, ist geprüft. Kein Video eines Kindes steht im
  offenen Netz, unter 16 geben die Eltern jedes frei. Kein Fremder schreibt
  einem Kind; Kinder unter 16 schreiben nur mit Trainer, Team und Eltern, und
  die Eltern lesen mit.

  Das bringt Pflichten mit sich, die man nicht nebenbei erledigt:

  - **Moderation.** Jemand bei KM1 liest jede Meldung, am besten am selben
    Tag, und entscheidet. Die App hat den Meldeknopf und die Liste für KM1;
    fehlt nur der Mensch dahinter, mit Vertretung im Urlaub.
  - **Prüfung.** Den Haken bekommt nur, wer ein erweitertes Führungszeugnis
    vorgelegt hat oder über einen geprüften Verein kommt. KM1 speichert, dass
    es vorlag und von wann, nicht das Dokument. Jemand muss die Belege
    ansehen, und zwar zügig, sonst warten Trainer tagelang.
  - **Recht.** Verhaltensregeln in den Nutzungsbedingungen, Begründung bei
    jeder Sperre, und prüfen lassen, welche Pflichten aus Jugendschutz und
    Digital Services Act für KM1 gelten.

  Bevor die Gemeinschaft für alle aufgeht, sollten diese drei Dinge stehen.
  Bis dahin kann sie mit einem Verein und seinen Teams im kleinen Kreis
  laufen.
- **Keine Bewertungen für Videos.** Bei zwanzig Videos sagt ein
  Sternedurchschnitt nichts aus und sieht leer aus.
- **Kein Trainingstagebuch mit Freitext.** Klingt gut, wird nach drei Tagen
  nicht mehr benutzt, und die leeren Seiten lassen die App tot wirken.

---

## 7. Reihenfolge, wenn ich entscheiden müsste

1. **Acht Videos drehen und schneiden.** Alles andere wartet darauf. Solange es
   keine Videos gibt, ist jede weitere Funktion Spekulation.
2. **Server einspielen, Store-Konten, RevenueCat.** Die Entwicklung dafür ist
   fertig bis auf die Teile, die an den Konten hängen.
3. **Rechtstexte und Einwilligungen**, jetzt auch für Camps und Gemeinschaft.
   Dauert länger als man denkt und blockiert am Ende den Store-Antrag.
4. **Moderation und Prüfung organisieren.** Wer liest Meldungen, wer prüft
   Führungszeugnisse, wer vertritt. Erst dann die Gemeinschaft öffnen.
5. **Die Rollenbereiche in der Handy-App.** Teams, Uploads, Chats, Laufbahn
   und Scouting, auf dem Server schon fertig.

Kapitelmarken, Weiterschauen, die Zustände aus Abschnitt 4, Trainingspläne und
die Selbstaufnahme sind erledigt. Das war der Feinschliff von der Sieben zur
Neun und der Punkt, der die Zehn ausmacht.

---

## 8. Wer macht was

| Deins | Meins |
| --- | --- |
| Drehen und schneiden | Die App und alles dahinter |
| Die Aufgaben in den Trainingsplänen prüfen | Sie einbauen, sobald sie stehen |
| Wer bei KM1 Meldungen liest und Belege prüft | Die Werkzeuge dafür in der App |
| Profis ansprechen, Zusagen einholen | Supabase, Abo, Store-Vorbereitung |
| Rechtstexte beauftragen | Die Texte einbauen und prüfen, dass nichts fehlt |
| Einwilligungen einsammeln | Das Datenmodell so bauen, dass Widerruf funktioniert |
| Entscheiden, was in die Zehn gehört | Ehrlich sagen, was es kostet |

---

## Der ehrlichste Satz

Die App ist auf einem sehr guten Stand für etwas, das es noch nicht gibt. Die
nächsten Wochen entscheiden sich nicht am Code, sondern an Kamera,
Unterschriften, Zusagen und daran, wer bei KM1 Meldungen liest. Wenn die acht
Videos stehen, ist der Rest Arbeit, die man planen kann.
