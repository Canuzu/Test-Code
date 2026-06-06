import { useState } from 'react';
import PixelSprite from './PixelSprite.jsx';
import { ITEMS } from '../data/items.js';
import { getSpecies, maxHp } from '../engine/creatures.js';

// Beutel außerhalb des Kampfes: Heil- und Beleber-Items auf das Team anwenden.
export default function Bag({ bag, party, onUse, onClose }) {
  const [sel, setSel] = useState(null);
  const usable = Object.keys(bag).filter((id) => (bag[id] || 0) > 0 && ITEMS[id].kind !== 'ball');
  const selItem = sel ? ITEMS[sel] : null;

  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>🎒 Beutel</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>

      {usable.length === 0 && <div className="tiny">Keine Heil- oder Beleber-Items. Fangkugeln nutzt du im Kampf.</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {usable.map((id) => {
          const it = ITEMS[id];
          return (
            <button
              key={id}
              className="btn"
              style={{ borderColor: sel === id ? 'var(--accent)' : 'var(--line)' }}
              onClick={() => setSel(id)}
            >
              {it.icon} {it.name} ×{bag[id]}
            </button>
          );
        })}
      </div>

      {selItem && (
        <>
          <div className="tiny">{selItem.desc} – auf wen anwenden?</div>
          {party.map((p, i) => {
            const sp = getSpecies(p);
            const mx = maxHp(p);
            const fainted = p.curHp <= 0;
            const valid = selItem.kind === 'revive' ? fainted : !fainted && p.curHp < mx;
            return (
              <div key={p.uid} className="row" style={{ opacity: valid ? 1 : 0.4 }}>
                <PixelSprite id={p.speciesId} type={sp.type} body={sp.body} size={40} />
                <span style={{ flex: 1 }} className="small">{sp.name}</span>
                <span className="tiny">{Math.max(0, p.curHp)}/{mx}</span>
                <button className="btn good" disabled={!valid} style={{ padding: '4px 8px' }} onClick={() => onUse(sel, i)}>
                  Anwenden
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
