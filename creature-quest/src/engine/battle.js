// Kampf-Engine: Schaden, Treffer, Status-Effekte, Fangen.
import { MOVES } from '../data/moves.js';
import { combinedMultiplier, speciesTypes, effectivenessLabel } from '../data/types.js';
import { maxStats, maxHp, getSpecies } from './creatures.js';

// Kampf-Buffs liegen direkt auf der Instanz (atkMul/defMul), Standard 1.
function atkOf(inst) {
  return maxStats(inst).atk * (inst.atkMul || 1);
}
function defOf(inst) {
  return maxStats(inst).def * (inst.defMul || 1);
}
export function speedOf(inst) {
  return maxStats(inst).spd;
}

export function resetBuffs(inst) {
  inst.atkMul = 1;
  inst.defMul = 1;
}

// Führt eine Attacke aus, verändert die HP des Ziels, liefert Log-Zeilen.
export function performMove(user, target, moveId) {
  const move = MOVES[moveId];
  const log = [];
  const uName = getSpecies(user).name;

  // Schlaf-Check: überspringe Zug wenn noch schläfrig
  if (user.status === 'sleep') {
    if ((user.sleepTurns ?? 0) > 0) {
      user.sleepTurns -= 1;
      if (user.sleepTurns === 0) {
        user.status = null;
        log.push(`${uName} wacht auf!`);
      } else {
        log.push(`${uName} schläft tief und fest.`);
        return { log, damage: 0, skipped: true };
      }
    } else {
      user.status = null;
    }
  }

  // Lähmungs-Check: 25% Chance auf Ausfall
  if (user.status === 'paralysis' && Math.random() < 0.25) {
    log.push(`${uName} ist gelähmt und kann sich nicht bewegen!`);
    return { log, damage: 0, skipped: true };
  }

  // Treffer?
  if (Math.random() * 100 > move.acc) {
    log.push(`${uName} setzt ${move.name} ein – daneben!`);
    return { log, damage: 0, missed: true };
  }

  // PP-Verbrauch
  if (user.movePP) {
    user.movePP[moveId] = Math.max(0, (user.movePP[moveId] ?? move.pp ?? 30) - 1);
  }

  // Status-Attacken (power 0)
  if (move.power === 0) {
    if (move.effect === 'raise_atk') {
      user.atkMul = Math.min(2, (user.atkMul || 1) + 0.3);
      log.push(`${uName} setzt ${move.name} ein – Angriff steigt!`);
    } else if (move.effect === 'raise_def') {
      user.defMul = Math.min(2, (user.defMul || 1) + 0.3);
      log.push(`${uName} setzt ${move.name} ein – Verteidigung steigt!`);
    } else {
      log.push(`${uName} setzt ${move.name} ein.`);
    }
    return { log, damage: 0 };
  }

  // Schaden berechnen (Verbrennung halbiert Angriff)
  const lvl = user.level;
  const a = atkOf(user) * (user.status === 'burn' ? 0.5 : 1);
  const d = defOf(target);
  const userTypes = speciesTypes(getSpecies(user));
  const targetTypes = speciesTypes(getSpecies(target));

  const stab = userTypes.includes(move.type) ? 1.5 : 1;
  const mult = combinedMultiplier(move.type, targetTypes);
  const crit = Math.random() < 0.0625 ? 1.5 : 1;
  const variance = 0.85 + Math.random() * 0.15;

  let dmg = Math.floor((((2 * lvl) / 5 + 2) * move.power * (a / d)) / 50) + 2;
  dmg = Math.floor(dmg * stab * mult * crit * variance);
  dmg = Math.max(1, dmg);

  target.curHp = Math.max(0, target.curHp - dmg);

  log.push(`${uName} setzt ${move.name} ein!`);
  if (crit > 1) log.push('Ein Volltreffer!');
  const lbl = effectivenessLabel(mult);
  if (lbl) log.push(lbl);

  // Sekundäreffekt: Status inflizieren
  if (move.sideEffect && !target.status && target.curHp > 0) {
    if (Math.random() < move.sideEffect.chance) {
      const tName = getSpecies(target).name;
      target.status = move.sideEffect.status;
      if (target.status === 'burn')      log.push(`${tName} wurde verbrannt!`);
      if (target.status === 'paralysis') log.push(`${tName} wurde gelähmt!`);
      if (target.status === 'poison')    log.push(`${tName} wurde vergiftet!`);
    }
  }

  return { log, damage: dmg, mult, crit: crit > 1 };
}

// Rundenende-Statusschaden (Verbrennung / Vergiftung). Einmal pro Zug aufrufen.
export function tickStatus(inst) {
  if (inst.status !== 'burn' && inst.status !== 'poison') return { log: [], damage: 0 };
  const name = getSpecies(inst).name;
  const damage = Math.max(1, Math.floor(maxHp(inst) / 8));
  inst.curHp = Math.max(0, inst.curHp - damage);
  const label = inst.status === 'burn' ? 'Verbrennung' : 'Vergiftung';
  return { log: [`${name} leidet unter ${label}!`], damage };
}

// Gegner-KI: meist eine Angriffs-Attacke, selten Status.
export function enemyChooseMove(enemy) {
  const attacks = enemy.moves.filter((m) => MOVES[m].power > 0);
  const pool = attacks.length ? attacks : enemy.moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

const RARITY_FACTOR = { common: 1.0, uncommon: 0.75, rare: 0.5, starter: 0.4 };

// Fangchance 0..1 anhand Rest-HP, Seltenheit und Kugel-Bonus.
export function captureChance(target, ballBonus = 1) {
  const mx = maxHp(target);
  const hpFactor = (mx * 3 - target.curHp * 2) / (mx * 3); // weniger HP -> höher
  const rarity = RARITY_FACTOR[getSpecies(target).rarity] ?? 0.8;
  const levelPenalty = Math.max(0.6, 1 - target.level / 80);
  const chance = hpFactor * rarity * ballBonus * levelPenalty;
  return Math.max(0.04, Math.min(0.95, chance));
}

export function attemptCapture(target, ballBonus = 1) {
  return Math.random() < captureChance(target, ballBonus);
}

// Fluchtchance steigt mit eigener Geschwindigkeit.
export function fleeChance(player, enemy) {
  const ratio = speedOf(player) / Math.max(1, speedOf(enemy));
  return Math.max(0.35, Math.min(0.95, 0.5 * ratio + 0.25));
}
