# CardCompass – neuer Shop

Neuaufbau von **cardcompass.de**: Online-Shop für Trading Cards, Displays, Booster und Zubehör.
Design in Weiß und Royal-Lila (`#8b00ff`), animiert, mobil optimiert, mit Dunkelmodus.

- **Technik:** React 18 + Vite, React Router, eigenes CSS (keine UI-Bibliothek), Icons von lucide-react, Schriften lokal (Inter + Poppins, keine Google-Fonts-Abfrage → DSGVO).
- **Daten:** dieselbe Supabase-Datenbank wie die bisherige Seite (`cc_products`, `cc_product_variants`, `cc_inventory`, `cc_product_images`, `cc_franchises`, `cc_categories`, …).
  Ohne Supabase-Zugangsdaten läuft der Shop mit einem eingebauten **Demo-Katalog** (für Vorschau & Entwicklung).
- **Bezahlung:** Stripe Checkout (Karte, PayPal, Klarna, SEPA, Apple Pay, Google Pay) über zwei Supabase Edge Functions – siehe [`docs/STRIPE-SETUP.md`](docs/STRIPE-SETUP.md).

## Vorschau

Die Design-Vorschau (Demo-Produkte, keine echten Bestellungen, nicht in Suchmaschinen) wird bei jedem Push auf `main` automatisch gebaut:
**https://canuzu.github.io/Test-Code/cardcompass/**

## Lokal starten

```bash
cd cardcompass
npm install
npm run dev          # http://localhost:5173 – Demo-Katalog
```

## Für cardcompass.de bauen (Livegang)

1. `.env.example` nach `.env.production` kopieren und `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` eintragen
   (beide öffentlich, stehen im Supabase-Dashboard unter *Project Settings → API*).
2. **Betreiberangaben eintragen:** in `.env.production` über `VITE_OPERATOR_NAME`, `_STREET`, `_CITY`, `_EMAIL`,
   `_PHONE` (so bleiben sie aus dem öffentlichen Repository heraus) – oder direkt in `src/content/operator.js`.
   Solange noch `[[…]]` gilt, zeigen Impressum, Kontakt, Widerruf und Datenschutz einen gelben Platzhalter-Hinweis.
3. `npm run build` → der Ordner `dist/` ist die fertige Website.
4. `dist/` beim bisherigen Hoster von cardcompass.de hochladen. Wichtig: Der Hoster muss alle unbekannten Pfade auf
   `index.html` umleiten (SPA-Fallback), damit Adressen wie `/shop` oder `/produkt/…` direkt funktionieren.
   - Cloudflare Pages / Netlify: Datei `public/_redirects` mit `/* /index.html 200` (liegt bereits bei).
   - Vercel: `vercel.json` mit Rewrite auf `/index.html` (liegt bereits bei).
5. Bezahlung erst nach [`docs/STRIPE-SETUP.md`](docs/STRIPE-SETUP.md) einschalten (`VITE_STRIPE_ENABLED=1`).
   Bis dahin zeigt die Kasse – wie bisher – „Die Bezahlung wird gerade eingerichtet".

## Einmalig in Supabase prüfen

- **Auth → URL Configuration:** `https://cardcompass.de/konto` und `https://cardcompass.de/konto/neues-passwort`
  als erlaubte Redirect-URLs eintragen (sonst funktionieren Bestätigungs- und Passwort-Links nicht).
- **Edge Function `submit-withdrawal`:** Das Widerrufsformular ruft sie genau wie die bisherige Seite auf
  (`{ name, email, order_number, scope?, confirm: true }`). Sie ist im Supabase-Projekt vorhanden, ihr Quellcode
  liegt aber nicht in diesem Repository – bitte prüfen, dass sie weiter deployt ist.
- **Datenschutzerklärung:** Der neue Abschnitt zu Stripe ist im Text als „Neu · vor Livegang rechtlich prüfen"
  markiert (`draft: true` in `src/content/legal.js`). Nach der Prüfung `draft: true` entfernen.
- **Cookie-Tabelle** in `src/content/legal.js` nennt die gespeicherten Schlüssel (`cc_cart_v1`, `cc_theme`,
  `cc_reload_at`, `cc_auth`). Werden die im Code umbenannt, die Tabelle mitziehen.

## Ungeprüft (kein Datenbankzugriff beim Bau)

Der neue Shop nutzt dieselben Tabellen und Felder, die die bisherige Seite abfragt. Die Datenbank selbst konnte ich
nicht einsehen. Vor dem Livegang einmal mit echten Daten prüfen:

- Produkte, Bilder (Storage-Bucket `product-images`), Lagerbestand und Kategorien erscheinen richtig.
- Kategorie-Zuordnung über `cc_product_categories` (Beziehung Produkt → Kategorie).
- Spalten der Bestelltabellen für die Stripe-Funktionen (siehe `docs/STRIPE-SETUP.md`).

## Struktur

```
src/
  pages/        Start, Shop, Produkt, Warenkorb, Kasse, Konto, Rechtliches, Kontakt, Widerruf
  components/   Header (Suche, Mega-Menü), Footer, Warenkorb-Schublade, Produktkarte, Produkt-Grafiken
  lib/          catalog.js (Daten), cart.jsx (Warenkorb), checkout.js, auth.js, config.js, routes.js
  content/      legal.js (Rechtstexte), operator.js (Betreiberangaben)
  styles/       base.css (Design-Tokens), layout.css, product.css, home.css, …
supabase/       Edge Functions (create-checkout, stripe-webhook) + SQL-Migration
docs/           STRIPE-SETUP.md
```
