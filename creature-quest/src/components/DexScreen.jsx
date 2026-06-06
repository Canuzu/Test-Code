import PixelSprite from './PixelSprite.jsx';
import { CREATURES, DEX_IDS } from '../data/creatures.js';
import { TYPES } from '../data/types.js';

export default function DexScreen({ dexSeen, dexCaught, onClose }) {
  const caught = dexCaught.size;
  const seen = dexSeen.size;

  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>Beastdex</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>
      <div className="tiny">Gefangen: {caught}/{DEX_IDS.length} · Gesehen: {seen}/{DEX_IDS.length}</div>

      <div className="grid-dex">
        {DEX_IDS.map((id) => {
          const c = CREATURES[id];
          const isCaught = dexCaught.has(id);
          const isSeen = dexSeen.has(id) || isCaught;
          const t = TYPES[c.type];
          return (
            <div key={id} className="dex-cell" style={{ borderColor: isCaught ? t.color : 'var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', filter: isCaught ? 'none' : 'brightness(0)' }}>
                {isSeen
                  ? <PixelSprite id={id} type={c.type} body={c.body} size={48} />
                  : <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>?</div>}
              </div>
              <div style={{ marginTop: 4 }}>
                {isCaught ? c.name : isSeen ? '???' : '—'}
              </div>
              <div className="tiny">#{String(id).padStart(2, '0')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
