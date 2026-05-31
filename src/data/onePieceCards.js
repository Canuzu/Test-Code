// Bundled One Piece Card Game demo dataset, in the same Card shape the rest of
// the app consumes. These are realistic but NOT live prices — One Piece has no
// free price API like pokemontcg.io, so the tracker ships sample data now and
// real Cardmarket-EUR prices arrive later via the official Cardmarket API
// (build-time fetcher, same path as Pokémon).
//
// No image CDN URLs are set (the One Piece art CDN isn't a stable, public,
// deterministic URL like pokemontcg.io), so the app's graceful card-art
// fallback renders a clean placeholder tile. Cardmarket links are built from the
// English name + set so "🛒 Cardmarket" lands on the right product search.

const enc = encodeURIComponent;
const cmSearch = (name, set) =>
  `https://www.cardmarket.com/en/OnePiece/Products/Search?searchString=${enc(`${name} ${set}`.trim())}`;

const card = ({ id, name, set, setId, number, rarity, cardType, color, year, market, low, trend, avg1, avg7, avg30 }) => ({
  id,
  game: 'onepiece',
  name,
  nameEn: name,
  baseName: name,
  set,
  setId,
  setReleaseDate: year ? `${year}/01/01` : '',
  series: '',
  number,
  rarity,
  cardType: [cardType, color].filter(Boolean).join(' · '),
  year,
  image: { small: null, large: null }, // graceful placeholder until a CDN is wired
  prices: {
    currency: 'EUR',
    market,
    low,
    trend: trend ?? market,
    avg1: avg1 ?? market,
    avg7,
    avg30,
    averageSell: avg7 ?? market,
    updatedAt: '2026/05/24',
  },
  cardmarketUrl: cmSearch(name, set),
});

export const ONE_PIECE_CARDS = [
  // --- Romance Dawn (OP01) ----------------------------------------------------
  card({ id: 'op01-001', name: 'Monkey D. Luffy (Leader)', set: 'Romance Dawn', setId: 'OP01', number: 'OP01-001', rarity: 'Leader', cardType: 'Leader', color: 'Rot/Grün', year: 2022, market: 9, low: 6, trend: 9, avg1: 9, avg7: 8, avg30: 7 }),
  card({ id: 'op01-025', name: 'Roronoa Zoro', set: 'Romance Dawn', setId: 'OP01', number: 'OP01-025', rarity: 'Super Rare', cardType: 'Character', color: 'Grün', year: 2022, market: 38, low: 30, trend: 38, avg1: 39, avg7: 36, avg30: 31 }),
  card({ id: 'op01-120', name: 'Shanks (Alt Art)', set: 'Romance Dawn', setId: 'OP01', number: 'OP01-120', rarity: 'Secret Rare', cardType: 'Character', color: 'Rot', year: 2022, market: 175, low: 150, trend: 175, avg1: 178, avg7: 170, avg30: 158 }),
  card({ id: 'op01-016', name: 'Trafalgar Law', set: 'Romance Dawn', setId: 'OP01', number: 'OP01-016', rarity: 'Super Rare', cardType: 'Character', color: 'Grün', year: 2022, market: 22, low: 17, trend: 22, avg1: 21, avg7: 23, avg30: 25 }),

  // --- Paramount War (OP02) ---------------------------------------------------
  card({ id: 'op02-013', name: 'Portgas D. Ace', set: 'Paramount War', setId: 'OP02', number: 'OP02-013', rarity: 'Super Rare', cardType: 'Character', color: 'Blau', year: 2023, market: 30, low: 24, trend: 30, avg1: 31, avg7: 29, avg30: 26 }),
  card({ id: 'op02-114', name: 'Sabo (Alt Art)', set: 'Paramount War', setId: 'OP02', number: 'OP02-114', rarity: 'Secret Rare', cardType: 'Character', color: 'Blau/Schwarz', year: 2023, market: 64, low: 52, trend: 64, avg1: 66, avg7: 61, avg30: 55 }),
  card({ id: 'op02-018', name: 'Marco', set: 'Paramount War', setId: 'OP02', number: 'OP02-018', rarity: 'Super Rare', cardType: 'Character', color: 'Blau', year: 2023, market: 14, low: 11, trend: 14, avg1: 14, avg7: 13, avg30: 12 }),

  // --- Pillars of Strength (OP03) --------------------------------------------
  card({ id: 'op03-001', name: 'Monkey D. Luffy (Gear 5 Leader)', set: 'Pillars of Strength', setId: 'OP03', number: 'OP03-001', rarity: 'Leader', cardType: 'Leader', color: 'Lila/Gelb', year: 2023, market: 12, low: 9, trend: 12, avg1: 12, avg7: 11, avg30: 10 }),
  card({ id: 'op03-112', name: 'Yamato (Alt Art)', set: 'Pillars of Strength', setId: 'OP03', number: 'OP03-112', rarity: 'Secret Rare', cardType: 'Character', color: 'Gelb', year: 2023, market: 48, low: 40, trend: 48, avg1: 47, avg7: 49, avg30: 52 }),

  // --- Kingdoms of Intrigue (OP04) -------------------------------------------
  card({ id: 'op04-056', name: 'Boa Hancock', set: 'Kingdoms of Intrigue', setId: 'OP04', number: 'OP04-056', rarity: 'Super Rare', cardType: 'Character', color: 'Lila', year: 2023, market: 26, low: 21, trend: 26, avg1: 27, avg7: 25, avg30: 22 }),
  card({ id: 'op04-118', name: 'Charlotte Katakuri (Alt Art)', set: 'Kingdoms of Intrigue', setId: 'OP04', number: 'OP04-118', rarity: 'Secret Rare', cardType: 'Character', color: 'Gelb', year: 2023, market: 41, low: 34, trend: 41, avg1: 40, avg7: 42, avg30: 45 }),

  // --- Awakening of the New Era (OP05) ---------------------------------------
  card({ id: 'op05-060', name: 'Eustass "Captain" Kid', set: 'Awakening of the New Era', setId: 'OP05', number: 'OP05-060', rarity: 'Super Rare', cardType: 'Character', color: 'Schwarz', year: 2024, market: 18, low: 14, trend: 18, avg1: 18, avg7: 17, avg30: 15 }),
  card({ id: 'op05-119', name: 'Monkey D. Luffy (Alt Art)', set: 'Awakening of the New Era', setId: 'OP05', number: 'OP05-119', rarity: 'Secret Rare', cardType: 'Character', color: 'Lila/Gelb', year: 2024, market: 95, low: 80, trend: 95, avg1: 98, avg7: 91, avg30: 82 }),

  // --- Legendary heroes / staples --------------------------------------------
  card({ id: 'op06-069', name: 'Kuzan (Aokiji)', set: 'Wings of the Captain', setId: 'OP06', number: 'OP06-069', rarity: 'Super Rare', cardType: 'Character', color: 'Schwarz/Blau', year: 2024, market: 20, low: 16, trend: 20, avg1: 21, avg7: 19, avg30: 17 }),
  card({ id: 'op07-119', name: 'Nami (Alt Art)', set: 'Tribute to Crown', setId: 'OP07', number: 'OP07-119', rarity: 'Secret Rare', cardType: 'Character', color: 'Blau', year: 2024, market: 58, low: 47, trend: 58, avg1: 59, avg7: 55, avg30: 49 }),
];
