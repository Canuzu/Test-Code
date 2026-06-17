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
1. **Auth + Cloud-Sync** — ✅ **implementiert** (Code liegt vor, siehe Aktivierung
   unten). Lokales Konto bleibt Fallback, wenn nicht konfiguriert.
2. **Stripe-Billing** — ✅ **implementiert**. Checkout + Customer Portal +
   Webhook flippen `profiles.plan`; `pro.js` `planIsPro()` liest den Plan, sobald
   `VITE_STRIPE_PRICE_ID` gesetzt ist (sonst alles frei).
3. **Live-Preise on-demand** — ✅ **implementiert**. `prices`-Edge-Function +
   „Live aktualisieren"-Button im Karten-Dialog (gegated über `VITE_LIVE_PRICES`).

## Aktivierung von Phase 1 (Auth + Cloud-Sync)

Der Code ist da und **opt-in**: ohne die zwei Env-Vars läuft die App rein lokal
(lokales Konto, kein Sync) — das Supabase-SDK wird dann nicht einmal ausgeliefert
(Dead-Code-Elimination). So schaltest du es scharf:

1. **Supabase-Projekt** anlegen (Region möglichst EU, z. B. Frankfurt).
2. **Migration** ausführen: Dashboard → SQL Editor → Inhalt von
   `supabase/migrations/0001_init.sql` einfügen → Run. (Legt `profiles` +
   `user_state` mit Row-Level-Security + Profil-Trigger an.)
3. **Auth** → Email-Provider aktivieren. E-Mail-Bestätigung: an = sicher
   (Nutzer bestätigt per Mail), aus = sofortiger Login (gut zum Testen).
4. **Keys** aus Project Settings → API holen (`Project URL`, `anon` key) und
   setzen:
   - lokal: `.env.example` → `.env.local` kopieren und beide Werte eintragen.
   - Deploy: in GitHub → Settings → Secrets and variables → Actions →
     **Variables** `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` anlegen.
     `deploy.yml` reicht sie bereits an den Build durch — **kein Code-Change**.
5. Neu deployen. Der „Anmelden"-Dialog ist jetzt echtes Supabase-Auth; Sammlung/
   Watchlist/Alerts/Settings synchronisieren geräteübergreifend.

**Datenschutz nicht vergessen:** mit aktivem Backend Supabase als Auftrags-
verarbeiter (AVV/EU-Region) + Account-Daten in `LegalModal` ergänzen.

### Was synchronisiert (und was nicht)
Synchronisiert: Watchlist, Portfolio/Sammlung, Verkäufe, Notizen, Tags, Alerts,
Buylist, Einstellungen. Bewusst **lokal**: der Karten-Snapshot-Cache und die
Preis-Historie (groß bzw. lokal regenerierbar). Konfliktregel Phase 1:
last-write-wins per `updated_at` (Login zieht den Cloud-Stand). Echtes Live-Merge
über Realtime ist ein späterer Schritt.

### Architektur im Code
`src/lib/supabase.js` (lazy Client + `isConfigured`) · `authBackend.js`
(Supabase **oder** lokal, gleiche Signaturen) · `cloudSync.js` (pull/push über
`user_state`, hängt am `setWriteHook` aus `storage.js`) · Integration in
`store.jsx` (login/register/logout + Session-Restore). Alles gegated über
`isConfigured`.

## Aktivierung von Phase 2 (Stripe-Billing)

Voraussetzung: Phase 1 läuft. Solange `VITE_STRIPE_PRICE_ID` leer ist, bleibt
alles kostenlos und ungegated.

1. **Migration** `supabase/migrations/0002_billing.sql` ausführen (Stripe-Spalten).
2. **Stripe** (Test-Modus zuerst): Produkt + wiederkehrenden Preis anlegen →
   `price_…`-ID notieren.
