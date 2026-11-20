// Franchise logo tile (Pokémon, Magic, …) used by the compass, menus, shop
// filters and banners: a white tile with the official logo. Franchises without
// a logo file yet (see src/lib/logos.js) get a typographic wordmark in their own
// colour instead, so there is never an empty colour block.
//
// size: 'xs' chips · 'sm' menu lists · 'md' cards · 'lg' compass dial · 'xl' banner
// The tile is decorative (the franchise name is always next to it or on the
// surrounding control), so it is hidden from assistive tech.
import { logoUrl } from '../lib/logos.js';

const SMALL = new Set(['xs', 'sm']);

// "One Piece" → OP, "Yu-Gi-Oh!" → YGO, "Riftbound" → R
export function monogram(f) {
  const words = String(f?.short || f?.name || '').replace(/[^\p{L}\p{N}\s-]/gu, '').split(/[\s-]+/).filter(Boolean);
  if (!words.length) return '·';
  return (words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join('') : words[0][0]).toUpperCase();
}

export default function FranchiseLogo({ franchise, size = 'sm', className = '', icon: Icon }) {
  if (!franchise) return null;
  const src = Icon ? null : logoUrl(franchise);
  const style = { '--c1': franchise.c1 || '#b26bff', '--c2': franchise.c2 || '#4c0099' };
  let body;
  if (Icon) {
    body = <><Icon className="flogo-ic" strokeWidth={2} />{!SMALL.has(size) && <span className="flogo-word">{franchise.short || franchise.name}</span>}</>;
  } else if (src) {
    body = <img src={src} alt="" loading="lazy" decoding="async" draggable="false" />;
  } else if (SMALL.has(size)) {
    body = <span className="flogo-mono">{monogram(franchise)}</span>;
  } else {
    body = <span className="flogo-word">{franchise.short || franchise.name}</span>;
  }
  return (
    <span className={`flogo flogo-${size} ${src ? 'has-img' : 'is-text'} ${className}`} style={style} aria-hidden="true">
      {body}
    </span>
  );
}
