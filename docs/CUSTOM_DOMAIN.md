# Eigene Domain einrichten

Die Seite läuft aktuell unter `https://canuzu.github.io/Test-Code/`. Mit einer
eigenen Domain (z. B. `cartograph.de`) wirkt sie professioneller und ist besser
fürs Branding/SEO. Schritte:

## 1. Domain kaufen
Bei einem Registrar deiner Wahl (z. B. Namecheap, Porkbun, INWX, Cloudflare).

## 2. DNS auf GitHub Pages zeigen
**Apex-Domain** (`cartograph.de`) — vier A-Records (GitHub Pages IPs):
```
A   @   185.199.108.153
A   @   185.199.109.153
A   @   185.199.110.153
A   @   185.199.111.153
```
optional zusätzlich AAAA-Records (IPv6) laut GitHub-Doku.

**www-Subdomain** (`www.cartograph.de`) — ein CNAME:
```
CNAME   www   canuzu.github.io.
```
(DNS-Propagation kann bis zu einige Stunden dauern.)

## 3. Domain im Repo setzen (ein Befehl)
```
node scripts/set-domain.mjs cartograph.de
```
Das schreibt `public/CNAME` und stellt alle absoluten URLs (Open Graph/Twitter,
JSON-LD, `sitemap.xml`, `robots.txt`) auf die neue Domain um. Danach committen &
pushen → der Deploy übernimmt die Domain.

Zurück zur Projekt-URL: `node scripts/set-domain.mjs --revert`.

## 4. In GitHub aktivieren
Repo → **Settings → Pages → Custom domain**: Domain eintragen, speichern.
Anschließend **„Enforce HTTPS"** anhaken (Zertifikat wird automatisch von GitHub
ausgestellt, kann ein paar Minuten dauern).

## 5. Prüfen
- `https://deine-domain` lädt die App.
- `https://deine-domain/sitemap.xml` und `/robots.txt` zeigen die neue Domain.
- In den Repo-Settings steht „DNS check successful".

## Hinweis: Clickjacking-Schutz
`frame-ancestors` / `X-Frame-Options` lassen sich nicht per `<meta>` setzen
(siehe `SECURITY.md`). Mit einer eigenen Domain hinter z. B. Cloudflare kannst du
diese Header dort ergänzen.
