// Der "Beastdex" – alle Kreaturen der Naturwelt.
// Kompakte Spezifikation; Stats & Lernsätze werden automatisch erzeugt.
import { TYPE_MOVE_TIERS } from './moves.js';

// Basiswerte nach Entwicklungsstufe und Rolle.
const STAGE_BASE = {
  1: { hp: 45, atk: 49, def: 48, spd: 45 },
  2: { hp: 60, atk: 67, def: 64, spd: 60 },
  3: { hp: 80, atk: 90, def: 84, spd: 78 },
};
const ROLE_MOD = {
  balanced:  { hp: 0,  atk: 0,  def: 0,  spd: 0 },
  attacker:  { hp: -3, atk: 14, def: -6, spd: 4 },
  tank:      { hp: 12, atk: -4, def: 16, spd: -10 },
  speedster: { hp: -4, atk: 4,  def: -6, spd: 18 },
};

function mkStats(stage, role) {
  const b = STAGE_BASE[stage];
  const m = ROLE_MOD[role] || ROLE_MOD.balanced;
  return {
    hp: b.hp + m.hp, atk: b.atk + m.atk,
    def: b.def + m.def, spd: b.spd + m.spd,
  };
}

function mkLearnset(type) {
  const t = TYPE_MOVE_TIERS[type] || TYPE_MOVE_TIERS.feuer;
  return [
    { level: 1, move: 'kratzer' },
    { level: 1, move: t[0] },
    { level: 6, move: 'panzern' },
    { level: 10, move: 'biss' },
    { level: 14, move: t[1] },
    { level: 18, move: 'staerken' },
    { level: 30, move: t[2] },
  ];
}

