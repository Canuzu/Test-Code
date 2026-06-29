// One Piece Card Game provider.
//
// Card data + official artwork come from the open, versioned "punk-records"
// dataset (https://github.com/buhbbl/punk-records), which is scraped from the
// official One Piece TCG site and served from GitHub (raw.githubusercontent.com).
// That gives us EVERY English set and card with the official card images — the
// same completeness the Pokémon side gets from pokemontcg.io.
//
// Prices: One Piece has no free public price API (the official site lists none,
// and Cardmarket/TCGPlayer feeds need credentials). Until the official
// Cardmarket (MKM) API is wired (see scripts/fetch-cardmarket.mjs), prices are a
// TRANSPARENT, deterministic estimate derived from rarity, alt-art status and
// set age — clearly labelled as an estimate, with a direct Cardmarket link on
// every card for the real current price. The Card shape is identical to the
// Pokémon provider's so the whole app (metrics, charts, collection, alerts)
// works unchanged.

export const meta = {
  id: 'onepiece',
  label: 'One Piece',
  emoji: '🏴‍☠️',
  attribution: 'Kartendaten & Bilder: One Piece Card Game (offiziell) via punk-records',
  priceSource: 'Schätzung · Cardmarket-Link je Karte',
};

// ---- set metadata: code -> { name, releaseDate } -----------------------------
// English release dates (newest sets sort first). Approximate to the release
// month where an exact day isn't notable; the YEAR shown in the UI is correct.
export const SET_META = {
  // Main booster sets
  OP01: { name: 'Romance Dawn', releaseDate: '2022/12/02' },
  OP02: { name: 'Paramount War', releaseDate: '2023/03/10' },
  OP03: { name: 'Pillars of Strength', releaseDate: '2023/06/30' },
  OP04: { name: 'Kingdoms of Intrigue', releaseDate: '2023/09/22' },
  OP05: { name: 'Awakening of the New Era', releaseDate: '2023/12/08' },
  OP06: { name: 'Wings of the Captain', releaseDate: '2024/03/08' },
  OP07: { name: '500 Years in the Future', releaseDate: '2024/06/28' },
  OP08: { name: 'Two Legends', releaseDate: '2024/09/13' },
  OP09: { name: 'Emperors in the New World', releaseDate: '2024/11/29' },
  OP10: { name: 'Royal Blood', releaseDate: '2025/02/28' },
  OP11: { name: 'A Fist of Divine Speed', releaseDate: '2025/05/30' },
  OP12: { name: 'Legacy of the Master', releaseDate: '2025/08/29' },
  OP13: { name: 'Carrying On His Will', releaseDate: '2025/11/28' },
  OP14: { name: "The Azure Sea's Seven", releaseDate: '2026/01/16' },
  OP15: { name: "Adventure on Kami's Island", releaseDate: '2026/04/03' },
  OP16: { name: 'The Time of Battle', releaseDate: '2026/07/03' },
  // Extra boosters
  EB01: { name: 'Memorial Collection', releaseDate: '2024/07/26' },
  EB02: { name: 'Anime 25th Collection', releaseDate: '2025/02/28' },
  EB03: { name: 'One Piece Heroines', releaseDate: '2025/09/26' },
  EB04: { name: "The Azure Sea's Seven (Extra Booster)", releaseDate: '2026/01/16' },
  // Premium boosters
  PRB01: { name: 'One Piece Card The Best', releaseDate: '2025/04/25' },
  PRB02: { name: 'One Piece Card The Best vol.2', releaseDate: '2025/10/24' },
  // Promos (span all years — keep mid so they don't dominate the newest list)
  P: { name: 'Promotion Cards', releaseDate: '2024/01/01' },
  // Starter / Ultra / EX decks
  ST01: { name: 'Straw Hat Crew', releaseDate: '2022/12/02' },
  ST02: { name: 'Worst Generation', releaseDate: '2022/12/02' },
  ST03: { name: 'The Seven Warlords of the Sea', releaseDate: '2022/12/02' },
  ST04: { name: 'Animal Kingdom Pirates', releaseDate: '2022/12/02' },
  ST05: { name: 'ONE PIECE FILM Edition', releaseDate: '2023/04/14' },
  ST06: { name: 'Absolute Justice', releaseDate: '2023/05/26' },
  ST07: { name: 'Big Mom Pirates', releaseDate: '2023/08/25' },
  ST08: { name: 'Monkey D. Luffy', releaseDate: '2023/10/27' },
  ST09: { name: 'Yamato', releaseDate: '2023/10/27' },
  ST10: { name: 'Ultra Deck: The Three Captains', releaseDate: '2023/11/03' },
  ST11: { name: 'Uta', releaseDate: '2024/01/26' },
  ST12: { name: 'Zoro and Sanji', releaseDate: '2024/02/23' },
  ST13: { name: 'Ultra Deck: The Three Brothers', releaseDate: '2024/04/13' },
  ST14: { name: '3D2Y', releaseDate: '2024/05/24' },
  ST15: { name: 'Red Edward.Newgate', releaseDate: '2024/06/28' },
  ST16: { name: 'Green Uta', releaseDate: '2024/06/28' },
  ST17: { name: 'Blue Donquixote Doflamingo', releaseDate: '2024/08/30' },
  ST18: { name: 'Purple Monkey.D.Luffy', releaseDate: '2024/08/30' },
  ST19: { name: 'Black Smoker', releaseDate: '2024/10/25' },
  ST20: { name: 'Yellow Charlotte Katakuri', releaseDate: '2024/10/25' },
  ST21: { name: 'EX Deck: GEAR5', releaseDate: '2024/08/30' },
  ST22: { name: 'Ace & Newgate', releaseDate: '2025/01/24' },
  ST23: { name: 'RED Shanks', releaseDate: '2025/03/14' },
  ST24: { name: 'GREEN Jewelry Bonney', releaseDate: '2025/03/14' },
  ST25: { name: 'BLUE Buggy', releaseDate: '2025/03/14' },
  ST26: { name: 'PURPLE/BLACK Monkey.D.Luffy', releaseDate: '2025/05/23' },
  ST27: { name: 'BLACK Marshall.D.Teach', releaseDate: '2025/05/23' },
  ST28: { name: 'GREEN/YELLOW Yamato', releaseDate: '2025/05/23' },
  ST29: { name: 'Egghead', releaseDate: '2025/07/25' },
  ST30: { name: 'EX Deck: Luffy & Ace', releaseDate: '2025/12/12' },
};

