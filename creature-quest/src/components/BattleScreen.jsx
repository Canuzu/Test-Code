import { useEffect, useState } from 'react';
import PixelSprite from './PixelSprite.jsx';
import { MOVES } from '../data/moves.js';
import { TYPES } from '../data/types.js';
import {
  performMove, enemyChooseMove, attemptCapture, fleeChance, speedOf, resetBuffs,
} from '../engine/battle.js';
import { gainXp, xpReward, getSpecies, maxHp } from '../engine/creatures.js';

function hpColor(ratio) {
  if (ratio > 0.5) return '#5ad15a';
  if (ratio > 0.2) return '#ffd24a';
  return '#ff6b6b';
}

function HpBox({ inst, showXp }) {
  const sp = getSpecies(inst);
  const t = TYPES[sp.type];
  const mx = maxHp(inst);
  const ratio = Math.max(0, inst.curHp / mx);
  return (
    <div className="hpbox">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{sp.name}</span>
        <span>Lv{inst.level}</span>
      </div>
      <span className="type-pill" style={{ background: t.color, marginTop: 2 }}>{t.icon}{t.name}</span>
      <div className="hpbar-bg"><div className="hpbar-fill" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} /></div>
      {showXp && <div style={{ fontSize: 8, marginTop: 3, color: 'var(--ink-dim)' }}>HP {Math.max(0, inst.curHp)}/{mx}</div>}
    </div>
  );
}

