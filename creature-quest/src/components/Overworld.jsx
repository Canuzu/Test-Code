import { ZONES, ZONE_WIDTH, ZONE_HEIGHT, TILE } from '../data/world.js';

const TILE_PX = 32;
// Tiles visible on screen (portrait mobile ~360px wide, ~320px tall for map area)
const VIEW_COLS = 13;
const VIEW_ROWS = 10;

// ── Tile image imports (Vite bundles these at build time) ─────────────────
const TILE_IMGS = import.meta.glob('../assets/tiles/*.png', { eager: true, import: 'default' });
const PLAYER_IMG = Object.entries(
  import.meta.glob('../assets/sprites/player.png', { eager: true, import: 'default' })
)[0]?.[1] ?? null;

function tileImgUrl(name) {
  for (const [p, url] of Object.entries(TILE_IMGS))
    if (p.endsWith(`/${name}.png`)) return url;
  return null;
}

// Precompute tile image urls once
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

// Fallback CSS colours (shown when tile images haven't downloaded yet)
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
const NPC_COLOR   = { talk: '#7c50c8', trainer: '#c03030' };
const NPC_ICON    = { talk: '💬', trainer: '⚔️' };
const WARP_ARROW  = { '<': '◄', '>': '►', '^': '▲', 'v': '▼' };

function TileCell({ ch }) {
  const isWarp = TILE.WARPS.has(ch);
  const imgUrl = !isWarp ? TILE_MAP[ch] : null;
  const fallback = isWarp ? WARP_COLOR : (TILE_FALLBACK[ch] || '#5a9e30');

  return (
    <div
      style={{
        width: TILE_PX,
        height: TILE_PX,
        background: fallback,
        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: '#fff',
        fontFamily: 'monospace',
        flexShrink: 0,
      }}
    >
      {isWarp ? <span style={{ fontSize: 14, filter: 'drop-shadow(0 0 2px #000)' }}>{WARP_ARROW[ch]}</span> : null}
    </div>
  );
}

