import { describe, it, expect } from 'vitest';
import { getTier, change, marketPrice, enrich } from './metrics.js';

describe('getTier', () => {
  it('maps scores to tiers at the documented thresholds', () => {
    expect(getTier(85).l).toBe('S');
    expect(getTier(70).l).toBe('A');
    expect(getTier(60).l).toBe('B');
    expect(getTier(50).l).toBe('C');
    expect(getTier(35).l).toBe('D');
    expect(getTier(10).l).toBe('F');
  });
});

describe('change', () => {
  it('computes the percentage move vs the windowed average', () => {
    expect(change({ market: 110, avg7: 100 }, 7)).toBeCloseTo(10, 5);
    expect(change({ market: 90, avg30: 100 }, 30)).toBeCloseTo(-10, 5);
  });
  it('returns null when data is missing', () => {
    expect(change({}, 7)).toBeNull();
  });
});

describe('marketPrice', () => {
  it('prefers trend, then market', () => {
    expect(marketPrice({ trend: 5, market: 7 })).toBe(5);
    expect(marketPrice({ market: 7 })).toBe(7);
  });
});

describe('enrich', () => {
  it('attaches derived metrics, a tier and a bilingual searchText', () => {
    const c = enrich({
      id: 'sv3-25', game: 'pokemon', name: 'Charizard ex', nameEn: 'Charizard ex',
      prices: { market: 12.5, trend: 12.5, avg7: 10, avg30: 9 },
    });
    expect(c.m).toBeTruthy();
    expect(typeof c.m.score).toBe('number');
    expect(c.m.tier.l).toBeTruthy();
    expect(c.name).toBe('Glurak ex');           // localized
    expect(c.searchText).toContain('charizard'); // still searchable in English
  });
});
