// Die Naturwelt: Stadt-Hub + drei Gebiete als Kachelkarten.
//
// Kachel-Legende:
//   T = Baum (blockiert)      R = Fels (blockiert)     ~ = Wasser (blockiert)
//   . = Weg/Wiese (begehbar)  " = hohes Gras (Begegnungen)
//   F = Blumen (begehbar)
//   C = Pokécenter  M = Shop  G = Arena  H = Haus  (alle blockieren, Gebäude)
//   < > ^ v = Warp-Felder (begehbar, wechseln das Gebiet)

export const TILE = {
  BLOCK: new Set(['T', 'R', '~', 'C', 'M', 'G', 'H']),
  ENCOUNTER: '"',
  WARPS: new Set(['<', '>', '^', 'v']),
  BUILDINGS: new Set(['C', 'M', 'G', 'H']),
};

export function isBlocked(ch) {
  return TILE.BLOCK.has(ch);
}

const ZONES = {
  ahornfeld: {
    name: 'Ahornfeld',
    town: true,
    battleBg: 'meadow',
    music: '#c98a3a',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...C.....M....T',
      'T..............T',
      'T..............T',
      'T......G.......T',
      'T..............T',
      'T....F....F....T',
      'T..............T',
      'T.......v......T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [],
    npcs: [
      {
        id: 'town_nurse', x: 4, y: 3, facing: 'down',
        name: 'Schwester Linnea', kind: 'heal', sprite: 'nurse',
        lines: ['Willkommen im Pokécenter von Ahornfeld!', 'Sollen sich deine Kreaturen ausruhen?'],
        healLines: ['Deine Kreaturen sind wieder kerngesund! ✦', 'Bis bald – pass gut auf sie auf!'],
      },
      {
        id: 'town_merchant', x: 10, y: 3, facing: 'down',
        name: 'Händler Cassian', kind: 'shop', sprite: 'npc-merchant',
        lines: ['Tritt näher! Tränke, Kugeln, alles was das Trainerherz begehrt.'],
      },
      {
        id: 'town_prof', x: 13, y: 4, facing: 'left',
        name: 'Prof. Ascher', kind: 'talk', sprite: 'prof-ascher',
        lines: [
          'Ah, da bist du ja! Deine Reise hat begonnen.',
          'In der Welt gibt es drei Arenen. Besiege ihre Leiter für Orden!',
          'Im hohen Gras fängst du wilde Kreaturen – die Kugeln kaufst du im Shop.',
          'Heile dein Team jederzeit hier im Pokécenter. Viel Erfolg!',
        ],
      },
      {
        id: 'gym_volt', x: 7, y: 6, facing: 'down',
        name: 'Arenaleiter Volt', kind: 'trainer', sprite: 'leader-volt',
        badge: 'blitz', badgeName: 'Blitz', prize: 1500,
        lines: ['Hochspannung! Ich bin Volt, der Arenaleiter von Ahornfeld.', 'Zeig mir, ob deine Kreaturen den Funken haben!'],
        team: [
          { speciesId: 13, level: 14 }, // Funkmaus
          { speciesId: 26, level: 15 }, // Blitzkiesel
          { speciesId: 14, level: 17 }, // Voltratz
        ],
        victoryLines: ['Wahnsinn, du hast mich erdet! Der Blitz-Orden ist deiner!'],
        defeatLines: ['Zu viel Spannung für dich! Komm wieder, wenn du stärker bist.'],
        postLines: ['Der Blitz-Orden steht dir gut. Auf zur nächsten Arena!'],
      },
      {
        id: 'rival_1', x: 3, y: 8, facing: 'right',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 600,
        lines: ['Na, auch unterwegs? Mal sehen, wer von uns das bessere Team hat!', 'Komm schon – zeig, was du drauf hast!'],
        team: [
          { speciesId: 15, level: 7 }, // Flatterling
          { speciesId: 20, level: 8 }, // Quappling
        ],
        victoryLines: ['Pff, diesmal hattest du Glück! Beim nächsten Mal gewinne ich.'],
        defeatLines: ['Haha! Siehst du? Üben, üben, üben!'],
        postLines: ['Ich trainiere weiter – wir sehen uns im Wald wieder!'],
      },
    ],
  },

  wiese: {
    name: 'Heimatwiese',
    battleBg: 'meadow',
    music: '#7cb342',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.....^........T',
      'T..""..TT....~~T',
      'T..""..TT....~~T',
      'T............~~T',
      'T..............>',
      'T..............T',
      'T...""".."""...T',
      'T...""".."""...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 13, weight: 5, min: 2, max: 5 }, // Funkmaus
      { id: 15, weight: 5, min: 2, max: 5 }, // Flatterling
      { id: 22, weight: 4, min: 2, max: 5 }, // Moosko
      { id: 28, weight: 4, min: 2, max: 5 }, // Nebelkrähe
      { id: 24, weight: 3, min: 3, max: 5 }, // Pilzkopf
      { id: 32, weight: 3, min: 3, max: 5 }, // Kaktor
      { id: 20, weight: 3, min: 2, max: 4 }, // Quappling
      { id: 29, weight: 2, min: 3, max: 5 }, // Perlmuschel
    ],
    npcs: [
      {
        id: 'wiese_wanderer',
        x: 12, y: 1,
        facing: 'down',
        name: 'Wanderer Elias',
        kind: 'talk',
        sprite: 'npc-elder',
        lines: [
          'Frischer Wind heut, was? Gut zum Reisen.',
          'Im hohen Gras – den gestreiften Flächen – triffst du wilde Kreaturen.',
          'Nördlich liegt Ahornfeld mit Pokécenter und Shop. Schau vorbei!',
        ],
      },
      {
        id: 'wiese_jungtrainer',
        x: 5, y: 9,
        facing: 'up',
        name: 'Jungtrainer Bo',
        kind: 'trainer',
        sprite: 'trainer-generic',
        color: '#4d7cc6',
        prize: 300,
        lines: ['He, du da! Lust auf ein kleines Kräftemessen?'],
        team: [
          { speciesId: 13, level: 6 },
          { speciesId: 28, level: 7 },
        ],
        victoryLines: ['Wow, du bist richtig stark! Das war knapp…'],
        defeatLines: ['Hehe, geübt verliert man auch mal! Komm bald wieder!'],
        postLines: ['Dein Team ist beeindruckend. Bis zum nächsten Mal!'],
      },
    ],
  },

  wald: {
    name: 'Flüsterwald',
    battleBg: 'forest',
    music: '#2e7d32',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..TT....TT....T',
      'T."""....."""..T',
      'T....TT....TT..T',
      'T...""".....TT.T',
      '<..............>',
      'T.TT....""""...T',
      'T....TT....TT..T',
      'T..""....""....T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 22, weight: 5, min: 4, max: 9 },  // Moosko
      { id: 24, weight: 4, min: 4, max: 9 },  // Pilzkopf
      { id: 18, weight: 4, min: 5, max: 9 },  // Aschehörn
      { id: 31, weight: 3, min: 5, max: 9 },  // Zündfalter
      { id: 15, weight: 4, min: 4, max: 8 },  // Flatterling
      { id: 33, weight: 3, min: 4, max: 8 },  // Buddelpelz
      { id: 10, weight: 3, min: 5, max: 9 },  // Erdling
      { id: 25, weight: 1, min: 8, max: 10 }, // Sporenhaupt (selten)
    ],
    npcs: [
      {
        id: 'gym_flora', x: 8, y: 9, facing: 'down',
        name: 'Arenaleiterin Flora', kind: 'trainer', sprite: 'leader-flora',
        badge: 'blatt', badgeName: 'Blatt', prize: 1200,
        lines: ['Willkommen im grünen Herzen des Waldes.', 'Ich bin Flora. Meine Pflanzen-Kreaturen wurzeln tief – besiege sie, wenn du kannst!'],
        team: [
          { speciesId: 24, level: 11 }, // Pilzkopf
          { speciesId: 22, level: 12 }, // Moosko
          { speciesId: 23, level: 14 }, // Dickwald
        ],
        victoryLines: ['Beeindruckend! Der Blatt-Orden gehört dir.'],
        defeatLines: ['Die Natur lehrt Geduld. Komm gestärkt zurück.'],
        postLines: ['Mögen deine Wurzeln stark bleiben, Reisende(r).'],
      },
      {
        id: 'rival_2', x: 12, y: 9, facing: 'left',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 1000,
        lines: ['Da bist du ja wieder! Ich hab fleißig trainiert.', 'Diesmal mache ich dich fertig!'],
        team: [
          { speciesId: 16, level: 13 }, // Windschwinge
          { speciesId: 21, level: 14 }, // Krötarch
          { speciesId: 31, level: 15 }, // Zündfalter
        ],
        victoryLines: ['Was?! Schon wieder verloren… Du bist echt gut geworden.'],
        defeatLines: ['Haha! Endlich hab ich dich! Naja, fast.'],
        postLines: ['Beim letzten Mal in der Höhle entscheidet sichs – warte nur!'],
      },
    ],
  },

  hoehle: {
    name: 'Kristallhöhle',
    battleBg: 'cave',
    music: '#5d4037',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TRR..RR....RR..T',
      'TR..""....RR..RT',
      'T..RR....""..RRT',
      'T..............T',
      '<..""....RR..""T',
      'TRR....""""..RRT',
      'T....RR....RR..T',
      'T.RR..""..RR..RT',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 10, weight: 5, min: 8, max: 14 },  // Erdling
      { id: 27, weight: 4, min: 8, max: 13 },  // Lehmgolem
      { id: 26, weight: 4, min: 8, max: 13 },  // Blitzkiesel
      { id: 13, weight: 3, min: 8, max: 12 },  // Funkmaus
      { id: 18, weight: 3, min: 9, max: 13 },  // Aschehörn
      { id: 33, weight: 3, min: 8, max: 12 },  // Buddelpelz
      { id: 11, weight: 2, min: 12, max: 15 }, // Felsbrock (selten)
      { id: 19, weight: 1, min: 13, max: 16 }, // Magmakäfer (selten)
    ],
    npcs: [
      {
        id: 'gym_magister', x: 8, y: 9, facing: 'down',
        name: 'Arenaleiter Magister', kind: 'trainer', sprite: 'magister',
        badge: 'stein', badgeName: 'Stein', prize: 2000,
        lines: ['Du wagst dich tief in meine Höhle, Trainer.', 'Ich bin Magister. Mein Fels zerbricht nicht – aber vielleicht zerbrichst du an ihm!'],
        team: [
          { speciesId: 27, level: 16 }, // Lehmgolem
          { speciesId: 10, level: 17 }, // Erdling
          { speciesId: 11, level: 19 }, // Felsbrock
        ],
        victoryLines: ['Unmöglich… mein Fels bröckelt. Der Stein-Orden ist verdient!'],
        defeatLines: ['Hart wie Stein, dein Scheitern. Kehre stärker zurück.'],
        postLines: ['Du trägst den Stein-Orden mit Ehre. Respekt.'],
      },
      {
        id: 'rival_3', x: 3, y: 9, facing: 'right',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 1800,
        lines: ['Das hier ist das große Finale, mein Freund!', 'Ich hab alles gegeben. Mein bestes Team gegen deins – jetzt!'],
        team: [
          { speciesId: 17, level: 19 }, // Sturmaar
          { speciesId: 30, level: 19 }, // Strudelschnapp
          { speciesId: 19, level: 21 }, // Magmakäfer
        ],
        victoryLines: ['…Du bist einfach besser. Ich bin stolz, gegen dich gekämpft zu haben.', 'Bis wir uns wiedersehen, Champion!'],
        defeatLines: ['Endlich! Der wahre Sieger steht fest… für heute zumindest!'],
        postLines: ['Wir sind Rivalen fürs Leben. Danke für die Kämpfe!'],
      },
    ],
  },
};

