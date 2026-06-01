// Consistent, client-side card localisation.
//
// The build's per-card PokéAPI translation is unreliable (the card baseName
// often carries a suffix like "ex", so the species lookup misses), which left
// the same Pokémon as "Glurak" on one card and "Charizard" on another and broke
// search. Here we re-derive a CONSISTENT German display name for every card by
// replacing the species word inside the card name, using two dictionaries:
//
//   1. pokedexDe.generated.json — the authoritative German Pokédex (~1010
//      species, slug→DE) that the build accumulated from PokéAPI over time and
//      committed into the snapshot. Accurate; covers the long tail.
//   2. pokedexDe.js — a hand-curated seed (Gen 1 complete + multi-word/punctuated
//      species like "Mr. Mime", "Ho-Oh", "Tapu Koko") that fills any gap.
//
// Generated wins where both have an entry; curated fills the rest. We also build
// a bilingual `searchText` (German + English + base + set + number) so a search
// for "Glurak", "Charizard" or "Glurak ex" all hit — for EVERY game.

import { POKEDEX_DE } from '../data/pokedexDe.js';
import GENERATED from '../data/pokedexDe.generated.json';

const DICT_GAMES = { pokemon: true };

// Slugify a card-name token the same way the build keyed deNames.
const slugify = (s) => (s || '')
  .toLowerCase()
  .replace(/[.'’:]/g, '')
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/(^-|-$)/g, '');

const titleCase = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);

// Matcher keys: every curated English species + each single-word generated slug
// (title-cased to match how species appear in card names). Longest first so
// multi-word species win. Hyphenated/punctuated species are covered by curated.
const matcherKeys = (() => {
  const set = new Set(Object.keys(POKEDEX_DE));
  for (const slug of Object.keys(GENERATED)) if (/^[a-z0-9]+$/.test(slug)) set.add(titleCase(slug));
  return [...set].sort((a, b) => b.length - a.length);
})();

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildMatcher = (keys) => {
  try { return new RegExp(`(?<![\\p{L}])(${keys.map(esc).join('|')})(?![\\p{L}])`, 'gu'); }
  catch { return new RegExp(`\\b(${keys.map(esc).join('|')})\\b`, 'g'); } // look-behind fallback
};
const MATCHER = buildMatcher(matcherKeys);

// Authoritative generated value first, curated as fallback.
const toGerman = (token) => GENERATED[slugify(token)] || POKEDEX_DE[token] || token;

export const fold = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim();

// Returns the card with a consistent German `name`, the English `nameEn`, and a
// bilingual `searchText`.
export const localizeCard = (card, game = 'pokemon') => {
  if (!card) return card;
  const g = game || card.game;
  const en = card.nameEn || card.name; // canonical English name
  let name = card.name;

  if (DICT_GAMES[g] && en) {
    const translated = en.replace(MATCHER, (m) => toGerman(m));
    if (translated !== en) name = translated;                 // species mapped → German
    else if (card.name && card.nameEn && card.name !== card.nameEn) name = card.name; // keep existing German
    else name = en;                                           // unknown species → English
  }

  const searchText = fold([name, en, card.baseName, card.set, card.number].filter(Boolean).join(' '));
  return { ...card, name, nameEn: en, searchText };
};
