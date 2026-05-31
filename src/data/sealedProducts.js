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

// Per-game accessors used by the UI.
export const sealedFor = (game) => (game === 'onepiece' ? ONE_PIECE_SEALED : SEALED);
export const sealedCategoriesFor = (game) => (game === 'onepiece' ? ONE_PIECE_SEALED_CATEGORIES : SEALED_CATEGORIES);
