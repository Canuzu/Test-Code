import { useState, useEffect, useCallback, useRef } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import StarterSelect from './components/StarterSelect.jsx';
import Overworld from './components/Overworld.jsx';
import BattleScreen from './components/BattleScreen.jsx';
import PartyScreen from './components/PartyScreen.jsx';
import DexScreen from './components/DexScreen.jsx';
import Shop from './components/Shop.jsx';
import Bag from './components/Bag.jsx';
import { WARPS, START, ZONES, tileAt, isBlocked, TILE } from './data/world.js';
import { createInstance, healFull, getSpecies, maxHp } from './engine/creatures.js';
import { pickWeighted, mulberry32, randInt } from './engine/rng.js';
import { saveGame, loadGame, hasSave, clearSave } from './engine/save.js';
import { ITEMS, STARTER_BAG, STARTER_MONEY } from './data/items.js';

const ENCOUNTER_RATE = 0.22;

export default function App() {
  const [screen, setScreen] = useState('title'); // title | starter | world | battle
  const [player, setPlayer] = useState({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
  const [party, setParty] = useState([]);
  const [box, setBox] = useState([]);
  const [dexSeen, setDexSeen] = useState(new Set());
  const [dexCaught, setDexCaught] = useState(new Set());
  const [bag, setBag] = useState({ ...STARTER_BAG });
  const [money, setMoney] = useState(STARTER_MONEY);
  const [enemy, setEnemy] = useState(null);
  const [overlay, setOverlay] = useState(null); // null | party | dex | menu | shop | bag
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
      player, party, box, dexSeen, dexCaught, bag, money, ...over,
    });
  }, [player, party, box, dexSeen, dexCaught, bag, money]);

  function startNewGame() {
    setParty([]); setBox([]);
    setDexSeen(new Set()); setDexCaught(new Set());
    setBag({ ...STARTER_BAG });
    setMoney(STARTER_MONEY);
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
    setBag(s.bag);
    setMoney(s.money);
    setScreen('world');
  }

  function chooseStarter(speciesId) {
    const starter = createInstance(speciesId, 5);
    const newParty = [starter];
    const seen = new Set([speciesId]);
    const caught = new Set([speciesId]);
    setParty(newParty); setDexSeen(seen); setDexCaught(caught);
    setScreen('world');
    saveGame({
      player: { zone: START.zone, x: START.x, y: START.y, facing: 'down' },
      party: newParty, box: [], dexSeen: seen, dexCaught: caught,
      bag: { ...STARTER_BAG }, money: STARTER_MONEY,
    });
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
    saveGame({ player: np, party, box, dexSeen, dexCaught, bag, money });
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
    let newMoney = money;
    let loseReset = false;
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
      loseReset = true;
      showToast('Du wurdest besiegt – erschöpft kehrst du zur Heimatwiese zurück.');
    } else if (result.type === 'win') {
      const reward = result.enemy ? result.enemy.level * 6 + 10 : 0;
      newMoney = money + reward;
      setMoney(newMoney);
      setParty(newParty);
      if (reward) showToast(`Sieg! +${reward} Taler 💰`);
    } else {
      setParty(newParty); // flee: HP-Änderungen übernehmen
    }
    setEnemy(null);
    setScreen('world');
    // nach kurzer Verzögerung speichern (State hat sich gesetzt)
    setTimeout(() => saveGame({
      player: loseReset ? { zone: START.zone, x: START.x, y: START.y, facing: 'down' } : player,
      party: newParty, box, dexSeen,
      dexCaught: result.type === 'catch' ? new Set([...dexCaught, result.enemy.speciesId]) : dexCaught,
      bag, money: newMoney,
    }), 0);
  }

  function consumeItem(id) {
    setBag((b) => {
      const n = { ...b };
      n[id] = Math.max(0, (n[id] || 0) - 1);
      if (n[id] === 0) delete n[id];
      return n;
    });
  }

  function buyItem(id) {
    const it = ITEMS[id];
    if (money < it.price) return;
    setMoney((m) => m - it.price);
    setBag((b) => ({ ...b, [id]: (b[id] || 0) + 1 }));
    showToast(`${it.name} gekauft!`);
  }

  function useBagItem(id, partyIdx) {
    const it = ITEMS[id];
    if (!it || (bag[id] || 0) <= 0) return;
    setParty((prev) => {
      const np = [...prev];
      const target = np[partyIdx];
      if (it.kind === 'heal') {
        if (target.curHp <= 0 || target.curHp >= maxHp(target)) return prev;
        target.curHp = Math.min(maxHp(target), target.curHp + it.amount);
      } else if (it.kind === 'revive') {
        if (target.curHp > 0) return prev;
        target.curHp = Math.max(1, Math.round(maxHp(target) * it.ratio));
      } else {
        return prev;
      }
      return np;
    });
    consumeItem(id);
    showToast(`${it.name} eingesetzt.`);
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
          bag={bag}
          onConsume={consumeItem}
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
      {overlay === 'shop' && (
        <Shop money={money} bag={bag} onBuy={buyItem} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'bag' && (
        <Bag bag={bag} party={party} onUse={useBagItem} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'menu' && (
        <div className="overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="title-big" style={{ fontSize: 14 }}>Menü</span>
            <button className="btn" onClick={() => setOverlay(null)}>✕</button>
          </div>
          <div className="tiny">💰 {money} Taler · Team: {party.length} · Box: {box.length}</div>
          <button className="btn" onClick={() => setOverlay('bag')}>🎒 Beutel</button>
          <button className="btn" onClick={() => setOverlay('shop')}>🛒 Naturladen</button>
          <button className="btn good" onClick={() => { persist(); showToast('Spiel gespeichert.'); setOverlay(null); }}>💾 Spiel speichern</button>
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
