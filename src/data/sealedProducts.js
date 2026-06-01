// Curated sealed products (booster packs, displays, Elite-Trainer-Boxes).
// pokemontcg.io has no sealed-product prices, so these are NOT live-priced —
// each tile links straight to the current Cardmarket price instead of showing
// a fabricated number. Tiles use the official set logo as the image.
//
// Sealed products are per-game: `sealedFor(game)` / `sealedCategoriesFor(game)`
// return the Pokémon set below or the One Piece set generated from set metadata.

import { SET_META } from './providers/onepiece.js';

const SETS = [
  { set: 'Prismatische Entwicklungen', setEn: 'Prismatic Evolutions', year: 2025, setId: 'sv8pt5' },
  { set: 'Elektrische Funken', setEn: 'Surging Sparks', year: 2024, setId: 'sv8' },
  { set: 'Strahlende Krone', setEn: 'Stellar Crown', year: 2024, setId: 'sv7' },
  { set: 'Twilights Maskerade', setEn: 'Twilight Masquerade', year: 2024, setId: 'sv6' },
  { set: 'Paldeas Schicksale', setEn: 'Paldean Fates', year: 2024, setId: 'sv4pt5' },
  { set: 'Pokémon 151', setEn: 'Pokémon 151', year: 2023, setId: 'sv3pt5' },
  { set: 'Obsidianflammen', setEn: 'Obsidian Flames', year: 2023, setId: 'sv3' },
  { set: 'Paradoxrift', setEn: 'Paradox Rift', year: 2023, setId: 'sv4' },
  { set: 'Krönender Höhepunkt', setEn: 'Crown Zenith', year: 2023, setId: 'swsh12pt5' },
  { set: 'Himmelsscheibe', setEn: 'Evolving Skies', year: 2021, setId: 'swsh7' },
  { set: 'Verlorener Ursprung', setEn: 'Lost Origin', year: 2022, setId: 'swsh11' },
  { set: 'Strahlende Sterne', setEn: 'Brilliant Stars', year: 2022, setId: 'swsh9' },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const PRODUCT_TYPES = {
  // `suffix` is the German display label. `cmTerm` MUST match Cardmarket's
  // (English) sealed-product catalogue, otherwise the search returns nothing:
  // e.g. Cardmarket lists "Elite Trainer Box", never the German "Top-Trainer-Box".
  booster: { label: 'Booster', suffix: 'Booster Pack', cmTerm: 'Booster', emoji: '📦', grad: ['#3b82f6', '#1e3a8a'] },
  display: { label: 'Display', suffix: 'Display (36 Booster)', cmTerm: 'Booster Box', emoji: '🗃️', grad: ['#f59e0b', '#b45309'] },
  etb: { label: 'Top-Trainer-Box', suffix: 'Top-Trainer-Box', cmTerm: 'Elite Trainer Box', emoji: '🎁', grad: ['#c084fc', '#7c3aed'] },
};

// Cardmarket product search using the English set + product term. The term must
// match Cardmarket's catalogue ("Elite Trainer Box", "Booster Box") so the
// result lands on the actual sealed product instead of an empty page.
const cmSealedUrl = (setEn, cmTerm) =>
  `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(`${setEn} ${cmTerm}`)}`;

export const SEALED = SETS.flatMap(({ set, setEn, year, setId }) =>
  Object.entries(PRODUCT_TYPES).map(([type, def]) => ({
    id: `${type}-${slug(setEn)}`,
    type,
    typeLabel: def.label,
    emoji: def.emoji,
    grad: def.grad,
    name: `${set} ${def.suffix}`,
    set,
    year,
    logo: `https://images.pokemontcg.io/${setId}/logo.png`,
    cardmarketUrl: cmSealedUrl(setEn, def.cmTerm),
  })),
);

export const SEALED_CATEGORIES = [
  { id: 'booster', label: 'Booster', emoji: '📦' },
  { id: 'display', label: 'Displays', emoji: '🗃️' },
  { id: 'etb', label: 'Top-Trainer-Box', emoji: '🎁' },
];

// ---- One Piece sealed --------------------------------------------------------
// Generated from the set metadata: every booster/extra/premium set gets a
// Booster + Display tile, and every deck gets a Starter-Deck tile. There is no
// One Piece sealed price feed either, so each tile links to the live Cardmarket
// price; the artwork is the set's first card (a stable official image URL).
const enc = encodeURIComponent;
const cmOpUrl = (term) => `https://www.cardmarket.com/de/OnePiece/Products/Search?searchString=${enc(term)}`;
const opCardImg = (code) => `https://en.onepiece-cardgame.com/images/cardlist/card/${code}-001.png`;
const opYear = (code) => parseInt((SET_META[code]?.releaseDate || '').slice(0, 4), 10) || 0;
const opSort = (codes) => [...codes].sort((a, b) => (SET_META[b].releaseDate || '').localeCompare(SET_META[a].releaseDate || ''));

const OP_BOOSTER_CODES = opSort(Object.keys(SET_META).filter((c) => /^(OP|EB|PRB)\d+$/.test(c)));
const OP_STARTER_CODES = opSort(Object.keys(SET_META).filter((c) => /^ST\d+$/.test(c)));

export const ONE_PIECE_SEALED = [
  ...OP_BOOSTER_CODES.flatMap((code) => {
    const name = SET_META[code].name;
    const year = opYear(code);
    return [
      { id: `op-booster-${code}`, type: 'booster', typeLabel: 'Booster', emoji: '📦', grad: ['#e23b3b', '#7a1010'], name: `${name} Booster`, set: name, year, logo: opCardImg(code), cardmarketUrl: cmOpUrl(`${name} Booster`) },
      { id: `op-display-${code}`, type: 'display', typeLabel: 'Display', emoji: '🗃️', grad: ['#ffb300', '#a86d00'], name: `${name} Display`, set: name, year, logo: opCardImg(code), cardmarketUrl: cmOpUrl(`${name} Display`) },
    ];
  }),
  ...OP_STARTER_CODES.map((code) => {
    const name = SET_META[code].name;
    return { id: `op-starter-${code}`, type: 'starter', typeLabel: 'Starter Deck', emoji: '🎴', grad: ['#448aff', '#1e3a8a'], name: `${name} [${code}]`, set: name, year: opYear(code), logo: opCardImg(code), cardmarketUrl: cmOpUrl(`${name} ${code}`) };
  }),
];

export const ONE_PIECE_SEALED_CATEGORIES = [
  { id: 'booster', label: 'Booster', emoji: '📦' },
  { id: 'display', label: 'Displays', emoji: '🗃️' },
  { id: 'starter', label: 'Starter Decks', emoji: '🎴' },
];

// ---- Magic / Yu-Gi-Oh sealed (data-driven) -----------------------------------
// These games have hundreds of sets, so instead of a static list we derive
// Booster + Display tiles from the sets present in the loaded catalogue. The
// tile artwork is the set's priciest card; each links to the live Cardmarket
// price for that set's sealed product.
const CM_GAME_PATH = { magic: 'Magic', yugioh: 'YuGiOh' };
const GAME_GRAD = { magic: [['#8b5cf6', '#4c1d95'], ['#3b82f6', '#1e3a8a']], yugioh: [['#f59e0b', '#92400e'], ['#b45309', '#78350f']] };

const sealedFromCards = (game, cards) => {
  const path = CM_GAME_PATH[game];
  if (!path || !Array.isArray(cards) || !cards.length) return [];
  // Group cards by set, remember newest release + top card (for artwork).
  const sets = new Map();
  for (const c of cards) {
    const key = c.setId || c.set;
    if (!key || !c.set) continue;
    let g = sets.get(key);
    if (!g) { g = { name: c.set, year: c.year || 0, date: c.setReleaseDate || '', top: c }; sets.set(key, g); }
    if ((c.prices?.market ?? 0) > (g.top?.prices?.market ?? 0)) g.top = c;
    if (c.setReleaseDate && c.setReleaseDate > g.date) g.date = c.setReleaseDate;
    if (c.year && c.year > g.year) g.year = c.year;
  }
  const grad = GAME_GRAD[game] || GAME_GRAD.magic;
  const sorted = [...sets.values()].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.year - a.year).slice(0, 80);
  return sorted.flatMap((s) => {
    const logo = s.top?.image?.small || s.top?.image?.large || null;
    return [
      { id: `${game}-booster-${s.name}`, type: 'booster', typeLabel: 'Booster', emoji: '📦', grad: grad[0], name: `${s.name} Booster`, set: s.name, year: s.year, logo, cardmarketUrl: `https://www.cardmarket.com/de/${path}/Products/Search?searchString=${enc(`${s.name} Booster`)}` },
      { id: `${game}-display-${s.name}`, type: 'display', typeLabel: 'Display', emoji: '🗃️', grad: grad[1], name: `${s.name} Display`, set: s.name, year: s.year, logo, cardmarketUrl: `https://www.cardmarket.com/de/${path}/Products/Search?searchString=${enc(`${s.name} Display`)}` },
    ];
  });
};

const DATA_DRIVEN_CATEGORIES = [
  { id: 'booster', label: 'Booster', emoji: '📦' },
  { id: 'display', label: 'Displays', emoji: '🗃️' },
];

// Per-game accessors used by the UI. `cards` is only needed for the data-driven
// games (Magic / Yu-Gi-Oh); Pokémon & One Piece use their curated static lists.
export const sealedFor = (game, cards) => {
  if (game === 'onepiece') return ONE_PIECE_SEALED;
  if (game === 'magic' || game === 'yugioh') return sealedFromCards(game, cards);
  return SEALED;
};
export const sealedCategoriesFor = (game) => {
  if (game === 'onepiece') return ONE_PIECE_SEALED_CATEGORIES;
  if (game === 'magic' || game === 'yugioh') return DATA_DRIVEN_CATEGORIES;
  return SEALED_CATEGORIES;
};
