import { useEffect, useState } from 'react';
import CreatureSprite from './CreatureSprite.jsx';
import { charImgUrl } from './GenderSelect.jsx';
import { MOVES } from '../data/moves.js';
import { TYPES } from '../data/types.js';
import {
  performMove, enemyChooseMove, attemptCapture, fleeChance, speedOf, resetBuffs,
} from '../engine/battle.js';
import { gainXp, xpReward, getSpecies, maxHp } from '../engine/creatures.js';

// Battle background images (downloaded by CI into assets/battle-bg/)
const BG_IMGS = import.meta.glob('../assets/battle-bg/*.png', { eager: true, import: 'default' });
function battleBgUrl(name) {
  for (const [p, url] of Object.entries(BG_IMGS))
    if (p.includes(`/${name}.`)) return url;
  return null;
}

// Zone → background key mapping
const ZONE_BG = { wiese: 'meadow', wald: 'forest', hoehle: 'cave' };

function hpColor(ratio) {
  if (ratio > 0.5) return '#48c840';
  if (ratio > 0.2) return '#f8c800';
  return '#f82800';
}

// Visual effect per move type: flying projectile glyph + impact colour.
const FX = {
  normal:  { glyph: '✦',  color: '#eceadf' },
  feuer:   { glyph: '🔥', color: '#ff7043' },
  wasser:  { glyph: '💧', color: '#42a5f5' },
  pflanze: { glyph: '🍃', color: '#66bb6a' },
  elektro: { glyph: '⚡', color: '#ffca28' },
  erde:    { glyph: '🪨', color: '#a1887f' },
  luft:    { glyph: '🌀', color: '#90caf9' },
};

function HpBar({ inst, showNums }) {
  const sp = getSpecies(inst);
  const mx = maxHp(inst);
  const ratio = Math.max(0, inst.curHp / mx);
  return (
    <div className="ds-hpbox">
      <div className="ds-hpbox-name">
        <span>{sp.name}</span>
        <span>Lv{inst.level}</span>
      </div>
      <div className="ds-hpbar-row">
        <span className="ds-hp-label">HP</span>
        <div className="ds-hpbar-track">
          <div className="ds-hpbar-fill" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} />
        </div>
      </div>
      {showNums && (
        <div className="ds-hpnums">{Math.max(0, inst.curHp)}<span className="ds-hpsep">/</span>{mx}</div>
      )}
    </div>
  );
}