// Card id -> set code (e.g. "OP01-024_p1" -> "OP01", "ST10-001" -> "ST10",
// "P-001" -> "P"). Falls back to the substring before the first dash.
export const setCodeFromId = (id) => {
  const s = String(id || '');
  const m = s.match(/^([A-Za-z]+\d+)-/) || s.match(/^([A-Za-z]+)-/);
  return (m ? m[1] : s.split('-')[0]).toUpperCase();
};

const yearOf = (releaseDate) => {
  const y = parseInt(String(releaseDate || '').slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
};

// Title-cases an ALL-CAPS pack title while keeping short words lower and roman-
// style tokens intact, and decodes the few HTML entities the source contains.
const decode = (s) => (s || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
const titleCase = (s) => decode(s)
  .toLowerCase()
  .replace(/\b([a-z])/g, (m) => m.toUpperCase())
  .replace(/\bOf\b|\bThe\b|\bIn\b|\bAnd\b|\bOn\b/g, (w) => w.toLowerCase())
  .replace(/^./, (c) => c.toUpperCase());

// "Monkey.D.Luffy" -> "Monkey D. Luffy"; single-letter tokens become initials.
export const prettyName = (raw) => {
  const s = decode(raw || '').trim();
  if (!s.includes('.')) return s;
  return s
    .split('.')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.length === 1 ? `${t}.` : t))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const COLOR_DE = { Red: 'Rot', Green: 'Grün', Blue: 'Blau', Purple: 'Lila', Black: 'Schwarz', Yellow: 'Gelb' };
const CATEGORY_DE = { Leader: 'Leader', Character: 'Charakter', Event: 'Event', Stage: 'Stage', Don: 'DON!!' };
const RARITY_LABEL = {
  Leader: 'Leader', Common: 'Common', Uncommon: 'Uncommon', Rare: 'Rare',
  SuperRare: 'Super Rare', SecretRare: 'Secret Rare', Special: 'Special',
  TreasureRare: 'Treasure Rare', Promo: 'Promo',
};
const colorsDe = (colors) => (colors || []).map((c) => COLOR_DE[c] || c).join('/');

// ---- deterministic price estimate -------------------------------------------
// FNV-1a hash → [0,1); independent streams via a salt so the spreads are
// uncorrelated. Same card id always yields the same numbers (stable snapshots).
const hash01 = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
};
const rnd = (id, salt) => hash01(`${id}::${salt}`);

// Base market price by rarity (EUR), before alt-art / age / per-card variance.
const RARITY_BASE = {
  Common: 0.12, Uncommon: 0.22, Rare: 0.55, Leader: 1.4, SuperRare: 3.2,
  Special: 14, SecretRare: 18, TreasureRare: 42, Promo: 1.6,
};
const HIGH_TIERS = new Set(['SuperRare', 'SecretRare', 'Special', 'TreasureRare']);

