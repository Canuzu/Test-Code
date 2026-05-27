// Bundled demo dataset in the same shape the live provider returns. Used on
// first run and whenever the live API is unreachable, so the tracker is never
// empty. Prices are realistic Cardmarket-EUR values but are NOT live.

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
  card({ id: 'sv3pt5-199', name: 'Charizard ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '199', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 178, low: 159, trend: 178, avg1: 181, avg7: 172, avg30: 158 }),
  card({ id: 'swsh7-215', name: 'Umbreon VMAX (Alt Art)', set: 'Evolving Skies', setId: 'swsh7', number: '215', rarity: 'Secret Rare', cardType: 'Pokémon · VMAX', year: 2021, market: 612, low: 549, trend: 612, avg1: 624, avg7: 605, avg30: 560 }),
  card({ id: 'sv3pt5-205', name: 'Mew ex', set: 'Pokémon 151', setId: 'sv3pt5', number: '205', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 96, low: 84, trend: 96, avg1: 99, avg7: 92, avg30: 81 }),
  card({ id: 'base1-4', name: 'Charizard', set: 'Base Set', setId: 'base1', number: '4', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 340, low: 295, trend: 340, avg1: 338, avg7: 345, avg30: 352 }),
  card({ id: 'swsh11-186', name: 'Giratina V (Alt Art)', set: 'Lost Origin', setId: 'swsh11', number: '186', rarity: 'Ultra Rare', cardType: 'Pokémon · V', year: 2022, market: 64, low: 55, trend: 64, avg1: 66, avg7: 63, avg30: 58 }),
  card({ id: 'swsh12-211', name: 'Lugia V (Alt Art)', set: 'Silver Tempest', setId: 'swsh12', number: '211', rarity: 'Ultra Rare', cardType: 'Pokémon · V', year: 2022, market: 41, low: 35, trend: 41, avg1: 40, avg7: 42, avg30: 45 }),
  card({ id: 'sv2-185', name: 'Iono', set: 'Paldea Evolved', setId: 'sv2', number: '185', rarity: 'Special Illustration Rare', cardType: 'Trainer · Supporter', year: 2023, market: 72, low: 63, trend: 72, avg1: 75, avg7: 70, avg30: 61 }),
  card({ id: 'sv4-245', name: 'Roaring Moon ex', set: 'Paradox Rift', setId: 'sv4', number: '245', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2023, market: 58, low: 49, trend: 58, avg1: 59, avg7: 57, avg30: 52 }),
  card({ id: 'swsh12pt5-GG44', name: 'Rayquaza VMAX', set: 'Crown Zenith', setId: 'swsh12pt5', number: 'GG44', rarity: 'Galarian Gallery', cardType: 'Pokémon · VMAX', year: 2023, market: 47, low: 41, trend: 47, avg1: 46, avg7: 48, avg30: 49 }),
  card({ id: 'sv8-238', name: 'Pikachu ex', set: 'Surging Sparks', setId: 'sv8', number: '238', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2024, market: 88, low: 76, trend: 88, avg1: 92, avg7: 84, avg30: 72 }),
  card({ id: 'sv6-167', name: 'Gardevoir ex', set: 'Twilight Masquerade', setId: 'sv6', number: '167', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2024, market: 34, low: 28, trend: 34, avg1: 35, avg7: 33, avg30: 30 }),
  card({ id: 'cel25-4', name: 'Charizard', set: 'Celebrations', setId: 'cel25', number: '4', rarity: 'Holo Rare', cardType: 'Pokémon', year: 2021, market: 26, low: 22, trend: 26, avg1: 26, avg7: 26, avg30: 25 }),
  card({ id: 'sv7-152', name: 'Terapagos ex', set: 'Stellar Crown', setId: 'sv7', number: '152', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2024, market: 31, low: 26, trend: 31, avg1: 32, avg7: 30, avg30: 27 }),
  card({ id: 'sm115-SV49', name: 'Charizard GX (Shiny)', set: 'Hidden Fates', setId: 'sm115', number: 'SV49', rarity: 'Shiny Vault', cardType: 'Pokémon · GX', year: 2019, market: 119, low: 104, trend: 119, avg1: 117, avg7: 121, avg30: 126 }),
  card({ id: 'swsh9-154', name: 'Origin Forme Palkia VSTAR', set: 'Brilliant Stars', setId: 'swsh9', number: '154', rarity: 'Ultra Rare', cardType: 'Pokémon · VSTAR', year: 2022, market: 22, low: 18, trend: 22, avg1: 23, avg7: 21, avg30: 19 }),
  card({ id: 'sv3-125', name: 'Charizard ex (Obsidian Flames)', set: 'Obsidian Flames', setId: 'sv3', number: '125', rarity: 'Double Rare', cardType: 'Pokémon · ex', year: 2023, market: 18, low: 14, trend: 18, avg1: 18, avg7: 18, avg30: 17 }),
  card({ id: 'sv8pt5-160', name: 'Sylveon ex', set: 'Prismatic Evolutions', setId: 'sv8pt5', number: '160', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2025, market: 54, low: 46, trend: 54, avg1: 57, avg7: 51, avg30: 44 }),
  card({ id: 'swsh10-074', name: 'Aerodactyl V (Alt Art)', set: 'Astral Radiance', setId: 'swsh10', number: '74', rarity: 'Ultra Rare', cardType: 'Pokémon · V', year: 2022, market: 16, low: 12, trend: 16, avg1: 16, avg7: 17, avg30: 18 }),
  card({ id: 'sv2-91', name: 'Chien-Pao ex', set: 'Paldea Evolved', setId: 'sv2', number: '91', rarity: 'Double Rare', cardType: 'Pokémon · ex', year: 2023, market: 9, low: 6, trend: 9, avg1: 9.5, avg7: 8.6, avg30: 7.2 }),
  card({ id: 'base1-2', name: 'Blastoise', set: 'Base Set', setId: 'base1', number: '2', rarity: 'Rare Holo', cardType: 'Pokémon', year: 1999, market: 165, low: 142, trend: 165, avg1: 163, avg7: 167, avg30: 170 }),
  card({ id: 'neo4-9', name: 'Lugia', set: 'Neo Genesis', setId: 'neo4', number: '9', rarity: 'Rare Holo', cardType: 'Pokémon', year: 2000, market: 210, low: 178, trend: 210, avg1: 214, avg7: 206, avg30: 191 }),
  card({ id: 'sv5-151', name: 'Pikachu ex (Surfing)', set: 'Temporal Forces', setId: 'sv5', number: '151', rarity: 'Special Illustration Rare', cardType: 'Pokémon · ex', year: 2024, market: 12, low: 9, trend: 12, avg1: 12, avg7: 12, avg30: 13 }),
];
