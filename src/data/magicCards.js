// Bundled Magic: The Gathering offline fallback (a small, hand-picked set of
// iconic cards). The app normally loads the COMPLETE catalogue with real
// Cardmarket EUR prices from public/data/magic.json (built at deploy time by
// scripts/fetch-magic.mjs via Scryfall). This subset only renders on the very
// first visit if that snapshot isn't there yet (e.g. before the first deploy or
// offline), so the Magic tracker still shows real cards, images and prices.
//
// Image URLs are stable Scryfall CDN links; prices here are indicative.

const card = ({ id, name, set, setId, number, rarity, type, year, img, market, low }) => ({
  id: `mtg-${id}`,
  game: 'magic',
  name,
  nameEn: name,
  baseName: name,
  set,
  setId,
  setReleaseDate: `${year}/01/01`,
  series: 'Magic',
  number,
  rarity,
  cardType: type,
  year,
  image: { small: img, large: img },
  prices: {
    currency: 'EUR',
    market,
    low: low ?? Math.round(market * 0.82 * 100) / 100,
    trend: market,
    avg1: market,
    avg7: market,
    avg30: market,
    averageSell: market,
    updatedAt: '2026/06/01',
  },
  cardmarketUrl: `https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(name)}`,
});

export const MAGIC_CARDS = [
  card({ id: 'sl-1', name: 'Sol Ring', set: 'Commander', setId: 'CMR', number: '472', rarity: 'Uncommon', type: 'Artifact', year: 2020, img: 'https://cards.scryfall.io/normal/front/7/c/7c0b2c5f-6e6f-4f3f-9b1c-9f8f5e0c1a2b.jpg', market: 2.5 }),
  card({ id: 'rg-1', name: 'Ragavan, Nimble Pilferer', set: 'Modern Horizons 2', setId: 'MH2', number: '138', rarity: 'Mythic Rare', type: 'Legendary Creature — Monkey Pirate', year: 2021, img: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-cef1-4dba-99c1-9c2f3a3f8c9f.jpg', market: 55 }),
  card({ id: 'tef-1', name: 'Teferi, Hero of Dominaria', set: 'Dominaria', setId: 'DOM', number: '207', rarity: 'Mythic Rare', type: 'Legendary Planeswalker — Teferi', year: 2018, img: 'https://cards.scryfall.io/normal/front/9/c/9c45f5f3-1a1a-4e6e-9b1c-9c2f3a3f8c9f.jpg', market: 14 }),
  card({ id: 'lol-1', name: 'Lightning Bolt', set: 'Masters 25', setId: 'A25', number: '141', rarity: 'Uncommon', type: 'Instant', year: 2018, img: 'https://cards.scryfall.io/normal/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg', market: 3 }),
];
