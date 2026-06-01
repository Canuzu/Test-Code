// Consistent, client-side card localisation.
//
// The build-time PokéAPI translation is rate-limited and leaves many cards in
// English, so the same Pokémon shows up as "Glurak" on one card and "Charizard"
// on another — and search only matched the displayed name. Here we re-derive a
// CONSISTENT German display name for every card from a bundled dictionary by
// replacing the species word inside the card name (e.g. "Charizard ex" →
// "Glurak ex", "Dark Charizard" → "Dark Glurak"), and attach a `searchText`
// that contains BOTH the German and English spellings so a search for "Glurak",
// "Charizard" or "Glurak ex" all hit.
//
// Provider-aware: a per-game dictionary plugs in via DICTS. Today only Pokémon
// ships one; other TCGs keep their own (often already localized) names — but the
// bilingual searchText still applies to every game.

import { POKEDEX_DE } from '../data/pokedexDe.js';

const DICTS = { pokemon: POKEDEX_DE };

// Precompile one word-boundary matcher per dictionary (species can sit anywhere
// in the name). Unicode look-around treats apostrophes/hyphens as boundaries so
// "Farfetch'd" / "Ho-Oh" match cleanly; longest keys first so multi-word species
// (e.g. "Mr. Mime", "Tapu Koko") win over any shorter overlap.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildMatcher = (dict) => {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length).map(esc);
  try { return new RegExp(`(?<![\\p{L}])(${keys.join('|')})(?![\\p{L}])`, 'gu'); }
  catch { return new RegExp(`\\b(${keys.join('|')})\\b`, 'g'); } // fallback if look-behind unsupported
};
const MATCHERS = { pokemon: buildMatcher(POKEDEX_DE) };

export const fold = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim();

// Returns the card with a consistent German display `name`, the English `nameEn`,
// and a bilingual `searchText`.
export const localizeCard = (card, game = 'pokemon') => {
  if (!card) return card;
  const g = game || card.game;
  const dict = DICTS[g];
  const matcher = MATCHERS[g];
  const en = card.nameEn || card.name; // canonical English name
  let name = card.name;

  if (dict && matcher && en) {
    const translated = en.replace(matcher, (m) => dict[m] || m);
    if (translated !== en) name = translated;               // species mapped → German
    else if (card.name && card.nameEn && card.name !== card.nameEn) name = card.name; // keep existing German
    else name = en;                                         // unknown species → English
  }

  // Bilingual search blob: German display + English name + English base + set + nr.
  const searchText = fold([name, en, card.baseName, card.set, card.number].filter(Boolean).join(' '));
  return { ...card, name, nameEn: en, searchText };
};
