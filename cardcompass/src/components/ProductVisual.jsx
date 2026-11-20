// Procedural product mock-ups (pure SVG) used whenever a product has no photo:
// booster packs with foil sheen, displays with a window of pack tops, deck
// boxes, collection boxes, tins, sleeves, binders, toploaders, playmats, manga,
// figures, model kits and virtual pets — tinted in the franchise colours.
// Real product photos (from Supabase storage) always take precedence.
import { useId } from 'react';

const W = 300;
const H = 360;

function Defs({ k, c1, c2 }) {
  return (
    <defs>
      <linearGradient id={k('main')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c1} />
        <stop offset="1" stopColor={c2} />
      </linearGradient>
      <linearGradient id={k('dark')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c2} />
        <stop offset="1" stopColor="#0b0618" />
      </linearGradient>
      <linearGradient id={k('foil')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset=".38" stopColor="#ffffff" stopOpacity=".05" />
        <stop offset=".47" stopColor="#ffe9ff" stopOpacity=".55" />
        <stop offset=".52" stopColor="#b9f3ff" stopOpacity=".45" />
        <stop offset=".6" stopColor="#ffffff" stopOpacity=".05" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={k('burst')} cx=".5" cy=".42" r=".6">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
        <stop offset=".3" stopColor={c1} stopOpacity=".55" />
        <stop offset="1" stopColor={c2} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={k('side')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity=".38" />
        <stop offset="1" stopColor="#000" stopOpacity=".18" />
      </linearGradient>
      <filter id={k('sh')} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#1d0545" floodOpacity=".32" />
      </filter>
    </defs>
  );
}

const Star = ({ x, y, r, fill = '#fff', o = 1 }) => (
  <path d={`M${x} ${y - r} C${x + r * .14} ${y - r * .14} ${x + r * .14} ${y - r * .14} ${x + r} ${y} C${x + r * .14} ${y + r * .14} ${x + r * .14} ${y + r * .14} ${x} ${y + r} C${x - r * .14} ${y + r * .14} ${x - r * .14} ${y + r * .14} ${x - r} ${y} C${x - r * .14} ${y - r * .14} ${x - r * .14} ${y - r * .14} ${x} ${y - r} Z`} fill={fill} opacity={o} />
);

// Compass rose watermark – the CardCompass signature on every mock-up.
const Rose = ({ x, y, r, o = .9 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={r} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth={r * .06} />
    <path d={`M0 ${-r * .95} L${r * .2} 0 L0 ${r * .95} L${-r * .2} 0 Z`} fill="#fff" />
    <path d={`M${-r * .95} 0 L0 ${r * .2} L${r * .95} 0 L0 ${-r * .2} Z`} fill="#fff" opacity=".75" />
    <circle r={r * .16} fill="#fff" />
  </g>
);

function Label({ x, y, w, label, sub, k, dark = true, logo }) {
  if (logo) {
    // Franchise logo on a white plate, product type underneath.
    return (
      <g>
        <rect x={x} y={y - 6} width={w} height={sub ? 58 : 46} rx="11" fill="#fff" opacity=".96" />
        <image href={logo} x={x + 8} y={y - 1} width={w - 16} height={sub ? 34 : 36} preserveAspectRatio="xMidYMid meet" />
        {sub && <text x={x + w / 2} y={y + 45} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10" letterSpacing=".1em" fill="#4c1d95">{String(sub).toUpperCase()}</text>}
      </g>
    );
  }
  const t = String(label || '').toUpperCase();
  const size = t.length > 18 ? 12 : t.length > 12 ? 14 : 16;
  return (
    <g>
      <rect x={x} y={y} width={w} height="46" rx="10" fill={dark ? 'rgba(10,4,24,.55)' : 'rgba(255,255,255,.88)'} />
      <text x={x + w / 2} y={y + 21} textAnchor="middle" fontFamily="Poppins, Inter, sans-serif" fontWeight="800" fontSize={size} letterSpacing=".06em" fill={dark ? '#fff' : '#1b0838'}>{t}</text>
      {sub && <text x={x + w / 2} y={y + 37} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="10.5" letterSpacing=".08em" fill={dark ? 'rgba(255,255,255,.75)' : '#5b2a99'}>{String(sub).toUpperCase()}</text>}
    </g>
  );
}

function Booster({ k, v }) {
  const zig = (y, up) => Array.from({ length: 21 }, (_, i) => `${60 + i * 9} ${y + (i % 2 ? (up ? -6 : 6) : 0)}`).join(' L');
  return (
    <g filter={`url(#${k('sh')})`}>
      <path d={`M60 40 L${zig(40, true)} L240 40 L246 320 L${zig(320, false).split(' L').reverse().join(' L')} L54 320 Z`} fill={`url(#${k('main')})`} />
      <rect x="54" y="40" width="192" height="22" fill="#000" opacity=".18" />
      <rect x="54" y="300" width="192" height="20" fill="#000" opacity=".18" />
      <circle cx="150" cy="150" r="78" fill={`url(#${k('burst')})`} />
      <Rose x={150} y={150} r={42} />
      <Star x={92} y={96} r={9} o={.9} /><Star x={212} y={210} r={7} o={.8} />
      <Label x={70} y={238} w={160} label={v.label} sub={v.sub} logo={v.logo} k={k} />
      <path d="M54 40 H246 V320 H54 Z" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Display({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <path d="M38 118 L198 96 L262 116 L104 140 Z" fill={v.c1} opacity=".95" />
      <path d="M38 118 L104 140 L104 318 L38 292 Z" fill={`url(#${k('dark')})`} />
      <path d="M38 118 L104 140 L104 318 L38 292 Z" fill={`url(#${k('side')})`} />
      <path d="M104 140 L262 116 L262 292 L104 318 Z" fill={`url(#${k('main')})`} />
      {/* window with pack tops */}
      <path d="M58 122 L196 103 L244 117 L106 137 Z" fill="#0b0618" opacity=".55" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${72 + i * 22} ${118 - i * 2.4} l14 -2 l3 9 l-14 2 Z`} fill={i % 2 ? '#fff' : v.c1} opacity=".9" />
      ))}
      <circle cx="183" cy="200" r="62" fill={`url(#${k('burst')})`} />
      <Rose x={183} y={196} r={30} />
      <Label x={120} y={238} w={126} label={v.label} sub={v.sub} logo={v.logo} k={k} />
      <path d="M104 140 L262 116 L262 292 L104 318 Z" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Deck({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <path d="M80 96 L196 84 L236 100 L120 114 Z" fill={v.c1} />
      <path d="M80 96 L120 114 L120 316 L80 296 Z" fill={`url(#${k('dark')})`} />
      <path d="M120 114 L236 100 L236 300 L120 316 Z" fill={`url(#${k('main')})`} />
      <path d="M120 114 L236 100 L236 132 L120 146 Z" fill="#000" opacity=".2" />
      <circle cx="178" cy="196" r="44" fill={`url(#${k('burst')})`} />
      <Rose x={178} y={194} r={24} />
      <Label x={128} y={246} w={100} label={v.label.split(' ')[0]} sub={v.sub} logo={v.logo} k={k} />
      <path d="M120 114 L236 100 L236 300 L120 316 Z" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Box({ k, v, tin }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      {tin ? (
        <>
          <rect x="44" y="96" width="212" height="214" rx="28" fill={`url(#${k('main')})`} />
          <rect x="44" y="96" width="212" height="44" rx="22" fill="#fff" opacity=".22" />
          <rect x="52" y="104" width="196" height="198" rx="22" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M30 136 L200 112 L272 136 L102 162 Z" fill={v.c1} />
          <path d="M30 136 L102 162 L102 304 L30 280 Z" fill={`url(#${k('dark')})`} />
          <path d="M102 162 L272 136 L272 280 L102 304 Z" fill={`url(#${k('main')})`} />
          <path d="M30 136 L200 112 L272 136 L102 162 Z" fill="#fff" opacity=".18" />
        </>
      )}
      <circle cx={tin ? 150 : 187} cy={tin ? 188 : 210} r="56" fill={`url(#${k('burst')})`} />
      <Rose x={tin ? 150 : 187} y={tin ? 184 : 206} r={28} />
      <Label x={tin ? 70 : 116} y={tin ? 238 : 238} w={tin ? 160 : 140} label={v.label} sub={v.sub} logo={v.logo} k={k} />
      {tin ? <rect x="44" y="96" width="212" height="214" rx="28" fill={`url(#${k('foil')})`} className="pv-foil" />
        : <path d="M102 162 L272 136 L272 280 L102 304 Z" fill={`url(#${k('foil')})`} className="pv-foil" />}
    </g>
  );
}

function Sleeves({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      {[-14, -7, 0].map((r, i) => (
        <rect key={i} x="86" y="70" width="128" height="196" rx="12" fill={`url(#${k('main')})`} opacity={0.55 + i * .22} transform={`rotate(${r} 150 260)`} />
      ))}
      <rect x="86" y="70" width="128" height="196" rx="12" fill={`url(#${k('main')})`} />
      <rect x="96" y="82" width="108" height="172" rx="8" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      <Rose x={150} y={154} r={26} />
      <rect x="70" y="252" width="160" height="66" rx="12" fill="#fff" />
      <text x="150" y="281" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="15" fill="#1b0838">{v.sub?.toUpperCase() || 'SLEEVES'}</text>
      <text x="150" y="301" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10.5" letterSpacing=".1em" fill="#7000cc">CARDCOMPASS</text>
      <rect x="86" y="70" width="128" height="196" rx="12" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Binder({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <rect x="62" y="56" width="186" height="256" rx="18" fill={`url(#${k('dark')})`} />
      <rect x="62" y="56" width="176" height="256" rx="16" fill={`url(#${k('main')})`} />
      <rect x="62" y="56" width="26" height="256" rx="10" fill="#000" opacity=".28" />
      <path d="M238 70 V298" stroke="#fff" strokeOpacity=".7" strokeWidth="4" strokeDasharray="3 5" />
      <Rose x={160} y={160} r={40} />
      <Label x={96} y={232} w={130} label={v.label} sub={v.sub} logo={v.logo} k={k} />
      <rect x="62" y="56" width="176" height="256" rx="16" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Toploader({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <rect x="84" y="56" width="132" height="190" rx="10" fill={`url(#${k('main')})`} opacity=".85" transform="rotate(-8 150 150)" />
      <rect x="94" y="66" width="132" height="190" rx="10" fill={`url(#${k('main')})`} />
      <Rose x={160} y={150} r={30} />
      <rect x="84" y="50" width="152" height="216" rx="12" fill="#fff" opacity=".22" stroke="#fff" strokeOpacity=".8" strokeWidth="3" />
      <Label x={86} y={276} w={148} label={v.sub || 'TOPLOADER'} sub="CardCompass" k={k} dark={false} />
      <rect x="84" y="50" width="152" height="216" rx="12" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function Playmat({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <path d="M30 150 L232 104 L274 222 L70 270 Z" fill={`url(#${k('dark')})`} />
      <path d="M30 150 L232 104 L274 222 L70 270 Z" fill={`url(#${k('burst')})`} />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={60 + (i * 47) % 200} cy={130 + (i * 31) % 110} r={i % 3 ? 1.6 : 2.6} fill="#fff" opacity=".8" />)}
      <Rose x={152} y={186} r={34} />
      <path d="M70 270 L274 222 L274 232 L72 282 Z" fill="#000" opacity=".35" />
      <Label x={80} y={288} w={140} label={v.label} sub={v.sub} logo={v.logo} k={k} dark={false} />
    </g>
  );
}

function Manga({ k, v }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <rect x="82" y="50" width="150" height="232" rx="6" fill={`url(#${k('main')})`} />
      <rect x="70" y="56" width="16" height="232" rx="4" fill={`url(#${k('dark')})`} />
      <rect x="82" y="50" width="150" height="232" rx="6" fill={`url(#${k('burst')})`} />
      <Rose x={157} y={140} r={34} />
      <Label x={92} y={214} w={130} label={v.label} sub={v.sub} logo={v.logo} k={k} />
      <rect x="82" y="50" width="150" height="232" rx="6" fill={`url(#${k('foil')})`} className="pv-foil" />
    </g>
  );
}

function WindowBox({ k, v, kind }) {
  return (
    <g filter={`url(#${k('sh')})`}>
      <rect x="64" y="52" width="172" height="252" rx="14" fill={`url(#${k('main')})`} />
      <rect x="82" y="72" width="136" height="150" rx="10" fill="#0b0618" opacity=".7" />
      {kind === 'digivice' ? (
        <g>
          <ellipse cx="150" cy="148" rx="46" ry="54" fill="#fff" />
          <rect x="124" y="124" width="52" height="40" rx="6" fill={v.c2} />
          <rect x="130" y="130" width="40" height="28" rx="3" fill="#9ae6b4" />
          {[0, 1, 2].map((i) => <circle key={i} cx={132 + i * 18} cy="182" r="5" fill={v.c1} />)}
        </g>
      ) : kind === 'gunpla' ? (
        <g stroke="#fff" strokeOpacity=".85" strokeWidth="3" fill="none">
          <rect x="128" y="96" width="44" height="34" rx="6" fill={v.c1} fillOpacity=".7" />
          <path d="M150 130 V176 M126 140 L102 170 M174 140 L198 170 M138 176 L126 214 M162 176 L174 214" />
          <path d="M100 74 L210 214" strokeOpacity=".25" strokeWidth="18" />
        </g>
      ) : (
        <g>
          <ellipse cx="150" cy="206" rx="48" ry="10" fill="#fff" opacity=".35" />
          <path d="M150 92 C176 92 186 118 178 140 C196 150 200 178 186 200 L114 200 C100 178 104 150 122 140 C114 118 124 92 150 92 Z" fill={`url(#${k('burst')})`} stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
          <Star x={150} y={128} r={14} />
        </g>
      )}
      <rect x="82" y="72" width="136" height="150" rx="10" fill={`url(#${k('foil')})`} className="pv-foil" />
      <Label x={80} y={238} w={140} label={v.label} sub={v.sub} logo={v.logo} k={k} />
    </g>
  );
}

export default function ProductVisual({ visual, className = '', title }) {
  const uid = useId().replace(/:/g, '');
  const k = (n) => `${n}-${uid}`;
  const v = { kind: 'box', c1: '#b26bff', c2: '#4c0099', label: 'CardCompass', sub: '', ...(visual || {}) };
  const body = {
    booster: <Booster k={k} v={v} />,
    display: <Display k={k} v={v} />,
    deck: <Deck k={k} v={v} />,
    deckbox: <Deck k={k} v={v} />,
    box: <Box k={k} v={v} />,
    tin: <Box k={k} v={v} tin />,
    sleeves: <Sleeves k={k} v={v} />,
    binder: <Binder k={k} v={v} />,
    toploader: <Toploader k={k} v={v} />,
    playmat: <Playmat k={k} v={v} />,
    manga: <Manga k={k} v={v} />,
    figure: <WindowBox k={k} v={v} kind="figure" />,
    plush: <WindowBox k={k} v={v} kind="figure" />,
    gunpla: <WindowBox k={k} v={v} kind="gunpla" />,
    digivice: <WindowBox k={k} v={v} kind="digivice" />,
  }[v.kind] || <Box k={k} v={v} />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`pv ${className}`} role="img" aria-label={title || `${v.label} ${v.sub}`.trim()}>
      <Defs k={k} c1={v.c1} c2={v.c2} />
      {body}
    </svg>
  );
}

// Photo if available, procedural mock-up otherwise.
export function ProductImage({ product, className = '', eager = false }) {
  const img = product?.images?.[0];
  if (img?.url) {
    return <img className={`pimg ${className}`} src={img.url} alt={img.alt_text || product.name} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  return <ProductVisual visual={product?.visual} className={className} title={product?.name} />;
}
