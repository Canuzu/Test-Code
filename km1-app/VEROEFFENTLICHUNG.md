# Der Weg in die Stores

Was zwischen dem heutigen Stand und einer veröffentlichten App liegt, in der
Reihenfolge, in der es angefasst werden muss. Ergänzt `WEG_ZUR_ZEHN.md`: dort
steht, **was** fehlt, hier steht, **wie** es in den Store kommt.

**Stand:** 20. September 2026.

---

## Entschieden

| Frage | Entscheidung |
| --- | --- |
| Entwicklerkonto | **Als Firma**, mit D-U-N-S-Nummer |
| Was als Nächstes gebaut wird | **Inhaltsfunktionen im Prototyp** |
| Start | **Erst still an die Camp-Familien**, danach öffentlich |
| Plattformen | **iOS und Android gleichzeitig** |

Die Entscheidung für die Firmenanmeldung und die für beide Plattformen passen
gut zusammen: **Google verlangt für Firmenkonten dieselbe D-U-N-S-Nummer wie
Apple.** Einmal beantragen, zweimal benutzen.

---

## 1. Was sofort anfangen muss

Diese vier Dinge haben Vorlaufzeiten von Wochen und hängen an anderen Menschen.
Wer sie zu spät anfängt, hat am Ende eine fertige App, die herumsteht.

### 1.1 D-U-N-S-Nummer

Die neunstellige Nummer weist dein Unternehmen aus. Beantragung bis zu fünf
Werktage, dann bis zu zwei weitere Tage, bis Apple sie von Dun & Bradstreet
bekommt, dann bis zu fünf Tage Kontoprüfung. **Realistisch zwei bis drei
Wochen**, bevor überhaupt etwas hochgeladen werden kann.

Apple akzeptiert für Organisationskonten eine eingetragene Rechtsform.
Ist KM1 ein Einzelunternehmen, kann die Anmeldung als Organisation abgelehnt
werden — dann bleibt nur das Einzelpersonenkonto, mit den Folgen aus 1.2.

Kosten: Apple 99 € im Jahr, Google einmalig 25 $.

### 1.2 Händlerstatus nach dem Digital Services Act

Seit Februar 2025 verlangt die EU einen verifizierten Händlerstatus. Ohne ihn
wird die App **in allen 27 EU-Ländern entfernt** — automatisch, auch wenn sie
schon live war.

**Wichtig zu wissen:** Apple zeigt Name, Anschrift, Telefonnummer und
E-Mail-Adresse des Händlers **öffentlich auf der Produktseite im Store**. Bei
einer Anmeldung als Privatperson steht dort die Privatanschrift. Das ist der
eigentliche Grund für die Firmenanmeldung, unabhängig vom Aufwand.

### 1.3 Der Vertrag für kostenpflichtige Apps

Ohne ihn lässt sich kein Abo verkaufen: Steuerdaten, Bankverbindung,
Steuerformulare. Kann sich ziehen und blockiert am Ende alles andere.

Gute Nachricht: Apple und Google sind gegenüber dem Kunden die Verkäufer und
führen die Mehrwertsteuer ab. Das muss nicht selbst gebaut werden.

### 1.4 Rechtstexte und Einwilligungen

Siehe `WEG_ZUR_ZEHN.md` §1.3. Gehört in dieselbe Startwoche, weil beides von
anderen Menschen abhängt: von einem Anwalt und von den Profis.

---

## 2. Die Reihenfolge bis zur Freigabe

1. Entwicklerkonten bei Apple und Google, D-U-N-S, Händlerstatus
2. App-ID, Zertifikate, Einträge in App Store Connect und Play Console
3. **Interne Tests** — TestFlight beziehungsweise interner Test bei Google,
   sofort verfügbar, nur das eigene Team
4. **Externe Tests** — TestFlight für bis zu 10.000 Leute, braucht eine eigene
   kurze Beta-Prüfung. Hier kommen die Camp-Familien rein.
5. Abo-Produkte anlegen und **separat** einreichen
6. **Prüfung** — meist ein bis zwei Tage, eine Ablehnung kostet schnell eine
   Woche
7. Freigabe

---

## 3. Woran Apps in genau dieser Lage scheitern

- **Zu wenig Inhalt.** Eine Video-App mit fünf Videos wird als unfertig
  abgelehnt. Das ist der Grund, warum die acht Videos nicht nur ein
  Produktthema sind, sondern ein Freigabethema.
- **Kein Testzugang.** Liegt die Hälfte hinter der Anmeldung, muss dem Prüfer
  ein Demokonto hinterlegt werden. Ohne das: Ablehnung, ohne dass er die App je
  gesehen hat.
- **Keine Kontolöschung in der App.** Wer ein Konto anlegen kann, muss es auch
  in der App wieder löschen können.
