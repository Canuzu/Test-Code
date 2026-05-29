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
- [x] 10. PWA / Mobile-App (Manifest, Service-Worker, Install, Responsive)

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
- #10 PWA ✓: `scripts/make-icons.mjs` (echte PNG-Icons 192/512/maskable, Blitz auf Dunkel) + `public/manifest.webmanifest` + `public/sw.js` (network-first Navigation/cards.json, cache-first Assets, cross-origin unangetastet) + SW-Registrierung in main.jsx + Apple/Manifest-Meta + Install-Button (beforeinstallprompt) + mobile Bottom-Nav + Responsive-CSS (Safe-Areas, Tap-Targets). dist enthält manifest/sw/icons.

## ✅ ALLE 10 FEATURES UMGESETZT, GEBAUT & COMMITTET.

## Folge-Batch (Verbesserungen)
- [x] A. Icon-Button (🧾 Receipt) zum direkten Hinzufügen einer Karte zur Buylist
- [x] B. Preisfarben je nach Zustand (NM grün → … → PO rot)
- [x] C. Vor-/Zurück-Navigation in der Website (Browser-History + Header-Buttons)
- [x] D. Transparenz-Hinweise im UI (Schätzungen+Verifikation, Alerts-Backend, Pro-Demo)

### Folge-Batch — Details
- A ✓: Buylist in den Store gehoben (`buylist {rules,items}`, `addToBuylist`/`inBuylist`/`removeFromBuylist`/`setBuylistItems`/`setBuylistRules`, KEY `buylist`). `BuylistView` nutzt jetzt den Store (eine Quelle der Wahrheit). Quick-Add-Icon (Receipt) auf `CardTile` (oben links) + Button in `CardModal`-Übersicht, mit „in Buylist"-Zustand.
- B ✓: `conditionColor`/`CONDITION_COLORS` in `theme.js`. Angewandt auf Preise/Zustand in `PortfolioView` (Karten-Pill + „Aktuell/Stk", Inventar-Tabelle Select + „Akt./Stk" + Legende) und `BuylistView` (Zustands-Select + Angebotspreis).
- C ✓: History-Integration in `App.jsx` (push/replaceState pro Tab/Modal-Wechsel, `popstate`-Restore inkl. Karten-Modal via cardsRef; `firstNav`/`isPopping`-Guards) + ◀/▶-Buttons im Header.
- D ✓: Hinweis-Footer in `AlertsView` (E-Mail braucht Backend), erweiterte Märkte-Notiz in `CardModal` (Auto-Live bei CM-Secrets); Pro-Demo-Hinweis steht bereits in `PricingModal`.

## Folge-Batch 2 (Accounts, mehr Karten, Farben)
- [x] E. User-Accounts: lokales Login/Registrierung, pro Konto getrennte Daten (No-Backend, gekennzeichnet)
- [x] F. Mehr Karten: Build holt die **4 neuesten Sets** mit **jeder** Karte
- [x] G. Farben übersichtlicher (mehr Kontrast) ohne Design-Umbau

### Folge-Batch 2 — Details
- F ✓ (überarbeitet): `scripts/fetch-prices.mjs` holt jetzt **ALLE Sets von neu→alt**, **jede Karte je Set vollständig**, ein Set nach dem anderen; Stopp nur an Set-Grenze bei `HARD_CAP=9000`. Kuratierte Breite + 4-Set-Limit entfernt (sie verletzten die Reihenfolge). `allSetsDesc()`, per-Set try/catch (Rate-Limit bricht nicht alles ab), `allCardsInSet` bis 6 Seiten. README: API-Key empfohlen. (Lokal 403/Sandbox, greift im CI.)
- SW-Update: `public/sw.js` Cache `kwde-v1`→`kwde-v2`, damit veraltete zwischengespeicherte Versionen beim nächsten Laden ersetzt werden (Fix für „sehe keine Karten" bei Rückkehrern).
- G ✓: Kontrast erhöht in `theme.js` (DARK+LIGHT) und `index.css` (synchron): hellere/dunklere Sekundärtexte (textSoft/Dim/Faint/Ghost) + etwas stärkere Linien. Akzente & Layout unverändert.
- E ✓: `src/lib/auth.js` (lokale Konten, PBKDF2-SHA256 via Web Crypto, Registry/Session in localStorage) + Storage-Namespace in `storage.js` (`setNamespace`; Gast='' = bisherige Daten) + Store: `loadAll()` (Profil-Swap), `account`/`login`/`register`/`logout`, Namespace beim Mount aus Session. `src/components/AuthModal.jsx` + Account-Button im Header. Headless verifiziert: Datentrennung PASS (A=1, Gast=0, A-Re-Login=1), 0 App-Fehler.

## Hinweise / offene Punkte für später
- Deploy-Workflow triggert nur auf `main` (+ alter Branch). Für Live-Schaltung
  müssen die Änderungen nach `main` gemerged werden (bewusst nicht ohne
  Freigabe gepusht).
- Echte E-Mail/Push-Alerts, echtes Stripe-Billing und Live-Cardmarket-OAuth
  brauchen ein Backend bzw. genehmigte Credentials — Architektur ist
  vorbereitet, aktiviert sich bei Bereitstellung.
