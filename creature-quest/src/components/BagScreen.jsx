import { useState } from 'react';
import CreatureSprite from './CreatureSprite.jsx';
import { ITEMS } from '../data/items.js';
import { getSpecies, maxHp } from '../engine/creatures.js';

const CAT_LABEL = { heal: 'Heilung', revive: 'Heilung', status: 'Statusheiler', ball: 'Fangkugeln' };

export default function BagScreen({ bag, party, onUse, onClose }) {
  const [picked, setPicked] = useState(null); // itemId, das auf eine Kreatur angewendet wird

  const owned = Object.entries(bag)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n, ...ITEMS[id] }))
    .filter((it) => it.name);

  // Fangkugeln nur im Kampf nutzbar – hier nur anzeigen.
  const usable = (it) => it.category === 'heal' || it.category === 'revive' || it.category === 'status';

  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>🎒 Beutel</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>

      {owned.length === 0 && <div className="small">Dein Beutel ist leer.</div>}

      {!picked && owned.map((it) => (
        <div key={it.id} className="row" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>{it.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="small">{it.name} <span className="tiny">×{it.n}</span></div>
            <div className="tiny">{it.desc}</div>
            <div className="tiny" style={{ color: 'var(--ink-dim)' }}>{CAT_LABEL[it.category] || ''}</div>
          </div>
          {usable(it) ? (
            <button className="btn good" style={{ padding: '4px 8px' }} onClick={() => setPicked(it.id)}>Benutzen</button>
          ) : (
            <span className="tiny" style={{ color: 'var(--ink-dim)' }}>nur im Kampf</span>
          )}
        </div>
      ))}

      {picked && (
        <>
          <div className="small">Bei welcher Kreatur {ITEMS[picked].name} einsetzen?</div>
          {party.map((p, i) => {
            const sp = getSpecies(p);
            return (
              <button key={p.uid} className="row" style={{ alignItems: 'center', cursor: 'pointer', width: '100%' }}
                onClick={() => { onUse(picked, i); setPicked(null); }}>
                <CreatureSprite id={p.speciesId} type={sp.type} body={sp.body} size={40} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="small">{sp.name} <span className="tiny">Lv{p.level}</span></div>
                  <div className="tiny">KP {Math.max(0, p.curHp)}/{maxHp(p)}{p.status ? ` · ${p.status}` : ''}</div>
                </div>
              </button>
            );
          })}
          <button className="btn" onClick={() => setPicked(null)}>↩ Zurück</button>
        </>
      )}
    </div>
  );
}
