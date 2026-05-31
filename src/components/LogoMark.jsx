// Cartograph brand mark: a rounded trading card with an upward, angular price
// line whose arrowhead is drawn with the SAME stroke (one path, round caps) so
// it reads as one continuous curve rather than a pasted-on triangle.
// Pure inline SVG (no assets) so it scales crisply at any size and inherits the
// gold→orange brand gradient. `size` is the square px box.
export default function LogoMark({ size = 38, title = 'Cartograph' }) {
  const gid = 'cartoGold';
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={title} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd700" />
          <stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
      </defs>
      <g transform="rotate(-7 64 64)">
        <rect x="36" y="18" width="64" height="88" rx="13" fill="#171733" stroke={`url(#${gid})`} strokeWidth="4" />
        <path
          d="M46 86 L60 75 L71 80 L84 57 L98 45 M86.5 47 L98 45 L94.5 56"
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
