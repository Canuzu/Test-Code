import CreatureSprite from './CreatureSprite.jsx';
import { TYPES } from '../data/types.js';
import { getSpecies, maxHp, maxStats, xpForNext } from '../engine/creatures.js';

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
