// Packshot-style product illustrations (pure SVG), used until real product
// photos exist. Deliberately calm: two-tone packaging in the franchise colours,
// a fine hatch texture, a typographic label and a soft floor shadow – no
// sparkles or glows. Every kind sits in the same footprint (x≈50–250,
// y≈40–318 of a 300×360 box) so product tiles look uniform.
// Real photos from Supabase storage always take precedence (ProductImage).
import { useId } from 'react';

const INK = '#120a1f';

function Defs({ k, c1, c2 }) {
  return (
    <defs>
      <linearGradient id={k('face')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c1} />
        <stop offset="1" stopColor={c2} />
      </linearGradient>
      <linearGradient id={k('side')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c2} />
        <stop offset="1" stopColor={INK} />
      </linearGradient>
      <linearGradient id={k('sheen')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".45" stopColor="#fff" stopOpacity=".22" />
        <stop offset=".55" stopColor="#fff" stopOpacity=".08" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <pattern id={k('hatch')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
        <line x1="0" y1="0" x2="0" y2="9" stroke="#fff" strokeOpacity=".16" strokeWidth="2" />
      </pattern>
      <radialGradient id={k('floor')} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor={INK} stopOpacity=".28" />
        <stop offset="1" stopColor={INK} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

const Floor = ({ k, w = 170 }) => <ellipse cx="150" cy="326" rx={w / 2} ry="11" fill={`url(#${k('floor')})`} />;

// Typographic label: franchise (expanded caps) + product kind.
function Label({ x, y, w, label, sub, light = false }) {
  const t = String(label || '').toUpperCase();
  // Archivo expanded caps ≈ 0.8 em per glyph → shrink long names to fit.
  const size = Math.max(8.5, Math.min(15, (w - 24) / (Math.max(1, t.length) * 0.88)));
  return (
    <g>
      <rect x={x} y={y} width={w} height="44" fill={light ? '#fff' : INK} opacity={light ? 1 : 0.88} />
      <text x={x + 12} y={y + 20} fontFamily="'Archivo Variable', Archivo, sans-serif" fontStretch="125%" fontWeight="800" fontSize={size} letterSpacing=".02em" fill={light ? INK : '#fff'}>{t}</text>
      {sub && <text x={x + 12} y={y + 35} fontFamily="'Archivo Variable', Archivo, sans-serif" fontWeight="600" fontSize="9.5" letterSpacing=".12em" fill={light ? '#6b6576' : 'rgba(255,255,255,.7)'}>{String(sub).toUpperCase()}</text>}
    </g>
  );
}

function Booster({ k, v }) {
  const crimp = (y, dir) => Array.from({ length: 23 }, (_, i) => `${62 + i * 8} ${y + (i % 2 ? dir * 5 : 0)}`).join(' L');
  const outline = `M62 46 L${crimp(46, -1)} L238 46 L238 314 L${crimp(314, 1).split(' L').reverse().join(' L')} L62 314 Z`;
  return (
    <g>
      <Floor k={k} w={190} />
      <path d={outline} fill={`url(#${k('face')})`} />
      <path d="M62 46 H238 V170 L62 250 Z" fill={`url(#${k('hatch')})`} />
      <rect x="62" y="46" width="176" height="16" fill={INK} opacity=".22" />
      <rect x="62" y="298" width="176" height="16" fill={INK} opacity=".22" />
      <Label x={62} y={226} w={176} label={v.label} sub={v.sub} />
    </g>
  );
}

// Oblique box: straight front face (so labels sit flat), side face to the left,
// lid on top. (fx, fy) = top-left of the front face; d = depth offset.
function Box3D({ k, v, fx, fy, fw, fh, d = 46 }) {
  const dy = d * 0.55;
  const front = `M${fx} ${fy} H${fx + fw} V${fy + fh} H${fx} Z`;
  return (
    <g>
      <Floor k={k} w={fw + d + 20} />
      <path d={`M${fx} ${fy} L${fx - d} ${fy - dy} L${fx + fw - d} ${fy - dy} L${fx + fw} ${fy} Z`} fill={v.c1} />
      <path d={`M${fx} ${fy} L${fx - d} ${fy - dy} L${fx - d} ${fy + fh - dy} L${fx} ${fy + fh} Z`} fill={`url(#${k('side')})`} />
      <path d={front} fill={`url(#${k('face')})`} />
      <rect x={fx} y={fy} width={fw} height={Math.round(fh * 0.42)} fill={`url(#${k('hatch')})`} />
      <Label x={fx} y={fy + fh - 66} w={fw} label={v.label} sub={v.sub} />
    </g>
  );
}

function Display({ k, v }) {
  return (
    <g>
      <Box3D k={k} v={v} fx={92} fy={134} fw={168} fh={180} d={52} />
      {/* open lid window with pack tops */}
      <path d="M100 130 L60 108 L208 108 L248 130 Z" fill={INK} opacity=".6" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${84 + i * 24} ${122 - (i % 2) * 2} l16 0 l-4 -9 l-16 0 Z`} fill={i % 2 ? '#fff' : v.c1} opacity=".92" />
      ))}
    </g>
  );
}

function Deck({ k, v }) {
  return <Box3D k={k} v={{ ...v, label: String(v.label || '').split(' ')[0] }} fx={112} fy={86} fw={124} fh={228} d={40} />;
}

function Box({ k, v, tin }) {
  if (tin) {
    return (
      <g>
        <Floor k={k} w={200} />
        <rect x="52" y="74" width="196" height="240" rx="26" fill={`url(#${k('face')})`} />
        <rect x="52" y="74" width="196" height="54" rx="26" fill="#fff" opacity=".16" />
        <rect x="52" y="128" width="196" height="186" fill={`url(#${k('hatch')})`} opacity=".7" />
        <Label x={52} y={232} w={196} label={v.label} sub={v.sub} />
      </g>
    );
  }
  return <Box3D k={k} v={v} fx={84} fy={150} fw={182} fh={164} d={56} />;
}

function Sleeves({ k, v }) {
  return (
    <g>
      <Floor k={k} w={170} />
      {[-10, -5].map((r, i) => <rect key={i} x="84" y="48" width="132" height="200" rx="6" fill={`url(#${k('face')})`} opacity={0.45 + i * 0.25} transform={`rotate(${r} 150 280)`} />)}
      <rect x="84" y="48" width="132" height="200" rx="6" fill={`url(#${k('face')})`} />
      <rect x="84" y="48" width="132" height="200" rx="6" fill={`url(#${k('hatch')})`} />
      <rect x="66" y="232" width="168" height="84" fill="#fff" stroke="#e7e3ec" />
      <text x="80" y="266" fontFamily="'Archivo Variable', Archivo, sans-serif" fontStretch="125%" fontWeight="800" fontSize="16" fill={INK}>{(v.sub || 'SLEEVES').toUpperCase()}</text>
      <text x="80" y="290" fontFamily="'Archivo Variable', Archivo, sans-serif" fontWeight="700" fontSize="9.5" letterSpacing=".14em" fill="#8b00ff">CARDCOMPASS</text>
    </g>
  );
}

function Binder({ k, v }) {
  return (
    <g>
      <Floor k={k} w={200} />
      <rect x="58" y="50" width="190" height="264" rx="10" fill={`url(#${k('side')})`} />
      <rect x="58" y="50" width="180" height="264" rx="8" fill={`url(#${k('face')})`} />
      <rect x="58" y="50" width="24" height="264" rx="6" fill={INK} opacity=".3" />
      <path d="M236 64 V300" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeDasharray="2 5" />
      <rect x="82" y="50" width="156" height="150" fill={`url(#${k('hatch')})`} />
      <Label x={82} y={232} w={156} label={v.label} sub={v.sub} />
    </g>
  );
}

function Toploader({ k, v }) {
  return (
    <g>
      <Floor k={k} w={170} />
      <rect x="96" y="66" width="122" height="176" rx="6" fill={`url(#${k('face')})`} opacity=".8" transform="rotate(-7 150 160)" />
      <rect x="92" y="62" width="122" height="176" rx="6" fill={`url(#${k('face')})`} />
      <rect x="92" y="62" width="122" height="176" rx="6" fill={`url(#${k('hatch')})`} />
      <rect x="80" y="50" width="146" height="204" rx="8" fill="#fff" opacity=".2" stroke="#fff" strokeOpacity=".9" strokeWidth="3" />
      <Label x={70} y={268} w={166} label={v.sub || 'Toploader'} sub="CardCompass" light />
    </g>
  );
}

function Playmat({ k, v }) {
  return (
    <g>
      <Floor k={k} w={230} />
      <path d="M34 150 L232 108 L270 224 L72 268 Z" fill={`url(#${k('side')})`} />
      <path d="M34 150 L232 108 L270 224 L72 268 Z" fill={`url(#${k('hatch')})`} />
      <path d="M72 268 L270 224 L270 234 L74 280 Z" fill={INK} opacity=".35" />
      <g transform="translate(70 282)"><Label x={0} y={0} w={160} label={v.label} sub={v.sub} light /></g>
    </g>
  );
}

function Manga({ k, v }) {
  return (
    <g>
      <Floor k={k} w={170} />
      <rect x="84" y="50" width="146" height="264" rx="3" fill={`url(#${k('face')})`} />
      <rect x="72" y="56" width="14" height="262" rx="2" fill={`url(#${k('side')})`} />
      <rect x="84" y="50" width="146" height="160" fill={`url(#${k('hatch')})`} />
      <Label x={84} y={236} w={146} label={v.label} sub={v.sub} />
    </g>
  );
}

function WindowBox({ k, v, kind }) {
  return (
    <g>
      <Floor k={k} w={190} />
      <rect x="64" y="50" width="172" height="264" rx="4" fill={`url(#${k('face')})`} />
      <rect x="80" y="68" width="140" height="150" rx="3" fill={INK} opacity=".72" />
      {kind === 'digivice' ? (
        <g>
          <ellipse cx="150" cy="142" rx="42" ry="50" fill="#fff" />
          <rect x="126" y="120" width="48" height="36" rx="4" fill={v.c2} />
          <rect x="132" y="126" width="36" height="24" rx="2" fill="#b7f0c8" />
          {[0, 1, 2].map((i) => <circle key={i} cx={134 + i * 16} cy="172" r="4.5" fill={v.c1} />)}
        </g>
      ) : kind === 'gunpla' ? (
        <g stroke="#fff" strokeOpacity=".85" strokeWidth="3" fill="none" strokeLinecap="round">
          <rect x="130" y="92" width="40" height="30" rx="4" fill={v.c1} fillOpacity=".8" />
          <path d="M150 122 V166 M128 132 L106 160 M172 132 L194 160 M140 166 L128 204 M160 166 L172 204" />
        </g>
      ) : (
        <g>
          <ellipse cx="150" cy="204" rx="44" ry="8" fill="#fff" opacity=".3" />
          <path d="M150 90 C174 90 184 114 176 134 C192 144 196 170 184 196 L116 196 C104 170 108 144 124 134 C116 114 126 90 150 90 Z" fill={v.c1} opacity=".9" />
        </g>
      )}
      <Label x={64} y={240} w={172} label={v.label} sub={v.sub} />
    </g>
  );
}

export default function ProductVisual({ visual, className = '', title }) {
  const uid = useId().replace(/:/g, '');
  const k = (n) => `${n}-${uid}`;
  const v = { kind: 'box', c1: '#a855f7', c2: '#3b0764', label: 'CardCompass', sub: '', ...(visual || {}) };
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
    <svg viewBox="0 0 300 360" className={`pv ${className}`} role="img" aria-label={title || `${v.label} ${v.sub}`.trim()}>
      <Defs k={k} c1={v.c1} c2={v.c2} />
      {body}
    </svg>
  );
}

// Photo if available, packshot illustration otherwise.
export function ProductImage({ product, className = '', eager = false }) {
  const img = product?.images?.[0];
  if (img?.url) {
    return <img className={`pimg ${className}`} src={img.url} alt={img.alt_text || product.name} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  return <ProductVisual visual={product?.visual} className={className} title={product?.name} />;
}
