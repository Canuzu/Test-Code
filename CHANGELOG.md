# Changelog

Alle nennenswerten Änderungen an Cartograph. Neueste zuerst.

## [Unreleased]
### Hinzugefügt
- Animierte Start-Symbole für **Magic** (Mana-Rad) und **Yu-Gi-Oh!** (Millennium-Puzzle).
- **Hilfe & FAQ**-Seite (Footer & Landing) mit Support-Kontakt.
- Optionale, **cookielose Analytics** (Plausible/GoatCounter), standardmäßig aus.
- Optionales **Fehler-Monitoring** (Sentry-DSN oder Webhook), standardmäßig aus.
- **Automatisierte Tests** (Vitest) + CI-Workflow (Tests + Smoke + Build je Push/PR).
- **Teilbare Links** via URL-Hash (Spiel/Tab/Set/Karte) + dynamische Seitentitel;
  `robots.txt`, `sitemap.xml`, JSON-LD für SEO.
- **Barrierefreiheit:** Fokus-Falle, Escape-Schließen und ARIA-Rollen für alle Modals.
- **Eigene Domain** vorbereitet: `scripts/set-domain.mjs` + `docs/CUSTOM_DOMAIN.md`.

### Geändert
- **Geschätzte Preise** (Yu-Gi-Oh!/One Piece) werden jetzt pro Karte klar mit „≈"
  und „(geschätzt)" gekennzeichnet.

### Geändert
- **Schnelleres Laden:** Kartendaten‑Snapshots ~35–42 % kleiner (konstante/ableitbare
  Felder werden beim Build entfernt und beim Laden rekonstruiert); Service Worker
  liefert Daten *stale-while-revalidate* (sofort aus Cache).
- **Navigation:** Zurück/Vor und **Reload** behalten Spiel, Tab, Unteransicht und
  Scroll-Position bei (kein Sprung mehr auf die Startseite/nach oben).
- **Mehr deutsche Namen:** Pokémon Trainer-/Item-/Energie-Wörterbuch erweitert.

---

_Format lose angelehnt an [Keep a Changelog](https://keepachangelog.com/de/)._
