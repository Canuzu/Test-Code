# Altersvorsorge-Rechner

Ein interaktiver, kundenorientierter Rechner für die private Altersvorsorge –
inspiriert vom Finanztip-Rechner, aber anschaulicher und mit mehr Funktionen.
Läuft **komplett im Browser**, ohne Server, ohne Build-Schritt und ohne externe
Abhängigkeiten (CSP-freundlich).

## Öffnen

Einfach `index.html` im Browser öffnen (Doppelklick genügt) – oder über einen
beliebigen Static-Server bzw. GitHub Pages ausliefern:

```bash
# optional, für lokales Testen
python3 -m http.server 8000   # dann http://localhost:8000 aufrufen
```

## Fondszahlen aktuell halten

Die Kennzahlen des Debeka Global Shares (Rendite p. a., Gesamt seit Auflegung,
laufende Kosten, 1/3/5-Jahres-Wertentwicklung) liegen in **`fund-data.json`**.
Die Seite lädt diese Datei beim Start und zeigt ihr `updatedAt` als „Stand" an.

- **Beim Ausliefern über einen Server / GitHub Pages** werden die Werte damit
  automatisch aus `fund-data.json` übernommen – ohne Code-Änderung.
- **Offline (Doppelklick auf `index.html`) oder in der Artifact-Vorschau** blockt
  der Browser den Datei-Abruf; dann greifen die in `app.js` eingebauten
  Fallback-Werte.

Aktualisiert wird `fund-data.json` über den Workflow
`.github/workflows/update-fund-data.yml`:

- **wöchentlich** – als Best-Effort-Versuch, die Werte aus dem öffentlichen
  Debeka-Factsheet (PDF) zu lesen. Schlägt der Abruf fehl (Debeka blockt teils
  automatisierte Zugriffe), bleibt die Datei unverändert.
- **manuell** über *Actions → „Debeka Global Shares – Daten aktualisieren" →
  Run workflow* – dort die Werte aus dem aktuellen Factsheet eintragen. Das ist
  der zuverlässige Weg und braucht keine externe Quelle.

Das Skript schreibt nur plausible Werte und aktualisiert das „Stand"-Datum nur
bei tatsächlicher Änderung. `fund-data.json` lässt sich auch direkt von Hand
bearbeiten.

## Was der Rechner kann

- **Live-Berechnung** bei jeder Eingabe – Slider und Felder aktualisieren alles
  in Echtzeit.
- **Monatliche Sparrate + Startkapital** mit optionaler **jährlicher Dynamik**
  (z. B. Inflationsausgleich der Sparrate).
- **Zinseszins** mit monatlicher Verzinsung über die gesamte Laufzeit.
- **Laufende Kosten (TER)** werden von der Rendite abgezogen (effektive Rendite).
- **Steuer bei Auszahlung**: Abgeltungsteuer inkl. Soli (26,375 %) auf den
  Kursgewinn, gemindert um die **Teilfreistellung** je Anlageform
  (Aktien-ETF 30 %, Mischfonds 15 %, sonstige 0 %).
- **Reale Kaufkraft heute** nach Abzug der Inflation.
- **Mögliche Monatsrente** in der Entnahmephase – wie viel du dir über die
  gewünschte Auszahldauer monatlich auszahlen kannst (nachschüssige
  Rentenformel, mit Restrendite auf das noch angelegte Kapital).
- **Interaktives Diagramm** der Vermögensentwicklung mit Hover-/Touch-Tooltip
  (Eingezahltes, Kursgewinn, Gesamt bzw. inflationsbereinigte Kaufkraft).
- **Light- & Dark-Mode** (Auswahl wird gespeichert), voll responsiv, mit
  Tastatur/Touch bedienbar.

## Aufbau

| Datei | Inhalt |
|-------|--------|
| `index.html` | Grundgerüst |
| `styles.css` | Design-System, Light/Dark-Themes, Layout |
| `app.js`     | Rechenmodell, UI-Rendering, SVG-Chart, Interaktion |

## Rechenmodell (Kurzfassung)

1. Effektive Rendite p. a. = erwartete Rendite − laufende Kosten.
2. Monatliche Verzinsung des Kapitals; die Sparrate steigt jährlich um die Dynamik.
3. Kursgewinn = Brutto-Endvermögen − Summe der Einzahlungen.
4. Steuer = Gewinn × (1 − Teilfreistellung) × 26,375 %.
5. Netto = Brutto − Steuer; Kaufkraft = Netto ÷ (1 + Inflation)^Jahre.
6. Monatsrente aus dem Netto-Kapital über die Auszahldauer (nachschüssig).

## Hinweis

Unverbindliche Modellrechnung, **keine Anlage- oder Steuerberatung**. Der
Sparer-Pauschbetrag und individuelle steuerliche Merkmale sind nicht
berücksichtigt. Erträge von Kapitalanlagen schwanken; vergangene
Wertentwicklungen sind kein Indikator für die Zukunft.
