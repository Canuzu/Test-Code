// Snapshot slimming / rehydration — shared by the build scripts (Node) and the
// app (browser), so the on-disk shape and the in-memory shape never drift.
//
// The committed public/data/*.json snapshots are 11–14 MB each, which makes the
// very first load slow (download + JSON.parse). A large share of those bytes is
// either CONSTANT for a whole file or trivially DERIVABLE per card:
//
//   • game            – the same value for every card in a file
//   • image.large     – Pokémon: small + "_hires"; every other game: identical
//                        to image.small (so it is pure duplication)
//   • prices.currency – always "EUR"
//   • cardmarketUrl   – Pokémon: the prices.pokemontcg.io/cardmarket/<id> redirect
//                        (rebuilt from id); Yu-Gi-Oh!/One Piece: a name+set search
//                        URL that cmUrl() rederives; Magic: the exact product page,
//                        kept as a compact numeric `cmId` instead of the full URL.
//
// `slimCards` strips those at build time; `rehydrateCards` puts them back on load
// so every component still sees the full, unchanged card shape.

// --- slim (build time) -----------------------------------------------------
export function slimCard(card, game) {
  const c = { ...card };
  delete c.game; // constant per file → re-added on load from the snapshot's game

  // Keep only image.small; large is derivable (Pokémon) or identical (others).
  if (c.image && c.image.small) c.image = { small: c.image.small };

  // prices.currency is always EUR.
  if (c.prices && c.prices.currency != null) {
    c.prices = { ...c.prices };
    delete c.prices.currency;
  }

  // cardmarketUrl: drop when derivable; keep Magic's exact product as a number.
  const url = c.cardmarketUrl;
  if (url) {
    if (game === 'pokemon' && /prices\.pokemontcg\.io\/cardmarket\//i.test(url)) {
      delete c.cardmarketUrl; // == prices.pokemontcg.io/cardmarket/<id>
    } else if (game === 'magic') {
      const m = url.match(/idProduct=(\d+)/);
      if (m) { c.cmId = Number(m[1]); delete c.cardmarketUrl; }
    } else if (/\/Products\/Search\?/i.test(url)) {
      delete c.cardmarketUrl; // a name+set search → cmUrl() rebuilds it
    }
  }
  return c;
}

export function slimCards(cards, game) {
  return (cards || []).map((c) => slimCard(c, game));
}

// --- rehydrate (load time) -------------------------------------------------
// Mutates in place (the parsed JSON is owned by the caller) and returns the card.
export function rehydrateCard(card, game) {
  if (!card) return card;
  const g = card.game || game;
  if (g && !card.game) card.game = g;

  if (card.image && card.image.small && !card.image.large) {
    card.image.large = g === 'pokemon'
      ? card.image.small.replace(/\.png(\?|$)/i, '_hires.png$1')
      : card.image.small;
  }

  if (card.prices && card.prices.currency == null) card.prices.currency = 'EUR';

  if (!card.cardmarketUrl) {
    if (g === 'pokemon' && card.id) {
      card.cardmarketUrl = `https://prices.pokemontcg.io/cardmarket/${card.id}`;
    } else if (g === 'magic' && card.cmId != null) {
      card.cardmarketUrl = `https://www.cardmarket.com/en/Magic/Products?idProduct=${card.cmId}`;
    }
  }
  return card;
}

export function rehydrateCards(cards, game) {
  if (Array.isArray(cards)) for (const c of cards) rehydrateCard(c, game);
  return cards;
}
