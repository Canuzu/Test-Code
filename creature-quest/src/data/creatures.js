// Der "Beastdex" – alle Kreaturen der Naturwelt.
import { TYPE_MOVE_TIERS } from './moves.js';

const STAGE_BASE = {
  1: { hp: 45, atk: 49, def: 48, spd: 45 },
  2: { hp: 60, atk: 67, def: 64, spd: 60 },
  3: { hp: 80, atk: 90, def: 84, spd: 78 },
  L: { hp: 108, atk: 118, def: 100, spd: 92 }, // Legendär
};
const ROLE_MOD = {
  balanced:  { hp:  0, atk:  0, def:  0, spd:  0 },
  attacker:  { hp: -3, atk: 14, def: -6, spd:  4 },
  tank:      { hp: 12, atk: -4, def: 16, spd:-10 },
  speedster: { hp: -4, atk:  4, def: -6, spd: 18 },
};

function mkStats(stage, role) {
  const b = STAGE_BASE[stage] || STAGE_BASE[1];
  const m = ROLE_MOD[role] || ROLE_MOD.balanced;
  return {
    hp: b.hp + m.hp, atk: b.atk + m.atk,
    def: b.def + m.def, spd: b.spd + m.spd,
  };
}

function mkLearnset(type, type2) {
  const t  = TYPE_MOVE_TIERS[type]  || TYPE_MOVE_TIERS.feuer;
  const t2 = type2 ? (TYPE_MOVE_TIERS[type2] || null) : null;
  const base = [
    { level: 1,  move: 'kratzer' },
    { level: 1,  move: t[0] },
    { level: 6,  move: 'panzern' },
    { level: 10, move: 'biss' },
    { level: 14, move: t[1] },
    { level: 18, move: 'staerken' },
    { level: 30, move: t[2] },
  ];
  if (t2) {
    base.push({ level: 22, move: t2[0] });
    base.push({ level: 38, move: t2[1] });
    base.sort((a, b) => a.level - b.level);
  }
  return base;
}

