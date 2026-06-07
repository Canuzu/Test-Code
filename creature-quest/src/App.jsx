import { useState, useEffect, useCallback, useRef } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import GenderSelect from './components/GenderSelect.jsx';
import NameEntry from './components/NameEntry.jsx';
import StarterSelect from './components/StarterSelect.jsx';
import Overworld from './components/Overworld.jsx';
import BattleScreen from './components/BattleScreen.jsx';
import PartyScreen from './components/PartyScreen.jsx';
import DexScreen from './components/DexScreen.jsx';
import BagScreen from './components/BagScreen.jsx';
import ShopScreen from './components/ShopScreen.jsx';
import Dialogue from './components/Dialogue.jsx';
import { WARPS, START, ZONES, tileAt, isBlocked, TILE, npcAt, facingTile } from './data/world.js';
import { createInstance, healFull, getSpecies } from './engine/creatures.js';
import { useItemOn } from './engine/items.js';
import { startingBag, totalBalls, ITEMS } from './data/items.js';
import { pickWeighted, mulberry32, randInt } from './engine/rng.js';
import { saveGame, loadGame, hasSave, clearSave } from './engine/save.js';
import { playMusic, resumeAudio, sfx, setEnabled, isEnabled } from './engine/audio.js';

const ENCOUNTER_RATE = 0.22;

