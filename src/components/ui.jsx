import { useState } from 'react';
import { C, changeColor } from '../lib/theme.js';
import { fmtPct } from '../lib/format.js';

// Mini price sparkline (30d avg -> 7d avg -> yesterday -> trend).
export function Spark({ series, width = 96, height = 30, strokeWidth = 2 }) {
  if (!series || series.length < 2) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textGhost, fontSize: 10 }}>kein Verlauf</div>;
  }
  const vals = series.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = width / (series.length - 1);
  const pad = 3;
  const y = (v) => height - pad - ((v - min) / span) * (height - pad * 2);
  const pts = series.map((p, i) => `${i * stepX},${y(p.v)}`);
  const up = vals[vals.length - 1] >= vals[0];
  const color = up ? C.green : C.red;
  const areaPts = `0,${height} ${pts.join(' ')} ${width},${height}`;
  const gid = `sg-${Math.round(min)}-${Math.round(max)}-${series.length}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gid})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(series.length - 1) * stepX} cy={y(vals[vals.length - 1])} r={2.6} fill={color} />
    </svg>
  );
}

// Card artwork with a graceful, multi-source fallback chain:
//   1. the card's own image (pokemontcg.io for Pokémon, the official One Piece
//      CDN for One Piece), requested with no-referrer so Referer-based hot-link
//      protection doesn't block it;
//   2. for One Piece (Bandai's CDN occasionally IP-blocks hot-linkers) a retry
//      through wsrv.nl, a CORS-friendly image proxy that re-serves it;
//   3. a clean placeholder tile if everything fails.
const proxied = (u, w) => `https://wsrv.nl/?url=${encodeURIComponent(u)}&output=png${w ? `&w=${w}` : ''}&maxage=30d`;

export function CardImage({ card, height = 150, radius = 10 }) {
  const [stage, setStage] = useState(0);
  // Try image.small → image.large → a constructed pokemontcg.io CDN URL.
  const constructed = (card?.setId && card?.number && card?.game !== 'onepiece')
    ? `https://images.pokemontcg.io/${card.setId}/${card.number}.png`
    : null;
  const primary = card?.image?.small || card?.image?.large || constructed;
  // Bandai's One Piece CDN hot-link-blocks unreliably (esp. on mobile networks),
  // so for One Piece we load through the wsrv.nl proxy FIRST (CORS-friendly,
  // cached, reaches Bandai server-side) and keep the direct URL as a fallback.
  const isOP = !!primary && /onepiece-cardgame\.com/i.test(primary);
  const candidates = [];
  if (primary) {
    if (isOP) candidates.push(proxied(primary, 600), primary);
    else candidates.push(primary);
  }
  const src = candidates[stage];
  if (!src) {
    return (
      <div style={{ height, width: height * 0.72, borderRadius: radius, background: 'linear-gradient(160deg,#23234a,#161630)', border: `1px solid ${C.lineStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 26 }}>🃏</span>
        <span style={{ fontSize: 9, color: C.textFaint, padding: '0 6px', textAlign: 'center', lineHeight: 1.2 }}>{card?.name?.slice(0, 24) || 'Karte'}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={card?.name || 'Karte'}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setStage((s) => s + 1)}
      style={{ height, width: 'auto', borderRadius: radius, display: 'block', flexShrink: 0, boxShadow: '0 4px 14px #00000060' }}
    />
  );
}

// Full-resolution artwork for the zoom overlay. Uses the same proxy fallback as
// CardImage plus a spinner — so a hot-link-blocked One Piece (Bandai) image never
// hangs forever — and a clear message if the image truly can't be fetched.
export function ZoomImage({ card }) {
  const [stage, setStage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const base = card?.image?.large || card?.image?.small || null;
  const isOP = !!base && /onepiece-cardgame\.com/i.test(base);
  const candidates = base ? (isOP ? [proxied(base), base] : [base]) : [];
  const src = candidates[stage];
  if (!src) {
    return <div style={{ color: '#fff', fontSize: 14, opacity: 0.85 }}>🃏 Bild nicht verfügbar</div>;
  }
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 80, minHeight: 80 }}>
      {!loaded && (
        <div className="spin" style={{ position: 'absolute', width: 42, height: 42, border: '3px solid #ffffff33', borderTopColor: '#fff', borderRadius: '50%' }} />
      )}
      <img
        key={src}
        src={src}
        alt={card?.name || 'Karte'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(false); setStage((s) => s + 1); }}
        style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 12, boxShadow: '0 10px 60px #000', display: loaded ? 'block' : 'none' }}
      />
    </div>
  );
}

export function Pill({ children, color = C.textDim, title }) {
  return (
    <span title={title} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: color + '22', color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// % change with arrow + colour, optionally with a label like "7T".
export function ChangeBadge({ value, label, size = 12 }) {
  const color = changeColor(value);
  const arrow = value == null ? '·' : value > 0.5 ? '▲' : value < -0.5 ? '▼' : '▬';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, color, fontWeight: 700, fontSize: size }}>
      {label && <span style={{ fontSize: size - 3, color: C.textFaint, fontWeight: 600 }}>{label}</span>}
      <span style={{ fontSize: size - 3 }}>{arrow}</span>
      {fmtPct(value)}
    </span>
  );
}

export function ScoreBadge({ tier, score, size = 'md' }) {
  const big = size === 'lg';
  return (
    <span style={{ background: tier.c, color: '#0c0c1a', borderRadius: big ? 8 : 6, padding: big ? '3px 10px' : '2px 8px', fontSize: big ? 13 : 11, fontWeight: 900, boxShadow: `0 2px 8px ${tier.c}55`, whiteSpace: 'nowrap' }}>
      {tier.l} · {score}
    </span>
  );
}

export function Stat({ label, value, color = C.text, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, hint, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textDim }}>
      <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.text }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginBottom: 20 }}>{hint}</div>}
      {children}
    </div>
  );
}