- **Zahlungshinweise außerhalb der App.** Ein Satz wie „günstiger auf unserer
  Website" reicht für eine Ablehnung.
- **Leere Zustände.** Ein Prüfer öffnet die Merkliste als Erstes, und die ist
  bei ihm leer.
- **Datenschutzangaben, die nicht zur App passen.** Die Angaben im Store müssen
  exakt abbilden, was die App wirklich tut.
- **Screenshots, die etwas anderes zeigen als die App.**

---

## 4. Der Store-Auftritt ist Teil des Produkts

Sechs bis zehn Screenshots, ein Vorschauvideo von 15 bis 30 Sekunden, die
ersten drei Zeilen der Beschreibung. Das ist die Seite, auf der Eltern
entscheiden — und sie entscheiden in fünf Sekunden. Dafür braucht es dieselbe
Sorgfalt wie für die App selbst. Wird fast immer unterschätzt und am Abend vor
der Einreichung zusammengeschustert.

---

## 5. Messbarkeit

Zwei Zahlen entscheiden, ob die App funktioniert:

- Wie viele öffnen sie **ein zweites Mal**?
- Wie viele schauen ein **zweites Video**?

Ohne diese beiden verbessert man ins Blaue. In der Kinderkategorie geht das nur
anonym und aggregiert, ohne Wiedererkennung einzelner Geräte — das muss von
Anfang an richtig aufgesetzt werden, nachrüsten ist dort heikel.

---

## 6. Der stille Start

Nicht öffentlich starten. Die Camp-Familien sind 100 bis 300 Leute, die Kader
schon vertrauen: die perfekte Testgruppe und die erste zahlende Kundschaft.
Fehler findet man dort mit Menschen, die einem wohlgesonnen sind, statt mit
Ein-Stern-Bewertungen, die dauerhaft stehen bleiben.

Ablauf: TestFlight und geschlossener Test bei Google → Rückmeldungen einarbeiten
→ Preis prüfen → öffentlicher Start mit einem Produkt, das schon von echten
Leuten benutzt wurde.

---

## 7. Was Android zusätzlich kostet

Der Code kann beides, die Store-Arbeit fällt trotzdem zweimal an: eigener
Eintrag, eigene Screenshots in anderen Größen, eigenes Datensicherheitsformular,
eigene Abo-Produkte, eigene Prüfung. Dazu die Richtlinien für Apps für Kinder,
die bei Google anders heißen und anders geprüft werden.

Rechne mit **zwei bis drei Wochen zusätzlich** vor dem Start. Dafür wird
niemand ausgeschlossen — und in Jugendmannschaften sind viele Android-Handys
unterwegs.

---

## 8. Die Fassung für den PC

Die App läuft ab 1000 Pixel Breite in einem eigenen Layout (siehe KONZEPT §11).
Das ist nicht nur Bequemlichkeit, es hat drei handfeste Folgen für die
Veröffentlichung:

- **Kein Store dazwischen.** Was über die Webfassung verkauft wird, läuft nicht
  über Apple oder Google und kostet damit keine 15 % Provision, sondern die
  Gebühren des Zahlungsdienstleisters — bei EU-Karten grob 1,5 % plus ein paar
  Cent. Achtung: aus der iOS-App heraus auf diesen Weg zu verweisen, ist
  reglementiert. Beides parallel anzubieten, ist erlaubt.
- **Kein Installationshindernis.** Eltern können sich die App ansehen, bevor
  sie irgendetwas installieren. Für die Seite „Wer ist Kader" (WEG_ZUR_ZEHN
  §2.6) ist das der natürliche Ort.
- **Sie lässt sich trotzdem installieren.** Chrome und Edge bieten „App
  installieren" an: eigenes Fenster, eigenes Symbol im Startmenü, keine
  Browserleisten. Für den Alltag ist das eine PC-App, ohne dass ein
  Installationspaket gebaut werden muss.

Eine **echte native Desktop-App** (Electron oder Tauri, mit eigenem Installer
und Eintrag im Microsoft Store) wäre möglich, bringt für eine Video-App aber
fast nichts und kostet eigene Pflege. Davon rate ich ab, solange kein
konkreter Grund dafür auftaucht.

Offen ist nur die Adresse: heute liegt alles unter der GitHub-Pages-Adresse.
Für den Start gehört die Webfassung unter eine eigene, zum Beispiel
`km1-training.de/training`.

---

## 9. Wer macht was

| Deins | Meins |
| --- | --- |
| D-U-N-S beantragen, Konten anlegen | App, Hintergrund, Store-Einträge vorbereiten |
| Steuer- und Bankdaten hinterlegen | Abo technisch einrichten |
| Rechtstexte beauftragen | Einbauen und prüfen, dass nichts fehlt |
| Drehen und schneiden | Screenshots und Vorschauvideo aus der App bauen |
| Camp-Familien einladen | TestFlight und geschlossenen Test aufsetzen |
