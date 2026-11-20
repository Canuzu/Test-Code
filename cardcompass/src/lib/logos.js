// Franchise logos, keyed by franchise slug (cc_franchises.slug). Files live in
// public/logos/ and are served relative to the app base. To add or replace a
// logo, drop a transparent WebP/PNG/SVG (roughly 400×140, tightly cropped) into
// public/logos/ and register it here. Franchises without an entry are shown as
// a clean wordmark tile instead.
//
// Current files (rasterised/cropped from Wikimedia Commons; the marks belong to
// their owners and are used to identify the products sold): pokemon ←
// "International Pokémon logo.svg", magic ← "Magicthegathering-logo.svg",
// one-piece ← "One piece logo 1.svg", yu-gi-oh ← "Yu-Gi-Oh!.png" (red kanji
// backdrop removed); digimon, riftbound, cyberpunk ← official logo files
// supplied by the shop owner. Official artwork can replace any of them.
export const LOGOS = {
  pokemon: 'logos/pokemon.webp',
  'one-piece': 'logos/one-piece.webp',
  'yu-gi-oh': 'logos/yu-gi-oh.webp',
  magic: 'logos/magic.webp',
  digimon: 'logos/digimon.webp',
  riftbound: 'logos/riftbound.webp',
  cyberpunk: 'logos/cyberpunk.webp',
};

// If a franchise in the shop database uses a different slug, match it by name.
const ALIASES = [
  ['pokemon', /pok[eé]mon/i],
  ['one-piece', /one[\s-]*piece/i],
  ['yu-gi-oh', /yu[\s-]*gi[\s-]*oh/i],
  ['magic', /magic|\bmtg\b/i],
  ['digimon', /digimon/i],
  ['riftbound', /riftbound/i],
  ['cyberpunk', /cyberpunk/i],
];

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';

export function logoUrl(franchise) {
  if (!franchise) return null;
  const f = typeof franchise === 'string' ? { slug: franchise } : franchise;
  let key = f.slug && LOGOS[f.slug] ? f.slug : null;
  if (!key) {
    const hay = `${f.slug || ''} ${f.name || ''}`;
    key = (ALIASES.find(([k, re]) => LOGOS[k] && re.test(hay)) || [])[0] || null;
  }
  return key ? `${BASE}${LOGOS[key]}` : null;
}
