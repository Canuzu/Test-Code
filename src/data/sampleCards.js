// Bundled demo dataset in the same shape the live provider returns. Used on
// first run and whenever the live API is unreachable, so the tracker is never
// empty. Prices are realistic Cardmarket-EUR values but are NOT live.
//
// Cards are deliberately chosen to be iconic, well-identified pieces (WOTC-era
// holos + famous modern alt arts) so the deterministic pokemontcg.io image URLs
// (images.pokemontcg.io/<setId>/<number>.png) resolve in the browser. In live
// mode the API supplies exact image URLs and real Cardmarket product links.

const card = ({ id, name, set, setId, number, rarity, cardType, year, market, low, trend, avg1, avg7, avg30 }) => ({
  id,
  game: 'pokemon',
  name,
  baseName: name,
  set,
  setId,
  series: '',
  number,
  rarity,
  cardType,
  year,
  image: {
    small: `https://images.pokemontcg.io/${setId}/${number}.png`,
    large: `https://images.pokemontcg.io/${setId}/${number}_hires.png`,
  },
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
  cardmarketUrl: null,
});

export const SAMPLE_CARDS = [
  // --- Modern chase / alt arts -------------------------------------------
  card({ id: 'swsh7-215', name: 'Umbreon VMAX (Alt Art)', set: 'Evolving Skies', setId: 'swsh7', number: '215', rarity: 'Secret Rare', cardType: 'Pokémon · VMAX', year: 2021, market: 612, low: 549, trend: 612, avg1: 624, avg7: 605, avg30: 560 }),
  card({ id: 'sv3pt5-199', name: 'Charizard ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '199', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 178, low: 159, trend: 178, avg1: 181, avg7: 172, avg30: 158 }),
  card({ id: 'swsh7-218', name: 'Rayquaza VMAX (Alt Art)', set: 'Evolving Skies', setId: 'swsh7', number: '218', rarity: 'Secret Rare', cardType: 'Pokémon · VMAX', year: 2021, market: 158, low: 138, trend: 158, avg1: 161, avg7: 155, avg30: 146 }),
  card({ id: 'sv3pt5-205', name: 'Mew ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '205', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 96, low: 84, trend: 96, avg1: 99, avg7: 92, avg30: 81 }),
  card({ id: 'swsh7-212', name: 'Sylveon VMAX (Alt Art)', set: 'Evolving Skies', setId: 'swsh7', number: '212', rarity: 'Secret Rare', cardType: 'Pokémon · VMAX', year: 2021, market: 70, low: 60, trend: 70, avg1: 69, avg7: 71, avg30: 75 }),
  card({ id: 'swsh11-186', name: 'Giratina V (Alt Art)', set: 'Lost Origin', setId: 'swsh11', number: '186', rarity: 'Ultra Rare', cardType: 'Pokémon · V', year: 2022, market: 64, low: 55, trend: 64, avg1: 66, avg7: 63, avg30: 58 }),
  card({ id: 'swsh7-209', name: 'Glaceon VMAX (Alt Art)', set: 'Evolving Skies', setId: 'swsh7', number: '209', rarity: 'Secret Rare', cardType: 'Pokémon · VMAX', year: 2021, market: 42, low: 35, trend: 42, avg1: 41, avg7: 43, avg30: 46 }),
  card({ id: 'swsh12-186', name: 'Lugia V (Alt Art)', set: 'Silver Tempest', setId: 'swsh12', number: '186', rarity: 'Ultra Rare', cardType: 'Pokémon · V', year: 2022, market: 41, low: 35, trend: 41, avg1: 40, avg7: 42, avg30: 45 }),
  card({ id: 'sv3pt5-200', name: 'Blastoise ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '200', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 35, low: 29, trend: 35, avg1: 34, avg7: 36, avg30: 38 }),
  card({ id: 'sv3pt5-198', name: 'Venusaur ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '198', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 32, low: 27, trend: 32, avg1: 33, avg7: 31, avg30: 28 }),
  card({ id: 'sv3-125', name: 'Charizard ex (Obsidian Flames)', set: 'Obsidian Flames', setId: 'sv3', number: '125', rarity: 'Double Rare', cardType: 'Pokémon · ex', year: 2023, market: 18, low: 14, trend: 18, avg1: 18, avg7: 18, avg30: 17 }),

  // --- Vintage / WOTC-era holos ------------------------------------------
  card({ id: 'base1-4', name: 'Charizard', set: 'Base Set', setId: 'base1', number: '4', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 340, low: 295, trend: 340, avg1: 338, avg7: 345, avg30: 352 }),
  card({ id: 'neo1-9', name: 'Lugia', set: 'Neo Genesis', setId: 'neo1', number: '9', rarity: 'Rare Holo', cardType: 'Pokémon', year: 2000, market: 210, low: 178, trend: 210, avg1: 214, avg7: 206, avg30: 191 }),
  card({ id: 'base1-15', name: 'Venusaur', set: 'Base Set', setId: 'base1', number: '15', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 175, low: 150, trend: 175, avg1: 178, avg7: 172, avg30: 168 }),
  card({ id: 'base1-2', name: 'Blastoise', set: 'Base Set', setId: 'base1', number: '2', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 165, low: 142, trend: 165, avg1: 163, avg7: 167, avg30: 170 }),
  card({ id: 'base1-10', name: 'Mewtwo', set: 'Base Set', setId: 'base1', number: '10', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 95, low: 80, trend: 95, avg1: 96, avg7: 94, avg30: 92 }),
  card({ id: 'base1-16', name: 'Zapdos', set: 'Base Set', setId: 'base1', number: '16', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 58, low: 49, trend: 58, avg1: 57, avg7: 59, avg30: 61 }),
  card({ id: 'base1-1', name: 'Alakazam', set: 'Base Set', setId: 'base1', number: '1', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 36, low: 30, trend: 36, avg1: 36, avg7: 36, avg30: 35 }),
  card({ id: 'base1-58', name: 'Pikachu', set: 'Base Set', setId: 'base1', number: '58', rarity: 'Common', cardType: 'Pokémon', year: 1999, market: 38, low: 31, trend: 38, avg1: 39, avg7: 37, avg30: 35 }),
];
