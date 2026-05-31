// Per-game brand marks for the game-selection page and the header chip.
//
// These are ORIGINAL, genre-inspired icons — NOT reproductions of the official
// TCG logos (which are trademarked). They evoke each game's theme with generic
// iconography (a capture ball, a straw hat, an arcane sparkle, a pyramid),
// drawn in white with soft gradients/highlights and dark translucent detailing
// so they look polished on any coloured game tile.
//
// `id` selects the mark; unknown ids fall back to a simple card glyph.
const DARK = '#15152e';

export default function GameMark({ id, size = 34 }) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', role: 'img', style: { display: 'block', overflow: 'visible' } };

  if (id === 'pokemon') {
    // Capture ball: glossy white top, dark bottom, band + centre button.
    return (
      <svg {...common} aria-label="Pokémon">
        <defs>
          <linearGradient id="pkW" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e8ebf4" />
          </linearGradient>
          <radialGradient id="pkB" cx="38%" cy="34%" r="80%">
            <stop offset="0" stopColor="#40406a" /><stop offset="1" stopColor={DARK} />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="17.5" fill="url(#pkW)" />
        <path d="M6.5 24a17.5 17.5 0 0 0 35 0Z" fill={DARK} />
        <rect x="6.5" y="21.4" width="35" height="5.2" fill={DARK} />
        <circle cx="24" cy="24" r="6.7" fill={DARK} />
        <circle cx="24" cy="24" r="4.1" fill="url(#pkB)" />
        <circle cx="22.5" cy="22.5" r="1.25" fill="#ffffff" opacity="0.9" />
        <path d="M12.5 15.5a9 5.5 0 0 1 8.5-3" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  if (id === 'onepiece') {
    // Straw hat: up-curved brim, rounded crown, dark band + a crown highlight.
    return (
      <svg {...common} aria-label="One Piece">
        <defs>
          <linearGradient id="opW" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#efe6d2" />
          </linearGradient>
        </defs>
        <path d="M4.5 32.5 Q 24 26 43.5 32.5 Q 24 39 4.5 32.5 Z" fill="url(#opW)" />
        <path d="M13.5 32 C 13.5 17.5 34.5 17.5 34.5 32 Z" fill="url(#opW)" />
        <path d="M14 29.2 Q 24 32.4 34 29.2 L 34 31.8 Q 24 35 14 31.8 Z" fill={DARK} opacity="0.82" />
        <path d="M18.5 21.5 q 4 -2.6 8 -1" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  if (id === 'magic') {
    // Arcane sparkle: a concave four-point star + a small companion sparkle.
    return (
      <svg {...common} aria-label="Magic">
        <defs>
          <radialGradient id="mgW" cx="50%" cy="42%" r="62%">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe6ff" />
          </radialGradient>
        </defs>
        <path d="M24 4.5 C 25.7 17.6 30.4 22.3 43.5 24 C 30.4 25.7 25.7 30.4 24 43.5 C 22.3 30.4 17.6 25.7 4.5 24 C 17.6 22.3 22.3 17.6 24 4.5 Z" fill="url(#mgW)" />
        <path d="M37.5 8.5 C 38.1 11.7 39.3 12.9 42.5 13.5 C 39.3 14.1 38.1 15.3 37.5 18.5 C 36.9 15.3 35.7 14.1 32.5 13.5 C 35.7 12.9 36.9 11.7 37.5 8.5 Z" fill="#ffffff" opacity="0.9" />
        <circle cx="10.5" cy="35" r="1.7" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }

  if (id === 'yugioh') {
    // Pyramid with brick courses, a shaded right face for depth, and a gem.
    return (
      <svg {...common} aria-label="Yu-Gi-Oh!">
        <defs>
          <linearGradient id="ygW" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e8ebf4" />
          </linearGradient>
        </defs>
        <path d="M24 5.5 L41 38.5 L7 38.5 Z" fill="url(#ygW)" />
        <path d="M24 5.5 L41 38.5 L24 38.5 Z" fill={DARK} opacity="0.1" />
        <g stroke={DARK} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18.8" y1="21.5" x2="29.2" y2="21.5" />
          <line x1="13" y1="31" x2="35" y2="31" />
          <line x1="24" y1="21.5" x2="24" y2="31" />
        </g>
        <circle cx="24" cy="34.6" r="2.7" fill={DARK} opacity="0.85" />
        <circle cx="24" cy="34.6" r="1.2" fill="#ffffff" opacity="0.9" />
      </svg>
    );
  }

  // Fallback: a simple card.
  return (
    <svg {...common} aria-label="TCG">
      <rect x="14" y="9" width="20" height="30" rx="4" fill="#fff" />
    </svg>
  );
}
