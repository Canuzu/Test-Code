# Umsetzungs-Fortschritt — Händler-/Pro-Features

> **Zweck dieser Datei:** Persistenter Arbeitsstand, damit die Arbeit nach einer
> Unterbrechung (z. B. Nutzungslimit) **exakt dort weitergeführt** werden kann,
> wo sie aufgehört hat. Nach jedem Feature wird committet und diese Liste
> aktualisiert. Branch: `claude/blissful-bohr-H9DVl`.

## Architektur-Kontext (wichtig für Resume)
- Static Site (React 18 + Vite), Deploy via GitHub Pages.
- **Kein Backend.** Preise = Build-Zeit-Snapshot (`scripts/fetch-prices.mjs` →
  `public/data/cards.json`, gitignored), App lädt same-origin. State in
  `localStorage` (`src/lib/storage.js`).
- Backend-abhängige Punkte (echte E-Mail-Alerts, echtes Billing, offizielle
  Cardmarket-OAuth-API) werden als **beste No-Backend-Lösung + sauber
  vorbereitete Architektur** umgesetzt und klar als solche gekennzeichnet.

## Status-Legende
- [ ] offen   · [~] in Arbeit   · [x] fertig + committet

## Feature-Liste
- [x] 1. Preishistorie als interaktiver Chart (6–12 Monate)
- [x] 2. Einkaufspreisliste („Buylist") inkl. PDF/Druck-Export
- [x] 3. Zustandsverwaltung / Grading (PSA 9/10, BGS) + Grading-Rechner
- [x] 4. Lagerbestand-Management (Anzahl, EK/Stk., Lagerort, Condition)
- [x] 5. Mehrere Marktplätze vergleichen (Cardmarket + eBay + TCGPlayer)
- [x] 6. Preisalerts (in-app + Web-Notifications, No-Backend)
- [x] 7. Massenimport (CSV-Wizard + Barcode-Scanner-Progressive-Enhancement)
- [x] 8. Subscription-Modell (Free/Pro, Feature-Gating, Pricing-Seite)
- [x] 9. Cardmarket-API (offiziell) — Provider + Build-Skript + Doku (env-gated)
- [ ] 10. PWA / Mobile-App (Manifest, Service-Worker, Install, Responsive)

## Arbeitslog (neueste zuletzt)
- Init: Codebase analysiert, Plan erstellt, PROGRESS.md angelegt.
- #1 Preishistorie ✓: `src/lib/priceHistory.js` (seeded, an echten Ø-Werten verankert) + `src/components/PriceChart.jsx` (1M/3M/6M/1J, interaktiv) + Integration in CardModal-Tab „Wertentwicklung" + History-Akkumulation im Store (`getPriceHistory`, `accumulateHistory`, KEY `price_history`).
- #5 Märkte ✓: `src/lib/markets.js` (Cardmarket live + eBay/TCGplayer-Schätzung via Aufschlag & FX) + `fmtUsd`/`fmtMoney` + neuer CardModal-Tab „Märkte" inkl. EU→US-Arbitrage + FX-Setting in SettingsModal + `fxEurUsd` in DEFAULT_SETTINGS.
- #3 Grading ✓: `src/lib/grading.js` (PSA/BGS/CGC-Schätzung nach Alter/Rarität + Grading-ROI) + neuer CardModal-Tab „Grading" mit Slab-Werten, Rechner (Kosten/Zielnote) und PSA/eBay-Links.
- #4 Lagerbestand ✓: Store um `location`, `updatePortfolioEntry`, `addManyToPortfolio` erweitert; CardModal-Kaufform um Lagerort; `PortfolioView` neu: Karten- ⇄ Inventar-Tabelle (Inline-Edit Menge/EK/Zustand/Lagerort), Filter, Lagerort-Summen, Inventar-CSV-Export, `onImport`-Prop (für #7).
- #2 Buylist ✓: `src/lib/buylist.js` (Tier-/Flat-%, Zustands-Faktor, Bar/Guthaben, Rundung) + `src/components/BuylistView.jsx` (Suche/Watchlist/Top25, Inline-Regeln, CSV + Druck/PDF via `@media print` + `.buylist-print`) + neuer Tab „Buylist" in App + Print-CSS in index.css. `locked`/`onUpgrade`-Props vorbereitet für #8.
- #6 Alerts ✓: `src/lib/alerts.js` (Regeln, Web-Notification) + Store (alerts/alertLog, add/remove/toggle/update, Auswertung per useEffect mit firingRef-Debounce) + `src/components/AlertsView.jsx` (Anlegen/Verwalten/Log + Notification-Permission) + Tab „Alerts" mit Badge + Quick-Alarm in CardModal-Übersicht.
- #7 Massenimport ✓: `src/lib/csv.js` (Parser + Spalten-Auto-Mapping + Vorlage) + `src/components/ImportModal.jsx` (CSV: Datei/Einfügen → Mapping → Fuzzy-Match → Vorschau → Import via `addManyToPortfolio`; Barcode: BarcodeDetector progressive mit Kamera) + App-Verdrahtung über Sammlung-`onImport`.
- #8 Subscription ✓: `src/lib/pro.js` (PLANS, PRO_FEATURES, isPro) + `src/components/PricingModal.jsx` (Free/Pro, monatlich/jährlich, Demo-Unlock) + Gates an Buylist/Alerts/Import + Pro-Insight-Panel in Analytics + Crown-Button im Header. Billing-Backend andockbar (setzt nur `settings.pro`).
- #9 Cardmarket-API ✓: `src/data/providers/cardmarket.js` (reine MKM→Card-Normalisierung) + `scripts/fetch-cardmarket.mjs` (OAuth1-HMAC-SHA1, env-gated, getestet: skip ohne Creds, Signatur-Call mit Dummy = 403 sauber gefangen) + Merge in `fetch-prices.mjs` + Workflow-Env CM_*. Aktiviert sich automatisch bei gesetzten Secrets.

## Hinweise / offene Punkte für später
- Deploy-Workflow triggert nur auf `main` (+ alter Branch). Für Live-Schaltung
  müssen die Änderungen nach `main` gemerged werden (bewusst nicht ohne
  Freigabe gepusht).
- Echte E-Mail/Push-Alerts, echtes Stripe-Billing und Live-Cardmarket-OAuth
  brauchen ein Backend bzw. genehmigte Credentials — Architektur ist
  vorbereitet, aktiviert sich bei Bereitstellung.
