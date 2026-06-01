// Yu-Gi-Oh! provider.
//
// Card data + official artwork come from the open YGOJSON dataset
// (https://github.com/iconmaster5326/YGOJSON, aggregate branch), regenerated
// daily from public sources. It carries every TCG card with images, localized
// (incl. German) names, card types and set membership — the same completeness
// the Pokémon/One Piece sides have.
//
// Prices: Yu-Gi-Oh! has no free public EUR price API, so prices are a
// TRANSPARENT, deterministic estimate from rarity + card type + age (same
// approach as One Piece), clearly labelled, with a Cardmarket link per card for
// the real current price. The official Cardmarket (MKM) API can later replace
// the estimate (scripts/fetch-cardmarket.mjs, game 'yugioh').

export const meta = {
  id: 'yugioh',
  label: 'Yu-Gi-Oh!',
  emoji: '🐉',
  attribution: 'Kartendaten & Bilder: YGOJSON (yugipedia/ygoprodeck)',
  priceSource: 'Schätzung · Cardmarket-Link je Karte',
};

const yearOf = (releaseDate) => {
  const y = parseInt(String(releaseDate || '').slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
};

// German labels for the card supertypes YGOJSON exposes.
const TYPE_DE = { monster: 'Monster', spell: 'Zauber', trap: 'Falle', skill: 'Skill', token: 'Token' };

// Display rarity (YGOJSON uses lowercase slugs on set entries).
const RARITY_LABEL = {
  common: 'Common', normal: 'Common', short: 'Short Print', shortprint: 'Short Print',
  rare: 'Rare', super: 'Super Rare', ultra: 'Ultra Rare',
  secret: 'Secret Rare', ultimate: 'Ultimate Rare', ghost: 'Ghost Rare',
  starlight: 'Starlight Rare', collector: "Collector's Rare",
  prismaticsecret: 'Prismatic Secret Rare', '25thsecret': '25th Secret Rare', '20thsecret': '20th Secret Rare',
  platinum: 'Platinum Rare', gold: 'Gold Rare', goldsecret: 'Gold Secret Rare', mosaic: 'Mosaic Rare',
  parallel: 'Parallel Rare', normalparallel: 'Normal Parallel Rare', commonparallel: 'Parallel Rare',
  superparallel: 'Super Parallel Rare', ultraparallel: 'Ultra Parallel Rare', secretparallel: 'Secret Parallel Rare',
  ultrasecret: 'Ultra Secret Rare', extrasecret: 'Extra Secret Rare', extrasecretparallel: 'Extra Secret Rare',
  millenium: 'Millennium Rare', milleniumgold: 'Millennium Gold Rare', starfoil: 'Starfoil Rare',
  kccommon: 'Common', kcrare: 'Rare', 'rare-purple': 'Rare', 'secret-blue': 'Secret Rare',
  duelterminal: 'Duel Terminal', dtpc: 'Duel Terminal', dtpsp: 'Duel Terminal',
  dtspr: 'Duel Terminal', dtupr: 'Duel Terminal', dtrpr: 'Duel Terminal',
};
export const rarityLabel = (r) => {
  const k = (r || '').toLowerCase();
  if (RARITY_LABEL[k]) return RARITY_LABEL[k];
  if (k.startsWith('dt')) return 'Duel Terminal';
  return r ? r.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Common';
};

// ---- deterministic price estimate (stable per card) --------------------------
const hash01 = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
};
const rnd = (id, salt) => hash01(`${id}::${salt}`);

// Base market price (EUR) by display rarity, before age/variance.
const RARITY_BASE = {
  Common: 0.15, 'Short Print': 0.3, Rare: 0.4, 'Super Rare': 1.1, 'Ultra Rare': 2.4,
  'Gold Rare': 1.6, 'Platinum Rare': 2.2, 'Parallel Rare': 1.4, 'Duel Terminal': 0.8,
  'Secret Rare': 6, 'Prismatic Secret Rare': 12, 'Ultimate Rare': 14, 'Ghost Rare': 22,
  "Collector's Rare": 28, 'Starlight Rare': 60, '25th Secret Rare': 18,
  'Mosaic Rare': 1.2, 'Normal Parallel Rare': 1.2, 'Super Parallel Rare': 2, 'Ultra Parallel Rare': 3,
};
const HIGH = new Set(['Secret Rare', 'Prismatic Secret Rare', 'Ultimate Rare', 'Ghost Rare', "Collector's Rare", 'Starlight Rare', '25th Secret Rare']);

export const estimatePrices = (id, rarityDisp, releaseDate) => {
  const base = RARITY_BASE[rarityDisp] ?? 0.4;
  const ageYears = Math.max(0, (Date.now() - new Date(releaseDate || Date.now()).getTime()) / 3.15576e10);
  // Older chase rarities appreciate; bulk commons stay flat.
  const ageMult = 1 + Math.min(ageYears, 20) * (HIGH.has(rarityDisp) ? 0.05 : 0.01);
  const jitter = 0.6 + rnd(id, 'j') * 1.2;
  let market = base * ageMult * jitter;
  market = market < 1 ? Math.max(0.05, Math.round(market * 100) / 100)
    : market < 30 ? Math.round(market * 100) / 100
      : market < 120 ? Math.round(market * 2) / 2
        : Math.round(market);
  const volScale = HIGH.has(rarityDisp) ? 1.2 : 0.6;
  const m30 = (rnd(id, 'm30') - 0.48) * 0.42 * volScale;
  const m7 = m30 * 0.5 + (rnd(id, 'm7') - 0.5) * 0.1;
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    currency: 'EUR',
    market: r2(market),
    low: r2(market * (0.66 + rnd(id, 'low') * 0.16)),
    trend: r2(market),
    avg1: r2(market),
    avg7: r2(market / (1 + m7)),
    avg30: r2(market / (1 + m30)),
    averageSell: r2(market / (1 + m7)),
    estimated: true,
  };
};

const enc = encodeURIComponent;
const cmSearchUrl = (name) =>
  `https://www.cardmarket.com/de/YuGiOh/Products/Search?searchString=${enc(name || '')}`;

// Normalises a pre-shaped Yu-Gi-Oh card (already flattened by the build script)
// into the app's common Card shape. `raw` carries: id, name, nameEn, image,
// cardType, rarity (display), setName, setId, releaseDate.
export const normalize = (raw, updatedAt = null) => {
  const id = raw.id;
  const year = yearOf(raw.releaseDate);
  return {
    id,
    game: 'yugioh',
    name: raw.name,
    nameEn: raw.nameEn || raw.name,
    baseName: raw.nameEn || raw.name,
    set: raw.setName || 'Yu-Gi-Oh!',
    setId: raw.setId || '',
    setReleaseDate: raw.releaseDate || '',
    series: 'Yu-Gi-Oh! TCG',
    number: raw.number || '',
    rarity: raw.rarity || 'Common',
    cardType: [TYPE_DE[raw.cardType] || raw.cardType, raw.subType].filter(Boolean).join(' · '),
    year,
    image: { small: raw.image || null, large: raw.image || null },
    prices: { ...estimatePrices(id, raw.rarity || 'Common', raw.releaseDate), updatedAt },
    cardmarketUrl: cmSearchUrl(raw.nameEn || raw.name),
  };
};
