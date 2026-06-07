import { ZONES, ZONE_WIDTH, ZONE_HEIGHT, TILE } from '../data/world.js';
import { charImgUrl } from './GenderSelect.jsx';

const TILE_PX = 32;
const VIEW_COLS = 13;
const VIEW_ROWS = 10;

// ── Tile image imports ───────────────────────────────────────────────────
const TILE_IMGS = import.meta.glob('../assets/tiles/*.png', { eager: true, import: 'default' });

function tileImgUrl(name) {
  for (const [p, url] of Object.entries(TILE_IMGS))
    if (p.endsWith(`/${name}.png`)) return url;
  return null;
}

const TILE_MAP = {
  '.': tileImgUrl('tile-grass'),
  '"': tileImgUrl('tile-tall-grass'),
  '~': tileImgUrl('tile-water'),
  'T': tileImgUrl('tile-tree'),
  'R': tileImgUrl('tile-cliff'),
  'P': tileImgUrl('tile-path'),
  'S': tileImgUrl('tile-sand'),
  'F': tileImgUrl('tile-flower'),
};

const TILE_FALLBACK = {
  '.':  '#5a9e30',
  '"':  '#2d6b18',
  '~':  '#2a6cc0',
  'T':  '#1a5210',
  'R':  '#8a7060',
  'P':  '#c8a870',
  'S':  '#e8d8a0',
  'F':  '#60a830',
};
const WARP_COLOR  = '#d4a017';
const NPC_ICON    = { talk: '💬', trainer: '⚔️' };
const WARP_ARROW  = { '<': '◄', '>': '►', '^': '▲', 'v': '▼' };
const TILE_ANIM   = { '~': 'cell-water', '"': 'cell-grass', 'F': 'cell-grass', 'T': 'cell-tree' };

function TileCell({ ch, delay }) {
  const isWarp = TILE.WARPS.has(ch);
  const imgUrl = !isWarp ? TILE_MAP[ch] : null;
  const fallback = isWarp ? WARP_COLOR : (TILE_FALLBACK[ch] || '#5a9e30');
  const animCls = !isWarp ? (TILE_ANIM[ch] || '') : '';
  return (
    <div
      className={animCls}
      style={{
        width: TILE_PX, height: TILE_PX,
        background: fallback,
        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
        backgroundSize: 'cover', backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        animationDelay: animCls ? `${delay}ms` : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#fff', fontFamily: 'monospace', flexShrink: 0,
      }}
    >
      {isWarp ? <span style={{ fontSize: 14, filter: 'drop-shadow(0 0 2px #000)' }}>{WARP_ARROW[ch]}</span> : null}
    </div>
  );
}

// ── Character sprites ────────────────────────────────────────────────────
function CharSprite({ sprite, fallbackIcon, size = 32 }) {
  const url = charImgUrl(sprite);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        draggable="false"
        style={{
          width: size, height: size * 1.4,
          imageRendering: 'pixelated',
          display: 'block',
          objectFit: 'contain',
          mixBlendMode: 'multiply',
        }}
      />
    );
  }
  return <span style={{ fontSize: 14 }}>{fallbackIcon}</span>;
}