// id, name, type, type2?, stage, role, rarity, body, flavor, evolvesTo?, evolveLevel?
const SPECS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Starter-Linien
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 1, name: 'Glutwelp',     type: 'feuer',   stage: 1, role: 'balanced',  rarity: 'starter',   body: 'beast',  flavor: 'Ein verspielter Welpe mit einer glühenden Schnauze.', evolvesTo: 2, evolveLevel: 16 },
  { id: 2, name: 'Flammkater',   type: 'feuer',   stage: 2, role: 'attacker',  rarity: 'starter',   body: 'beast',  flavor: 'Sein Fell knistert vor Hitze, wenn er zum Sprung ansetzt.', evolvesTo: 3, evolveLevel: 34 },
  { id: 3, name: 'Infernox',     type: 'feuer',   stage: 3, role: 'attacker',  rarity: 'starter',   body: 'beast',  flavor: 'Eine lodernde Raubkatze, deren Brüllen Funken sprüht.' },

  { id: 4, name: 'Tröpfling',    type: 'wasser',  stage: 1, role: 'balanced',  rarity: 'starter',   body: 'fish',   flavor: 'Eine neugierige Kaulquappe mit großen Augen.', evolvesTo: 5, evolveLevel: 16 },
  { id: 5, name: 'Wogefin',      type: 'wasser',  stage: 2, role: 'speedster', rarity: 'starter',   body: 'fish',   flavor: 'Flitzt blitzschnell durch Bäche und Teiche.', evolvesTo: 6, evolveLevel: 34 },
  { id: 6, name: 'Tidehorn',     type: 'wasser',  stage: 3, role: 'tank',      rarity: 'starter',   body: 'fish',   flavor: 'Ein majestätisches Wesen, das Gezeiten befehligen kann.' },

  { id: 7, name: 'Knospling',    type: 'pflanze', stage: 1, role: 'balanced',  rarity: 'starter',   body: 'blob',   flavor: 'Auf seinem Kopf wächst eine kleine, feste Knospe.', evolvesTo: 8, evolveLevel: 16 },
  { id: 8, name: 'Rankgar',      type: 'pflanze', stage: 2, role: 'tank',      rarity: 'starter',   body: 'blob',   flavor: 'Seine Ranken können Felsbrocken umwickeln.', evolvesTo: 9, evolveLevel: 34 },
  { id: 9, name: 'Florwucht',    type: 'pflanze', stage: 3, role: 'tank',      rarity: 'starter',   body: 'beast',  flavor: 'Eine wandelnde Festung aus Wurzeln und Blüten.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Erde / Elektro / Luft (frühe Gebiete)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 10, name: 'Erdling',      type: 'erde',    stage: 1, role: 'tank',      rarity: 'common',    body: 'golem',  flavor: 'Ein kleiner Gesteinsbrocken, der gerne gräbt.', evolvesTo: 11, evolveLevel: 18 },
  { id: 11, name: 'Felsbrock',    type: 'erde',    stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'golem',  flavor: 'Seine Haut ist hart wie Granit.', evolvesTo: 12, evolveLevel: 36 },
  { id: 12, name: 'Gesteinor',    type: 'erde',    stage: 3, role: 'tank',      rarity: 'rare',      body: 'golem',  flavor: 'Ein wandelnder Berg, dessen Schritte den Boden beben lassen.' },

  { id: 13, name: 'Funkmaus',     type: 'elektro', stage: 1, role: 'speedster', rarity: 'common',    body: 'beast',  flavor: 'Aus ihrem Fell springen ständig kleine Funken.', evolvesTo: 14, evolveLevel: 20 },
  { id: 14, name: 'Voltratz',     type: 'elektro', stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'beast',  flavor: 'Rast so schnell, dass sie Blitze hinter sich herzieht.' },

  { id: 15, name: 'Flatterling',  type: 'luft',    stage: 1, role: 'speedster', rarity: 'common',    body: 'bird',   flavor: 'Ein zierlicher Vogel, der kaum still sitzen kann.', evolvesTo: 16, evolveLevel: 16 },
  { id: 16, name: 'Windschwinge', type: 'luft',    stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'bird',   flavor: 'Reitet auf Aufwinden über die Wipfel.', evolvesTo: 17, evolveLevel: 34 },
  { id: 17, name: 'Sturmaar',     type: 'luft',    stage: 3, role: 'attacker',  rarity: 'rare',      body: 'bird',   flavor: 'Ein gewaltiger Greif, der Stürme heraufbeschwört.' },

  { id: 18, name: 'Aschehörn',    type: 'feuer',   stage: 1, role: 'attacker',  rarity: 'common',    body: 'bug',    flavor: 'Glühende Asche rieselt von seinen Hörnchen.', evolvesTo: 19, evolveLevel: 22 },
  { id: 19, name: 'Magmakäfer',   type: 'feuer',   stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'bug',    flavor: 'Sein Panzer ist von erstarrter Lava überzogen.' },

  { id: 20, name: 'Quappling',    type: 'wasser',  stage: 1, role: 'balanced',  rarity: 'common',    body: 'fish',   flavor: 'Hüpft munter zwischen den Seerosen umher.', evolvesTo: 21, evolveLevel: 20 },
  { id: 21, name: 'Krötarch',     type: 'wasser',  stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'blob',   flavor: 'Ein bulliger Wasserlurch mit lautem Ruf.' },

  { id: 22, name: 'Moosko',       type: 'pflanze', stage: 1, role: 'tank',      rarity: 'common',    body: 'blob',   flavor: 'Ein moosbewachsener Geselle, der gern döst.', evolvesTo: 23, evolveLevel: 22 },
  { id: 23, name: 'Dickwald',     type: 'pflanze', stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'beast',  flavor: 'Auf seinem Rücken wächst ein ganzer kleiner Wald.' },

  { id: 24, name: 'Pilzkopf',     type: 'pflanze', stage: 1, role: 'balanced',  rarity: 'common',    body: 'blob',   flavor: 'Sein Hut verströmt schläfrige Sporen.', evolvesTo: 25, evolveLevel: 24 },
  { id: 25, name: 'Sporenhaupt',  type: 'pflanze', stage: 2, role: 'attacker',  rarity: 'uncommon',  body: 'blob',   flavor: 'Verteilt Sporenwolken, die Gegner verwirren.' },

  { id: 26, name: 'Blitzkiesel',  type: 'elektro', stage: 1, role: 'tank',      rarity: 'uncommon',  body: 'golem',  flavor: 'Ein Stein, in dem statische Ladung knistert.' },
  { id: 27, name: 'Lehmgolem',    type: 'erde',    stage: 1, role: 'tank',      rarity: 'uncommon',  body: 'golem',  flavor: 'Aus feuchtem Flussschlamm geformt und zum Leben erwacht.' },
  { id: 28, name: 'Nebelkrähe',   type: 'luft',    stage: 1, role: 'speedster', rarity: 'common',    body: 'bird',   flavor: 'Taucht aus dem Morgennebel auf und verschwindet ebenso schnell.' },

  { id: 29, name: 'Perlmuschel',  type: 'wasser',  stage: 1, role: 'tank',      rarity: 'common',    body: 'blob',   flavor: 'Verbirgt eine schimmernde Perle in ihrem Inneren.', evolvesTo: 30, evolveLevel: 26 },
  { id: 30, name: 'Strudelschnapp',type:'wasser',  stage: 2, role: 'attacker',  rarity: 'rare',      body: 'fish',   flavor: 'Erzeugt reißende Strudel, um Beute einzusaugen.' },

  { id: 31, name: 'Zündfalter',   type: 'feuer',   stage: 1, role: 'speedster', rarity: 'uncommon',  body: 'bug',    flavor: 'Seine Flügel glühen wie kleine Flammen.' },
  { id: 32, name: 'Kaktor',       type: 'pflanze', stage: 1, role: 'attacker',  rarity: 'common',    body: 'blob',   flavor: 'Schießt scharfe Stacheln auf alles, was zu nah kommt.' },
  { id: 33, name: 'Buddelpelz',   type: 'erde',    stage: 1, role: 'speedster', rarity: 'common',    body: 'beast',  flavor: 'Gräbt blitzschnell Tunnel und schnappt von unten zu.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Geist-Linien
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 34, name: 'Schattköpfchen',type:'geist',   stage: 1, role: 'speedster', rarity: 'common',    body: 'ghost',  flavor: 'Ein kleines Schattenwesen, das gerne erschreckt.', evolvesTo: 35, evolveLevel: 20 },
  { id: 35, name: 'Dunkelgeist',   type: 'geist',  stage: 2, role: 'attacker',  rarity: 'uncommon',  body: 'ghost',  flavor: 'Huscht durch Mauern und flüstert eisige Worte.' },

  { id: 36, name: 'Nebelgestalt',  type: 'geist',  stage: 1, role: 'balanced',  rarity: 'uncommon',  body: 'ghost',  flavor: 'Entsteht aus Nebelfetzen, wenn die Sonne untergeht.', evolvesTo: 37, evolveLevel: 28 },
  { id: 37, name: 'Schreckenswolf',type: 'geist',  stage: 2, role: 'attacker',  rarity: 'rare',      body: 'ghost',  flavor: 'Jagt mit geisterhafter Geschwindigkeit durch die Nacht.', evolvesTo: 38, evolveLevel: 42 },
  { id: 38, name: 'Grabwächter',   type: 'geist',  stage: 3, role: 'attacker',  rarity: 'rare',      body: 'ghost',  flavor: 'Hütet uralte Grabstätten und kann Spiegel spalten.' },

  { id: 80, name: 'Nachtschatten', type: 'geist',  stage: 1, role: 'speedster', rarity: 'common',    body: 'ghost',  flavor: 'Eine Erscheinung aus dunklen Ecken, die das Licht scheut.', evolvesTo: 81, evolveLevel: 25 },
  { id: 81, name: 'Finsterwolf',   type: 'geist',  stage: 2, role: 'attacker',  rarity: 'uncommon',  body: 'ghost',  flavor: 'Sein Heulen lässt Schatten tanzen und Herzen stocken.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Psycho-Linien
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 39, name: 'Flüsterherz',   type: 'psycho', stage: 1, role: 'balanced',  rarity: 'uncommon',  body: 'beast',  flavor: 'Liest Gedanken mit seinen großen, leuchtenden Augen.', evolvesTo: 40, evolveLevel: 22 },
  { id: 40, name: 'Sinnsturm',     type: 'psycho', stage: 2, role: 'attacker',  rarity: 'rare',      body: 'beast',  flavor: 'Bricht Gedankenbarrieren mit roher Psychokraft.', evolvesTo: 41, evolveLevel: 40 },
  { id: 41, name: 'Gedankenkönig', type: 'psycho', stage: 3, role: 'attacker',  rarity: 'rare',      body: 'beast',  flavor: 'Herrscht über Gedanken und Träume. Nichts entgeht ihm.' },

  { id: 42, name: 'Traumfänger',   type: 'psycho', stage: 1, role: 'speedster', rarity: 'common',    body: 'beast',  flavor: 'Sammelt Träume schlafender Wesen wie Schmetterlinge.', evolvesTo: 43, evolveLevel: 26 },
  { id: 43, name: 'Träumerwächter',type: 'psycho', stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'beast',  flavor: 'Beschützt Schläfer vor Albträumen mit reiner Geisteskraft.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Eis-Linien
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 44, name: 'Schneeball',    type: 'eis',    stage: 1, role: 'balanced',  rarity: 'common',    body: 'blob',   flavor: 'Rollt durch Schnee und wird dabei größer und kälter.', evolvesTo: 45, evolveLevel: 18 },
  { id: 45, name: 'Frostfuchs',    type: 'eis',    stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'beast',  flavor: 'Jagt über zugefrorene Seen mit atemberaubender Geschwindigkeit.', evolvesTo: 46, evolveLevel: 35 },
  { id: 46, name: 'Gletscherwal',  type: 'eis',    stage: 3, role: 'tank',      rarity: 'rare',      body: 'beast',  flavor: 'Ein uraltes Wesen, das in ewigem Eis geschlummert hat.' },

  { id: 47, name: 'Eiszapfling',   type: 'eis',    stage: 1, role: 'tank',      rarity: 'common',    body: 'golem',  flavor: 'Hängt kopfüber von Höhlendecken und tropft eisiges Wasser.', evolvesTo: 48, evolveLevel: 24 },
  { id: 48, name: 'Kristalleis',   type: 'eis',    stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'golem',  flavor: 'Seine Haut ist aus reinem Bergkristall – kaum zu zerkratzen.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Drachen-Linie
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 49, name: 'Schuppwurm',    type: 'drache', stage: 1, role: 'balanced',  rarity: 'uncommon',  body: 'dragon', flavor: 'Ein junger Drache mit schimmernden Schuppen, voller Tatendrang.', evolvesTo: 50, evolveLevel: 25 },
  { id: 50, name: 'Wyrmkling',     type: 'drache', stage: 2, role: 'attacker',  rarity: 'rare',      body: 'dragon', flavor: 'Atmet erste Flammen und knurrt furchteinflößend.', evolvesTo: 51, evolveLevel: 45 },
  { id: 51, name: 'Draghur',       type: 'drache', stage: 3, role: 'attacker',  rarity: 'rare',      body: 'dragon', flavor: 'Ein majestätischer Drache – der König seiner Linie.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Wüste (Sand / Feuer)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 52, name: 'Gluthörnchen',  type: 'feuer',  stage: 1, role: 'speedster', rarity: 'common',    body: 'beast',  flavor: 'Rennt durch die Wüste und hinterlässt kleine Feuerflecken.', evolvesTo: 53, evolveLevel: 22 },
  { id: 53, name: 'Flammfuchs',    type: 'feuer',  stage: 2, role: 'attacker',  rarity: 'uncommon',  body: 'beast',  flavor: 'Seine Schwanzspitze kann Felsen schmelzen.' },

  { id: 54, name: 'Sandwühler',    type: 'erde',   stage: 1, role: 'balanced',  rarity: 'common',    body: 'beast',  flavor: 'Gräbt Tunnel im Wüstensand und überrascht Feinde von unten.', evolvesTo: 55, evolveLevel: 22 },
  { id: 55, name: 'Sandstromer',   type: 'erde',   stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'beast',  flavor: 'Bewegt sich wie ein Sandsturm – kaum zu greifen.' },

  { id: 56, name: 'Sandskorpion',  type: 'erde',   stage: 1, role: 'attacker',  rarity: 'uncommon',  body: 'bug',    flavor: 'Lauert unter dem Sand und schnappt mit seiner Schere zu.', evolvesTo: 57, evolveLevel: 28 },
  { id: 57, name: 'Felsskorpion',  type: 'erde',   stage: 2, role: 'attacker',  rarity: 'rare',      body: 'bug',    flavor: 'Seine versteinerte Rüstung ist undurchdringlich.', evolvesTo: 58, evolveLevel: 42 },
  { id: 58, name: 'Vulkanskorpion',type: 'feuer',  type2: 'erde', stage: 3, role: 'attacker', rarity: 'rare', body: 'bug', flavor: 'Endfeuerstacheln sprühen Lava, wenn es angreift.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Küste / Wasser (fortgeschritten)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 59, name: 'Wellenreiter',  type: 'wasser', stage: 1, role: 'speedster', rarity: 'common',    body: 'fish',   flavor: 'Springt auf Wellen und reitet sie bis ans Ufer.', evolvesTo: 60, evolveLevel: 20 },
  { id: 60, name: 'Strömling',     type: 'wasser', stage: 2, role: 'speedster', rarity: 'uncommon',  body: 'fish',   flavor: 'Erzeugt Strudel, die selbst größere Kreaturen mitreißen.', evolvesTo: 61, evolveLevel: 36 },
  { id: 61, name: 'Meeresfürst',   type: 'wasser', stage: 3, role: 'tank',      rarity: 'rare',      body: 'fish',   flavor: 'Herrscht über die Tiefe des Ozeans.' },

  { id: 62, name: 'Laichling',     type: 'wasser', stage: 1, role: 'balanced',  rarity: 'common',    body: 'blob',   flavor: 'Lebt in Flachwasserbereichen und springt zwischen Felsen.', evolvesTo: 63, evolveLevel: 22 },
  { id: 63, name: 'Riffwächter',   type: 'wasser', stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'beast',  flavor: 'Schützt Korallenriffe mit seiner harten Panzerhaut.', evolvesTo: 64, evolveLevel: 38 },
  { id: 64, name: 'Korallenriese', type: 'wasser', stage: 3, role: 'tank',      rarity: 'rare',      body: 'beast',  flavor: 'Ein gewaltiger Hüter der Meere, schwer wie ein Riff.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Berge / Luft (fortgeschritten)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 65, name: 'Bergfalke',     type: 'luft',   stage: 1, role: 'speedster', rarity: 'common',    body: 'bird',   flavor: 'Kreist über Berggipfeln und sucht nach Beute.', evolvesTo: 66, evolveLevel: 22 },
  { id: 66, name: 'Adlerhorn',     type: 'luft',   stage: 2, role: 'attacker',  rarity: 'uncommon',  body: 'bird',   flavor: 'Stürzt sich im Sturzflug auf Feinde.', evolvesTo: 67, evolveLevel: 40 },
  { id: 67, name: 'Himmelsaar',    type: 'luft',   stage: 3, role: 'attacker',  rarity: 'rare',      body: 'bird',   flavor: 'Berührt fast die Wolken. Sein Schrei hallt durch Täler.' },

  { id: 68, name: 'Windspinne',    type: 'elektro',type2: 'luft', stage: 1, role: 'balanced', rarity: 'uncommon', body: 'bug', flavor: 'Webt Netze aus statisch geladenen Fäden.', evolvesTo: 69, evolveLevel: 28 },
  { id: 69, name: 'Gewitternetz',  type: 'elektro',type2: 'luft', stage: 2, role: 'attacker', rarity: 'rare',     body: 'bug', flavor: 'Sein Netz leitet Blitze und fängt Kreaturen doppelt ein.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Normal-Typen
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 70, name: 'Wühltier',      type: 'normal', stage: 1, role: 'balanced',  rarity: 'common',    body: 'beast',  flavor: 'Buddelt überall und findet manchmal bunte Steine.', evolvesTo: 71, evolveLevel: 22 },
  { id: 71, name: 'Stachelbär',    type: 'normal', stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'beast',  flavor: 'Dreht sich ein, wenn es bedroht wird, und zeigt seine Stacheln.', evolvesTo: 72, evolveLevel: 38 },
  { id: 72, name: 'Titanenbär',    type: 'normal', stage: 3, role: 'tank',      rarity: 'rare',      body: 'beast',  flavor: 'So groß wie ein Felsen und genauso sturmfest.' },

  { id: 73, name: 'Riesenigel',    type: 'normal', stage: 1, role: 'attacker',  rarity: 'common',    body: 'beast',  flavor: 'Rollt sich zu einer Stachelkugel und rollt auf Feinde zu.', evolvesTo: 74, evolveLevel: 26 },
  { id: 74, name: 'Panzerhamster', type: 'normal', stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'beast',  flavor: 'Trägt alles, was es findet, in riesigen Backentaschen.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Mehr Erde (fortgeschritten)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 75, name: 'Tonkrümel',     type: 'erde',   stage: 1, role: 'tank',      rarity: 'common',    body: 'blob',   flavor: 'Ein Klumpen lebendiger Erde, der schläfrig rollt.', evolvesTo: 76, evolveLevel: 20 },
  { id: 76, name: 'Schlickwesen',  type: 'erde',   stage: 2, role: 'tank',      rarity: 'uncommon',  body: 'golem',  flavor: 'Absorbiert alles, was in seine Masse eindringt.', evolvesTo: 77, evolveLevel: 38 },
  { id: 77, name: 'Sumpfgollem',   type: 'erde',   stage: 3, role: 'tank',      rarity: 'rare',      body: 'golem',  flavor: 'Ein gewaltiger Golem aus verdichtetem Schlamm und Erde.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Team-Nox-Kreaturen (Geist + Erde)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 78, name: 'Giftzahn',      type: 'erde',   stage: 1, role: 'attacker',  rarity: 'common',    body: 'snake',  flavor: 'Vergiftet alles, was es beißt. Dient Team Nox treu.', evolvesTo: 79, evolveLevel: 28 },
  { id: 79, name: 'Toxiknatter',   type: 'erde',   type2: 'geist', stage: 2, role: 'attacker', rarity: 'uncommon', body: 'snake', flavor: 'Schwebt geisterhaft über den Boden und verbreitet Angst.' },

  // (IDs 80/81 above in Geist section)

  // ═══════════════════════════════════════════════════════════════════════════
  // Dual-Typen (Eis+Luft, Feuer+Erde)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 82, name: 'Eisvogel',      type: 'eis',    type2: 'luft', stage: 1, role: 'speedster', rarity: 'uncommon', body: 'bird', flavor: 'Schießt pfeilschnell über Eisfelder und friert die Luft ein.', evolvesTo: 83, evolveLevel: 26 },
  { id: 83, name: 'Frostadler',    type: 'eis',    type2: 'luft', stage: 2, role: 'attacker', rarity: 'rare',     body: 'bird', flavor: 'Hinterlässt einen Eissturm, wenn er die Flügel schlägt.' },

  { id: 84, name: 'Lavabombe',     type: 'feuer',  type2: 'erde', stage: 1, role: 'attacker', rarity: 'uncommon', body: 'golem', flavor: 'Explosiver Gesteinsklumpen, der auf Feinde zurollt.', evolvesTo: 85, evolveLevel: 30 },
  { id: 85, name: 'Magmawucht',    type: 'feuer',  type2: 'erde', stage: 2, role: 'attacker', rarity: 'rare',     body: 'golem', flavor: 'Riesiger Magmagolem, dessen Schlag die Erde erschüttert.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Elite-4-Kreaturen (Psycho+Geist)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 86, name: 'Mondauge',      type: 'psycho', type2: 'geist', stage: 1, role: 'balanced', rarity: 'uncommon', body: 'beast', flavor: 'Sieht in absoluter Dunkelheit. Sein Blick bannt Feinde.', evolvesTo: 87, evolveLevel: 32 },
  { id: 87, name: 'Traumspiegel',  type: 'psycho', type2: 'geist', stage: 2, role: 'attacker', rarity: 'rare',     body: 'beast', flavor: 'Zeigt Feinden ihre größten Ängste. Unbesiegbar in Träumen.' },

  { id: 88, name: 'Wüstenphönix', type: 'feuer',  type2: 'luft', stage: 2, role: 'attacker', rarity: 'rare',     body: 'bird', flavor: 'Steigt aus Asche immer wieder auf. Sein Flügelschlag entfacht Sandstürme.' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Legendäre
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 89, name: 'Sonnenschlange',type: 'feuer',  type2: 'drache', stage: 'L', role: 'attacker', rarity: 'legendary', body: 'dragon', flavor: 'Der ewige Drache der Sonne. Niemand kennt seinen Ursprung.' },
  { id: 90, name: 'Mondgeist',     type: 'geist',  type2: 'eis',    stage: 'L', role: 'speedster', rarity: 'legendary', body: 'ghost',  flavor: 'Erscheint in mondlosen Nächten und friert Zeit ein.' },
  { id: 91, name: 'Erdriese',      type: 'erde',   stage: 'L',      role: 'tank',     rarity: 'legendary', body: 'golem',  flavor: 'Lebt tief in der Erde. Die Beben der Welt sind sein Herzschlag.' },
];

// Vollständige Kreatur-Definitionen (mit Stats + Lernsatz).
export const CREATURES = {};
for (const s of SPECS) {
  CREATURES[s.id] = {
    ...s,
    baseStats: mkStats(s.stage, s.role),
    learnset: mkLearnset(s.type, s.type2),
  };
}

export const DEX_IDS = SPECS.map((s) => s.id).sort((a, b) => a - b);
export const STARTER_IDS = [1, 4, 7];
