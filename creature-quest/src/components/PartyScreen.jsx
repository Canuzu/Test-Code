import CreatureSprite from './CreatureSprite.jsx';
import { TYPES } from '../data/types.js';
import { getSpecies, maxHp, maxStats, xpForNext } from '../engine/creatures.js';

const STATUS_BADGE = {
  burn:      { label: 'BRN', color: '#b03000', bg: '#ffcaaa' },
  paralysis: { label: 'PAR', color: '#806000', bg: '#ffe878' },
  poison:    { label: 'PSN', color: '#7030a0', bg: '#e8c0f0' },
  sleep:     { label: 'SLP', color: '#404080', bg: '#c0c0e8' },
};

export default function PartyScreen({ party, box, onClose, onLead }) {
  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>Dein Team</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>

      {party.map((p, i) => {
        const sp = getSpecies(p);
        const t = TYPES[sp.type];
        const t2 = sp.type2 ? TYPES[sp.type2] : null;
        const st = maxStats(p);
        const mx = maxHp(p);
        return (
          <div key={p.uid} className="row" style={{ alignItems: 'flex-start' }}>
            <CreatureSprite id={p.speciesId} type={sp.type} body={sp.body} size={56} />
            <div style={{ flex: 1 }}>
              <div className="small">
                {i === 0 ? '⭐ ' : ''}{sp.name} <span className="tiny">Lv{p.level}</span>
                {p.status && STATUS_BADGE[p.status] && (
                  <span
                    className="status-badge"
                    style={{ background: STATUS_BADGE[p.status].bg, color: STATUS_BADGE[p.status].color, marginLeft: 6 }}
                  >
                    {STATUS_BADGE[p.status].label}
                  </span>
                )}
              </div>
              <span className="type-pill" style={{ background: t.color }}>{t.icon} {t.name}</span>
              {t2 && <span className="type-pill" style={{ background: t2.color, marginLeft: 4 }}>{t2.icon} {t2.name}</span>}
              <div className="tiny" style={{ marginTop: 4 }}>
                HP {Math.max(0, p.curHp)}/{mx} · ATK {st.atk} · DEF {st.def} · SPD {st.spd}
              </div>
              <div className="tiny">EP bis Lv{p.level + 1}: {Math.max(0, xpForNext(p.level) - p.xp)}</div>
              <div className="tiny">Attacken: {p.moves.map((m) => m).length} · {sp.flavor}</div>
            </div>
            {i !== 0 && (
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => onLead(i)}>↑ Anführer</button>
            )}
          </div>
        );
      })}

      {box.length > 0 && (
        <div className="tiny" style={{ marginTop: 6 }}>
          📦 In der Box (Lager): {box.length} weitere Kreatur(en).
        </div>
      )}
    </div>
  );
}
