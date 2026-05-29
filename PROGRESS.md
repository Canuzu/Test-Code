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
- [ ] 2. Einkaufspreisliste („Buylist") inkl. PDF/Druck-Export
- [ ] 3. Zustandsverwaltung / Grading (PSA 9/10, BGS) + Grading-Rechner
- [ ] 4. Lagerbestand-Management (Anzahl, EK/Stk., Lagerort, Condition)
- [ ] 5. Mehrere Marktplätze vergleichen (Cardmarket + eBay + TCGPlayer)
- [ ] 6. Preisalerts (in-app + Web-Notifications, No-Backend)
- [ ] 7. Massenimport (CSV-Wizard + Barcode-Scanner-Progressive-Enhancement)
- [ ] 8. Subscription-Modell (Free/Pro, Feature-Gating, Pricing-Seite)
- [ ] 9. Cardmarket-API (offiziell) — Provider + Build-Skript + Doku (env-gated)
- [ ] 10. PWA / Mobile-App (Manifest, Service-Worker, Install, Responsive)

## Arbeitslog (neueste zuletzt)
- Init: Codebase analysiert, Plan erstellt, PROGRESS.md angelegt.
- #1 Preishistorie ✓: `src/lib/priceHistory.js` (seeded, an echten Ø-Werten verankert) + `src/components/PriceChart.jsx` (1M/3M/6M/1J, interaktiv) + Integration in CardModal-Tab „Wertentwicklung" + History-Akkumulation im Store (`getPriceHistory`, `accumulateHistory`, KEY `price_history`).

## Hinweise / offene Punkte für später
- Deploy-Workflow triggert nur auf `main` (+ alter Branch). Für Live-Schaltung
  müssen die Änderungen nach `main` gemerged werden (bewusst nicht ohne
  Freigabe gepusht).
- Echte E-Mail/Push-Alerts, echtes Stripe-Billing und Live-Cardmarket-OAuth
  brauchen ein Backend bzw. genehmigte Credentials — Architektur ist
  vorbereitet, aktiviert sich bei Bereitstellung.
