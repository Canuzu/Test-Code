// Wendet ein Item auf eine Kreatur an. Gibt { ok, msg } zurück; bei ok=true
// wurde das Item verbraucht. Mutiert die Instanz direkt.
import { ITEMS } from '../data/items.js';
import { maxHp, getSpecies } from './creatures.js';

const STATUS_NAME = { burn: 'Verbrennung', paralysis: 'Lähmung', poison: 'Vergiftung', sleep: 'Schlaf' };

export function useItemOn(itemId, inst) {
  const item = ITEMS[itemId];
  if (!item) return { ok: false, msg: 'Unbekanntes Item.' };
  const name = getSpecies(inst).name;

  switch (item.category) {
    case 'heal': {
      if (inst.curHp <= 0) return { ok: false, msg: `${name} ist besiegt – nutze einen Beleber.` };
      if (inst.curHp >= maxHp(inst)) return { ok: false, msg: `${name} hat bereits volle KP.` };
      const before = inst.curHp;
      inst.curHp = Math.min(maxHp(inst), inst.curHp + item.heal);
      return { ok: true, msg: `${name} erhält ${inst.curHp - before} KP zurück.` };
    }
    case 'revive': {
      if (inst.curHp > 0) return { ok: false, msg: `${name} ist nicht besiegt.` };
      inst.curHp = Math.max(1, Math.round(maxHp(inst) * (item.reviveRatio || 0.5)));
      inst.status = null;
      inst.sleepTurns = 0;
      return { ok: true, msg: `${name} wurde wiederbelebt!` };
    }
    case 'status': {
      if (!inst.status) return { ok: false, msg: `${name} hat kein Statusproblem.` };
      if (item.cures !== 'all' && item.cures !== inst.status) {
        return { ok: false, msg: `Wirkt nicht gegen ${STATUS_NAME[inst.status] || 'dieses Problem'}.` };
      }
      const cured = STATUS_NAME[inst.status] || 'Status';
      inst.status = null;
      inst.sleepTurns = 0;
      return { ok: true, msg: `${name}: ${cured} geheilt!` };
    }
    default:
      return { ok: false, msg: 'Dieses Item kann hier nicht benutzt werden.' };
  }
}
