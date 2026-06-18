import { useId } from 'react';

// Per-game brand marks for the game-selection tiles and the header chip.
//
// ORIGINAL, genre-inspired icons — NOT reproductions of the trademarked TCG
// logos. Each is a clean WHITE glyph; interior detail is created by NEGATIVE
// SPACE (cut-outs via a mask) so the tile's colour shows through. A top-lit
// white gradient plus a soft drop shadow lift the glyph off the tile so it reads
// crisp and a little three-dimensional instead of flat.
//
// `useId` gives every instance unique gradient/mask/filter ids so multiple marks
// on the page (e.g. a tile + the header chip) never clash.
export default function GameMark({ id, size = 34 }) {
  const uid = useId().replace(/:/g, '');
  const g = `g-${uid}`;
  const m = `m-${uid}`;
  const sh = `s-${uid}`;
  const common = { width: size, height: size, viewBox: '0 0 48 48', role: 'img', style: { display: 'block', overflow: 'visible' } };
  const defs = (
    <defs>
      <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#f4f6fd" />
        <stop offset="1" stopColor="#dfe5f5" />
      </linearGradient>
      {/* soft contact shadow so the white glyph lifts off the coloured tile */}
      <filter id={sh} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.1" stdDeviation="1.1" floodColor="#0b1020" floodOpacity="0.32" />
      </filter>
    </defs>
  );

  if (id === 'pokemon') {
    // Capture ball: a filled top dome over a thin equator slot, with a ringed
    // centre button. Bolder than line-art so it stays crisp at chip size.
    return (
      <svg {...common} aria-label="Pokémon">
        {defs}
        <g filter={`url(#${sh})`}>
          <mask id={m}>
            <rect width="48" height="48" fill="black" />
            <circle cx="24" cy="24" r="17.5" fill="white" />
            {/* equator slot */}
            <rect x="5" y="22.1" width="38" height="3.8" fill="black" />
            {/* centre button: ring (white) around a cut hole, then the dot */}
            <circle cx="24" cy="24" r="6.6" fill="black" />
            <circle cx="24" cy="24" r="6.6" fill="none" stroke="white" strokeWidth="2.6" />
            <circle cx="24" cy="24" r="2.2" fill="white" />
          </mask>
          <rect width="48" height="48" fill={`url(#${g})`} mask={`url(#${m})`} />
        </g>
      </svg>
    );
  }

  if (id === 'onepiece') {
    // Straw hat: a rounded crown on a wide brim, with the hatband as a cut-out
    // slot. Reads as a sun hat without any trademarked detail.
    return (
      <svg {...common} aria-label="One Piece">
        {defs}
        <g filter={`url(#${sh})`}>
          <mask id={m}>
            <rect width="48" height="48" fill="black" />
            <ellipse cx="24" cy="33.5" rx="19.5" ry="6" fill="white" />
            <path d="M13.5 33 C 12.5 17 35.5 17 34.5 33 Z" fill="white" />
            {/* band = transparent slot following the crown */}
            <path d="M13.7 30.2 Q 24 33.6 34.3 30.2 L 34.3 32.8 Q 24 36.2 13.7 32.8 Z" fill="black" />
          </mask>
          <rect width="48" height="48" fill={`url(#${g})`} mask={`url(#${m})`} />
        </g>
      </svg>
    );
  }

  if (id === 'magic') {
    // Arcane sparkle: a concave four-point star with a small companion glint.
    return (
      <svg {...common} aria-label="Magic">
        {defs}
        <g filter={`url(#${sh})`}>
          <path d="M24 3.5 C 25.9 17.6 30.4 22.1 44.5 24 C 30.4 25.9 25.9 30.4 24 44.5 C 22.1 30.4 17.6 25.9 3.5 24 C 17.6 22.1 22.1 17.6 24 3.5 Z" fill={`url(#${g})`} />
          <path d="M37.8 7.5 C 38.5 11.3 39.7 12.5 43.5 13.2 C 39.7 13.9 38.5 15.1 37.8 18.9 C 37.1 15.1 35.9 13.9 32.1 13.2 C 35.9 12.5 37.1 11.3 37.8 7.5 Z" fill={`url(#${g})`} opacity="0.9" />
        </g>
      </svg>
    );
  }

  if (id === 'yugioh') {
    // Pyramid: a white triangle with a capstone groove and a lower course as
    // thin negative-space cut-outs. Clean and unmistakably a pyramid.
    return (
      <svg {...common} aria-label="Yu-Gi-Oh!">
        {defs}
        <g filter={`url(#${sh})`}>
          <mask id={m}>
            <rect width="48" height="48" fill="black" />
            <path d="M24 5 L42 39.5 L6 39.5 Z" fill="white" />
            <g stroke="black" strokeWidth="2.1" strokeLinecap="round">
              <line x1="19.4" y1="20.8" x2="28.6" y2="20.8" />
              <line x1="12.6" y1="32" x2="35.4" y2="32" />
            </g>
          </mask>
          <rect width="48" height="48" fill={`url(#${g})`} mask={`url(#${m})`} />
        </g>
      </svg>
    );
  }

  // Fallback: a simple card.
  return (
    <svg {...common} aria-label="TCG">
      {defs}
      <rect x="14" y="9" width="20" height="30" rx="4" fill={`url(#${g})`} filter={`url(#${sh})`} />
    </svg>
  );
}
