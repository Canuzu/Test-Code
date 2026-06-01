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
- F (inkrementell): `fetch-prices.mjs` akkumuliert jetzt über Läufe hinweg — `cards.json` wird **ins Repo committet** (gitignore-Ausnahme) und der Deploy-Workflow committet den gewachsenen Snapshot mit `[skip ci]` zurück (`contents: write`, `continue-on-error`). Pro Lauf: `REFRESH_RECENT=8` neueste Sets neu (frische Preise) + `BATCH_NEW` (keyless 10 / mit Key 40) nächste noch fehlende Sets; `completedSets`+`deNames` im Snapshot gemerkt → nächster Lauf macht bei den nächsten Sets weiter. So wächst der Katalog neu→alt verlässlich, auch ohne Key. HARD_CAP=8000 (Stopp an Set-Grenze). Cron + jeder Push schieben weiter; API-Key beschleunigt stark.
- G ✓: Kontrast erhöht in `theme.js` (DARK+LIGHT) und `index.css` (synchron): hellere/dunklere Sekundärtexte (textSoft/Dim/Faint/Ghost) + etwas stärkere Linien. Akzente & Layout unverändert.
- E ✓: `src/lib/auth.js` (lokale Konten, PBKDF2-SHA256 via Web Crypto, Registry/Session in localStorage) + Storage-Namespace in `storage.js` (`setNamespace`; Gast='' = bisherige Daten) + Store: `loadAll()` (Profil-Swap), `account`/`login`/`register`/`logout`, Namespace beim Mount aus Session. `src/components/AuthModal.jsx` + Account-Button im Header. Headless verifiziert: Datentrennung PASS (A=1, Gast=0, A-Re-Login=1), 0 App-Fehler.

## Folge-Batch 3 (One Piece voll ausgebaut – wie Pokémon)
- [x] H. One Piece: **alle Sets & Karten** mit **offiziellem Artwork** + Preisen,
  voll funktionsfähig wie die Pokémon-Seite (Discover/Sets/Singles, Sammlung,
  Watchlist, Analyse, Buylist, Alerts, Sealed, Markt-Links).

### Folge-Batch 3 — Details
- Datenquelle: offener Datensatz **buhbbl/punk-records** (offizielle One-Piece-TCG-
  Daten, über GitHub raw ausgeliefert – im Deploy **und** lokal erreichbar, anders
  als die Cloudflare-geblockten TCG-APIs). Enthält jedes engl. Set + Karte inkl.
  offizieller Bild-URLs.
- `scripts/fetch-onepiece.mjs`: holt `packs.json` + alle `data/<pack>.json`,
  **dedupliziert per Karten-ID** (Karten werden über viele Decks/Booster
  nachgedruckt), normalisiert über den Provider, sortiert neu→alt, schreibt
  `public/data/onepiece.json` (**4.392 Karten, 53 Sets**). Robust: hält bei Fehler
  den bestehenden Snapshot, exit 0. In Deploy-Workflow eingehängt (Schritt vor
  `npm run build`).
- `src/data/providers/onepiece.js`: `meta`, `SET_META` (Code→Name+Release-Datum
  für OP01–16, EB01–04, PRB01–02, ST01–30, P), `prettyName` ("Monkey.D.Luffy" →
  "Monkey D. Luffy"), Farb-/Kategorie-Mapping (DE), `normalize` (→ App-Card-Shape,
  inkl. Cardmarket-OnePiece-Link je Karte) und ein **deterministisches
  Preismodell** `estimatePrices` (FNV-Hash-Seeds → stabile Snapshots): Basis nach
  Rarität, ×2,8–5 für Alt-Arts (`_pN`), Set-Alter-Faktor, Streuung; daraus
  market/low/trend/avg1/avg7/avg30 passend zu `metrics.js` (Score/Tier/Change/
  Marge rechnen sauber, kein NaN). Preise klar als **Schätzung** gekennzeichnet.
- `src/data/onePieceCards.js`: gebündelter Offline-Fallback neu generiert (56
  echte Karten quer über 16 neueste Sets, echte Bilder/Preise) statt der alten
  16 Demo-Karten.
