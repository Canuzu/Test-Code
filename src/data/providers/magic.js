// Magic: The Gathering provider.
//
// Card data, official artwork AND real Cardmarket (EUR) prices come from
// Scryfall's free bulk data (https://scryfall.com/docs/api/bulk-data), fetched
// server-side at deploy time (Scryfall blocks browser CORS for bulk files).
// Scryfall exposes `prices.eur` / `prices.eur_foil` straight from Cardmarket —
// so unlike One Piece / Yu-Gi-Oh!, Magic ships with GENUINE EU prices, no
// estimate needed. Card shape is identical to the other games.

export const meta = {
  id: 'magic',
  label: 'Magic: The Gathering',
  emoji: '🔮',
  attribution: 'Kartendaten, Bilder & Preise: Scryfall (Cardmarket EUR)',
  priceSource: 'Cardmarket EU (via Scryfall)',
};

const yearOf = (releaseDate) => {
  const y = parseInt(String(releaseDate || '').slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
};

const num = (v) => {
  const x = typeof v === 'string' ? parseFloat(v) : v;
  return typeof x === 'number' && !Number.isNaN(x) ? x : null;
};

// Title-cases Scryfall's lowercase rarity ("mythic" → "Mythic").
const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', mythic: 'Mythic Rare', special: 'Special', bonus: 'Bonus' };

// Picks the best image URL from a Scryfall card (handles double-faced cards).
const imageOf = (raw) => {
  if (raw.image_uris) return raw.image_uris.normal || raw.image_uris.large || raw.image_uris.small || null;
  const face = Array.isArray(raw.card_faces) ? raw.card_faces.find((f) => f.image_uris) : null;
  return face?.image_uris?.normal || face?.image_uris?.large || null;
};

// Normalises a raw Scryfall card into the app's common Card shape. Prices are
// REAL Cardmarket EUR (eur = non-foil trend, eur_foil = foil). We seed the
// short-term averages from the single Scryfall price point; the app then
// accumulates genuine measured points over daily snapshots (same as Pokémon).
export const normalize = (raw, updatedAt = null) => {
  const p = raw.prices || {};
  const eur = num(p.eur) ?? num(p.eur_foil);
  if (eur == null) return null; // keep only cards that carry a real EUR price
  const image = imageOf(raw);
  const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
  return {
    id: raw.id,
    game: 'magic',
    name: raw.printed_name || raw.name, // printed_name is localized when present
    nameEn: raw.name,
    baseName: raw.name,
    set: raw.set_name || '',
    setId: (raw.set || '').toUpperCase(),
    setReleaseDate: raw.released_at ? raw.released_at.replace(/-/g, '/') : '',
    series: raw.set_type || 'Magic',
    number: raw.collector_number || '',
    rarity: RARITY_LABEL[raw.rarity] || raw.rarity || '',
    cardType: raw.type_line || '',
    year: yearOf(raw.released_at),
    image: { small: image, large: image },
    prices: {
      currency: 'EUR',
      market: eur,
      low: r2(eur * 0.82),
      trend: eur,
      avg1: eur,
      avg7: eur,
      avg30: eur,
      averageSell: eur,
      updatedAt,
    },
    cardmarketUrl: raw.purchase_uris?.cardmarket
      || `https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(raw.name || '')}`,
  };
};
