# Changelog

Alle nennenswerten Änderungen an Cartograph. Neueste zuerst.

## [Unreleased]
### Hinzugefügt
- Animierte Start-Symbole für **Magic** (Mana-Rad) und **Yu-Gi-Oh!** (Millennium-Puzzle).
- **Hilfe & FAQ**-Seite (Footer & Landing) mit Support-Kontakt.
- Optionale, **cookielose Analytics** (Plausible/GoatCounter), standardmäßig aus.

### Geändert
- **Schnelleres Laden:** Kartendaten‑Snapshots ~35–42 % kleiner (konstante/ableitbare
  Felder werden beim Build entfernt und beim Laden rekonstruiert); Service Worker
  liefert Daten *stale-while-revalidate* (sofort aus Cache).
- **Navigation:** Zurück/Vor und **Reload** behalten Spiel, Tab, Unteransicht und
  Scroll-Position bei (kein Sprung mehr auf die Startseite/nach oben).
- **Mehr deutsche Namen:** Pokémon Trainer-/Item-/Energie-Wörterbuch erweitert.

---

_Format lose angelehnt an [Keep a Changelog](https://keepachangelog.com/de/)._
