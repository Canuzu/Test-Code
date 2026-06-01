# Backend-Plan (#13)

Ziel laut Auswahl: **(a) Accounts + Cloud-Sync**, **(b) Live-Preise on-demand**,
**(c) Bezahlung/Abo (Stripe)**. Heute ist die App rein statisch (GitHub Pages +
tägliche JSON-Snapshots, alle Daten im `localStorage`). Dieses Dokument ist der
Plan, **bevor** Code entsteht — Architektur, Stack, Phasen, Kosten, Recht.

> Hinweis: Die aktuelle Entwicklungs-Sandbox hat **kein Außennetz**, daher kann
> Backend-Integration hier nicht gebaut/getestet werden. Umsetzung in einer
> Session mit Netzzugang (oder lokalem Supabase) + hinterlegten Keys.

## Empfohlener Stack

**Supabase** (Postgres + Auth + Row-Level-Security + Edge Functions + Realtime)
als Kern, **Stripe** fürs Billing, **GitHub Pages** bleibt das Frontend.

Warum:
- **Auth** (E-Mail/Magic-Link/OAuth) fertig integriert.
- **Postgres mit RLS** → jede Zeile gehört einem User; ideal für Sammlung/
  Watchlist-Sync. Kein Vendor-Lock-in (am Ende „nur" Postgres, selbst-hostbar).
- **Realtime** → Sync über mehrere Geräte.
- **Edge Functions** (Deno) → Stripe-Webhooks und Preis-Proxy ohne eigenen Server.
- **Free-Tier** (≈500 MB DB, 50k MAU) trägt den Launch.

Alternativen: Firebase (proprietär, aber sehr schnell startklar) · eigenes
Node/Hono auf Fly.io/Railway (maximale Kontrolle, mehr Wartung).

## Datenmodell (Skizze)

```
profiles(id = auth.uid, plan 'free'|'pro', stripe_customer_id, created_at)
collection_items(id, user_id, game, card_id, qty, condition, buy_price, bought_at, updated_at)
watchlist_items(user_id, game, card_id, target_price, updated_at)
alerts(id, user_id, game, card_id, rule, threshold, active, updated_at)
```
RLS-Policy überall: `user_id = auth.uid()`.

## Sync-Strategie (offline-first)
- `localStorage` bleibt der lokale Cache → App funktioniert auch ohne Login.
- Bei Login: einmal pull + merge (per-Item `updated_at`, last-write-wins).
- Danach: jede Mutation lokal schreiben **und** nach Supabase pushen; Realtime
  spiegelt Änderungen anderer Geräte zurück.
- Bestehende `src/lib/storage.js`-Schnittstelle kapselt das — ein neuer
  „remote adapter" hinter demselben API, kein UI-Umbau nötig.

## Billing (Stripe)
- Heute bewusst **alles kostenlos** (`isPro()` → `true`). Für Abo:
  1. Stripe **Checkout** für „Pro/Händler"; **Customer Portal** für Verwaltung.
  2. **Webhook** (Edge Function) setzt `profiles.plan` nach Zahlung.
  3. `src/lib/pro.js` → `isPro()` liest wieder den server-gesetzten Plan
     (statt hart `true`). Der Umbau ist dort schon als Rückbau-Punkt vermerkt.
- Gebühren: ca. **1,5 % + 0,25 €** je EU-Kartenzahlung.

## Live-Preise on-demand
- **Scheduled** Edge Function aktualisiert „heiße" Karten; **on-demand** Function
  proxyt Cardmarket/Scryfall mit Cache (Rate-Limits + ToS beachten).
- Scryfall (Magic) offen; pokemontcg.io (Pokémon) ok; **Cardmarket-Echtzeit**
  braucht den genehmigten MKM-API-Zugang (Secrets sind in `deploy.yml` schon
  vorgesehen). Bleibt progressive Verbesserung über den Snapshots.

## Phasen
1. **Auth + Cloud-Sync** (Sammlung/Watchlist/Alerts). `isPro` liest `profiles.plan`
   (Default free). → größter Nutzen, kein Geldfluss.
2. **Stripe-Billing** (Checkout + Portal + Webhook) flippt den Plan.
3. **Live-Preis-Proxy** + Caching/Cron als Aufwertung der Snapshots.

## Recht (wichtig)
Mit Accounts ändert sich der Datenschutz: Supabase wird **Auftragsverarbeiter**
(AVV/DPA abschließen, Region wählen, möglichst EU), Account-/Zahlungsdaten in der
Datenschutzerklärung ergänzen, Lösch-/Auskunftsrecht serverseitig umsetzen,
Stripe als weiterer Verarbeiter nennen. `LegalModal` entsprechend erweitern.

## Kosten (Launch)
Supabase Free (später ~25 $/mo) · Stripe nur pro Transaktion · Domain ~5–15 €/yr
· Hosting weiter kostenlos (Pages).