export default function BattleScreen({ enemy, party, balls, onEnd, onUseBall }) {
  const [active, setActive] = useState(() => party.findIndex((p) => p.curHp > 0));
  const [phase, setPhase] = useState('msg'); // msg | menu | move | team
  const [mandatorySwitch, setMandatory] = useState(false);
  const [msg, setMsg] = useState([`Ein wildes ${getSpecies(enemy).name} erscheint!`]);
  const [outcome, setOutcome] = useState({ type: 'continue' });
  const [, forceTick] = useState(0); // erzwingt Re-Render nach HP-Änderung

  // Buffs zu Kampfbeginn zurücksetzen
  useEffect(() => {
    party.forEach(resetBuffs);
    resetBuffs(enemy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = party[active];

  // Nachrichten automatisch weiterschalten
  useEffect(() => {
    if (phase !== 'msg') return;
    if (msg.length === 0) {
      applyOutcome();
      return;
    }
    const t = setTimeout(() => setMsg((m) => m.slice(1)), 1050);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, msg]);

  function enqueue(lines, out) {
    setOutcome(out);
    setMsg(lines);
    setPhase('msg');
    forceTick((n) => n + 1);
  }

  function applyOutcome() {
    switch (outcome.type) {
      case 'continue': setPhase('menu'); break;
      case 'win': onEnd({ type: 'win', enemy }); break;
      case 'catch': onEnd({ type: 'catch', enemy }); break;
      case 'flee': onEnd({ type: 'flee' }); break;
      case 'lose': onEnd({ type: 'lose' }); break;
      case 'forceSwitch': setMandatory(true); setPhase('team'); break;
      default: setPhase('menu');
    }
  }

  function resolveFaint(faintedIdx) {
    const other = party.some((p, k) => k !== faintedIdx && p.curHp > 0);
    return other ? { type: 'forceSwitch' } : { type: 'lose' };
  }

  function resolveWin(meInst, foe, lines) {
    const nameBefore = getSpecies(meInst).name;
    const ev = gainXp(meInst, xpReward(foe));
    if (ev.gained) lines.push(`${nameBefore} erhält ${ev.gained} EP.`);
    for (const lv of ev.levels) lines.push(`${nameBefore} erreicht Level ${lv}!`);
    for (const mv of ev.learned) lines.push(`${nameBefore} erlernt ${MOVES[mv].name}!`);
    if (ev.evolved) lines.push(`Was?! ${ev.evolved.from} entwickelt sich zu ${ev.evolved.to}!`);
    return { type: 'win' };
  }

  function playerAttack(moveId) {
    const foe = enemy;
    const lines = [];
    const order = speedOf(me) >= speedOf(foe) ? ['me', 'foe'] : ['foe', 'me'];
    let out = { type: 'continue' };
    for (const who of order) {
      if (me.curHp <= 0 || foe.curHp <= 0) break;
      if (who === 'me') {
        const r = performMove(me, foe, moveId);
        lines.push(...r.log);
        if (foe.curHp <= 0) { lines.push(`${getSpecies(foe).name} wurde besiegt!`); out = resolveWin(me, foe, lines); break; }
      } else {
        const r = performMove(foe, me, enemyChooseMove(foe));
        lines.push(...r.log);
        if (me.curHp <= 0) { lines.push(`${getSpecies(me).name} wurde besiegt!`); out = resolveFaint(active); break; }
      }
    }
    enqueue(lines, out);
  }

  function throwBall() {
    if (balls <= 0) { enqueue(['Du hast keine Fangkugeln mehr!'], { type: 'continue' }); return; }
    onUseBall();
    const lines = ['Du wirfst eine Fangkugel…'];
    if (attemptCapture(enemy)) {
      lines.push(`${getSpecies(enemy).name} wurde gefangen!`);
      enqueue(lines, { type: 'catch' });
    } else {
      lines.push(`Oh nein! ${getSpecies(enemy).name} hat sich befreit!`);
      const r = performMove(enemy, me, enemyChooseMove(enemy));
      lines.push(...r.log);
      let out = { type: 'continue' };
      if (me.curHp <= 0) { lines.push(`${getSpecies(me).name} wurde besiegt!`); out = resolveFaint(active); }
      enqueue(lines, out);
    }
  }

  function doSwitch(i) {
    if (i === active || party[i].curHp <= 0) return;
    const forced = mandatorySwitch;
    const lines = [`Los, ${getSpecies(party[i]).name}!`];
    setActive(i);
    setMandatory(false);
    if (forced) {
      enqueue(lines, { type: 'continue' });
      return;
    }
    // Freiwilliger Wechsel: Gegner greift an
    const r = performMove(enemy, party[i], enemyChooseMove(enemy));
    lines.push(...r.log);
    let out = { type: 'continue' };
    if (party[i].curHp <= 0) { lines.push(`${getSpecies(party[i]).name} wurde besiegt!`); out = resolveFaint(i); }
    enqueue(lines, out);
  }

  function flee() {
    if (Math.random() < fleeChance(me, enemy)) {
      enqueue(['Du bist sicher entkommen!'], { type: 'flee' });
    } else {
      const lines = ['Flucht gescheitert!'];
      const r = performMove(enemy, me, enemyChooseMove(enemy));
      lines.push(...r.log);
      let out = { type: 'continue' };
      if (me.curHp <= 0) { lines.push(`${getSpecies(me).name} wurde besiegt!`); out = resolveFaint(active); }
      enqueue(lines, out);
    }
  }

  const enemySp = getSpecies(enemy);
  const meSp = getSpecies(me);

  return (
    <div className="battle">
      <div className="battle-field">
        <div className="enemy-slot">
          <HpBox inst={enemy} showXp />
          <div style={{ marginTop: 6 }}>
            <PixelSprite id={enemy.speciesId} type={enemySp.type} body={enemySp.body} size={96} />
          </div>
        </div>
        <div className="player-slot">
          <div style={{ marginBottom: 6 }}>
            <PixelSprite id={me.speciesId} type={meSp.type} body={meSp.body} size={104} flip />
          </div>
          <HpBox inst={me} showXp />
        </div>
      </div>

      <div className="battle-ui">
        {phase === 'msg' && (
          <div className="log" onClick={() => msg.length && setMsg((m) => m.slice(1))} style={{ cursor: 'pointer' }}>
            {msg[0]}
            <div className="tiny" style={{ marginTop: 8 }}>▼ weiter</div>
          </div>
        )}

        {phase === 'menu' && (
          <>
            <div className="log">Was soll {meSp.name} tun?</div>
            <div className="action-grid">
              <button className="btn primary" onClick={() => setPhase('move')}>⚔️ Kämpfen</button>
              <button className="btn" onClick={throwBall}>🎯 Fangkugel ({balls})</button>
              <button className="btn" onClick={() => setPhase('team')}>👥 Team</button>
              <button className="btn" onClick={flee}>🏃 Flucht</button>
            </div>
          </>
        )}

        {phase === 'move' && (
          <>
            <div className="log">Wähle eine Attacke:</div>
            <div className="action-grid">
              {me.moves.map((mv) => {
                const m = MOVES[mv];
                const t = TYPES[m.type] || { color: '#888', icon: '◆' };
                return (
                  <button key={mv} className="btn" onClick={() => playerAttack(mv)}>
                    {m.name}
                    <div className="tiny">{t.icon} {m.power ? `Kraft ${m.power}` : 'Status'}</div>
                  </button>
                );
              })}
              <button className="btn" style={{ gridColumn: '1 / -1' }} onClick={() => setPhase('menu')}>↩ Zurück</button>
            </div>
          </>
        )}

        {phase === 'team' && (
          <div style={{ padding: 8 }}>
            <div className="log">{mandatorySwitch ? 'Wähle deine nächste Kreatur!' : 'Kreatur wechseln:'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {party.map((p, i) => {
                const sp = getSpecies(p);
                const fainted = p.curHp <= 0;
                return (
                  <button
                    key={p.uid}
                    className="row"
                    disabled={fainted || i === active}
                    onClick={() => doSwitch(i)}
                    style={{ opacity: fainted ? 0.4 : 1, cursor: fainted || i === active ? 'default' : 'pointer' }}
                  >
                    <PixelSprite id={p.speciesId} type={sp.type} body={sp.body} size={36} />
                    <span style={{ flex: 1 }} className="small">{sp.name} {i === active ? '(aktiv)' : ''}</span>
                    <span className="tiny">Lv{p.level} · {Math.max(0, p.curHp)}/{maxHp(p)}</span>
                  </button>
                );
              })}
              {!mandatorySwitch && (
                <button className="btn" onClick={() => setPhase('menu')}>↩ Zurück</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
