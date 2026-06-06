import { ZONES, ZONE_WIDTH, ZONE_HEIGHT, TILE } from '../data/world.js';

const TILE_PX = 26;

const TILE_STYLE = {
  'T': { background: '#143a1c', boxShadow: 'inset 0 -6px 0 #0d2713, inset 0 6px 0 #1d5028' },
  'R': { background: '#6d5b4f', boxShadow: 'inset 0 -6px 0 #4e3f36, inset 0 6px 0 #8a7567' },
  '~': { background: '#2a6cc0', boxShadow: 'inset 0 -6px 0 #1d4f93, inset 0 6px 0 #4f8fe0' },
  '.': { background: '#3a7d34' },
  '"': { background: '#2f6e2a', backgroundImage: 'repeating-linear-gradient(90deg,#2f6e2a 0 3px,#235221 3px 6px)' },
};
const WARP_STYLE = { background: '#caa64a', color: '#3a2c00', boxShadow: 'inset 0 0 0 2px #8a6f1f' };

function tileStyle(ch) {
  if (TILE.WARPS.has(ch)) return WARP_STYLE;
  return TILE_STYLE[ch] || TILE_STYLE['.'];
}

const WARP_ARROW = { '<': '◄', '>': '►', '^': '▲', 'v': '▼' };

const NPC_COLOR = { talk: '#8e6fc4', trainer: '#c0392b' };
const NPC_ICON = { talk: '💬', trainer: '⚔️' };

export default function Overworld({ zone, px, py, facing, onDir, onInteract, onOpenParty, onOpenDex, onMenu, balls, partyCount }) {
  const z = ZONES[zone];
  const mapW = ZONE_WIDTH * TILE_PX;
  const mapH = ZONE_HEIGHT * TILE_PX;
  const flip = facing === 'left';

  return (
    <div className="world-wrap">
      <div className="world-top">
        <span>📍 {z.name}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ padding: '4px 8px' }} onClick={onOpenParty}>👥 Team ({partyCount})</button>
          <button className="btn" style={{ padding: '4px 8px' }} onClick={onOpenDex}>📖 Dex</button>
          <button className="btn" style={{ padding: '4px 8px' }} onClick={onMenu}>☰</button>
        </span>
      </div>

      <div className="map-area">
        <div
          style={{
            position: 'relative',
            width: mapW,
            height: mapH,
            display: 'grid',
            gridTemplateColumns: `repeat(${ZONE_WIDTH}, ${TILE_PX}px)`,
            gridTemplateRows: `repeat(${ZONE_HEIGHT}, ${TILE_PX}px)`,
            border: '4px solid #0a1a10',
            borderRadius: 4,
          }}
        >
          {z.rows.flatMap((row, y) =>
            row.split('').map((ch, x) => (
              <div key={`${x}-${y}`} style={{ width: TILE_PX, height: TILE_PX, ...tileStyle(ch), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {TILE.WARPS.has(ch) ? WARP_ARROW[ch] : ''}
              </div>
            )),
          )}

          {/* NPCs */}
          {(z.npcs || []).map((n) => (
            <div
              key={n.id}
              className="npc-marker"
              style={{
                left: n.x * TILE_PX + 3,
                top: n.y * TILE_PX + 1,
                width: TILE_PX - 6,
                height: TILE_PX - 6,
                background: n.color || NPC_COLOR[n.kind] || NPC_COLOR.talk,
              }}
            >
              {NPC_ICON[n.kind] || '💬'}
            </div>
          ))}

          {/* Spieler-Avatar */}
          <div
            style={{
              position: 'absolute',
              left: px * TILE_PX,
              top: py * TILE_PX - 6,
              width: TILE_PX,
              height: TILE_PX + 6,
              transition: 'left .12s, top .12s',
              transform: flip ? 'scaleX(-1)' : 'none',
              zIndex: 5,
            }}
          >
            <Trainer />
          </div>
        </div>
      </div>

      <div className="dpad">
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, -1)}>▲</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(-1, 0)}>◄</button>
        <button className="btn" onClick={onInteract} title="Sprechen / Interagieren">✓</button>
        <button className="btn" onClick={() => onDir(1, 0)}>►</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onDir(0, 1)}>▼</button>
        <div className="spacer" />
      </div>
    </div>
  );
}

// Kleiner Pixel-Trainer (Kappe + Gesicht + Körper).
function Trainer() {
  return (
    <svg viewBox="0 0 8 11" width="100%" height="100%" style={{ imageRendering: 'pixelated', display: 'block' }} shapeRendering="crispEdges">
      <rect x="2" y="0" width="4" height="2" fill="#c0392b" />
      <rect x="1" y="2" width="6" height="1" fill="#c0392b" />
      <rect x="2" y="3" width="4" height="2" fill="#f1c27d" />
      <rect x="3" y="4" width="1" height="1" fill="#1b1b1b" />
      <rect x="5" y="4" width="1" height="1" fill="#1b1b1b" />
      <rect x="2" y="5" width="4" height="4" fill="#2e86de" />
      <rect x="2" y="9" width="2" height="2" fill="#34495e" />
      <rect x="4" y="9" width="2" height="2" fill="#34495e" />
    </svg>
  );
}
