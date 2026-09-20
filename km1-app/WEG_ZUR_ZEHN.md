# Der Weg zur Zehn

Eine ehrliche Bestandsaufnahme der KM1-Training-App und was zwischen dem
heutigen Stand und einem fertigen Produkt liegt. Sortiert danach, was eine
Zehn wirklich blockiert — nicht danach, was am schnellsten gebaut ist.

**Stand:** September 2026. Die App ist als Prototyp vollständig bedienbar und
liegt installierbar unter <https://canuzu.github.io/Test-Code/km1-app/>. Alles
dahinter — Konten, Videos, Zahlungen — ist Attrappe.

Was in Klammern steht, ist meine grobe Schätzung des Aufwands. *KONZEPT §12*
heißt: steht dort schon als Vorschlag, hier nur eingeordnet.

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
App von neun auf zehn hebt, dann dieser. (3–5 Tage)

### 2.3 Trainingspläne statt Videosammlung *(KONZEPT §12)*

Sechs Wochen, drei Einheiten pro Woche, als Liste zum Abhaken.

Das ist das stärkste Abo-Argument, das es gibt — stärker als „mehr Videos". Ein
Plan hat einen Anfang und ein Ende, eine Videosammlung hat das nicht. Wer in
Woche vier ist, kündigt nicht. (2–3 Tage in der App, plus die inhaltliche
Arbeit)

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
- **Ein Begrüßungsablauf.** Drei Fragen beim ersten Start: wie alt, welche
  Position, wie oft in der Woche. Danach ist die Startseite passend gefüllt
  statt für alle gleich. Ohne Konto, rein auf dem Gerät. *(KONZEPT §12)*
- **Haptik.** ~~Kurzes Vibrieren beim Abhaken, beim Sprung im Video, beim
  Ebenenaufstieg.~~ **Erledigt** — acht Muster, siehe KONZEPT §11. Im Web nur
  auf Android zu spüren; auf dem iPhone erst in der echten App, dort dafür
  besser als auf jedem Android-Gerät.

---

## 4. Das Handwerk, an dem man eine Zehn erkennt

Diese Punkte sieht niemand auf einem Werbebild. Sie sind trotzdem der
Unterschied zwischen einer Sieben und einer Zehn, weil sie in genau den
Momenten auftreten, in denen jemand entscheidet, ob eine App gut ist.

- **Ladezustände.** Was steht da, während das Video lädt? Heute: nichts.
- **Kein Netz.** Die App muss sagen, dass es am Netz liegt, nicht einfach leer
  bleiben.
- **Video lässt sich nicht laden.** Passiert, wenn ein signierter Link
  abgelaufen ist. Braucht eine Meldung und einen Knopf zum Erneutversuchen.
- **Leere Suche, leere Merkliste, leere Startseite beim ersten Start.** Drei
  Zustände, die jeder Nutzer mindestens einmal sieht.
- **Barrierefreiheit.** Die große Systemschrift respektieren, Beschriftungen
  für den Screenreader, „Bewegung reduzieren" beachten. Apple prüft das
  inzwischen mit.
- **Was passiert bei Anruf oder Sperrbildschirm?** Das Video muss anhalten und
  an derselben Stelle weiterlaufen.

Zusammen ungefähr eine Woche. Es ist die am wenigsten dankbare Woche der
ganzen Entwicklung und die, die man am deutlichsten merkt.

---

## 5. Geschäftlich

### 5.1 Vereine statt Eltern

Ein Verein mit 200 Jugendspielern zahlt lieber einmal 500 € im Jahr als 200
Eltern einzeln 6,99 € im Monat. Andere Vertriebsarbeit, aber deutlich weniger
Marketingdruck — und du kennst die Vereine in Köln bereits.

**Das ist möglicherweise das eigentliche Geschäft.** Technisch braucht es dafür
Sammellizenzen: ein Code, den der Verein verteilt. (3–4 Tage)

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

---

## 6. Was ich bewusst weglassen würde

- **Keine Abzeichen, Sterne oder Münzen.** Die Pyramide und die Serie reichen.
  KM1 ist eine Fußballschule, kein Spiel. *(KONZEPT §12 hält sich schon daran)*
- **Kein Chat, keine Kommentare, keine Community.** Sobald Kinder miteinander
  schreiben können, bist du im Jugendmedienschutz, brauchst Moderation und
  haftest für das, was dort steht. Das will man nicht nebenbei.
- **Keine Bewertungen für Videos.** Bei zwanzig Videos sagt ein
  Sternedurchschnitt nichts aus und sieht leer aus.
- **Kein Trainingstagebuch mit Freitext.** Klingt gut, wird nach drei Tagen
  nicht mehr benutzt, und die leeren Seiten lassen die App tot wirken.

---

## 7. Reihenfolge, wenn ich entscheiden müsste

1. **Acht Videos drehen und schneiden.** Alles andere wartet darauf. Solange es
   keine Videos gibt, ist jede weitere Funktion Spekulation.
2. **Supabase, Konten, Abo.** Läuft parallel zum Dreh und ist reine
   Entwicklungsarbeit.
3. **Rechtstexte und Einwilligungen.** Ebenfalls parallel, dauert länger als
   man denkt, und blockiert am Ende den Store-Antrag.
4. **Kapitelmarken, „Weiterschauen", die Zustände aus Abschnitt 4.** Der
   Feinschliff, der aus einer Sieben eine Neun macht.
5. **Selbstaufnahme mit Vergleich.** Das ist die Zehn.

---

## 8. Wer macht was

| Deins | Meins |
| --- | --- |
| Drehen und schneiden | Die App und alles dahinter |
| Profis ansprechen, Zusagen einholen | Supabase, Abo, Store-Vorbereitung |
| Rechtstexte beauftragen | Die Texte einbauen und prüfen, dass nichts fehlt |
| Einwilligungen einsammeln | Das Datenmodell so bauen, dass Widerruf funktioniert |
| Entscheiden, was in die Zehn gehört | Ehrlich sagen, was es kostet |

---

## Der ehrlichste Satz

Die App ist auf einem sehr guten Stand für etwas, das es noch nicht gibt. Die
nächsten Wochen entscheiden sich nicht am Code, sondern an Kamera,
Unterschriften und Zusagen. Wenn die acht Videos stehen, ist der Rest Arbeit,
die man planen kann.