3. **Edge Functions deployen** (Supabase CLI):
   ```
   supabase functions deploy create-checkout
   supabase functions deploy customer-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. **Function-Secrets** setzen:
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_ID=price_… \
     STRIPE_WEBHOOK_SECRET=whsec_… APP_URL=https://<deine-domain>/
   ```
   (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` werden
   automatisch injiziert.)
5. **Webhook** in Stripe anlegen → Endpoint = URL der `stripe-webhook`-Function;
   Events mindestens: `checkout.session.completed`,
   `customer.subscription.created/updated/deleted`. Das `whsec_…` aus Schritt 4.
6. **Frontend scharf schalten**: Repo-Variables `VITE_STRIPE_PRICE_ID` (und
   optional `VITE_STRIPE_PRICE_LABEL`, z. B. „9 € / Monat") setzen → neu deployen.
   Ab jetzt sind `PRO_FEATURES` (Buylist, Alerts, Import, Pro-Analytics) ein Abo;
   der „Pro abonnieren"-Button im Preis-Dialog startet echtes Stripe-Checkout, der
   Webhook setzt `plan='pro'`, Rückkehr `?billing=success` aktualisiert den Status.

> **Achtung:** Sobald `VITE_STRIPE_PRICE_ID` gesetzt ist, sind die Pro-Features
> nicht mehr gratis. Erst aktivieren, wenn du wirklich monetarisieren willst.

## Aktivierung von Phase 3 (Live-Preise)

1. `supabase functions deploy prices --no-verify-jwt`
   (optional `supabase secrets set POKEMONTCG_API_KEY=…` für höhere Limits).
2. Repo-Variable `VITE_LIVE_PRICES=true` setzen → neu deployen.
3. Im Karten-Dialog erscheint „🔄 Live-Preis aktualisieren". Quellen: Magic
   (Scryfall, echte Cardmarket-EUR), Pokémon (pokemontcg.io). One Piece / Yu-Gi-Oh!
   sind Schätzungen → kein Live-Preis.

## One Piece / Yu-Gi-Oh!: echte Cardmarket-Preise (statt Schätzung)

Standardmäßig sind diese Kataloge Schätzungen. Mit den vier MKM-Secrets
(`CM_APP_TOKEN`, `CM_APP_SECRET`, `CM_ACCESS_TOKEN`, `CM_ACCESS_SECRET`, in
`deploy.yml` bereits verdrahtet) ersetzt der Build echte Cardmarket-Preise:

- **Standard (Namens-Suche):** schnell, ersetzt nur die Top-Karten (die per
  Suchbegriff gefundenen ~Hunderte).
- **Vollständige Abdeckung (opt-in):** Repo-**Variable** `CM_ONEPIECE_FULL=1`
  setzen. Der Build crawlt dann **jede Expansion → jedes Single →
  `priceGuide`**, sodass **alle ~4.390 One-Piece-Karten** echte MKM-Preise
  bekommen. Der Crawl ist:
  - **request-budget- und rate-limit-fest** — er liest MKMs
    `X-Request-Limit-*`-Header und stoppt rechtzeitig vor dem Tageslimit (≈5k
    bei nicht-kommerziellen, deutlich mehr bei Professional-Accounts) bzw. bei
    HTTP 429;
  - **resümierbar** — bereits bepreiste Produkte werden über `cmPid` im
    Snapshot gemerkt und in Folgeläufen übersprungen. Mit knappem Tagesbudget
    füllt sich die Abdeckung so über mehrere (täglich per Cron getriggerte)
    Läufe auf, ohne Budget doppelt auszugeben.
  - Optionale Stellschrauben als Repo-Variablen: `CM_MAX_PRODUCTS` (Produkte
    pro Lauf, Default 4500) und `CM_CONCURRENCY` (parallele Requests, Default 4).

  Mit einem Professional-MKM-Account (hohes Tageslimit) ist die volle Abdeckung
  in einem Lauf erreicht; mit einem nicht-kommerziellen Account dauert es einige
  Läufe. Sobald alle Karten echte Preise haben, kennzeichnet der Snapshot
  `pricesEstimated: false` und die UI zeigt keinen Schätzungs-Hinweis mehr.

## Recht (wichtig)
Mit Accounts ändert sich der Datenschutz: Supabase wird **Auftragsverarbeiter**
(AVV/DPA abschließen, Region wählen, möglichst EU), Account-/Zahlungsdaten in der
Datenschutzerklärung ergänzen, Lösch-/Auskunftsrecht serverseitig umsetzen,
Stripe als weiterer Verarbeiter nennen. `LegalModal` entsprechend erweitern.

## Kosten (Launch)
Supabase Free (später ~25 $/mo) · Stripe nur pro Transaktion · Domain ~5–15 €/yr
· Hosting weiter kostenlos (Pages).