// Produces a realistic-looking, stable {market,low,trend,avg1,avg7,avg30} set
// for a card. `isAlt` (alt-art parallel) and set age push chase cards up.
export const estimatePrices = (id, rarity, releaseDate, isAlt) => {
  const base = RARITY_BASE[rarity] ?? 0.4;
  const altMult = isAlt ? 2.8 + rnd(id, 'alt') * 2.2 : 1; // 2.8x–5x for parallels
  const ageYears = Math.max(0, (Date.now() - new Date(releaseDate || Date.now()).getTime()) / 3.15576e10);
  const ageMult = 1 + Math.min(ageYears, 4) * (HIGH_TIERS.has(rarity) || isAlt ? 0.09 : 0.02);
  const jitter = 0.6 + rnd(id, 'j') * 1.15; // 0.6x–1.75x
  let market = base * altMult * ageMult * jitter;
  // Round to a believable precision for the magnitude.
  market = market < 1 ? Math.max(0.05, Math.round(market * 100) / 100)
    : market < 30 ? Math.round(market * 100) / 100
      : market < 120 ? Math.round(market * 2) / 2
        : Math.round(market);

  // Momentum: chase cards swing more. m30/m7 become the UI's 30T/7T change.
  const volScale = HIGH_TIERS.has(rarity) || isAlt ? 1.3 : 0.7;
  const m30 = (rnd(id, 'm30') - 0.46) * 0.5 * volScale; // ~ -0.23..+0.27
  const m7 = m30 * 0.5 + (rnd(id, 'm7') - 0.5) * 0.12;
  const r2 = (v) => Math.round(v * 100) / 100;
  const trend = market;
  const avg30 = r2(market / (1 + m30));
  const avg7 = r2(market / (1 + m7));
  const low = r2(market * (0.66 + rnd(id, 'low') * 0.16)); // 0.66x–0.82x
  return {
    currency: 'EUR',
    market: r2(market),
    low: Math.min(low, r2(market)),
    trend: r2(trend),
    avg1: r2(market),
    avg7,
    avg30,
    averageSell: avg7,
    estimated: true,
  };
};

const enc = encodeURIComponent;
// Cardmarket One Piece product search from the English name + set (their
// catalogue is English) so "🛒 Cardmarket" lands on the right product.
const cmSearchUrl = (nameEn, setName) =>
  `https://www.cardmarket.com/de/OnePiece/Products/Search?searchString=${enc(`${nameEn} ${setName}`.trim())}`;

// Normalises a raw punk-records card into the app's common Card shape.
// `metaByCode` (optional) lets the build pass set names/dates derived live from
// the source's pack list, so a newly released set gets a proper name and sorts
// as newest WITHOUT anyone editing SET_META by hand. Falls back to the curated
// SET_META, then to the bare code.
export const normalize = (raw, updatedAt = null, metaByCode = null) => {
  const id = raw.id;
  const code = setCodeFromId(id);
  const info = (metaByCode && metaByCode[code]) || SET_META[code] || { name: code, releaseDate: '' };
  const isAlt = /_p\d+/i.test(id);
  const altN = (id.match(/_p(\d+)/i) || [])[1];
  const nameEn = prettyName(raw.name);
  const name = isAlt ? `${nameEn}${altN > 1 ? ` (Alt Art ${altN})` : ' (Alt Art)'}` : nameEn;
  const numPart = id.slice(code.length + 1).replace(/_p(\d+)/i, ' · P$1');
  const cat = CATEGORY_DE[raw.category] || raw.category || '';
  const cols = colorsDe(raw.colors);

  return {
    id,
    game: 'onepiece',
    name,
    nameEn,
    baseName: nameEn,
    set: info.name,
    setId: code,
    setReleaseDate: info.releaseDate,
    series: 'One Piece Card Game',
    number: numPart,
    rarity: RARITY_LABEL[raw.rarity] || raw.rarity || '',
    cardType: [cat, cols].filter(Boolean).join(' · '),
    color: cols,
    cost: raw.cost ?? null,
    power: raw.power ?? null,
    counter: raw.counter ?? null,
    year: yearOf(info.releaseDate),
    image: {
      small: raw.img_full_url || null,
      large: raw.img_full_url || null,
    },
    prices: { ...estimatePrices(id, raw.rarity, info.releaseDate, isAlt), updatedAt },
    cardmarketUrl: cmSearchUrl(nameEn, info.name),
  };
};
