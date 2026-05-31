// Card print variants — mirrors Cardmarket's per-product "version" selector
// (Normal / Reverse Holo / Holo) shown on a card.
//
// IMPORTANT: our price feed (pokemontcg.io → Cardmarket) exposes a SINGLE price
// per card, not one price per variant. So this selector lets the user choose
// and track the variant (and is saved with a collection entry); the price shown
// stays the card's standard listing. Which variants exist is inferred from the
// rarity, the same way Cardmarket offers versions per product.

export const VARIANTS = {
  normal: { id: 'normal', label: 'Normal', short: 'N', color: '#9f9fc6' },
  reverse: { id: 'reverse', label: 'Reverse Holo', short: 'RH', color: '#48c6ff' },
  holo: { id: 'holo', label: 'Holo', short: 'H', color: '#c084fc' },
};

const lc = (r) => (r || '').toLowerCase();

// Foil class of a rarity (also used by the Discover browse filter): genuine
// foil rarities = 'holo', base Common/Uncommon/Rare prints = 'reverse'
// (they ship as reverse-holo), everything else = 'normal'.
export const foilClass = (rarity) => {
  const x = lc(rarity);
  if (!x) return 'normal';
  if (x.includes('holo') || x.includes('ultra') || x.includes('secret') || x.includes('rainbow')
    || x.includes('illustration') || x.includes('hyper') || x.includes('shiny') || x.includes('radiant')
    || x.includes('vmax') || x.includes('vstar') || x.includes('gx') || x.includes('ex')
    || x.includes('break') || x.includes('prime') || x.includes('legend') || x.includes('prism')
    || x.includes('amazing') || x.includes('ace') || /\bv\b/.test(x) || x.includes('double rare')) return 'holo';
  if (x === 'common' || x === 'uncommon' || x === 'rare') return 'reverse';
  return 'normal';
};

// Which variants Cardmarket typically offers for a card of this rarity.
export const variantsFor = (rarity) => {
  const x = lc(rarity);
  if (!x) return ['normal'];
  if (x === 'common' || x === 'uncommon' || x === 'rare') return ['normal', 'reverse']; // base print + reverse
  if (x === 'rare holo') return ['holo', 'reverse'];                                     // holo rare + reverse holo
  if (foilClass(x) === 'holo') return ['holo'];                                          // chase foils: single version
  return ['normal'];                                                                     // promos / unknown
};

export const defaultVariant = (rarity) => variantsFor(rarity)[0];