- Bilder robust: `CardImage` lädt offizielle CDN mit `no-referrer` (hebelt
  Referer-Hotlinkschutz aus) → Fallback über `wsrv.nl`-Proxy (gegen Bandais
  IP-Hotlinkschutz) → sauberer Platzhalter. (Bestätigt durch optcg-api-Quelle.)
- Spielbewusst gemacht: `marketLinks.js` (Cardmarket **OnePiece** /TCGplayer-Line/
  eBay-Keyword je `card.game`), `sealedProducts.js` (`sealedFor`/
  `sealedCategoriesFor`: One-Piece-Booster/Display/**Starter-Decks** aus
  Set-Metadaten, Cardmarket-Links, Set-Artwork), `SealedGrid`/`Discover`
  (Kategorien, Icons, Such-Scope/-Platzhalter, Quellen-Zeile, Sealed-Grid),
  `App.jsx`-Footer (One-Piece-Hinweis: echte Karten/Bilder, Preise geschätzt),
  Registry-Metadaten (Provider aktiv, Tagline/Blurb), `metrics.js`-rarityWeight
  (One-Piece-Raritäten: Leader/Super Rare/Secret/Treasure korrekt gewichtet).
- SW-Cache `kwde-v3`→`kwde-v4`; `data/*.json`-Snapshots jetzt network-first (nicht
  nur cards.json), damit One-Piece-Daten frisch geladen werden. Build grün
  (2404 Module), `enrich()` über alle 4.392 Karten ohne NaN (Tiers S:147 A:482
  B:1296 C:1571 D:878 F:18).
- Live-Schaltung: Deploy triggert nur auf `main` → für canuzu.github.io muss der
  Branch `claude/magical-planck-nU1th` nach `main` gemergt werden.

## Folge-Batch 4 (One Piece: Startseiten-Animation, Bilder mobil, Start-Seite)
- [x] I. One-Piece-Startseiten-Animation: **Thousand Sunny, der auf dem Meer
  schaukelt** (reines SVG/CSS, analog zur Pokéball-Animation). Neue Komponente
  `ThousandSunny` in `Discover.jsx` (Schiff mit Löwen-Galionsfigur, Jolly-Roger-
  Segel + Strohhut, animierte Wellen) + CSS `.op-scene/.op-ship/.op-sea/.op-wave*/
  .op-shadow` und Keyframes `shipBob`/`waveSway` in `index.css` (inkl. reduced-
  motion). `WelcomeHero` zeigt für `isOP` die Szene + Texte „Setze die Segel! ⚓"
  / Button „🏴‍☠️ Sets entern".
- [x] J. Bilder luden mobil nicht zuverlässig: Bandais CDN
  (`en.onepiece-cardgame.com`) blockt Hotlinking unzuverlässig (v. a. mobile
  Netze). `CardImage` lädt One-Piece-Bilder jetzt **primär über den `wsrv.nl`-
  Proxy** (CORS/cache, erreicht Bandai serverseitig), offizielle URL als Fallback,
  dann Platzhalter.
- [x] K. App startete (v. a. Handy) direkt im zuletzt gewählten Spiel: `store.jsx`
  initialisiert `activeGame` jetzt **immer als ''** → jeder Start öffnet die
  Spiel-Auswahl-Startseite (Handy + Desktop). `getGame`-Import entfernt.

## ⏸️ NÄCHSTER OFFENER PUNKT (hier weitermachen — "wo waren wir?")
**One Piece — echte Live-Preise, vollständige Abdeckung.** Status:
- ✅ Offizielle Cardmarket-(MKM-)API ist **fertig verdrahtet** (Folge-Batch 3,
  CM-Teil): sobald die 4 `CM_*`-Secrets gesetzt sind, ersetzt der Build die
  Schätzung durch echte MKM-Preise (idGame via `/games` auto-aufgelöst). **Der
  Nutzer muss nur noch die Secrets im Repo hinterlegen** (cardmarket.com →
  Account → API; i. d. R. Professional-Account nötig).
- ⬜ **OFFEN / auf Wunsch des Nutzers umzusetzen:** optionaler **vollständiger
  Expansions-Crawl** (`/games/{id}/expansions` → `/expansions/{id}/singles` →
  pro Produkt `priceGuide`), damit **alle ~4.390 Karten** echte Preise bekommen
  statt nur der per-Suchbegriff gefundenen. Als opt-in (z. B. `CM_ONEPIECE_FULL=1`)
  in `scripts/fetch-cardmarket.mjs` + Aufruf in `fetch-onepiece.mjs` bauen,
  defensiv/paginiert/rate-limit-fest. Alternative: kostenpflichtige TCG-Preis-API
  (JustTCG/apitcg) mit Key.

## Folge-Batch 5 (Magic & Yu-Gi-Oh! aktiviert – wie Pokémon/One Piece)
- [x] L. **Yu-Gi-Oh!** voll ausgebaut: Quelle YGOJSON (`iconmaster5326/YGOJSON`,
  Branch `v1/aggregate`, via raw.githubusercontent — im Deploy & lokal erreichbar).
  `scripts/fetch-yugioh.mjs` flacht jede Karte auf ihr frühestes TCG-Set +
  repräsentative Rarität ab, deutsche Namen, offizielle Bilder → `public/data/
  yugioh.json` (**14.334 Karten, ~285 echte Sets**). Provider `yugioh.js`
  (Rarität-Label-Map, deterministisches Preismodell wie One Piece). Preise =
  Schätzung (Cardmarket-Link je Karte).
- [x] M. **Magic** voll ausgebaut: Quelle Scryfall-Bulk (`default_cards`).
  `scripts/fetch-magic.mjs` läuft im Deploy (Scryfall blockt Browser-CORS), nimmt
  Karten mit **echtem Cardmarket-EUR-Preis** (`prices.eur`), neueste Sets zuerst,
  Cap `MAGIC_HARD_CAP=16000` → `public/data/magic.json`. Provider `magic.js`
  (normalisiert Scryfall inkl. doppelseitiger Karten, echte EUR-Preise). **Echte
  Live-Preise, keine Schätzung.** Bis zum ersten Deploy greift ein kleiner
  Sample-Fallback (`magicCards.js`); committeter Platzhalter-Snapshot vorhanden.
- Registry: beide `enabled:true` mit Provider, Tagline/Blurb, Snapshot-Pfad.
  Samples in Store (`yugiohCards.js` aus echten Daten, `magicCards.js` kuratiert).
  `.gitignore` lässt yugioh.json + magic.json durch. Deploy-Workflow baut beide
  Kataloge und committet alle 4 Snapshots zurück (`[skip ci]`).
- Spielbewusst erweitert: `marketLinks` (Cardmarket Magic/YuGiOh, eBay/TCGplayer),
  `metrics.rarityWeight` (Mythic/Ghost/Starlight/Collector/Ultimate), Sealed
  **datengetrieben** für Magic/YGO (`sealedFromCards` aus geladenen Sets →
  Booster/Display + Cardmarket-Link, Set-Artwork = teuerste Karte), Discover
  Quellen-Zeile (`snapshotLabel`) + WelcomeHero-Texte je Spiel, App-Footer-Hinweis.
  `GameMark` hatte bereits Magic-/YGO-Icons. Build grün, enrich() NaN-frei.
- ⏸️ Magic-Snapshot wird erst beim Deploy real befüllt (Scryfall im Sandbox
  geblockt) — YGO ist bereits vollständig vorgeneriert & committet.

## Hinweise / offene Punkte für später
- Deploy-Workflow triggert nur auf `main` (+ alter Branch). Für Live-Schaltung
  müssen die Änderungen nach `main` gemerged werden (bewusst nicht ohne
  Freigabe gepusht).
- Echte E-Mail/Push-Alerts, echtes Stripe-Billing und Live-Cardmarket-OAuth
  brauchen ein Backend bzw. genehmigte Credentials — Architektur ist
  vorbereitet, aktiviert sich bei Bereitstellung.
