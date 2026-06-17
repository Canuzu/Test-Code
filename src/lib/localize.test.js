import { describe, it, expect } from 'vitest';
import { fold, localizeCard } from './localize.js';

describe('fold', () => {
  it('lowercases and strips diacritics for accent-insensitive search', () => {
    expect(fold('Pokémon')).toBe('pokemon');
    expect(fold('  Glücksrad ')).toBe('glucksrad');
  });
});

describe('localizeCard (Pokémon)', () => {
  it('maps the English species to its German name', () => {
    const c = localizeCard({ name: 'Charizard ex', nameEn: 'Charizard ex', game: 'pokemon' }, 'pokemon');
    expect(c.name).toBe('Glurak ex');
    expect(c.nameEn).toBe('Charizard ex');
  });

  it('translates Trainer/Item cards via the dictionary', () => {
    const c = localizeCard({ name: 'Ultra Ball', nameEn: 'Ultra Ball', game: 'pokemon' }, 'pokemon');
    expect(c.name).toBe('Hyperball');
  });

  it('builds a bilingual searchText so DE and EN both match', () => {
    const c = localizeCard({ name: 'Charizard ex', nameEn: 'Charizard ex', set: 'Obsidian Flames', number: '125', game: 'pokemon' }, 'pokemon');
    expect(c.searchText).toContain('glurak');
    expect(c.searchText).toContain('charizard');
    expect(c.searchText).toContain('obsidian');
  });

  it('keeps unknown names in English (never invents a wrong name)', () => {
    const c = localizeCard({ name: 'Totally Made Up Card', nameEn: 'Totally Made Up Card', game: 'pokemon' }, 'pokemon');
    expect(c.name).toBe('Totally Made Up Card');
  });
});