export default function App() {
  const [screen, setScreen] = useState('title'); // title | gender | name | starter | world | battle
  const [player, setPlayer] = useState({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
  const [playerName, setPlayerName] = useState('');
  const [gender, setGender] = useState('boy');
  const [party, setParty] = useState([]);
  const [box, setBox] = useState([]);
  const [dexSeen, setDexSeen] = useState(new Set());
  const [dexCaught, setDexCaught] = useState(new Set());
  const [bag, setBag] = useState(startingBag());
  const [money, setMoney] = useState(3000);
  const [badges, setBadges] = useState(new Set());
  const [rivalStage, setRivalStage] = useState(0);
  const [defeatedTrainers, setDefeatedTrainers] = useState(new Set());

  // Kampf-State: entweder Wild-Begegnung oder Trainerkampf
  const [enemyTeam, setEnemyTeam] = useState(null);        // Array von Instanzen
  const [trainerData, setTrainerData] = useState(null);    // NPC-Objekt (trainer) oder null

  const [overlay, setOverlay] = useState(null); // null | party | dex | bag | shop | menu
  const [shopNpc, setShopNpc] = useState(null);
  const [toast, setToast] = useState(null);

  // Aktiver Dialog (NPC-Textbox)
  const [dialogue, setDialogue] = useState(null); // { name, lines, onDone? }

  const [canContinue, setCanContinue] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); // bumps on each screen change to replay fade-in
  const [soundOn, setSoundOn] = useState(isEnabled());

  const encounterRng = useRef(mulberry32(Date.now() >>> 0));

  useEffect(() => { setCanContinue(hasSave()); }, []);

  // Replay a quick fade-in whenever the screen changes (DS-style transitions).
  useEffect(() => { setFadeKey((k) => k + 1); }, [screen]);

  // ---- Hintergrundmusik je nach Screen/Zone ----
  useEffect(() => {
    if (screen === 'title' || screen === 'gender' || screen === 'name' || screen === 'starter') {
      playMusic('title');
    } else if (screen === 'battle') {
      playMusic(trainerData ? 'trainer' : 'battle');
    } else if (screen === 'world') {
      playMusic(ZONES[player.zone]?.town ? 'town' : (player.zone || 'wiese'));
    }
  }, [screen, trainerData, player.zone]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setEnabled(next);
    if (next) { resumeAudio(); playMusic(screen === 'title' ? 'title' : (ZONES[player.zone]?.town ? 'town' : player.zone || 'wiese')); }
  }

  const showToast = (txt) => {
    setToast(txt);
    setTimeout(() => setToast(null), 2200);
  };

  // ---- Beutel / Geld ----
  function addItem(id, n = 1) {
    setBag((b) => ({ ...b, [id]: (b[id] || 0) + n }));
  }
  function removeItem(id, n = 1) {
    setBag((b) => {
      const left = Math.max(0, (b[id] || 0) - n);
      const nb = { ...b };
      if (left <= 0) delete nb[id]; else nb[id] = left;
      return nb;
    });
  }

  // ---- Speichern / Laden ----
  const persist = useCallback((over = {}) => {
    saveGame({
      player, party, box, dexSeen, dexCaught, bag, money, badges,
      playerName, defeatedTrainers, rivalStage, gender, ...over,
    });
  }, [player, party, box, dexSeen, dexCaught, bag, money, badges, playerName, defeatedTrainers, rivalStage, gender]);

  function startNewGame() {
    resumeAudio();
    setParty([]); setBox([]);
    setDexSeen(new Set()); setDexCaught(new Set());
    setBag(startingBag());
    setMoney(3000);
    setBadges(new Set());
    setRivalStage(0);
    setDefeatedTrainers(new Set());
    setPlayerName('');
    setPlayer({ zone: START.zone, x: START.x, y: START.y, facing: 'down' });
    setScreen('gender');
  }

  function handleGenderChoose(g) {
    setGender(g);
    setScreen('name');
  }

  function continueGame() {
    resumeAudio();
    const s = loadGame();
    if (!s) { startNewGame(); return; }
    setPlayer(s.player);
    setParty(s.party);
    setBox(s.box);
    setDexSeen(s.dexSeen);
    setDexCaught(s.dexCaught);
    setBag(s.bag);
    setMoney(s.money);
    setBadges(s.badges);
    setRivalStage(s.rivalStage);
    setPlayerName(s.playerName || '');
    setDefeatedTrainers(s.defeatedTrainers || new Set());
    setGender(s.gender || 'boy');
    setScreen('world');
  }

  function handleNameConfirm(name) {
    setPlayerName(name);
    setScreen('starter');
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
      bag: startingBag(), money: 3000, badges: new Set(),
      playerName, defeatedTrainers: new Set(), rivalStage: 0, gender,
    });
    setCanContinue(true);
    showToast(`${getSpecies(starter).name} schließt sich dir an!`);
  }

  // ---- Bewegung ----
  const tryDir = useCallback((dx, dy) => {
    if (screen !== 'world' || overlay || dialogue) return;
    setPlayer((p) => {
      const facing = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      const nx = p.x + dx;
      const ny = p.y + dy;
      const ch = tileAt(p.zone, nx, ny);

      // NPC blockiert?
      if (npcAt(p.zone, nx, ny)) return { ...p, facing };
      if (isBlocked(ch)) { sfx('bump'); return { ...p, facing }; }

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

      // Begegnung im hohen Gras? (Städte haben kein hohes Gras)
      if (ch === TILE.ENCOUNTER && encounterRng.current() < ENCOUNTER_RATE) {
        queueMicrotask(() => triggerEncounter(np.zone));
      }
      queueMicrotask(() => saveAfterMove(np));
      return np;
    });
  }, [screen, overlay, dialogue]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveAfterMove(np) {
    saveGame({ player: np, party, box, dexSeen, dexCaught, bag, money, badges, playerName, defeatedTrainers, rivalStage, gender });
  }

  // ---- Pokécenter-Heilung ----
  function healParty() {
    sfx('heal');
    setParty((p) => {
      const np = p.map((c) => ({ ...c }));
      np.forEach(healFull);
      return np;
    });
  }

  // ---- Interaktion (✓-Taste / Enter) ----
  const handleInteract = useCallback(() => {
    if (screen !== 'world' || overlay || dialogue) return;
    const ft = facingTile(player);
    const npc = npcAt(player.zone, ft.x, ft.y);
    if (!npc) return;

    if (npc.kind === 'talk') {
      sfx('confirm');
      setDialogue({ name: npc.name, lines: npc.lines });
      return;
    }

    if (npc.kind === 'heal') {
      setDialogue({
        name: npc.name,
        lines: npc.lines || ['Willkommen! Sollen sich deine Kreaturen ausruhen?'],
        onDone: () => {
          healParty();
          setDialogue({
            name: npc.name,
            lines: npc.healLines || ['Deine Kreaturen sind wieder topfit!'],
            onDone: () => { setDialogue(null); setTimeout(persist, 0); },
          });
        },
      });
      return;
    }

    if (npc.kind === 'shop') {
      sfx('confirm');
      setDialogue({
        name: npc.name,
        lines: npc.lines || ['Willkommen im Shop! Was darf es sein?'],
        onDone: () => { setDialogue(null); setShopNpc(npc); setOverlay('shop'); },
      });
      return;
    }

    if (npc.kind === 'trainer') {
      const alreadyDefeated = defeatedTrainers.has(npc.id);
      if (alreadyDefeated) {
        setDialogue({ name: npc.name, lines: npc.postLines || ['…'] });
        return;
      }
      // Kampf-Dialog -> Trainerkampf starten
      setDialogue({
        name: npc.name,
        lines: npc.lines,
        onDone: () => {
          setDialogue(null);
          launchTrainerBattle(npc);
        },
      });
    }
  }, [screen, overlay, dialogue, player, defeatedTrainers, persist]); // eslint-disable-line react-hooks/exhaustive-deps

  function launchTrainerBattle(npc) {
    const trainerTeam = npc.team.map((e) => createInstance(e.speciesId, e.level));
    setEnemyTeam(trainerTeam);
    setTrainerData(npc);
    setScreen('battle');
  }

  function triggerEncounter(zoneKey) {
    const z = ZONES[zoneKey];
    const pick = pickWeighted(encounterRng.current, z.encounters);
    const level = randInt(encounterRng.current, pick.min, pick.max);
    const foe = createInstance(pick.id, level);
    sfx('encounter');
    setDexSeen((prev) => new Set(prev).add(pick.id));
    setEnemyTeam([foe]);
    setTrainerData(null);
    setScreen('battle');
  }

  // Tastatursteuerung
  useEffect(() => {
    if (screen !== 'world') return;
    const onKey = (e) => {
      if (dialogue) return;
      if (overlay) { if (e.key === 'Escape') setOverlay(null); return; }
      const map = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      const m = map[e.key];
      if (m) { e.preventDefault(); tryDir(m[0], m[1]); }
      if (e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleInteract();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, overlay, dialogue, tryDir, handleInteract]);

  // ---- Kampf-Ergebnis ----
  function endBattle(result) {
    const newParty = result.party ? result.party.map((c) => ({ ...c })) : [...party];
    if (result.bag) setBag(result.bag);

    if (result.type === 'trainer_win') {
      const npc = trainerData;
      let newBadges = badges;
      let newRival = rivalStage;
      const lines = [...(npc?.victoryLines || ['Du hast mich besiegt!'])];
      if (npc) {
        const newDefeated = new Set([...defeatedTrainers, npc.id]);
        setDefeatedTrainers(newDefeated);
        // Preisgeld
        if (npc.prize) { setMoney((m) => m + npc.prize); lines.push(`Du erhältst ${npc.prize} ₽!`); }
        // Orden
        if (npc.badge && !badges.has(npc.badge)) {
          newBadges = new Set([...badges, npc.badge]);
          setBadges(newBadges);
          sfx('badge');
          lines.push(`Du erhältst den ${npc.badgeName || npc.badge}-Orden! 🏅`);
        }
        // Rivalen-Fortschritt
        if (npc.rival) { newRival = rivalStage + 1; setRivalStage(newRival); }
        setDialogue({ name: npc.name, lines });
        saveGame({ player, party: newParty, box, dexSeen, dexCaught, bag: result.bag || bag, money: money + (npc.prize || 0), badges: newBadges, playerName, defeatedTrainers: newDefeated, rivalStage: newRival, gender });
      }
      setParty(newParty);
      setEnemyTeam(null); setTrainerData(null);
      setScreen('world');
      return;
    }

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
      const back = { zone: START.zone, x: START.x, y: START.y, facing: 'down' };
      setPlayer(back);
      if (trainerData) {
        setDialogue({ name: trainerData.name, lines: trainerData.defeatLines || ['…'] });
      } else {
        showToast('Du wurdest besiegt – im Pokécenter von Ahornfeld kommst du wieder zu Kräften.');
      }
    } else {
      setParty(newParty);
    }

    setEnemyTeam(null); setTrainerData(null);
    setScreen('world');
    const finalPlayer = result.type === 'lose'
      ? { zone: START.zone, x: START.x, y: START.y, facing: 'down' }
      : player;
    setTimeout(() => saveGame({
      player: finalPlayer, party: newParty, box, dexSeen,
      dexCaught: result.type === 'catch' ? new Set([...dexCaught, result.enemy.speciesId]) : dexCaught,
      bag: result.bag || bag, money, badges, playerName, defeatedTrainers, rivalStage, gender,
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

  // Item im Overworld benutzen (aus dem Beutel-Overlay).
  function useBagItem(itemId, targetIdx) {
    const target = party[targetIdx];
    if (!target) return;
    const inst = { ...target };
    const res = useItemOn(itemId, inst);
    if (res.ok) {
      sfx(ITEMS[itemId]?.category === 'heal' ? 'heal' : 'confirm');
      setParty((p) => p.map((c, i) => (i === targetIdx ? inst : c)));
      removeItem(itemId, 1);
      setTimeout(persist, 0);
    } else {
      sfx('cancel');
    }
    showToast(res.msg);
  }

  // Shop-Kauf.
  function buyItem(itemId) {
    const item = ITEMS[itemId];
    if (!item) return;
    if (money < item.price) { sfx('cancel'); showToast('Nicht genug Geld!'); return; }
    setMoney((m) => m - item.price);
    addItem(itemId, 1);
    sfx('buy');
    showToast(`${item.name} gekauft!`);
    setTimeout(persist, 0);
  }

  // ---- Render ----
  const fade = <div key={fadeKey} className="screen-fade screen-fade-in" />;

  if (screen === 'title') {
    return (
      <div className="app">
        {fade}
        <TitleScreen onNew={startNewGame} onContinue={continueGame} canContinue={canContinue} />
      </div>
    );
  }

  if (screen === 'gender') {
    return <div className="app">{fade}<GenderSelect onChoose={handleGenderChoose} /></div>;
  }

  if (screen === 'name') {
    return <div className="app">{fade}<NameEntry onConfirm={handleNameConfirm} /></div>;
  }

  if (screen === 'starter') {
    return <div className="app">{fade}<StarterSelect onChoose={chooseStarter} /></div>;
  }

  if (screen === 'battle' && enemyTeam) {
    return (
      <div className="app">
        {fade}
        {toast && <div className="toast">{toast}</div>}
        <BattleScreen
          enemyTeam={enemyTeam}
          trainer={trainerData}
          party={party}
          bag={bag}
          playerName={playerName}
          gender={gender}
          zone={player.zone}
          onEnd={endBattle}
        />
      </div>
    );
  }

  // world
  return (
    <div className="app">
      {fade}
      {toast && <div className="toast">{toast}</div>}
      <Overworld
        zone={player.zone}
        px={player.x}
        py={player.y}
        facing={player.facing}
        gender={gender}
        balls={totalBalls(bag)}
        money={money}
        badges={badges}
        partyCount={party.length}
        onDir={tryDir}
        onInteract={handleInteract}
        onOpenParty={() => setOverlay('party')}
        onOpenDex={() => setOverlay('dex')}
        onOpenBag={() => setOverlay('bag')}
        onMenu={() => setOverlay('menu')}
      />

      {dialogue && (
        <Dialogue
          name={dialogue.name}
          lines={dialogue.lines}
          onDone={dialogue.onDone || (() => setDialogue(null))}
        />
      )}

      {!dialogue && overlay === 'party' && (
        <PartyScreen party={party} box={box} onClose={() => setOverlay(null)} onLead={leadParty} />
      )}
      {!dialogue && overlay === 'dex' && (
        <DexScreen dexSeen={dexSeen} dexCaught={dexCaught} onClose={() => setOverlay(null)} />
      )}
      {!dialogue && overlay === 'bag' && (
        <BagScreen bag={bag} party={party} onUse={useBagItem} onClose={() => setOverlay(null)} />
      )}
      {!dialogue && overlay === 'shop' && (
        <ShopScreen npc={shopNpc} bag={bag} money={money} onBuy={buyItem} onClose={() => setOverlay(null)} />
      )}
      {!dialogue && overlay === 'menu' && (
        <div className="overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="title-big" style={{ fontSize: 14 }}>Menü</span>
            <button className="btn" onClick={() => setOverlay(null)}>✕</button>
          </div>
          {playerName && <div className="small">Trainer: {playerName}</div>}
          <div className="tiny">💰 {money} ₽ · 🏅 {badges.size} Orden · Team: {party.length} · Box: {box.length}</div>
          <button className="btn good" onClick={() => { persist(); showToast('Spiel gespeichert.'); setOverlay(null); }}>💾 Spiel speichern</button>
          <button className="btn" onClick={toggleSound}>{soundOn ? '🔊 Sound: An' : '🔈 Sound: Aus'}</button>
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
