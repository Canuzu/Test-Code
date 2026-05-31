import { useId } from 'react';

// Per-game brand marks for the game-selection tiles and the header chip.
//
// ORIGINAL, genre-inspired icons — NOT reproductions of the trademarked TCG
// logos. Each is a clean WHITE glyph with a soft white gradient; interior detail
// is created by NEGATIVE SPACE (cut-outs via a mask) so the tile's colour shows
// through. No black ink anywhere — that's what kept the old versions muddy.
//
// `useId` gives every instance unique gradient/mask ids so multiple marks on the
// page (e.g. a tile + the header chip) never clash.
export default function GameMark({ id, size = 34 }) {
  const uid = useId().replace(/:/g, '');
  const g = `g-${uid}`;
  const m = `m-${uid}`;
  const common = { width: size, height: size, viewBox: '0 0 48 48', role: 'img', style: { display: 'block', overflow: 'visible' } };
  const whiteGrad = (
    <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="1" stopColor="#eef1fb" />
    </linearGradient>
  );

  if (id === 'pokemon') {
    // Clean line-art capture ball: ring + split band + button. All white; the
    // gaps in the band and inside the ring let the tile colour read as the ball.
    return (
      <svg {...common} aria-label="Pokémon">
        <defs>{whiteGrad}</defs>
        <g fill="none" stroke={`url(#${g})`} strokeWidth="3.4" strokeLinecap="round">
          <circle cx="24" cy="24" r="17" />
          <path d="M7 24 H16.5" />
          <path d="M31.5 24 H41" />
          <circle cx="24" cy="24" r="5.6" />
        </g>
        <circle cx="24" cy="24" r="1.9" fill={`url(#${g})`} />
      </svg>
    );
  }

  if (id === 'onepiece') {
    // Straw hat: brim + crown as one white shape; the hatband is a cut-out slot.
    return (
      <svg {...common} aria-label="One Piece">
        <defs>
          {whiteGrad}
          <mask id={m}>
            <rect width="48" height="48" fill="black" />
            <ellipse cx="24" cy="33" rx="19" ry="5.6" fill="white" />
            <path d="M13 32.5 C 13 17 35 17 35 32.5 Z" fill="white" />
            {/* band = transparent slot */}
            <path d="M13.6 29.2 Q 24 32.4 34.4 29.2 L 34.4 31.9 Q 24 35.1 13.6 31.9 Z" fill="black" />
          </mask>
        </defs>
        <rect width="48" height="48" fill={`url(#${g})`} mask={`url(#${m})`} />
      </svg>
    );
  }

  if (id === 'magic') {
    // Arcane sparkle: a concave four-point star + a small companion sparkle.
    return (
      <svg {...common} aria-label="Magic">
        <defs>{whiteGrad}</defs>
        <path d="M24 4 C 25.8 17.5 30.5 22.2 44 24 C 30.5 25.8 25.8 30.5 24 44 C 22.2 30.5 17.5 25.8 4 24 C 17.5 22.2 22.2 17.5 24 4 Z" fill={`url(#${g})`} />
        <path d="M37.5 8 C 38.2 11.6 39.4 12.8 43 13.5 C 39.4 14.2 38.2 15.4 37.5 19 C 36.8 15.4 35.6 14.2 32 13.5 C 35.6 12.8 36.8 11.6 37.5 8 Z" fill={`url(#${g})`} opacity="0.92" />
      </svg>
    );
  }

  if (id === 'yugioh') {
    // Pyramid: white triangle with a capstone groove + two horizontal courses,
    // all as thin negative-space cut-outs. Clean and unmistakably a pyramid.
    return (
      <svg {...common} aria-label="Yu-Gi-Oh!">
        <defs>
          {whiteGrad}
          <mask id={m}>
            <rect width="48" height="48" fill="black" />
            <path d="M24 5 L41.5 39 L6.5 39 Z" fill="white" />
            <g stroke="black" strokeWidth="2" strokeLinecap="round">
              {/* capstone groove */}
              <line x1="19.7" y1="20.5" x2="28.3" y2="20.5" />
              {/* lower course */}
              <line x1="13.2" y1="31.5" x2="34.8" y2="31.5" />
            </g>
          </mask>
        </defs>
        <rect width="48" height="48" fill={`url(#${g})`} mask={`url(#${m})`} />
      </svg>
    );
  }

  // Fallback: a simple card.
  return (
    <svg {...common} aria-label="TCG">
      <defs>{whiteGrad}</defs>
      <rect x="14" y="9" width="20" height="30" rx="4" fill={`url(#${g})`} />
    </svg>
  );
}
