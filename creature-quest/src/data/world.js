// Die Naturwelt: drei verbundene Gebiete als Kachelkarten.
//
// Kachel-Legende:
//   T = Baum (blockiert)      R = Fels (blockiert)     ~ = Wasser (blockiert)
//   . = Weg/Wiese (begehbar)  " = hohes Gras (Begegnungen)
//   < > ^ v = Warp-Felder (begehbar, wechseln das Gebiet)

export const TILE = {
  BLOCK: new Set(['T', 'R', '~']),
  ENCOUNTER: '"',
  WARPS: new Set(['<', '>', '^', 'v']),
};

export function isBlocked(ch) {
  return TILE.BLOCK.has(ch);
}

const ZONES = {
  wiese: {
    name: 'Heimatwiese',
    music: '#7cb342',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
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
        lines: [
          'Frischer Wind heut, was? Gut zum Reisen.',
          'Im hohen Gras – den gestreiften Flächen – triffst du wilde Kreaturen.',
          'Pass auf: Manche Wege führen weiter als du denkst…',
        ],
      },
      {
        id: 'wiese_jungtrainer',
        x: 5, y: 9,
        facing: 'up',
        name: 'Jungtrainer Bo',
        kind: 'trainer',
        color: '#4d7cc6',
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
  },

  hoehle: {
    name: 'Kristallhöhle',
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
  },
};

// Warp-Verbindungen: zoneKey -> { '<': {to, x, y}, ... }
export const WARPS = {
  wiese: { '>': { to: 'wald', x: 2, y: 5 } },
  wald: {
    '<': { to: 'wiese', x: 13, y: 5 },
    '>': { to: 'hoehle', x: 2, y: 5 },
  },
  hoehle: { '<': { to: 'wald', x: 13, y: 5 } },
};

export const START = { zone: 'wiese', x: 3, y: 5 };

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