// ── Player avatar ────────────────────────────────────────────────────────
function PlayerSprite({ facing }) {
  if (PLAYER_IMG) {
    const flip = facing === 'left';
    const rotate = facing === 'up' ? 'scaleY(-1)' : facing === 'down' ? 'none' : '';
    return (
      <img
        src={PLAYER_IMG}
        style={{
          width: TILE_PX,
          height: TILE_PX + 8,
          imageRendering: 'pixelated',
          display: 'block',
          transform: [flip ? 'scaleX(-1)' : '', rotate].filter(Boolean).join(' ') || undefined,
        }}
        alt=""
        draggable="false"
      />
    );
  }
  // Fallback: crisp SVG trainer
  return (
    <svg
      viewBox="0 0 10 14"
      width={TILE_PX}
      height={TILE_PX + 8}
      style={{ imageRendering: 'pixelated', display: 'block', transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      shapeRendering="crispEdges"
    >
      {/* Cap */}
      <rect x="2" y="0" width="6" height="2" fill="#c8281e" />
      <rect x="1" y="2" width="8" height="1" fill="#c8281e" />
      {/* Hair */}
      <rect x="2" y="3" width="6" height="1" fill="#4a3010" />
      {/* Face */}
      <rect x="2" y="4" width="6" height="3" fill="#f4c07a" />
      {/* Eyes */}
      <rect x="3" y="5" width="1" height="1" fill="#1a1a1a" />
      <rect x="6" y="5" width="1" height="1" fill="#1a1a1a" />
      {/* Jacket */}
      <rect x="2" y="7" width="6" height="4" fill="#1a6abf" />
      {/* Collar */}
      <rect x="4" y="7" width="2" height="1" fill="#f4c07a" />
      {/* Belt */}
      <rect x="2" y="11" width="6" height="1" fill="#c8a020" />
      {/* Shorts */}
      <rect x="2" y="12" width="6" height="2" fill="#3a5a80" />
      {/* Shoes */}
      <rect x="2" y="14" width="2" height="1" fill="#2a2a2a" />
      <rect x="6" y="14" width="2" height="1" fill="#2a2a2a" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function Overworld({
  zone, px, py, facing,
  onDir, onInteract,
  onOpenParty, onOpenDex, onMenu,
  balls, partyCount,
}) {
  const z = ZONES[zone];

  // Camera: clamp viewport so it doesn't go out of bounds
  const camX = Math.max(0, Math.min(px - Math.floor(VIEW_COLS / 2), ZONE_WIDTH  - VIEW_COLS));
  const camY = Math.max(0, Math.min(py - Math.floor(VIEW_ROWS / 2), ZONE_HEIGHT - VIEW_ROWS));

  const visibleRows = z.rows.slice(camY, camY + VIEW_ROWS);

  const vpW = VIEW_COLS * TILE_PX;
  const vpH = VIEW_ROWS * TILE_PX;

  // Player position within the viewport
  const playerVX = (px - camX) * TILE_PX;
  const playerVY = (py - camY) * TILE_PX;

  return (
    <div className="world-wrap">
      {/* ── Top bar ── */}
      <div className="world-top">
        <span style={{ color: '#e8e0c8', fontSize: 9 }}>📍 {z.name}</span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onOpenParty}>
            Team ({partyCount})
          </button>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onOpenDex}>
            Dex
          </button>
          <button className="btn" style={{ padding: '3px 8px', fontSize: 8 }} onClick={onMenu}>
            ☰
          </button>
        </span>
      </div>

      {/* ── Map viewport ── */}
      <div className="map-area">
        <div
          style={{
            position: 'relative',
            width: vpW,
            height: vpH,
            overflow: 'hidden',
            border: '4px solid #3c2c18',
            borderRadius: 4,
            boxShadow: '0 4px 16px #0006, inset 0 0 0 2px #6c4e28',
          }}
        >
          {/* Tile grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${VIEW_COLS}, ${TILE_PX}px)`,
              gridTemplateRows: `repeat(${VIEW_ROWS}, ${TILE_PX}px)`,
              width: vpW,
              height: vpH,
            }}
          >
            {visibleRows.flatMap((row, ry) =>
              row.slice(camX, camX + VIEW_COLS).split('').map((ch, rx) => (
                <TileCell key={`${rx}-${ry}`} ch={ch} />
              ))
            )}
          </div>

          {/* NPCs */}
          {(z.npcs || []).map((n) => {
            const vx = n.x - camX;
            const vy = n.y - camY;
            if (vx < 0 || vx >= VIEW_COLS || vy < 0 || vy >= VIEW_ROWS) return null;
            return (
              <div
                key={n.id}
                style={{
                  position: 'absolute',
                  left: vx * TILE_PX + 2,
                  top:  vy * TILE_PX,
                  width: TILE_PX - 4,
                  height: TILE_PX,
                  zIndex: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                {NPC_ICON[n.kind] || '💬'}
              </div>
            );
          })}

          {/* Player */}
          <div
            style={{
              position: 'absolute',
              left: playerVX,
              top:  playerVY - 8,
              width: TILE_PX,
              height: TILE_PX + 8,
              transition: 'left .1s linear, top .1s linear',
              zIndex: 5,
            }}
          >
            <PlayerSprite facing={facing} />
          </div>

          {/* Mini position indicator (top-right corner) */}
          <div style={{
            position: 'absolute', top: 4, right: 6, fontSize: 7,
            color: '#fff8', textShadow: '1px 1px 0 #0008',
            fontFamily: 'monospace', pointerEvents: 'none', zIndex: 10,
          }}>
            {px},{py}
          </div>
        </div>
      </div>

      {/* ── D-Pad ── */}
      <div className="dpad">
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, -1)}>▲</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(-1, 0)}>◄</button>
        <button className="btn" style={{ background: '#d4a017', borderColor: '#8a6010', color: '#3c2808' }} onClick={onInteract} title="Sprechen / Interagieren">✓</button>
        <button className="btn" onClick={() => onDir(1, 0)}>►</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, 1)}>▼</button>
        <div className="spacer" />
      </div>
    </div>
  );
}