export default function BattleScreen({ enemyTeam, trainer, party, balls, playerName, gender = 'boy', zone = 'wiese', onEnd, onUseBall }) {
  const isTrainer = !!trainer;

  const [enemyIdx, setEnemyIdx] = useState(0);
  const [active, setActive] = useState(() => party.findIndex((p) => p.curHp > 0));
  const [phase, setPhase] = useState('msg');
  const [mandatorySwitch, setMandatory] = useState(false);
  const [msg, setMsg] = useState(() => {
    const foe = enemyTeam[0];
    const foeName = getSpecies(foe).name;
    return isTrainer
      ? [`${trainer.name} fordert dich heraus!`, `Los, ${foeName}!`]
      : [`Ein wildes ${foeName} erscheint!`];
  });
  const [outcome, setOutcome] = useState({ type: 'continue' });
  const [hitFlash, setHitFlash] = useState(null); // 'enemy' | 'player'
  const [lunge, setLunge]   = useState(null);
  const [fx, setFx]         = useState(null);
  const [shake, setShake]   = useState(false);
  const [fainting, setFainting] = useState(null);
  const [trainerOut, setTrainerOut] = useState(false); // trainer portrait exits once battle starts
  const [, forceTick] = useState(0);

  const foe = enemyTeam[enemyIdx];
  const foeSp = getSpecies(foe);
  const me = party[active];
  const meSp = getSpecies(me);

  useEffect(() => {
    party.forEach(resetBuffs);
    enemyTeam.forEach(resetBuffs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A freshly sent-in creature is standing again.
  useEffect(() => { setFainting((f) => (f === 'enemy'  ? null : f)); }, [enemyIdx]);
  useEffect(() => { setFainting((f) => (f === 'player' ? null : f)); }, [active]);

  // Once the intro messages clear and battle enters menu, animate trainer portrait out.
  useEffect(() => {
    if (isTrainer && phase === 'menu' && !trainerOut) {
      setTrainerOut(true);
    }
  }, [isTrainer, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'msg') return;
    if (msg.length === 0) { applyOutcome(); return; }
    const t = setTimeout(() => setMsg((m) => m.slice(1)), 1100);
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
      case 'win':      onEnd({ type: 'win', enemy: foe }); break;
      case 'trainer_win': onEnd({ type: 'trainer_win' }); break;
      case 'next_enemy': {
        const next = outcome.nextIdx;
        setEnemyIdx(next);
        const nextSp = getSpecies(enemyTeam[next]);
        enqueue([`${trainer?.name ?? 'Trainer'} schickt ${nextSp.name}!`], { type: 'continue' });
        break;
      }
      case 'catch':    onEnd({ type: 'catch', enemy: foe }); break;
      case 'flee':     onEnd({ type: 'flee' }); break;
      case 'lose':     onEnd({ type: 'lose' }); break;
      case 'forceSwitch': setMandatory(true); setPhase('team'); break;
      default: setPhase('menu');
    }
  }

  function resolveFaint(faintedIdx) {
    return party.some((p, k) => k !== faintedIdx && p.curHp > 0)
      ? { type: 'forceSwitch' }
      : { type: 'lose' };
  }

  function resolveEnemyFaint(meInst, deadFoe, lines) {
    const nameBefore = getSpecies(meInst).name;
    const ev = gainXp(meInst, xpReward(deadFoe));
    if (ev.gained) lines.push(`${nameBefore} erhält ${ev.gained} EP.`);
    for (const lv of ev.levels) lines.push(`${nameBefore} erreicht Level ${lv}!`);
    for (const mv of ev.learned) lines.push(`${nameBefore} erlernt ${MOVES[mv].name}!`);
    if (ev.evolved) lines.push(`${ev.evolved.from} entwickelt sich zu ${ev.evolved.to}!`);
    if (isTrainer) {
      const nextIdx = enemyIdx + 1;
      return nextIdx < enemyTeam.length ? { type: 'next_enemy', nextIdx } : { type: 'trainer_win' };
    }
    return { type: 'win' };
  }

  // Plays the collected hit events one after another: attacker lunges, a
  // type-coloured projectile flies at the defender, then impact flash + shake,
  // and finally a collapse if the defender fainted.
  function playHits(hits) {
    hits.forEach((h, i) => {
      setTimeout(() => {
        setLunge(h.attacker);
        setTimeout(() => setLunge((l) => (l === h.attacker ? null : l)), 260);
        if (h.damage > 0) {
          setFx({ defender: h.defender, type: FX[h.type] ? h.type : 'normal', key: Date.now() + i });
          setShake(true);
          setTimeout(() => setHitFlash(h.defender), 300);
          setTimeout(() => { setHitFlash(null); setShake(false); }, 640);
          setTimeout(() => setFx(null), 700);
        }
        if (h.faint) setTimeout(() => setFainting(h.faint), h.damage > 0 ? 360 : 60);
      }, i * 720);
    });
  }

  function playerAttack(moveId) {
    const lines = [];
    const hits = [];
    const order = speedOf(me) >= speedOf(foe) ? ['me', 'foe'] : ['foe', 'me'];
    let out = { type: 'continue' };
    for (const who of order) {
      if (me.curHp <= 0 || foe.curHp <= 0) break;
      if (who === 'me') {
        const r = performMove(me, foe, moveId);
        lines.push(...r.log);
        hits.push({ attacker: 'player', defender: 'enemy', type: MOVES[moveId].type, damage: r.damage, faint: foe.curHp <= 0 ? 'enemy' : null });
        if (foe.curHp <= 0) { lines.push(`${foeSp.name} wurde besiegt!`); out = resolveEnemyFaint(me, foe, lines); break; }
      } else {
        const mid = enemyChooseMove(foe);
        const r = performMove(foe, me, mid);
        lines.push(...r.log);
        hits.push({ attacker: 'enemy', defender: 'player', type: MOVES[mid].type, damage: r.damage, faint: me.curHp <= 0 ? 'player' : null });
        if (me.curHp <= 0) { lines.push(`${meSp.name} wurde besiegt!`); out = resolveFaint(active); break; }
      }
    }
    playHits(hits);
    enqueue(lines, out);
  }

  // The foe's retaliation, shared by ball/switch/flee. Mutates lines, returns outcome.
  function foeRetaliate(target, targetIdx, lines, hits) {
    const mid = enemyChooseMove(foe);
    const r = performMove(foe, target, mid);
    lines.push(...r.log);
    hits.push({ attacker: 'enemy', defender: 'player', type: MOVES[mid].type, damage: r.damage, faint: target.curHp <= 0 ? 'player' : null });
    if (target.curHp <= 0) { lines.push(`${getSpecies(target).name} wurde besiegt!`); return resolveFaint(targetIdx); }
    return { type: 'continue' };
  }

  function throwBall() {
    if (isTrainer) { enqueue(['Trainer-Kreaturen können nicht gefangen werden!'], { type: 'continue' }); return; }
    if (balls <= 0) { enqueue(['Keine Fangkugeln mehr!'], { type: 'continue' }); return; }
    onUseBall();
    const lines = ['Du wirfst eine Fangkugel…'];
    if (attemptCapture(foe)) {
      lines.push(`${foeSp.name} wurde gefangen!`);
      enqueue(lines, { type: 'catch' });
    } else {
      lines.push(`${foeSp.name} hat sich befreit!`);
      const hits = [];
      const out = foeRetaliate(me, active, lines, hits);
      playHits(hits);
      enqueue(lines, out);
    }
  }

  function doSwitch(i) {
    if (i === active || party[i].curHp <= 0) return;
    const forced = mandatorySwitch;
    const lines = [`Los, ${getSpecies(party[i]).name}!`];
    setActive(i);
    setMandatory(false);
    if (forced) { enqueue(lines, { type: 'continue' }); return; }
    const hits = [];
    const out = foeRetaliate(party[i], i, lines, hits);
    playHits(hits);
    enqueue(lines, out);
  }

  function flee() {
    if (isTrainer) { enqueue(['Vor einem Trainer kann man nicht fliehen!'], { type: 'continue' }); return; }
    if (Math.random() < fleeChance(me, foe)) {
      enqueue(['Du bist entkommen!'], { type: 'flee' });
    } else {
      const lines = ['Flucht gescheitert!'];
      const hits = [];
      const out = foeRetaliate(me, active, lines, hits);
      playHits(hits);
      enqueue(lines, out);
    }
  }

  const skipMsg = () => msg.length && setMsg((m) => m.slice(1));

  const foeType = TYPES[foeSp.type];
  const bgKey = ZONE_BG[zone] || 'meadow';
  const bgUrl = battleBgUrl(bgKey);
  const trainerSpriteKey = trainer?.sprite || 'trainer-generic';
  const trainerImgUrl = charImgUrl(trainerSpriteKey);
  const showTrainerPortrait = isTrainer && !trainerOut;

  return (
    <div className="battle-wrap">
      {/* ── Trainer banner ── */}
      {isTrainer && (
        <div className="trainer-banner">
          <span>⚔ {trainer.name}</span>
          <span>{enemyIdx + 1}/{enemyTeam.length}</span>
        </div>
      )}

      {/* ── Battle field ── */}
      <div className={`battle-scene${shake ? ' shake' : ''}`} style={bgUrl ? {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center bottom',
      } : undefined}>
        {/* gradient overlay so the scene stays readable even with bg image */}
        <div className="battle-bg-overlay" />
        {/* drifting clouds */}
        <div className="battle-clouds" aria-hidden>
          <span className="bcloud b1" /><span className="bcloud b2" /><span className="bcloud b3" />
        </div>
        {!bgUrl && <div className="battle-sun" aria-hidden />}

        {/* enemy side */}
        <div className="enemy-side">
          <HpBar inst={foe} showNums={false} />
          <div className="enemy-sprite-wrap">
            <div className="enemy-platform" />
            {/* Trainer portrait (shown during intro messages) */}
            {showTrainerPortrait && (
              <div className="trainer-portrait-wrap trainer-enter">
                {trainerImgUrl
                  ? <img src={trainerImgUrl} alt={trainer.name} className="trainer-portrait-img" draggable="false" />
                  : <div className="trainer-portrait-fallback">⚔️</div>}
              </div>
            )}
            {/* Pokémon sprite (hidden while trainer portrait is shown) */}
            <div key={`enemy-${enemyIdx}`}
              className={`sprite-stack ${showTrainerPortrait ? 'hidden-sprite' : 'sprite-enter'}`}>
              <div className={lunge === 'enemy' ? 'lunge-enemy' : ''}>
                <div className={`sprite-breath${fainting === 'enemy' ? ' is-faint' : ''}`}>
                  <div className={hitFlash === 'enemy' ? 'sprite-flash' : ''}>
                    <div style={{ mixBlendMode: 'multiply' }}>
                      <CreatureSprite id={foe.speciesId} type={foeSp.type} body={foeSp.body} size={128} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* player side */}
        <div className="player-side">
          <div className="player-sprite-wrap">
            <div className="player-platform" />
            <div key={`me-${me.uid}`} className="sprite-stack sprite-enter-back">
              <div className={lunge === 'player' ? 'lunge-player' : ''}>
                <div className={`sprite-breath${fainting === 'player' ? ' is-faint' : ''}`}>
                  <div className={hitFlash === 'player' ? 'sprite-flash' : ''}>
                    <div style={{ mixBlendMode: 'multiply' }}>
                      <CreatureSprite id={me.speciesId} type={meSp.type} body={meSp.body} size={144} flip />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <HpBar inst={me} showNums />
        </div>

        {/* ── Attack effect layer ── */}
        {fx && (
          <>
            <div key={fx.key} className={`fx-layer fx-to-${fx.defender}`}>
              <div className="fx-proj" style={{ color: FX[fx.type].color }}>{FX[fx.type].glyph}</div>
            </div>
            <div
              key={`burst-${fx.key}`}
              className={`fx-burst fx-burst-${fx.defender}`}
              style={{ background: `radial-gradient(circle, ${FX[fx.type].color} 0%, ${FX[fx.type].color}00 70%)` }}
            />
          </>
        )}
      </div>

      {/* ── Bottom UI ── */}
      <div className="battle-ui-wrap">
        {phase === 'msg' && (
          <div className="ds-textbox" onClick={skipMsg}>
            <p className="ds-msg-text">{msg[0]}</p>
            <span className="ds-arrow">▼</span>
          </div>
        )}

        {phase === 'menu' && (
          <div className="ds-menu">
            <div className="ds-menu-prompt">
              <span>Was tun?</span>
              <span className="ds-menu-name">{meSp.name}</span>
            </div>
            <div className="ds-action-grid">
              <button className="ds-btn ds-fight" onClick={() => setPhase('move')}>
                <span className="ds-btn-icon">⚔</span>KÄMPFEN
              </button>
              <button className="ds-btn ds-bag" onClick={throwBall} disabled={isTrainer}>
                <span className="ds-btn-icon">◎</span>{isTrainer ? 'BAG —' : `BAG (${balls})`}
              </button>
              <button className="ds-btn ds-party" onClick={() => setPhase('team')}>
                <span className="ds-btn-icon">◉</span>WECHSELN
              </button>
              <button className="ds-btn ds-run" onClick={flee}>
                <span className="ds-btn-icon">↗</span>FLUCHT
              </button>
            </div>
          </div>
        )}

        {phase === 'move' && (
          <div className="ds-moves">
            {me.moves.map((mv) => {
              const m = MOVES[mv];
              const t = TYPES[m.type] || { color: '#888', icon: '◆', name: m.type };
              return (
                <button key={mv} className="ds-move-btn" onClick={() => playerAttack(mv)}>
                  <span className="ds-move-name">{m.name}</span>
                  <span className="type-pill ds-move-type" style={{ background: t.color }}>{t.icon} {t.name}</span>
                  {m.power > 0 && <span className="ds-move-power">Kraft {m.power}</span>}
                </button>
              );
            })}
            <button className="ds-btn ds-back-btn" onClick={() => setPhase('menu')}>↩ Zurück</button>
          </div>
        )}

        {phase === 'team' && (
          <div className="ds-team">
            <p className="ds-team-title">{mandatorySwitch ? 'Kreatur wählen!' : 'Team:'}</p>
            {party.map((p, i) => {
              const sp = getSpecies(p);
              const fainted = p.curHp <= 0;
              return (
                <button
                  key={p.uid}
                  className={`ds-team-row${fainted ? ' fainted' : ''}${i === active ? ' active' : ''}`}
                  disabled={fainted || i === active}
                  onClick={() => doSwitch(i)}
                >
                  <CreatureSprite id={p.speciesId} type={sp.type} body={sp.body} size={36} />
                  <span className="ds-team-name">{sp.name}</span>
                  <span className="ds-team-hp">
                    {Math.max(0, p.curHp)}/{maxHp(p)}
                    {i === active && ' ●'}
                  </span>
                </button>
              );
            })}
            {!mandatorySwitch && (
              <button className="ds-btn ds-back-btn" onClick={() => setPhase('menu')}>↩ Zurück</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