// id, name, type, stage, role, rarity, body, flavor, evolvesTo?, evolveLevel?
const SPECS = [
  // === Starter: Feuer-Linie ===
  { id: 1, name: 'Glutwelp', type: 'feuer', stage: 1, role: 'balanced', rarity: 'starter', body: 'beast', flavor: 'Ein verspielter Welpe mit einer glühenden Schnauze.', evolvesTo: 2, evolveLevel: 16 },
  { id: 2, name: 'Flammkater', type: 'feuer', stage: 2, role: 'attacker', rarity: 'starter', body: 'beast', flavor: 'Sein Fell knistert vor Hitze, wenn er zum Sprung ansetzt.', evolvesTo: 3, evolveLevel: 34 },
  { id: 3, name: 'Infernox', type: 'feuer', stage: 3, role: 'attacker', rarity: 'starter', body: 'beast', flavor: 'Eine lodernde Raubkatze, deren Brüllen Funken sprüht.' },

  // === Starter: Wasser-Linie ===
  { id: 4, name: 'Tröpfling', type: 'wasser', stage: 1, role: 'balanced', rarity: 'starter', body: 'fish', flavor: 'Eine neugierige Kaulquappe mit großen Augen.', evolvesTo: 5, evolveLevel: 16 },
  { id: 5, name: 'Wogefin', type: 'wasser', stage: 2, role: 'speedster', rarity: 'starter', body: 'fish', flavor: 'Flitzt blitzschnell durch Bäche und Teiche.', evolvesTo: 6, evolveLevel: 34 },
  { id: 6, name: 'Tidehorn', type: 'wasser', stage: 3, role: 'tank', rarity: 'starter', body: 'fish', flavor: 'Ein majestätisches Wesen, das Gezeiten befehligen kann.' },

  // === Starter: Pflanze-Linie ===
  { id: 7, name: 'Knospling', type: 'pflanze', stage: 1, role: 'balanced', rarity: 'starter', body: 'blob', flavor: 'Auf seinem Kopf wächst eine kleine, feste Knospe.', evolvesTo: 8, evolveLevel: 16 },
  { id: 8, name: 'Rankgar', type: 'pflanze', stage: 2, role: 'tank', rarity: 'starter', body: 'blob', flavor: 'Seine Ranken können Felsbrocken umwickeln.', evolvesTo: 9, evolveLevel: 34 },
  { id: 9, name: 'Florwucht', type: 'pflanze', stage: 3, role: 'tank', rarity: 'starter', body: 'beast', flavor: 'Eine wandelnde Festung aus Wurzeln und Blüten.' },

  // === Wilde Kreaturen ===
  { id: 10, name: 'Erdling', type: 'erde', stage: 1, role: 'tank', rarity: 'common', body: 'golem', flavor: 'Ein kleiner Gesteinsbrocken, der gerne gräbt.', evolvesTo: 11, evolveLevel: 18 },
  { id: 11, name: 'Felsbrock', type: 'erde', stage: 2, role: 'tank', rarity: 'uncommon', body: 'golem', flavor: 'Seine Haut ist hart wie Granit.', evolvesTo: 12, evolveLevel: 36 },
  { id: 12, name: 'Gesteinor', type: 'erde', stage: 3, role: 'tank', rarity: 'rare', body: 'golem', flavor: 'Ein wandelnder Berg, dessen Schritte den Boden beben lassen.' },

  { id: 13, name: 'Funkmaus', type: 'elektro', stage: 1, role: 'speedster', rarity: 'common', body: 'beast', flavor: 'Aus ihrem Fell springen ständig kleine Funken.', evolvesTo: 14, evolveLevel: 20 },
  { id: 14, name: 'Voltratz', type: 'elektro', stage: 2, role: 'speedster', rarity: 'uncommon', body: 'beast', flavor: 'Rast so schnell, dass sie Blitze hinter sich herzieht.' },

  { id: 15, name: 'Flatterling', type: 'luft', stage: 1, role: 'speedster', rarity: 'common', body: 'bird', flavor: 'Ein zierlicher Vogel, der kaum still sitzen kann.', evolvesTo: 16, evolveLevel: 16 },
  { id: 16, name: 'Windschwinge', type: 'luft', stage: 2, role: 'speedster', rarity: 'uncommon', body: 'bird', flavor: 'Reitet auf Aufwinden über die Wipfel.', evolvesTo: 17, evolveLevel: 34 },
  { id: 17, name: 'Sturmaar', type: 'luft', stage: 3, role: 'attacker', rarity: 'rare', body: 'bird', flavor: 'Ein gewaltiger Greif, der Stürme heraufbeschwört.' },

  { id: 18, name: 'Aschehörn', type: 'feuer', stage: 1, role: 'attacker', rarity: 'common', body: 'bug', flavor: 'Glühende Asche rieselt von seinen Hörnchen.', evolvesTo: 19, evolveLevel: 22 },
  { id: 19, name: 'Magmakäfer', type: 'feuer', stage: 2, role: 'tank', rarity: 'uncommon', body: 'bug', flavor: 'Sein Panzer ist von erstarrter Lava überzogen.' },

  { id: 20, name: 'Quappling', type: 'wasser', stage: 1, role: 'balanced', rarity: 'common', body: 'fish', flavor: 'Hüpft munter zwischen den Seerosen umher.', evolvesTo: 21, evolveLevel: 20 },
  { id: 21, name: 'Krötarch', type: 'wasser', stage: 2, role: 'tank', rarity: 'uncommon', body: 'blob', flavor: 'Ein bulliger Wasserlurch mit lautem Ruf.' },

  { id: 22, name: 'Moosko', type: 'pflanze', stage: 1, role: 'tank', rarity: 'common', body: 'blob', flavor: 'Ein moosbewachsener Geselle, der gern döst.', evolvesTo: 23, evolveLevel: 22 },
  { id: 23, name: 'Dickwald', type: 'pflanze', stage: 2, role: 'tank', rarity: 'uncommon', body: 'beast', flavor: 'Auf seinem Rücken wächst ein ganzer kleiner Wald.' },

  { id: 24, name: 'Pilzkopf', type: 'pflanze', stage: 1, role: 'balanced', rarity: 'common', body: 'blob', flavor: 'Sein Hut verströmt schläfrige Sporen.', evolvesTo: 25, evolveLevel: 24 },
  { id: 25, name: 'Sporenhaupt', type: 'pflanze', stage: 2, role: 'attacker', rarity: 'uncommon', body: 'blob', flavor: 'Verteilt Sporenwolken, die Gegner verwirren.' },

  { id: 26, name: 'Blitzkiesel', type: 'elektro', stage: 1, role: 'tank', rarity: 'uncommon', body: 'golem', flavor: 'Ein Stein, in dem statische Ladung knistert.' },
  { id: 27, name: 'Lehmgolem', type: 'erde', stage: 1, role: 'tank', rarity: 'uncommon', body: 'golem', flavor: 'Aus feuchtem Flussschlamm geformt und zum Leben erwacht.' },
  { id: 28, name: 'Nebelkrähe', type: 'luft', stage: 1, role: 'speedster', rarity: 'common', body: 'bird', flavor: 'Taucht aus dem Morgennebel auf und verschwindet ebenso schnell.' },

  { id: 29, name: 'Perlmuschel', type: 'wasser', stage: 1, role: 'tank', rarity: 'common', body: 'blob', flavor: 'Verbirgt eine schimmernde Perle in ihrem Inneren.', evolvesTo: 30, evolveLevel: 26 },
  { id: 30, name: 'Strudelschnapp', type: 'wasser', stage: 2, role: 'attacker', rarity: 'rare', body: 'fish', flavor: 'Erzeugt reißende Strudel, um Beute einzusaugen.' },

  { id: 31, name: 'Zündfalter', type: 'feuer', stage: 1, role: 'speedster', rarity: 'uncommon', body: 'bug', flavor: 'Seine Flügel glühen wie kleine Flammen.' },
  { id: 32, name: 'Kaktor', type: 'pflanze', stage: 1, role: 'attacker', rarity: 'common', body: 'blob', flavor: 'Schießt scharfe Stacheln auf alles, was zu nah kommt.' },
  { id: 33, name: 'Buddelpelz', type: 'erde', stage: 1, role: 'speedster', rarity: 'common', body: 'beast', flavor: 'Gräbt blitzschnell Tunnel und schnappt von unten zu.' },
];

// Vollständige Kreatur-Definitionen (mit Stats + Lernsatz).
export const CREATURES = {};
for (const s of SPECS) {
  CREATURES[s.id] = {
    ...s,
    baseStats: mkStats(s.stage, s.role),
    learnset: mkLearnset(s.type),
  };
}

export const DEX_IDS = SPECS.map((s) => s.id);
export const STARTER_IDS = [1, 4, 7];
