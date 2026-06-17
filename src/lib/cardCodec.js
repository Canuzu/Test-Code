// Snapshot slimming / rehydration — shared by the build scripts (Node) and the
// app (browser), so the on-disk shape and the in-memory shape never drift.
//
// The committed public/data/*.json snapshots are several MB each, which makes
// the very first load slow (download + JSON.parse). A large share of those bytes
// is either CONSTANT for a whole file or trivially DERIVABLE per card. We strip
// those at build time and rehydrate them on load, so every component still sees
// the full, unchanged card shape.
//
//   • game            – the same value for every card in a file
//   • image.large     – Pokémon: small + "_hires"; every other game: identical
//                        to image.small (pure duplication)
//   • prices.currency – always "EUR"
//   • prices.updatedAt– usually one date for the whole snapshot → hoisted to a
//                        snapshot-level `pricesUpdatedAt`, kept per-card only when
//                        it differs (Pokémon's incremental build mixes dates)
//   • series          – not shown anywhere in the UI
//   • baseName        – almost always equals nameEn → kept only when it differs
//   • cardmarketUrl   – Pokémon: the prices.pokemontcg.io/cardmarket/<id> redirect
//                        (rebuilt from id); Yu-Gi-Oh!/One Piece: a name+set search
//                        URL that cmUrl() rederives; Magic: the exact product page,
//                        kept as a compact numeric `cmId` instead of the full URL.

// --- slim (build time) -----------------------------------------------------
function slimCard(card, game, defaultUpdatedAt) {
  const c = { ...card };
  delete c.game;   // constant per file → re-added on load from the snapshot's game
  delete c.series; // unused in the UI

  // baseName almost always duplicates nameEn (or name) → keep only when it differs.
  if (c.baseName != null && c.baseName === (c.nameEn || c.name)) delete c.baseName;

  // Keep only image.small; large is derivable (Pokémon) or identical (others).
  if (c.image && c.image.small) c.image = { small: c.image.small };

  if (c.prices && (c.prices.currency != null || c.prices.updatedAt === defaultUpdatedAt)) {
    c.prices = { ...c.prices };
    delete c.prices.currency;                                   // always EUR
    if (c.prices.updatedAt === defaultUpdatedAt) delete c.prices.updatedAt; // == snapshot default
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

// Most common prices.updatedAt across a snapshot (so the per-card field can be
// hoisted to the snapshot level for the majority and kept only for outliers).
function modeUpdatedAt(cards) {
  const counts = new Map();
  for (const c of cards) {
    const u = c && c.prices && c.prices.updatedAt;
    if (u) counts.set(u, (counts.get(u) || 0) + 1);
  }
  let best = null; let n = -1;
  for (const [u, k] of counts) if (k > n) { n = k; best = u; }
  return best;
}

// Slim a whole snapshot object: hoists pricesUpdatedAt and slims every card.
export function slimSnapshot(snap, game) {
  const cards = Array.isArray(snap && snap.cards) ? snap.cards : [];
  const mode = modeUpdatedAt(cards);
  return {
    ...snap,
    pricesUpdatedAt: mode || (snap && snap.pricesUpdatedAt) || undefined,
    cards: cards.map((c) => slimCard(c, game, mode)),
  };
}

// --- rehydrate (load time) -------------------------------------------------
// Mutates in place (the parsed JSON is owned by the caller) and returns the card.
export function rehydrateCard(card, game, pricesUpdatedAt) {
  if (!card) return card;
  const g = card.game || game;
  if (g && !card.game) card.game = g;

  if (card.baseName == null) card.baseName = card.nameEn || card.name;

  if (card.image && card.image.small && !card.image.large) {
    card.image.large = g === 'pokemon'
      ? card.image.small.replace(/\.png(\?|$)/i, '_hires.png$1')
      : card.image.small;
  }

  if (card.prices) {
    if (card.prices.currency == null) card.prices.currency = 'EUR';
    if (card.prices.updatedAt == null && pricesUpdatedAt) card.prices.updatedAt = pricesUpdatedAt;
  }

  if (!card.cardmarketUrl) {
    if (g === 'pokemon' && card.id) {
      card.cardmarketUrl = `https://prices.pokemontcg.io/cardmarket/${card.id}`;
    } else if (g === 'magic' && card.cmId != null) {
      card.cardmarketUrl = `https://www.cardmarket.com/en/Magic/Products?idProduct=${card.cmId}`;
    }
  }
  return card;
}

export function rehydrateCards(cards, game, pricesUpdatedAt) {
  if (Array.isArray(cards)) for (const c of cards) rehydrateCard(c, game, pricesUpdatedAt);
  return cards;
}