// Warp-Verbindungen: zoneKey -> { '<': {to, x, y}, ... }
export const WARPS = {
  ahornfeld: { 'v': { to: 'wiese', x: 6, y: 2 } },
  wiese: {
    '^': { to: 'ahornfeld', x: 8, y: 8 },
    '>': { to: 'wald', x: 2, y: 5 },
  },
  wald: {
    '<': { to: 'wiese', x: 13, y: 5 },
    '>': { to: 'hoehle', x: 2, y: 5 },
  },
  hoehle: { '<': { to: 'wald', x: 13, y: 5 } },
};

export const START = { zone: 'ahornfeld', x: 8, y: 8 };

// Validierung: alle Zeilen gleich breit (fängt Tippfehler in den Karten ab).
const WIDTH = 16;
for (const [key, z] of Object.entries(ZONES)) {
  z.rows.forEach((r, i) => {
    if (r.length !== WIDTH) {
      throw new Error(`Karte "${key}" Zeile ${i} hat Breite ${r.length}, erwartet ${WIDTH}: "${r}"`);
    }
  });
}

export const ZONE_WIDTH = WIDTH;
export const ZONE_HEIGHT = ZONES.wiese.rows.length;
export { ZONES };

export function tileAt(zoneKey, x, y) {
  const z = ZONES[zoneKey];
  if (!z) return 'T';
  if (y < 0 || y >= z.rows.length) return 'T';
  const row = z.rows[y];
  if (x < 0 || x >= row.length) return 'T';
  return row[x];
}

// NPC an einer bestimmten Position im Gebiet (oder null).
export function npcAt(zoneKey, x, y) {
  const z = ZONES[zoneKey];
  if (!z || !z.npcs) return null;
  return z.npcs.find((n) => n.x === x && n.y === y) || null;
}

const FACING_OFFSET = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Tile, dem der Spieler gerade zugewandt ist (für Interaktionen).
export function facingTile(player) {
  const [dx, dy] = FACING_OFFSET[player.facing] || [0, 1];
  return { x: player.x + dx, y: player.y + dy };
}
