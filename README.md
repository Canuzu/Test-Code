# Cartograph — TCG Live-Preistracker (deutscher Markt)

Eine Website zum Live-Tracking von Trading-Card-Preisen mit Fokus auf den
**deutschen/europäischen Markt** (Cardmarket EU). Sie zeigt übersichtlich
**Wertentwicklung (7/30 Tage), ROI/Marge, Beliebtheit und einen Investment-Score**
und bietet Watchlist, Portfolio, Vergleich und Analyse-Diagramme.

Design und Funktionsumfang orientieren sich an der mitgelieferten Vorlage
(`pokeprofittracker`), wurden aber zu einer echten, deploybaren Website umgebaut:
echte Live-Preise statt KI-Schätzungen, `localStorage` statt Artifact-Storage.

## Features

**Grundlagen (kostenlos)**

- **Live-Preise** von Cardmarket EU (in EUR) über die kostenlose
  [pokemontcg.io](https://pokemontcg.io)-API — inkl. Durchschnitten für 1/7/30 Tage.
- **Interaktiver Preisverlauf-Chart** (1M/3M/6M/1J) — an die echten Ø-Werte
  verankert; gemessene Punkte kommen mit jedem täglichen Snapshot dazu.
- **Kennzahlen pro Karte**: Marktpreis, günstigstes Angebot, Marge (Low→Trend),
  Beliebtheits-Index, Risiko, Trend, Investment-Score (S–F-Tiers).
- **Mehrere Marktplätze vergleichen**: Cardmarket (live) + eBay & TCGplayer
  (transparente Schätzung via Aufschlag & EUR→USD-Kurs) + EU→US-Arbitrage.
- **Grading**: geschätzte PSA 10/9/8-, BGS 9.5- und CGC 10-Werte (nach
  Alter/Rarität) inkl. **Grading-ROI-Rechner** und PSA-/eBay-Links.
- **Netto-Gewinn nach Gebühren** für Cardmarket, eBay DE und TCGPlayer.
- **Watchlist** und **Sammlung/Lagerbestand**: Anzahl, EK/Stück, **Zustand**,
  **Lagerort** — als Karten- oder editierbare **Inventar-Tabelle** mit
  Lagerort-Summen und CSV-Export.
- **Analyse**: Tier-/Seltenheits-/Trend-Verteilung, Scatter, Top-Mover.
- Light/Dark-Theme, Filter & Sortierung, CSV-Export.

**Händler / Pro** (siehe [Subscription-Modell](#subscription-modell-freepro))

- **🧾 Buylist** (Einkaufspreisliste): Ankaufspreis als konfigurierbarer
  %-Satz vom Marktpreis (nach Preisstufe, Zustand, Bar/Guthaben), exportierbar
  als **PDF/Druck** und CSV.
- **🔔 Preisalerts**: „Benachrichtige mich, wenn Glurak ex über 200 € steigt" —
  in-app + Web-Notification (PWA-tauglich).
- **📥 Massenimport**: CSV-Wizard (Spalten-Mapping, Fuzzy-Match) + Barcode-Scan
  (Kamera, wo unterstützt).
- **📊 Erweiterte Analytics** (Markt-Konzentration u. a.) und Team-Zugang (vorbereitet).

**Plattform**

- **Lokale Konten**: Login/Registrierung im Browser (Passwort PBKDF2-gehasht),
  pro Konto getrennte Daten (Watchlist/Sammlung/Buylist/Alerts/Einstellungen) –
  ideal für ein geteiltes Ladengerät. Kein Server nötig; ein echtes Backend
  (geräteübergreifend) lässt sich später andocken.
- **PWA / Mobile**: installierbar, offline-fähig (Service-Worker), mobile
  Bottom-Navigation, App-Icons.
- **Offizielle Cardmarket-API** als optionale Preisquelle (siehe unten).
- **Mehrere TCGs**: Spiel-Auswahl-Startseite mit eigener Sammlung/Watchlist/Alerts
  je Spiel. **Pokémon** (live, Cardmarket EU) und **One Piece** (alle Sets &
  Karten mit offiziellem Artwork) sind ausgebaut; Magic & Yu-Gi-Oh! sind als
  Provider vorbereitet (`src/data/providers/`).
- **Beispieldaten** sind eingebaut, damit die App auch ohne Netzwerk sofort läuft.

> Hinweis: eBay-/TCGplayer-Preise, Slab-Werte und der ältere Teil des
> Preisverlaufs sind **transparent gekennzeichnete Schätzungen** (eine statische
> Seite ohne Backend hat dafür keine Live-Quelle). Jede Schätzung ist mit einem
> Direktlink zur Verifikation auf dem jeweiligen Marktplatz versehen.

## Subscription-Modell (Free/Pro)

Kostenlos sind alle Grundfunktionen; **Pro** (€19/Monat bzw. €15/Monat jährlich)
schaltet Buylist, Alerts, Massenimport und erweiterte Analytics frei. Da eine
statische Seite kein Zahlungs-Secret halten kann, ist die Freischaltung aktuell
ein **lokaler Demo-Schalter** (`settings.pro` in `src/lib/pro.js`). Für echtes
Abo-Billing wird ein Backend (z. B. Stripe Checkout) angebunden, das nach
erfolgreicher Zahlung genau diesen Pro-Status setzt — der Rest der App bleibt
unverändert.

## Offizielle Cardmarket-API (optional)

`pokemontcg.io` liefert bereits Cardmarket-Preise, aber die **offizielle
MKM-API** hat mehr (volle Price-Guide, Verkaufshistorie, Angebote, Shop-Sync).
Die Anbindung ist serverseitig (OAuth 1.0a, kein CORS, Secret) und **opt-in**:

1. Auf cardmarket.com unter *Account → API* eine dedizierte App registrieren →
   App-Token/-Secret und Access-Token/-Secret.
2. Als GitHub-Secrets hinterlegen (*Repo → Settings → Secrets and variables →
   Actions*): `CM_APP_TOKEN`, `CM_APP_SECRET`, `CM_ACCESS_TOKEN`,
   `CM_ACCESS_SECRET`. Optional als *Variables*: `CM_GAME_ID` (Standard 6 =
   Pokémon), `CM_SEARCH` (Komma-Liste an Suchbegriffen).
3. Beim nächsten Deploy mischt `scripts/fetch-cardmarket.mjs` echte MKM-Produkte
   in den Snapshot. **Ohne** die Secrets passiert nichts — die App nutzt weiter
   den pokemontcg.io-Snapshot.

Lokaler Signatur-/Credential-Test: `node scripts/fetch-cardmarket.mjs`.

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

## Live-Preise (Build-Zeit-Snapshot)

Browser dürfen die pokemontcg.io-API wegen CORS nicht direkt aufrufen. Deshalb
holt **`scripts/fetch-prices.mjs` die echten Cardmarket-Preise serverseitig beim
Deploy** (im GitHub-Actions-Workflow, ohne CORS-Beschränkung) und schreibt sie
nach `public/data/cards.json`. Die App lädt diese Datei dann **same-origin** —
inklusive echter Bilder und exakter Cardmarket-Produktlinks.

- **Umfang:** Es werden **alle Sets von neu nach alt** aufgenommen, **jede Karte
  je Set vollständig**, ein Set nach dem anderen — bis zur Obergrenze `HARD_CAP`
  (Stopp nur an Set-Grenzen, nie mitten in einem Set). Reicht das Anfragelimit
  nicht für alle Sets, sind zumindest die **neuesten Sets komplett** enthalten.
- **Aktualisierung:** Der Workflow läuft bei jedem Push **und täglich per Cron**
  (`0 5 * * *`) → die Preise sind täglich frisch (Cardmarket aktualisiert ohnehin
  nur täglich).
- **Ohne Netz / lokal:** Gibt es keine `cards.json`, fällt die App automatisch auf
  die eingebauten Beispieldaten zurück.
- **API-Key empfohlen:** Für viele Sets das Anfragelimit anheben — kostenlosen Key
  auf `pokemontcg.io/dashboard` anlegen und als **GitHub-Secret
  `POKEMONTCG_API_KEY`** hinterlegen (Repo → Settings → Secrets and variables →
  Actions). Ohne Key werden weniger (die neuesten) Sets geladen.

Lokal kann der Snapshot mit `node scripts/fetch-prices.mjs` erzeugt werden
(braucht Internetzugang zur API).

## One Piece Card Game (vollständiger Katalog)

One Piece ist genauso ausgebaut wie Pokémon – **jedes englische Set und jede
Karte** inklusive **offiziellem Artwork**. Quelle ist der offene, versionierte
Datensatz [punk-records](https://github.com/buhbbl/punk-records) (von der
offiziellen One-Piece-TCG-Seite gescrapt, über GitHub ausgeliefert).
`scripts/fetch-onepiece.mjs` holt ihn zur Build-Zeit, dedupliziert die über viele
Decks/Booster nachgedruckten Karten und schreibt **`public/data/onepiece.json`**
(~4.300 Karten, 53 Sets). Bilder werden mit `no-referrer` direkt von der
offiziellen CDN geladen, mit automatischem Fallback über den Bild-Proxy
`wsrv.nl`, falls Bandai Hotlinking blockt.

**Preise:** Für One Piece gibt es keine freie Live-Preis-API (die offizielle
Seite listet keine Preise; Cardmarket/TCGPlayer brauchen Zugangsdaten). Bis die
**offizielle Cardmarket-API** (`scripts/fetch-cardmarket.mjs`, `CM_*`-Secrets,
`CM_GAME_ID` auf die One-Piece-ID setzen) angebunden ist, sind die Preise eine
**transparente, deterministische Schätzung** aus Seltenheit, Alt-Art-Status und
Set-Alter – klar als Schätzung gekennzeichnet, mit einem **Cardmarket-Link je
Karte** für den echten Tagespreis. Das Card-Format ist identisch zu Pokémon, also
funktionieren Sammlung, Charts, Alerts und Analyse unverändert.

## Technik

- React 18 + Vite, Charts mit `recharts`, Icons mit `lucide-react`.
- Preisdaten werden zur Build-Zeit serverseitig geholt — kein Secret/Key im
  Client-Code, kein CORS-Problem.
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