// ── Player avatar ────────────────────────────────────────────────────────
function PlayerSprite({ facing, gender }) {
  const spriteName = `player-${gender}`;
  const url = charImgUrl(spriteName);
  const flip = facing === 'left';
  const extraTransform = facing === 'up' ? 'scaleY(-1)' : '';
  if (url) {
    return (
      <img
        src={url}
        alt=""
        draggable="false"
        style={{
          width: TILE_PX, height: TILE_PX + 12,
          imageRendering: 'pixelated', display: 'block',
          objectFit: 'contain',
          transform: [flip ? 'scaleX(-1)' : '', extraTransform].filter(Boolean).join(' ') || undefined,
          mixBlendMode: 'multiply',
        }}
      />
    );
  }
  // SVG fallback
  return (
    <svg viewBox="0 0 10 16" width={TILE_PX} height={TILE_PX + 8}
      style={{ imageRendering: 'pixelated', display: 'block', transform: flip ? 'scaleX(-1)' : undefined }}
      shapeRendering="crispEdges">
      {gender === 'girl' ? (
        <>
          <rect x="2" y="0" width="6" height="2" fill="#e87090" />
          <rect x="3" y="3" width="4" height="3" fill="#f4c07a" />
          <rect x="2" y="6" width="6" height="5" fill="#d0e8f0" />
          <rect x="2" y="11" width="2" height="4" fill="#c87090" />
          <rect x="6" y="11" width="2" height="4" fill="#c87090" />
        </>
      ) : (
        <>
          <rect x="2" y="0" width="6" height="2" fill="#1a4cc0" />
          <rect x="3" y="3" width="4" height="3" fill="#f4c07a" />
          <rect x="2" y="6" width="6" height="4" fill="#c83820" />
          <rect x="2" y="11" width="6" height="2" fill="#3a5a80" />
          <rect x="2" y="13" width="2" height="1" fill="#2a2a2a" />
          <rect x="6" y="13" width="2" height="1" fill="#2a2a2a" />
        </>
      )}
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function Overworld({
  zone, px, py, facing, gender = 'boy',
  onDir, onInteract,
  onOpenParty, onOpenDex, onOpenBag, onMenu,
  balls, money = 0, badges, partyCount,
}) {
  const z = ZONES[zone];
  const camX = Math.max(0, Math.min(px - Math.floor(VIEW_COLS / 2), ZONE_WIDTH  - VIEW_COLS));
  const camY = Math.max(0, Math.min(py - Math.floor(VIEW_ROWS / 2), ZONE_HEIGHT - VIEW_ROWS));
  const visibleRows = z.rows.slice(camY, camY + VIEW_ROWS);
  const vpW = VIEW_COLS * TILE_PX;
  const vpH = VIEW_ROWS * TILE_PX;
  const playerVX = (px - camX) * TILE_PX;
  const playerVY = (py - camY) * TILE_PX;

  return (
    <div className="world-wrap">
      {/* ── Top bar ── */}
      <div className="world-top">
        <span style={{ color: '#e8e0c8', fontSize: 9 }}>📍 {z.name}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#f4d878', fontSize: 8 }}>💰{money}</span>
          {badges && badges.size > 0 && <span style={{ fontSize: 8, color: '#f4d878' }}>🏅{badges.size}</span>}
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onOpenParty}>Team ({partyCount})</button>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onOpenBag}>🎒</button>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onOpenDex}>Dex</button>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onMenu}>☰</button>
        </span>
      </div>

      {/* ── Map viewport ── */}
      <div className="map-area">
        <div style={{
          position: 'relative', width: vpW, height: vpH,
          overflow: 'hidden', border: '4px solid #3c2c18',
          borderRadius: 4, boxShadow: '0 4px 16px #0006, inset 0 0 0 2px #6c4e28',
        }}>
          {/* Tile grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${VIEW_COLS}, ${TILE_PX}px)`,
            gridTemplateRows: `repeat(${VIEW_ROWS}, ${TILE_PX}px)`,
            width: vpW, height: vpH,
          }}>
            {visibleRows.flatMap((row, ry) =>
              row.slice(camX, camX + VIEW_COLS).split('').map((ch, rx) => (
                <TileCell key={`${rx}-${ry}`} ch={ch} delay={((rx * 7 + ry * 13) % 10) * 150} />
              ))
            )}
          </div>

          {/* Drifting clouds */}
          <div className="ow-clouds" aria-hidden>
            <span className="ow-cloud c1" /><span className="ow-cloud c2" /><span className="ow-cloud c3" />
          </div>

          {/* NPCs */}
          {(z.npcs || []).map((n) => {
            const vx = n.x - camX;
            const vy = n.y - camY;
            if (vx < 0 || vx >= VIEW_COLS || vy < 0 || vy >= VIEW_ROWS) return null;
            return (
              <div key={n.id} style={{
                position: 'absolute',
                left: vx * TILE_PX,
                top:  vy * TILE_PX - 8,
                width: TILE_PX,
                height: TILE_PX + 8,
                zIndex: 4,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
              }}>
                <div className="ow-shadow" />
                <div className="ow-actor" style={{ animationDelay: `${(n.x * 7 + n.y * 13) % 5 * 200}ms` }}>
                  <CharSprite sprite={n.sprite} fallbackIcon={NPC_ICON[n.kind] || '💬'} size={28} />
                </div>
              </div>
            );
          })}

          {/* Player */}
          <div style={{
            position: 'absolute',
            left: playerVX,
            top:  playerVY - 10,
            width: TILE_PX,
            height: TILE_PX + 12,
            transition: 'left .1s linear, top .1s linear',
            zIndex: 5,
          }}>
            <div className="ow-shadow" />
            <div className="ow-actor">
              <PlayerSprite facing={facing} gender={gender} />
            </div>
          </div>

          {/* Depth vignette */}
          <div className="ow-vignette" aria-hidden />

          {/* Mini coords */}
          <div style={{
            position: 'absolute', top: 4, right: 6, fontSize: 7,
            color: '#fff8', textShadow: '1px 1px 0 #0008',
            fontFamily: 'monospace', pointerEvents: 'none', zIndex: 10,
          }}>{px},{py}</div>
        </div>
      </div>

      {/* ── D-Pad ── */}
      <div className="dpad">
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, -1)}>▲</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(-1, 0)}>◄</button>
        <button className="btn" style={{ background: '#d4a017', borderColor: '#8a6010', color: '#3c2808' }} onClick={onInteract}>✓</button>
        <button className="btn" onClick={() => onDir(1, 0)}>►</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, 1)}>▼</button>
        <div className="spacer" />
      </div>
    </div>
  );
}
