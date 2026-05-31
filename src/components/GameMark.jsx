// Per-game brand marks for the game-selection page.
//
// These are ORIGINAL, genre-inspired icons — NOT reproductions of the official
// TCG logos (which are trademarked). They evoke each game's theme with generic
// iconography (a capture ball, a straw hat, an arcane sparkle, a pyramid) drawn
// in white with subtle dark detailing, so they sit on the coloured game tile.
//
// `id` selects the mark; unknown ids fall back to a simple card glyph.
const DARK = '#15152e';

export default function GameMark({ id, size = 34 }) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', role: 'img', style: { display: 'block' } };

  if (id === 'pokemon') {
    // Capture ball: white top, dark bottom + band + centre button.
    return (
      <svg {...common} aria-label="Pokémon">
        <circle cx="24" cy="24" r="18" fill="#fff" />
        <path d="M6 24 A18 18 0 0 0 42 24 Z" fill={DARK} />
        <rect x="6" y="21.4" width="36" height="5.2" fill={DARK} />
        <circle cx="24" cy="24" r="6" fill={DARK} />
        <circle cx="24" cy="24" r="3.2" fill="#fff" />
      </svg>
    );
  }

  if (id === 'onepiece') {
    // Straw hat: brim + dome + hatband (generic pirate headwear).
    return (
      <svg {...common} aria-label="One Piece">
        <ellipse cx="24" cy="33" rx="19" ry="5.6" fill="#fff" />
        <path d="M12 33 C 12 17, 36 17, 36 33 Z" fill="#fff" />
        <rect x="12.5" y="28.5" width="23" height="3.6" rx="1.8" fill={DARK} opacity="0.9" />
      </svg>
    );
  }

  if (id === 'magic') {
    // Arcane sparkle (four-point concave star) + a small spark.
    return (
      <svg {...common} aria-label="Magic">
        <path d="M24 6 C 25 17, 31 23, 42 24 C 31 25, 25 31, 24 42 C 23 31, 17 25, 6 24 C 17 23, 23 17, 24 6 Z" fill="#fff" />
        <circle cx="37" cy="12" r="2.6" fill="#fff" opacity="0.85" />
      </svg>
    );
  }

  if (id === 'yugioh') {
    // Pyramid with brick courses + a central gem (Egyptian/duel theme, NOT the
    // Millennium-Eye logo).
    return (
      <svg {...common} aria-label="Yu-Gi-Oh!">
        <path d="M24 7 L40 38 L8 38 Z" fill="#fff" />
        <g stroke={DARK} strokeWidth="1.6" opacity="0.55" strokeLinecap="round">
          <line x1="19" y1="21" x2="29" y2="21" />
          <line x1="14.5" y1="30" x2="33.5" y2="30" />
        </g>
        <circle cx="24" cy="32.5" r="3" fill={DARK} opacity="0.7" />
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
