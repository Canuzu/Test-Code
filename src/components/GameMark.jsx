import { useId } from 'react';

// Per-game app-icon badges (landing tiles, ticker, header switcher, settings).
//
// Each badge is ONE self-contained SVG: a rounded tile with its own rich
// background, a soft top gloss and a full-colour, slightly three-dimensional
// emblem. They are ORIGINAL, genre-inspired drawings — not reproductions of the
// trademarked TCG logos:
//   • Pokémon   – a glossy capture ball on a sunny yellow→orange tile
//   • One Piece – a woven straw hat with red band over a deep-sea tile
//   • Magic     – the five colours of mana circling an arcane spark
//   • Yu-Gi-Oh! – a golden inverted puzzle-pyramid with an engraved eye
// Shapes are kept bold so they still read at 12–14 px (ticker chips).
//
// `useId` keeps gradient/filter ids unique per instance so many badges on one
// page never clash. Callers should NOT wrap this in another coloured tile.
export default function GameMark({ id, size = 34, title }) {
  const uid = useId().replace(/:/g, '');
  const k = (n) => `${n}-${uid}`;
  const url = (n) => `url(#${k(n)})`;
  const label = title || { pokemon: 'Pokémon', onepiece: 'One Piece', magic: 'Magic: The Gathering', yugioh: 'Yu-Gi-Oh!' }[id] || 'TCG';

  // Shared tile chrome: clip, gloss, hairline border, emblem drop shadow.
  const chrome = (bg) => (
    <>
      <clipPath id={k('clip')}><rect width="64" height="64" rx="15" /></clipPath>
      <linearGradient id={k('gloss')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id={k('sh')} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.5" floodColor="#05060f" floodOpacity="0.4" />
      </filter>
      {bg}
    </>
  );
  if (id === 'pokemon') {
    return (
      <Tile size={size} label={label} uid={uid} extra={chrome(<>
        <linearGradient id={k('bg')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe066" /><stop offset="0.55" stopColor="#ffb020" /><stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
        <linearGradient id={k('red')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a7a" /><stop offset="0.6" stopColor="#e5262f" /><stop offset="1" stopColor="#b8121c" />
        </linearGradient>
        <linearGradient id={k('white')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9dfec" />
        </linearGradient>
        <clipPath id={k('ball')}><circle cx="32" cy="32.5" r="19" /></clipPath>
      </>)}>
        <circle cx="32" cy="32" r="27" fill="#ffffff" opacity="0.16" />
        <g filter={url('sh')}>
          <g clipPath={url('ball')}>
            <rect x="12" y="12" width="40" height="20.5" fill={url('red')} />
            <rect x="12" y="32.5" width="40" height="20" fill={url('white')} />
            <rect x="12" y="30.4" width="40" height="4.2" fill="#1b1b2f" />
          </g>
          <circle cx="32" cy="32.5" r="19" fill="none" stroke="#1b1b2f" strokeWidth="2.8" />
          <circle cx="32" cy="32.5" r="7" fill="#1b1b2f" />
          <circle cx="32" cy="32.5" r="4.7" fill="#ffffff" />
          <circle cx="32" cy="32.5" r="2.3" fill="#e8ecf5" stroke="#c4cbdb" strokeWidth="0.8" />
          <ellipse cx="24.5" cy="22.5" rx="5.6" ry="3.2" fill="#ffffff" opacity="0.5" transform="rotate(-28 24.5 22.5)" />
        </g>
      </Tile>
    );
  }

  if (id === 'onepiece') {
    return (
      <Tile size={size} label={label} uid={uid} extra={chrome(<>
        <linearGradient id={k('bg')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#1677c9" /><stop offset="0.6" stopColor="#0b3f7a" /><stop offset="1" stopColor="#061f42" />
        </linearGradient>
        <linearGradient id={k('straw')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffeaa8" /><stop offset="0.55" stopColor="#f4bf52" /><stop offset="1" stopColor="#c98a2a" />
        </linearGradient>
        <linearGradient id={k('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4b4b" /><stop offset="1" stopColor="#b3141b" />
        </linearGradient>
        <radialGradient id={k('sun')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd36b" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
        </radialGradient>
      </>)}>
        {/* sun glow + sea */}
        <circle cx="32" cy="30" r="24" fill={url('sun')} />
        <path d="M0 50 C10 46 18 54 32 50 C46 46 54 54 64 50 V64 H0 Z" fill="#0a5aa8" opacity="0.55" />
        <path d="M0 55 C12 52 20 58 32 55 C44 52 52 58 64 55 V64 H0 Z" fill="#083a72" opacity="0.7" />
        <g filter={url('sh')} transform="translate(32 33) scale(1.1) translate(-32 -33)">
          <ellipse cx="32" cy="38" rx="24" ry="8" fill={url('straw')} />
          <ellipse cx="32" cy="37.2" rx="17" ry="4.6" fill="#b87a22" opacity="0.45" />
          <path d="M17.6 37 C17 20.5 47 20.5 46.4 37 Z" fill={url('straw')} />
          <path d="M17.7 31.8 Q32 35.8 46.3 31.8 L46.4 36.6 Q32 40.8 17.6 36.6 Z" fill={url('band')} />
          {/* weave + highlight */}
          <g fill="none" stroke="#b9802a" strokeOpacity="0.55" strokeWidth="0.8" strokeLinecap="round">
            <path d="M12.5 40.5 Q32 46 51.5 40.5" />
          </g>
          <path d="M22.6 30.4 Q24.6 27.2 29.6 26.3" fill="none" stroke="#fff6d6" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
        </g>
      </Tile>
    );
  }

  if (id === 'magic') {
    // W U B R G around the centre (clockwise from the top), like the colour pie.
    const orbs = [
      { a: -90, c: '#fff6d2', d: '#d9c47e' },
      { a: -18, c: '#5c9dff', d: '#1d4fd8' },
      { a: 54, c: '#8b8299', d: '#2b2433' },
      { a: 126, c: '#ff6b5e', d: '#c81e1e' },
      { a: 198, c: '#4ee08f', d: '#15803d' },
    ].map((o) => ({ ...o, x: 32 + 17 * Math.cos((o.a * Math.PI) / 180), y: 32.5 + 17 * Math.sin((o.a * Math.PI) / 180) }));
    return (
      <Tile size={size} label={label} uid={uid} extra={chrome(<>
        <radialGradient id={k('bg')} cx="0.32" cy="0.25" r="0.95">
          <stop offset="0" stopColor="#8b5cf6" /><stop offset="0.5" stopColor="#4c1d95" /><stop offset="1" stopColor="#1a0f45" />
        </radialGradient>
        <radialGradient id={k('core')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" /><stop offset="0.45" stopColor="#c4b5fd" stopOpacity="0.55" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        {orbs.map((o, i) => (
          <radialGradient key={i} id={k(`o${i}`)} cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="0.35" stopColor={o.c} /><stop offset="1" stopColor={o.d} />
          </radialGradient>
        ))}
      </>)}>
        <circle cx="32" cy="32.5" r="17" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.2" />
        <polygon points={orbs.map((o) => `${o.x.toFixed(2)},${o.y.toFixed(2)}`).join(' ')} fill="none" stroke="#e9d5ff" strokeOpacity="0.22" strokeWidth="1" />
        <circle cx="32" cy="32.5" r="11" fill={url('core')} />
        <g filter={url('sh')}>
          <path d="M32 23.5 C32.9 30.6 33.9 31.6 41 32.5 C33.9 33.4 32.9 34.4 32 41.5 C31.1 34.4 30.1 33.4 23 32.5 C30.1 31.6 31.1 30.6 32 23.5 Z" fill="#ffffff" />
          {orbs.map((o, i) => (
            <circle key={i} cx={o.x} cy={o.y} r="5.6" fill={url(`o${i}`)} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
          ))}
        </g>
      </Tile>
    );
  }

  if (id === 'yugioh') {
    return (
      <Tile size={size} label={label} uid={uid} extra={chrome(<>
        <linearGradient id={k('bg')} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#3b2370" /><stop offset="0.6" stopColor="#1f1340" /><stop offset="1" stopColor="#0f0a22" />
        </linearGradient>
        <linearGradient id={k('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff4c2" /><stop offset="0.4" stopColor="#f7c948" /><stop offset="1" stopColor="#a86b12" />
        </linearGradient>
        <linearGradient id={k('goldR')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7ac2c" /><stop offset="1" stopColor="#7a4a08" />
        </linearGradient>
        <radialGradient id={k('halo')} cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#ffcf4d" stopOpacity="0.45" /><stop offset="1" stopColor="#ffcf4d" stopOpacity="0" />
        </radialGradient>
      </>)}>
        <circle cx="32" cy="31" r="26" fill={url('halo')} />
        <g filter={url('sh')}>
          {/* cord ring */}
          <circle cx="32" cy="11" r="3.3" fill="none" stroke={url('gold')} strokeWidth="2" />
          {/* inverted pyramid: lit left face + shaded right face */}
          <path d="M13 16 H32 V51 Z" fill={url('gold')} />
          <path d="M32 16 H51 L32 51 Z" fill={url('goldR')} />
          <path d="M13 16 H51 L49.4 19 H14.6 Z" fill="#fff3c4" opacity="0.55" />
          {/* engraved eye */}
          <g fill="none" stroke="#3a2205" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M24.2 27.2 Q32 21.6 39.8 27.2 Q32 32.6 24.2 27.2 Z" fill="#3a2205" fillOpacity="0.18" />
            <path d="M23.6 22.6 Q32 18.8 40.4 22.6" />
            <path d="M29.6 30.4 L28.2 36.4" />
            <path d="M34.2 30.4 Q36.4 34.8 39.6 33.6" />
          </g>
          <circle cx="32" cy="27.1" r="2.5" fill="#3a2205" />
          <path d="M14.5 17.2 L31 49" stroke="#fffbe6" strokeOpacity="0.55" strokeWidth="0.9" />
        </g>
      </Tile>
    );
  }

  // Fallback: a neutral card on a gold tile.
  return (
    <Tile size={size} label={label} uid={uid} extra={chrome(
      <linearGradient id={k('bg')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd700" /><stop offset="1" stopColor="#ff6b35" /></linearGradient>,
    )}>
      <rect x="21" y="14" width="22" height="34" rx="4" fill="#ffffff" filter={url('sh')} />
    </Tile>
  );
}

// Rounded tile chrome shared by every badge (module-level so React keeps the
// same component type across renders).
function Tile({ size, label, uid, extra, children }) {
  const url = (n) => `url(#${n}-${uid})`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label} style={{ display: 'block', flexShrink: 0 }}>
      <defs>{extra}</defs>
      <g clipPath={url('clip')}>
        <rect width="64" height="64" fill={url('bg')} />
        {children}
        <path d="M0 0 H64 V26 C44 34 20 34 0 26 Z" fill={url('gloss')} />
      </g>
      <rect x="0.6" y="0.6" width="62.8" height="62.8" rx="14.4" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.2" />
    </svg>
  );
}
