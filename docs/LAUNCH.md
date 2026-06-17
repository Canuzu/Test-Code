# Launch-Checkliste

Kurzreferenz für den Go-Live. Stand: Juni 2026.

## 1. Impressum ausfüllen (Pflicht in DE)

In `src/lib/site.js` das `OPERATOR`-Objekt — alle `[[…]]` ersetzen (Name,
Anschrift, E-Mail). Repo nach `[[` durchsuchen, es darf danach **kein** `[[`
mehr geben. Die Angaben speisen Impressum, Datenschutz und (sofern Pro aktiv)
AGB/Widerruf zentral.

## 1b. Bezahltes Pro / Stripe aktivieren (optional)

Pro-Abo ist standardmäßig **aus**. Zum Aktivieren `VITE_STRIPE_PRICE_ID` (Live-
Price-ID) als Build-Env setzen — erst dann gilt `billingEnabled` und im
Rechtliches-Modal erscheinen automatisch **AGB** und **Widerrufsbelehrung** für
das Pro-Abo.

- ⚠️ **AGB + Widerrufsbelehrung sind Vorlagen** — vor dem ersten Verkauf
  **anwaltlich prüfen** lassen (Pflichtangaben, Widerruf bei digitalen
  Diensten, Verbraucherschutz).
- ⚠️ **Marken-/Bildrechte:** Kommerzialisierung erhöht das Risiko von
  Abmahnungen/C&D durch die Rechteinhaber (Pokémon/Nintendo, Bandai, Konami,
  WotC) deutlich, weil offizielle Namen und Kartenbilder genutzt werden.
  Mitigation: Pro-Mehrwert von den geschützten Inhalten entkoppeln (eigene
  Tools/Daten statt fremder Bilder als Verkaufsargument), Bilder nicht spiegeln
  sondern aus erlaubten Quellen nachladen, ggf. Cardmarket-Affiliate statt Abo,
  und im Zweifel rechtlich beraten lassen.
- Stripe-Webhooks/Backend gemäß `docs/BACKEND.md` einrichten; Erstattung &
  Kündigung müssen funktionieren (siehe AGB §5 / Widerruf).

## 2. Eigene Domain (#10)

Die App nutzt relative Asset-Pfade (`vite base: './'`), läuft also ohne Änderung
sowohl unter `canuzu.github.io/Test-Code/` als auch unter einer eigenen Domain.

### Domain-Vorschläge (Verfügbarkeit prüfen)
- `cartograph-tcg.de` — passend für den DE/EU-Fokus (Cardmarket)
- `cartograph.cards` — sprechende TLD
- `cartograph.app` — erzwingt HTTPS (haben wir ohnehin)
- `getcartograph.com` — falls `.de`/`.cards` belegt

### Registrar
- **Cloudflare Registrar** — zum Einkaufspreis, ohne Marge (Domain muss dort per
  Transfer liegen)
- **Netcup / INWX** — gute deutsche Anbieter, günstige `.de`
- **Namecheap** — international

### Anbinden an GitHub Pages
1. Domain kaufen.
2. `public/CNAME` anlegen mit **einer Zeile** = deiner Domain (z. B.
   `cartograph-tcg.de`). Sie landet so im Build-Artefakt.
3. Repo → **Settings → Pages → Custom domain** = dieselbe Domain eintragen,
   **„Enforce HTTPS"** aktivieren.
4. DNS beim Registrar setzen:
   - **Subdomain** (`tcg.deinedomain.de`): `CNAME tcg → canuzu.github.io`
   - **Root/Apex** (`deinedomain.de`): vier A-Records auf GitHubs Pages-IPs
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (+ optional AAAA auf die IPv6-Pendants). Aktuelle IPs in den
     GitHub-Pages-Docs gegenprüfen.
5. **Absolute URLs aktualisieren** (Social-Preview): in `index.html` die fünf
   `og:`/`twitter:`-URLs + `og:url` auf die neue Domain umstellen. (`manifest`
   und Asset-Pfade sind relativ → bleiben unverändert.)

## 3. Nach dem ersten Deploy verifizieren (#6, #8)
- Magic-Katalog gefüllt? → `https://<domain>/data/magic.json` sollte `count > 0`
  zeigen (Actions-Log: `[fetch-magic] ✓ wrote …`).
- `node scripts/smoke-data.mjs` lokal nach `git pull` (alle vier Kataloge OK).
- Karten-Bilder aller Spiele laden (v. a. Yu-Gi-Oh! über den wsrv.nl-Proxy).
