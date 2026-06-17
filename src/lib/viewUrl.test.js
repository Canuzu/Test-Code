import { describe, it, expect } from 'vitest';
import { viewToHash, hashToView } from './viewUrl.js';

describe('viewToHash', () => {
  it('encodes landing, game/tab, set and card', () => {
    expect(viewToHash({ game: '' })).toBe('#/');
    expect(viewToHash({ game: 'pokemon', tab: 'discover' })).toBe('#/pokemon/discover');
    expect(viewToHash({ game: 'pokemon', tab: 'discover', discSet: 'sv3' })).toBe('#/pokemon/discover/set/sv3');
    expect(viewToHash({ game: 'magic', tab: 'discover', discSet: 'X', modalId: 'abc-1' })).toBe('#/magic/discover/set/X/card/abc-1');
  });
});

describe('hashToView', () => {
  it('round-trips with viewToHash', () => {
    const v = { game: 'pokemon', tab: 'watchlist', discSet: null, modalId: null };
    expect(hashToView(viewToHash(v))).toEqual(v);
    const v2 = { game: 'yugioh', tab: 'discover', discSet: 'LOB', modalId: 'uuid-9' };
    expect(hashToView(viewToHash(v2))).toEqual(v2);
  });

  it('falls back safely on garbage / unknown game or tab', () => {
    expect(hashToView('')).toEqual({ game: '', tab: 'discover', discSet: null, modalId: null });
    expect(hashToView('#/nonsense/foo')).toEqual({ game: '', tab: 'discover', discSet: null, modalId: null });
    expect(hashToView('#/pokemon/bogus')).toEqual({ game: 'pokemon', tab: 'discover', discSet: null, modalId: null });
  });
});
