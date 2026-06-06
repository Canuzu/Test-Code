import { useState } from 'react';
import CreatureSprite from './CreatureSprite.jsx';
import { CREATURES, STARTER_IDS } from '../data/creatures.js';
import { TYPES } from '../data/types.js';

export default function StarterSelect({ onChoose }) {
  const [sel, setSel] = useState(null);
  const chosen = sel != null ? CREATURES[sel] : null;

  return (
    <div className="screen-center">
      <div className="title-big" style={{ fontSize: 16 }}>Wähle deinen Begleiter</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {STARTER_IDS.map((id) => {
          const c = CREATURES[id];
          const t = TYPES[c.type];
          const active = sel === id;
          return (
            <button
              key={id}
              className="panel"
              onClick={() => setSel(id)}
              style={{
                background: active ? '#28396199' : 'var(--panel)',
                borderColor: active ? t.color : 'var(--line)',
                padding: 10,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CreatureSprite id={c.id} type={c.type} body={c.body} size={96} />
              <span className="small">{c.name}</span>
              <span className="type-pill" style={{ background: t.color }}>
                {t.icon} {t.name}
              </span>
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className="panel" style={{ padding: 12, maxWidth: 340 }}>
          <div className="tiny">{chosen.flavor}</div>
        </div>
      )}
      <button
        className="btn primary"
        disabled={!chosen}
        onClick={() => onChoose(sel)}
        style={{ textAlign: 'center', width: 220 }}
      >
        {chosen ? `${chosen.name} wählen!` : 'Wähle eine Kreatur'}
      </button>
    </div>
  );
}
