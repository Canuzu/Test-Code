import { useState, useEffect, useRef } from 'react';
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
//   1. for hosts that hot-link-block or aren't CORS-friendly (Bandai's One Piece
//      CDN, the Yu-Gi-Oh! hosts ygoprodeck / yugipedia) we load through the
//      wsrv.nl image proxy FIRST, with the direct URL as a fallback;
//   2. otherwise the card's own image (pokemontcg.io, Scryfall) loaded directly
//      with no-referrer so Referer-based hot-link protection doesn't block it;
//   3. a clean placeholder tile if everything fails.
// wsrv.nl proxy: fetches the origin server-side (CORS-friendly, beats Referer
// hot-link protection) and resizes to a WebP of the display width. Used FIRST
// only for hosts that block hot-linking; fast CORS CDNs load direct (below) to
// avoid the extra proxy hop.
const proxied = (u, w) => `https://wsrv.nl/?url=${encodeURIComponent(u)}&output=webp&q=82${w ? `&w=${w}` : ''}&maxage=30d`;
// Standard TCG card aspect ratio (63 mm × 88 mm) → keeps the box stable so the
// grid doesn't reflow as images arrive.
const CARD_RATIO = 0.716;
// Hosts that block hot-linking / lack CORS → must go through the proxy.
const NEEDS_PROXY = /onepiece-cardgame\.com|ygoprodeck\.com|yugipedia\.com/i;
const SCRYFALL = /cards\.scryfall\.io/i;
// Collapse accidental double slashes in the path (some Yu-Gi-Oh! image URLs
// arrive as ".../com//f/fd/...") without touching the "https://" scheme.
const cleanUrl = (u) => (u ? u.replace(/([^:])\/{2,}/g, '$1/') : u);
// Scryfall serves fixed size variants; swap to a small (146px) or normal (488px)
// image so a grid tile pulls ~10–15 KB directly from Scryfall's fast CDN instead
// of the oversized "normal" we store. `big` is used for the large modal view.
const scryfallSized = (u, big) => u.replace(/\/(small|normal|large|png|art_crop|border_crop)\//, big ? '/normal/' : '/small/');

export function CardImage({ card, height = 150, radius = 10 }) {
  const [stage, setStage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const width = Math.max(1, Math.round(height * CARD_RATIO));
  const reqW = Math.min(660, width * 2); // retina-sharp but capped
  const big = height >= 260; // modal / detail view wants a sharper image
  // Try image.small → image.large → a constructed pokemontcg.io CDN URL.
  const constructed = (card?.setId && card?.number && card?.game !== 'onepiece')
    ? `https://images.pokemontcg.io/${card.setId}/${card.number}.png`
    : null;
  const primary = cleanUrl(card?.image?.small || card?.image?.large || constructed);
  // Routing: hot-link-blocked hosts go through the resized proxy FIRST; fast CORS
  // CDNs (Scryfall, pokemontcg.io) load DIRECTLY at a tile-appropriate size so
  // they appear instantly, with the proxy kept only as a fallback.
  const candidates = [];
  if (primary) {
    if (NEEDS_PROXY.test(primary)) {
      candidates.push(proxied(primary, reqW), primary);
    } else if (SCRYFALL.test(primary)) {
      const direct = scryfallSized(primary, big);
      candidates.push(direct, proxied(direct, reqW), primary);
    } else {
      candidates.push(primary, proxied(primary, reqW));
    }
  }
  const src = candidates[stage];
  // Reset/raise the fade-in when the source changes (handles cached images that
  // never fire onLoad after mount).
  useEffect(() => {
    setLoaded(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src) {
    return (
      <div style={{ height, width, borderRadius: radius, background: 'linear-gradient(160deg,#23234a,#161630)', border: `1px solid ${C.lineStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 26 }}>🃏</span>
        <span style={{ fontSize: 9, color: C.textFaint, padding: '0 6px', textAlign: 'center', lineHeight: 1.2 }}>{card?.name?.slice(0, 24) || 'Karte'}</span>
      </div>
    );
  }
  return (
    <img
      ref={imgRef}
      src={src}
      alt={card?.name || 'Karte'}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setStage((s) => s + 1)}
      style={{ height, width, borderRadius: radius, display: 'block', flexShrink: 0, boxShadow: '0 4px 14px #00000060', background: 'linear-gradient(160deg,#23234a,#161630)', opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
    />
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
