# KartenwertDE — TCG Live-Preistracker (deutscher Markt)

Eine Website zum Live-Tracking von Trading-Card-Preisen mit Fokus auf den
**deutschen/europäischen Markt** (Cardmarket EU). Sie zeigt übersichtlich
**Wertentwicklung (7/30 Tage), ROI/Marge, Beliebtheit und einen Investment-Score**
und bietet Watchlist, Portfolio, Vergleich und Analyse-Diagramme.

Design und Funktionsumfang orientieren sich an der mitgelieferten Vorlage
(`pokeprofittracker`), wurden aber zu einer echten, deploybaren Website umgebaut:
echte Live-Preise statt KI-Schätzungen, `localStorage` statt Artifact-Storage.

## Features

- **Live-Preise** von Cardmarket EU (in EUR) über die kostenlose
  [pokemontcg.io](https://pokemontcg.io)-API — inkl. Durchschnitten für 1/7/30 Tage.
- **Wertentwicklung**: echte Veränderung über 7 und 30 Tage + Mini-Sparklines.
- **Kennzahlen pro Karte**: Marktpreis, günstigstes Angebot, Marge (Low→Trend),
  Beliebtheits-Index, Risiko, Trend, Investment-Score (S–F-Tiers).
- **Netto-Gewinn nach Gebühren** für Cardmarket, eBay DE und TCGPlayer.
- **Watchlist** (mit „Δ seit Merken") und **Portfolio** (Einkauf vs. Marktwert,
  unrealisierter Gewinn/Verlust).
- **Analyse**: Tier-/Seltenheits-/Trend-Verteilung, Preis-vs-Wertänderung-Scatter,
  Top-Gewinner/Verlierer.
- **Filter & Sortierung**, Schnellfilter, Grid-/Listenansicht, CSV-Export.
- **Erweiterbar**: Provider-Architektur — Magic, Yu-Gi-Oh!, One Piece lassen sich
  später als eigener Provider ergänzen (`src/data/providers/`).
- **Beispieldaten** sind eingebaut, damit die App auch ohne Netzwerk sofort läuft.

## Schnellstart

```bash
npm install
npm run dev      # Entwicklungsserver auf http://localhost:5173
```

Produktions-Build:

```bash
npm run build    # erzeugt dist/
npm run preview  # baut + serviert den Build lokal
```

`dist/` ist eine statische Seite und kann z. B. auf Netlify, Vercel, GitHub Pages
oder jedem Webserver gehostet werden.

## Live-Preise aktivieren

In der Entdecken-Ansicht einen Suchbegriff eingeben und **Enter** drücken bzw. auf
**„Live-Preise"** klicken — die App lädt dann aktuelle Cardmarket-Preise.

> Hinweis: Die App funktioniert ohne API-Key (mit niedrigerem Anfragelimit). Ein
> optionaler, kostenloser Key von **pokemontcg.io/dashboard** kann in den
> Einstellungen hinterlegt werden (wird nur lokal im Browser gespeichert) und hebt
> das Limit an. In abgeschotteten Umgebungen ohne Internetzugang zeigt die App
> automatisch die eingebauten Beispieldaten.

## Technik

- React 18 + Vite, Charts mit `recharts`, Icons mit `lucide-react`.
- Keine geheimen Schlüssel im Code: der optionale API-Key bleibt clientseitig.
- Berechnete Werte (Score, Beliebtheit) sind transparente Heuristiken aus den
  Preisdaten — siehe `src/lib/metrics.js`.

## Projektstruktur

```
src/
  App.jsx                 App-Shell: Header, Tabs, Modals
  store.jsx               zentraler State (Context) + Persistenz
  lib/                    metrics, fees, format, theme, storage, marketLinks
  data/
    providers/            Provider-Registry + pokemon.js (pokemontcg.io)
    sampleCards.js        eingebaute Beispieldaten
  components/             CardTile, CardModal, Discover, Analytics, ... 
```

⚠️ Keine Anlageberatung. Preisdaten können verzögert/unvollständig sein —
vor dem Kauf auf Cardmarket prüfen.
