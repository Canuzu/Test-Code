import { describe, it, expect } from 'vitest';
import { slimSnapshot, rehydrateCard } from './cardCodec.js';

// A full snapshot round-trips: slim → rehydrate restores the exact card shape
// every component relies on. This is the safety net for the payload-shrinking.

const pokemon = {
  id: 'sv1-25', game: 'pokemon', name: 'Glurak ex', nameEn: 'Charizard ex', baseName: 'Charizard ex',
  series: 'Scarlet & Violet', set: 'Obsidian Flames', setId: 'sv3', number: '25', rarity: 'Rare',
  image: { small: 'https://images.pokemontcg.io/sv3/25.png', large: 'https://images.pokemontcg.io/sv3/25_hires.png' },
  prices: { currency: 'EUR', market: 12.5, trend: 12.5, updatedAt: '2026/06/16' },
  cardmarketUrl: 'https://prices.pokemontcg.io/cardmarket/sv1-25',
};
const magic = {
  id: 'abc', game: 'magic', name: 'Wald', nameEn: 'Forest', baseName: 'Forest',
  series: 'expansion', set: 'X', setId: 'X', number: '1', rarity: 'Common',
  image: { small: 'https://cards.scryfall.io/normal/x.jpg', large: 'https://cards.scryfall.io/normal/x.jpg' },
  prices: { currency: 'EUR', market: 0.05, updatedAt: '2026/06/16' },
  cardmarketUrl: 'https://www.cardmarket.com/en/Magic/Products?idProduct=890610&referrer=scryfall',
};

describe('slimSnapshot / rehydrateCard', () => {
  it('drops constant + derivable fields when slimming Pokémon', () => {
    const slim = slimSnapshot({ cards: [pokemon] }, 'pokemon');
    const c = slim.cards[0];
    expect(slim.pricesUpdatedAt).toBe('2026/06/16');
    expect(c.game).toBeUndefined();
    expect(c.series).toBeUndefined();
    expect(c.baseName).toBeUndefined();          // == nameEn
    expect(c.image.large).toBeUndefined();
    expect(c.prices.currency).toBeUndefined();
    expect(c.prices.updatedAt).toBeUndefined();  // == snapshot default
    expect(c.cardmarketUrl).toBeUndefined();     // derivable from id
  });

  it('rehydrates Pokémon back to the original shape', () => {
    const slim = slimSnapshot({ cards: [pokemon] }, 'pokemon');
    const c = rehydrateCard({ ...slim.cards[0] }, 'pokemon', slim.pricesUpdatedAt);
    expect(c.game).toBe('pokemon');
    expect(c.baseName).toBe('Charizard ex');
    expect(c.image.large).toBe('https://images.pokemontcg.io/sv3/25_hires.png');
    expect(c.prices.currency).toBe('EUR');
    expect(c.prices.updatedAt).toBe('2026/06/16');
    expect(c.cardmarketUrl).toBe('https://prices.pokemontcg.io/cardmarket/sv1-25');
  });

  it('keeps Magic exact product as a compact cmId and rebuilds the URL', () => {
    const slim = slimSnapshot({ cards: [magic] }, 'magic');
    const s = slim.cards[0];
    expect(s.cmId).toBe(890610);
    expect(s.cardmarketUrl).toBeUndefined();
    const c = rehydrateCard({ ...s }, 'magic', slim.pricesUpdatedAt);
    expect(c.cardmarketUrl).toBe('https://www.cardmarket.com/en/Magic/Products?idProduct=890610');
    expect(c.image.large).toBe(c.image.small); // non-Pokémon: large == small
  });

  it('keeps a per-card updatedAt that differs from the snapshot default', () => {
    const a = { ...pokemon, id: 'a', prices: { ...pokemon.prices, updatedAt: '2026/06/16' } };
    const b = { ...pokemon, id: 'b', prices: { ...pokemon.prices, updatedAt: '2025/01/01' } };
    const c = { ...pokemon, id: 'c', prices: { ...pokemon.prices, updatedAt: '2026/06/16' } };
    const slim = slimSnapshot({ cards: [a, b, c] }, 'pokemon');
    expect(slim.pricesUpdatedAt).toBe('2026/06/16');          // the mode
    expect(slim.cards[0].prices.updatedAt).toBeUndefined();   // == default
    expect(slim.cards[1].prices.updatedAt).toBe('2025/01/01'); // outlier kept
  });
});
