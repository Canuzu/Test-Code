// Curated sealed products (booster packs, displays, Elite-Trainer-Boxes).
// pokemontcg.io has no sealed-product prices, so these are NOT live-priced —
// each tile links straight to the current Cardmarket price instead of showing
// a fabricated number. Add/remove sets here to curate the lists.

const SETS = [
  { set: 'Prismatic Evolutions', year: 2025 },
  { set: 'Surging Sparks', year: 2024 },
  { set: 'Stellar Crown', year: 2024 },
  { set: 'Twilight Masquerade', year: 2024 },
  { set: 'Paldean Fates', year: 2024 },
  { set: 'Pokémon 151', year: 2023 },
  { set: 'Obsidian Flames', year: 2023 },
  { set: 'Paradox Rift', year: 2023 },
  { set: 'Crown Zenith', year: 2023 },
  { set: 'Evolving Skies', year: 2021 },
  { set: 'Lost Origin', year: 2022 },
  { set: 'Brilliant Stars', year: 2022 },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const PRODUCT_TYPES = {
  booster: { label: 'Booster', suffix: 'Booster Pack', emoji: '📦', grad: ['#3b82f6', '#1e3a8a'] },
  display: { label: 'Display', suffix: 'Display (36 Booster)', emoji: '🗃️', grad: ['#f59e0b', '#b45309'] },
  etb: { label: 'Top-Trainer-Box', suffix: 'Top-Trainer-Box', emoji: '🎁', grad: ['#c084fc', '#7c3aed'] },
};

export const SEALED = SETS.flatMap(({ set, year }) =>
  Object.entries(PRODUCT_TYPES).map(([type, def]) => ({
    id: `${type}-${slug(set)}`,
    type,
    typeLabel: def.label,
    emoji: def.emoji,
    grad: def.grad,
    name: `${set} ${def.suffix}`,
    set,
    year,
    // Cardmarket search for the exact product -> current live price.
    cardmarketUrl: `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(`${set} ${def.suffix}`)}`,
  })),
);

export const SEALED_CATEGORIES = [
  { id: 'booster', label: 'Booster', emoji: '📦' },
  { id: 'display', label: 'Displays', emoji: '🗃️' },
  { id: 'etb', label: 'Top-Trainer-Box', emoji: '🎁' },
];
