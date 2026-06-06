import { useState, useEffect, useCallback, useRef } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import StarterSelect from './components/StarterSelect.jsx';
import Overworld from './components/Overworld.jsx';
import BattleScreen from './components/BattleScreen.jsx';
import PartyScreen from './components/PartyScreen.jsx';
import DexScreen from './components/DexScreen.jsx';
import { WARPS, START, ZONES, tileAt, isBlocked, TILE } from './data/world.js';
import { createInstance, healFull, getSpecies } from './engine/creatures.js';
import { pickWeighted, mulberry32, randInt } from './engine/rng.js';
import { saveGame, loadGame, hasSave, clearSave } from './engine/save.js';

const ENCOUNTER_RATE = 0.22;

export default function App() {
  const [screen, setScreen] = useState('title'); // title | starter | world | battle
  const [player, setPlayer] = useState({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
  const [party, setParty] = useState([]);
  const [box, setBox] = useState([]);
  const [dexSeen, setDexSeen] = useState(new Set());
  const [dexCaught, setDexCaught] = useState(new Set());
  const [balls, setBalls] = useState(10);
  const [enemy, setEnemy] = useState(null);
  const [overlay, setOverlay] = useState(null); // null | party | dex | menu
  const [toast, setToast] = useState(null);
  const [canContinue, setCanContinue] = useState(false);

  const encounterRng = useRef(mulberry32(Date.now() >>> 0));

  useEffect(() => { setCanContinue(hasSave()); }, []);

  const showToast = (txt) => {
    setToast(txt);
    setTimeout(() => setToast(null), 2200);
  };

  // ---- Speichern / Laden ----
  const persist = useCallback((over = {}) => {
    saveGame({
      player, party, box, dexSeen, dexCaught, balls, ...over,
    });
  }, [player, party, box, dexSeen, dexCaught, balls]);

  function startNewGame() {
    setParty([]); setBox([]);
    setDexSeen(new Set()); setDexCaught(new Set());
    setBalls(10);
    setPlayer({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
    setScreen('starter');
  }

  function continueGame() {
    const s = loadGame();
    if (!s) { startNewGame(); return; }
    setPlayer(s.player);
    setParty(s.party);
    setBox(s.box);
    setDexSeen(s.dexSeen);
    setDexCaught(s.dexCaught);
    setBalls(s.balls);
    setScreen('world');
  }

  function chooseStarter(speciesId) {
    const starter = createInstance(speciesId, 5);
    const newParty = [starter];
    const seen = new Set([speciesId]);
    const caught = new Set([speciesId]);
    setParty(newParty); setDexSeen(seen); setDexCaught(caught);
    setScreen('world');
    saveGame({ player: { zone: START.zone, x: START.x, y: START.y, facing: 'down' }, party: newParty, box: [], dexSeen: seen, dexCaught: caught, balls: 10 });
    setCanContinue(true);
    showToast(`${getSpecies(starter).name} schließt sich dir an!`);
  }

  // ---- Bewegung ----
  const tryDir = useCallback((dx, dy) => {
    if (screen !== 'world' || overlay) return;
    setPlayer((p) => {
      const facing = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      const nx = p.x + dx;
      const ny = p.y + dy;
      const ch = tileAt(p.zone, nx, ny);
      if (isBlocked(ch)) return { ...p, facing };

      // Warp?
      if (TILE.WARPS.has(ch)) {
        const w = WARPS[p.zone]?.[ch];
        if (w) {
          const np = { zone: w.to, x: w.x, y: w.y, facing };
          queueMicrotask(() => saveAfterMove(np));
          return np;
        }
      }

      const np = { ...p, x: nx, y: ny, facing };

      // Begegnung im hohen Gras?
      if (ch === TILE.ENCOUNTER && encounterRng.current() < ENCOUNTER_RATE) {
        queueMicrotask(() => triggerEncounter(np.zone));
      }
      queueMicrotask(() => saveAfterMove(np));
      return np;
    });
  }, [screen, overlay]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveAfterMove(np) {
    saveGame({ player: np, party, box, dexSeen, dexCaught, balls });
  }

  function triggerEncounter(zoneKey) {
    const z = ZONES[zoneKey];
    const pick = pickWeighted(encounterRng.current, z.encounters);
    const level = randInt(encounterRng.current, pick.min, pick.max);
    const foe = createInstance(pick.id, level);
    setDexSeen((prev) => new Set(prev).add(pick.id));
    setEnemy(foe);
    setScreen('battle');
  }

  // Tastatursteuerung
  useEffect(() => {
    if (screen !== 'world') return;
    const onKey = (e) => {
      if (overlay) { if (e.key === 'Escape') setOverlay(null); return; }
      const map = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      const m = map[e.key];
      if (m) { e.preventDefault(); tryDir(m[0], m[1]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, overlay, tryDir]);

  // ---- Kampf-Ergebnis ----
  function endBattle(result) {
    const newParty = [...party];
    if (result.type === 'catch') {
      const caught = result.enemy;
      if (newParty.length < 6) newParty.push(caught);
      else setBox((b) => [...b, caught]);
      setParty(newParty);
      setDexCaught((prev) => new Set(prev).add(caught.speciesId));
      showToast(`${getSpecies(caught).name} ist jetzt in deinem Team!`);
    } else if (result.type === 'lose') {
      newParty.forEach(healFull);
      setParty(newParty);
      setPlayer({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
      showToast('Du wurdest besiegt – erschöpft kehrst du zur Heimatwiese zurück.');
    } else {
      setParty(newParty); // win / flee: HP/EP-Änderungen übernehmen
    }
    setEnemy(null);
    setScreen('world');
    // nach kurzer Verzögerung speichern (State hat sich gesetzt)
    setTimeout(() => saveGame({
      player: result.type === 'lose' ? { zone: START.zone, x: START.x, y: START.y, facing: 'down' } : player,
      party: newParty, box, dexSeen,
      dexCaught: result.type === 'catch' ? new Set([...dexCaught, result.enemy.speciesId]) : dexCaught,
      balls,
    }), 0);
  }

  function leadParty(i) {
    setParty((p) => {
      const np = [...p];
      const [picked] = np.splice(i, 1);
      np.unshift(picked);
      return np;
    });
  }

  // ---- Render ----
  if (screen === 'title') {
    return (
      <div className="app">
        <TitleScreen onNew={startNewGame} onContinue={continueGame} canContinue={canContinue} />
      </div>
    );
  }

  if (screen === 'starter') {
    return (
      <div className="app">
        <StarterSelect onChoose={chooseStarter} />
      </div>
    );
  }

  if (screen === 'battle' && enemy) {
    return (
      <div className="app">
        {toast && <div className="toast">{toast}</div>}
        <BattleScreen
          enemy={enemy}
          party={party}
          balls={balls}
          onUseBall={() => setBalls((b) => Math.max(0, b - 1))}
          onEnd={endBattle}
        />
      </div>
    );
  }

  // world
  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <Overworld
        zone={player.zone}
        px={player.x}
        py={player.y}
        facing={player.facing}
        balls={balls}
        partyCount={party.length}
        onDir={tryDir}
        onOpenParty={() => setOverlay('party')}
        onOpenDex={() => setOverlay('dex')}
        onMenu={() => setOverlay('menu')}
      />

      {overlay === 'party' && (
        <PartyScreen party={party} box={box} onClose={() => setOverlay(null)} onLead={leadParty} />
      )}
      {overlay === 'dex' && (
        <DexScreen dexSeen={dexSeen} dexCaught={dexCaught} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'menu' && (
        <div className="overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="title-big" style={{ fontSize: 14 }}>Menü</span>
            <button className="btn" onClick={() => setOverlay(null)}>✕</button>
          </div>
          <div className="tiny">Fangkugeln: {balls} · Team: {party.length} · Box: {box.length}</div>
          <button className="btn good" onClick={() => { persist(); showToast('Spiel gespeichert.'); setOverlay(null); }}>💾 Spiel speichern</button>
          <button className="btn" onClick={() => { setBalls((b) => b + 5); showToast('+5 Fangkugeln (Startgeschenk).'); }}>🎁 Fangkugeln auffüllen (+5)</button>
          <button className="btn" onClick={() => { persist(); setOverlay(null); setScreen('title'); }}>🏠 Zum Titelbildschirm</button>
          <button
            className="btn"
            style={{ borderColor: 'var(--danger)' }}
            onClick={() => { if (confirm('Spielstand wirklich löschen?')) { clearSave(); setCanContinue(false); setOverlay(null); setScreen('title'); } }}
          >
            🗑 Spielstand löschen
          </button>
        </div>
      )}
    </div>
  );
}
