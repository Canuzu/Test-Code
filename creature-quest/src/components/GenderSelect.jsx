const CHAR_IMGS = import.meta.glob('../assets/characters/*.png', { eager: true, import: 'default' });
const CHAR_JPEGS = import.meta.glob('../assets/characters/*.jpeg', { eager: true, import: 'default' });

export function charImgUrl(name) {
  for (const [p, url] of Object.entries({ ...CHAR_IMGS, ...CHAR_JPEGS }))
    if (p.includes(`/${name}.`)) return url;
  return null;
}

function BoyFallback() {
  return (
    <svg viewBox="0 0 10 16" width={80} height={128}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      shapeRendering="crispEdges">
      <rect x="3" y="0" width="4" height="2" fill="#1a4cc0" />
      <rect x="2" y="2" width="6" height="1" fill="#1a4cc0" />
      <rect x="3" y="3" width="4" height="4" fill="#f4c07a" />
      <rect x="3" y="5" width="1" height="1" fill="#1a1a1a" />
      <rect x="6" y="5" width="1" height="1" fill="#1a1a1a" />
      <rect x="2" y="7" width="6" height="4" fill="#c83820" />
      <rect x="2" y="11" width="6" height="4" fill="#3a5a80" />
      <rect x="2" y="15" width="2" height="1" fill="#2a2a2a" />
      <rect x="6" y="15" width="2" height="1" fill="#2a2a2a" />
    </svg>
  );
}

function GirlFallback() {
  return (
    <svg viewBox="0 0 10 16" width={80} height={128}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      shapeRendering="crispEdges">
      <rect x="2" y="0" width="6" height="2" fill="#e87090" />
      <rect x="1" y="2" width="8" height="1" fill="#e87090" />
      <rect x="3" y="3" width="4" height="4" fill="#f4c07a" />
      <rect x="3" y="5" width="1" height="1" fill="#1a1a1a" />
      <rect x="6" y="5" width="1" height="1" fill="#1a1a1a" />
      <rect x="2" y="7" width="6" height="5" fill="#d0e8f0" />
      <rect x="1" y="12" width="8" height="3" fill="#d0e8f0" />
      <rect x="2" y="15" width="2" height="1" fill="#c87090" />
      <rect x="6" y="15" width="2" height="1" fill="#c87090" />
    </svg>
  );
}

function CharCard({ name, label, fallback, onChoose }) {
  const url = charImgUrl(name);
  return (
    <button className="gender-card" onClick={onChoose}>
      <div className="gender-sprite">
        {url
          ? <img src={url} alt={label} style={{ width: 80, height: 128, imageRendering: 'pixelated', display: 'block', objectFit: 'contain', mixBlendMode: 'multiply' }} draggable="false" />
          : fallback}
      </div>
      <span className="small">{label}</span>
    </button>
  );
}

export default function GenderSelect({ onChoose }) {
  return (
    <div className="screen-center">
      <div className="title-big" style={{ fontSize: 14 }}>Wer bist du?</div>
      <div className="tiny" style={{ marginBottom: 8 }}>Wähle deinen Charakter!</div>
      <div style={{ display: 'flex', gap: 24 }}>
        <CharCard name="player-boy"  label="Junge"    fallback={<BoyFallback />}  onChoose={() => onChoose('boy')} />
        <CharCard name="player-girl" label="Mädchen"  fallback={<GirlFallback />} onChoose={() => onChoose('girl')} />
      </div>
    </div>
  );
}
