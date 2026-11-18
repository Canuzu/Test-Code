import { describe, it, expect } from 'vitest';
import { sanitizePrices } from './priceSanity.js';

describe('sanitizePrices', () => {
  it('drops a troll "cheapest offer" far above every average (Nachtara)', () => {
    const p = { market: 4989.67, low: 50000, trend: 4989.67, avg1: 5999, avg7: 4384.86, avg30: 2824.28, averageSell: 5999 };
    expect(sanitizePrices(p)).toEqual(['low']);
    expect(p.low).toBeUndefined();
    expect(p.trend).toBe(4989.67); // a genuine +77 % month stays intact
    expect(p.avg30).toBe(2824.28);
  });

  it('drops a single-sale 1-day spike', () => {
    const p = { market: 189.12, low: 5, trend: 189.12, avg1: 2200, avg7: 244.36, avg30: 74.13, averageSell: 22.62 };
    const dropped = sanitizePrices(p);
    expect(dropped).toContain('avg1');
    expect(p.avg1).toBeUndefined();
    expect(p.trend).toBe(189.12);
  });

  it('drops a stale near-zero trend (and the identical market) on a card that sells for ~20 €', () => {
    const p = { market: 0.02, low: 11.9, trend: 0.02, avg1: 22, avg7: 19.57, avg30: 25.36, averageSell: 27.41 };
    expect(sanitizePrices(p)).toEqual(['trend', 'market']);
    expect(p.avg7).toBe(19.57);
    expect(p.low).toBe(11.9);
  });

  it('drops a cheapest offer 25× below the market', () => {
    const p = { market: 54.52, low: 0.02, trend: 54.52, avg1: 29, avg7: 37.79, avg30: 26.18, averageSell: 28 };
    expect(sanitizePrices(p)).toEqual(['low']);
  });

  it('leaves plausible prices untouched', () => {
    const p = { market: 12, low: 8.5, trend: 12, avg1: 13, avg7: 11.4, avg30: 10.2, averageSell: 12.6 };
    const before = { ...p };
    expect(sanitizePrices(p)).toEqual([]);
    expect(p).toEqual(before);
  });

  it('does nothing without enough signals for a reliable reference', () => {
    const p = { market: 3, low: 300, trend: 3 };
    expect(sanitizePrices(p)).toEqual([]);
    expect(p.low).toBe(300);
    expect(sanitizePrices(null)).toEqual([]);
  });
});
