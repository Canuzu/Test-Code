# Der Auftritt in den Stores — Entwürfe

Texte, Angaben und Bilder für App Store und Google Play, fertig zum
Einfügen, sobald die Konten stehen. Alle Längen sind nachgezählt. Was mit
„Entscheidung" markiert ist, braucht noch ein Ja von Can.

**Stand:** 23. September 2026.

---

## 1. Texte

| Feld | Grenze | Text | Länge |
| --- | --- | --- | --- |
| Name (beide) | 30 | KM1 Training | 12 |
| Untertitel (Apple) | 30 | Fußballtechnik zum Nachmachen | 29 |
| Kurzbeschreibung (Google) | 80 | Fußballtechnik Schritt für Schritt, von der KM1 Fußballschule aus Köln. | 71 |
| Werbetext (Apple) | 170 | Jede Übung in Schritten, mit Zeitlupe und dem häufigsten Fehler. Dazu Einheiten mit aktiven Profispielern. Von der KM1 Fußballschule aus Köln. | 142 |
| Stichwörter (Apple) | 100 | fußball,technik,dribbling,flanken,torwart,jugend,fußballschule,übungen,köln,verein,passen,kinder | 96 |

Der Name steht im Stichwortfeld nicht noch einmal: Apple durchsucht ihn
ohnehin.

### Beschreibung (beide Stores, bis 4000 Zeichen)

```
KM1 Training ist die App der KM1 Fußballschule aus Köln. Sie zeigt, wie Fußballtechnik geht: nicht als Trickvideo, sondern als Übung zum Nachmachen.

JEDE ÜBUNG IN SCHRITTEN
Jedes Video zerlegt eine Technik in drei bis vier Schritte. Ein Tipp auf einen Schritt springt an die passende Stelle im Video. Dazu die Zeitlupe und der Fehler, den fast jeder am Anfang macht.

VIER EBENEN, EINE RICHTUNG
Die KM1-Pyramide führt von den Grundlagen bis zum Profibereich. Jede Ebene hat einen Pfad aus fünf Einheiten. Wer ihn auf dem Platz geschafft und abgehakt hat, steigt auf.

SCHLAG DEN COACH
Jeden Monat eine Challenge mit Kaders Marke. Ansehen, üben, im nächsten Training zeigen.

KM1 PRO: DIE PROFIS AUS DER NÄHE
Einheiten mit aktiven Profispielern: der Freistoß über die Mauer, die Flanke unter Druck, der erste Kontakt im Strafraum. Sieben Tage gratis, danach 6,99 € im Monat oder 59,00 € im Jahr.

FÜR ELTERN
- Ohne Anmeldung sofort nutzbar, ohne E-Mail.
- Für Kinder unter 16 Jahren legen die Eltern das Konto an.
- Kein Tracking, keine Werbung, kein Video, das von allein weiterläuft.
- Das Konto lässt sich jederzeit in der App löschen.

Das Abo verlängert sich automatisch, wenn es nicht spätestens 24 Stunden vor Ablauf gekündigt wird. Kündigen geht jederzeit in den Einstellungen des App Store oder bei Google Play.
```

## 2. Einordnung

| Angabe | Vorschlag |
| --- | --- |
| Kategorie | Sport, als zweite Kategorie Bildung (nur Apple) |
| Altersfreigabe Apple | 4+ über den Fragebogen: keine Gewalt, keine Glücksspiele, kein offenes Internet, keine Inhalte von Nutzern |
| Kinderkategorie Apple | **Nicht wählen** (KONZEPT §10). Sie verbietet Links nach außen und verlangt eine Elternschranke vor jedem Kauf. |
| Einstufung Google (IARC) | USK 0, über denselben Fragebogen |
| Zielgruppe Google | **Entscheidung.** Die App richtet sich auch an Kinder unter 13. Wer diese Altersgruppen ankreuzt, fällt unter die Familienrichtlinie von Google: keine Werbe-Dienste, nur zertifizierte Fremddienste, Datenschutzerklärung Pflicht. Die App erfüllt das heute, weil sie keine Fremddienste außer Supabase einbindet. |
| Länder | Zum Start Deutschland, Österreich, Schweiz |
| Preise | Abo „KM1 Pro" monatlich 6,99 €, jährlich 59,00 €, je 7 Tage gratis |

## 3. Datenschutz-Angaben

Die Angaben müssen genau zu dem passen, was die App tut. Heute:

| Daten | Wozu | Mit der Person verknüpft | Tracking |
| --- | --- | --- | --- |
| E-Mail-Adresse | Konto | ja | nein |
| Vorname | Anzeige in der App | ja | nein |
| Jahrgang | Altersgrenze, Einwilligung der Eltern | ja | nein |
| Abgehakte Übungen, Merkliste | Fortschritt | ja | nein |
| Käufe | Abo (über Apple und Google) | ja | nein |

- **Apple (App Privacy):** „Daten, die mit dir verknüpft sind": Kontaktdaten
  (E-Mail, Name), Kaufhistorie, Nutzungsdaten (Produktinteraktion), Sonstige
  Daten (Jahrgang). Zweck jeweils „App-Funktionalität". Kein Tracking.
- **Google (Datensicherheit):** dieselben Daten, „verschlüsselt übertragen:
  ja", „Löschung möglich: ja, in der App".
- Keine Absturzberichte, keine Analyse: beides gibt es in der App noch nicht.
  Kommt es dazu, müssen diese Angaben mit.

## 4. Hinweise für die Prüfer

In App Store Connect und in der Play Console gibt es ein Feld für Notizen an
die Prüfer. Es wird auf Englisch gelesen.

```
KM1 Training is the learning app of KM1, a youth football school in Cologne, Germany.

Demo account (adult, with an active KM1 Pro subscription, so every screen is visible):
  E-mail: pruefung@km1-training.de
  Password: [set before submission]

- Free videos play without an account. Videos marked "Konto" need a free account; "Profi" videos need the KM1 Pro subscription.
- Children under 16 cannot create an account themselves. The app asks for the birth year first; below 16 a parent enters their own e-mail address and gives explicit consent, and the account is activated by the confirmation e-mail sent to the parent.
- Account deletion: Profil → "Konto löschen" (also in Datenschutz and Für Eltern). It deletes the account and all data immediately.
- Subscription terms, auto-renewal notice, Terms of Use and Privacy Policy links are shown on the KM1 Pro screen before purchase.
- No ads, no tracking, no user-generated content.
```

Das Demokonto legt `supabase/README.md` an („Das Konto für die Prüfer").

## 5. Bilder

| Was | Apple | Google |
| --- | --- | --- |
| Screenshots | iPhone 6,9", 1290 × 2796, mindestens 3 | Telefon, 1080 × 1920, mindestens 2 |
| iPad | nicht nötig, die App läuft nur auf dem iPhone (`supportsTablet: false`) | — |
| Grafik oben | — | 1024 × 500, Pflicht |
| Vorschauvideo | optional, 15 bis 30 Sekunden | optional, über YouTube |

Erste Entwürfe liegen in `store/`. Sie sind aus der App aufgenommen und
zeigen noch Kreidezeichnungen und das Testvideo. **Vor dem Einreichen neu
aufnehmen**, sobald die echten Videos und Standbilder da sind: Beide Stores
lehnen Screenshots ab, die etwas anderes zeigen als die App.
