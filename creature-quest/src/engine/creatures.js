// Kreatur-Instanzen: erzeugen, Stats berechnen, XP/Level, Entwicklung.
import { CREATURES } from '../data/creatures.js';
import { MOVES } from '../data/moves.js';

let uidCounter = 1;
export function newUid() {
  return `c${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;
}

export function getSpecies(inst) {
  return CREATURES[inst.speciesId];
}

// Tatsächliche Werte aus Basiswerten + Level.
export function maxStats(inst) {
  const b = getSpecies(inst).baseStats;
  const lvl = inst.level;
  return {
    hp: Math.floor((b.hp * lvl) / 50) + lvl + 10,
    atk: Math.floor((b.atk * lvl) / 50) + 5,
    def: Math.floor((b.def * lvl) / 50) + 5,
    spd: Math.floor((b.spd * lvl) / 50) + 5,
  };
}

export function maxHp(inst) {
  return maxStats(inst).hp;
}

// Welche Attacken kennt die Art bis zu diesem Level? (max. 4, die neuesten).
export function movesUpToLevel(speciesId, level) {
  const sp = CREATURES[speciesId];
  const learned = sp.learnset.filter((l) => l.level <= level).map((l) => l.move);
  // Duplikate raus, letzte 4 behalten
  const uniq = [...new Set(learned)];
  return uniq.slice(-4);
}

export function createInstance(speciesId, level) {
  const inst = {
    uid: newUid(),
    speciesId,
    level,
    xp: 0,
    moves: movesUpToLevel(speciesId, level),
    curHp: 0,
  };
  inst.curHp = maxHp(inst);
  return inst;
}

export function xpForNext(level) {
  return 16 + level * level * 4;
}

// XP-Belohnung für das Besiegen einer Kreatur.
export function xpReward(enemy) {
  const stageBonus = (getSpecies(enemy).stage || 1) * 4;
  return Math.floor(enemy.level * 9) + 14 + stageBonus * 2;
}

// Vergibt XP, behandelt Level-Ups, gelernte Attacken und Entwicklung.
// Gibt ein Ereignis-Objekt für das Kampf-Log zurück.
export function gainXp(inst, amount) {
  const events = { gained: amount, levels: [], learned: [], evolved: null };
  inst.xp += amount;
  while (inst.xp >= xpForNext(inst.level) && inst.level < 100) {
    inst.xp -= xpForNext(inst.level);
    inst.level += 1;
    events.levels.push(inst.level);

    // Neue Attacke auf diesem Level?
    const sp = getSpecies(inst);
    for (const l of sp.learnset) {
      if (l.level === inst.level && !inst.moves.includes(l.move)) {
        if (inst.moves.length < 4) inst.moves.push(l.move);
        else inst.moves = [...inst.moves.slice(1), l.move]; // ältester raus
        events.learned.push(l.move);
      }
    }

    // Entwicklung?
    if (sp.evolvesTo && sp.evolveLevel && inst.level >= sp.evolveLevel) {
      const fromName = sp.name;
      const ratio = inst.curHp / maxHp(inst);
      inst.speciesId = sp.evolvesTo;
      inst.curHp = Math.max(1, Math.round(maxHp(inst) * ratio));
      events.evolved = { from: fromName, to: getSpecies(inst).name };
    }
  }
  // HP bleibt anteilig korrekt; nach Level-Up volle Werte erlauben
  inst.curHp = Math.min(inst.curHp, maxHp(inst));
  return events;
}

export function isFainted(inst) {
  return inst.curHp <= 0;
}

export function healFull(inst) {
  inst.curHp = maxHp(inst);
}

export function moveData(moveId) {
  return MOVES[moveId];
}
