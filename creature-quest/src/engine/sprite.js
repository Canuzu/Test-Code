// Prozeduraler Pixel-Sprite-Generator.
// Erzeugt aus Kreatur-ID + Typ + Körperform ein 16x16-Pixelraster.
// Symmetrisch (linke Hälfte gespiegelt) -> wirkt wie ein "Wesen".
import { mulberry32 } from './rng.js';
import { TYPES } from '../data/types.js';

const SZ = 16;

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(a, b, t) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return rgbToHex([ra[0] + (rb[0] - ra[0]) * t, ra[1] + (rb[1] - ra[1]) * t, ra[2] + (rb[2] - ra[2]) * t]);
}

// Körperform-Parameter (Ellipse + Extras).
const BODY = {
  blob:  { rx: 6.2, ry: 6.0, cy: 8.5, ears: 0, antennae: false, tail: false, wing: false },
  beast: { rx: 6.0, ry: 5.2, cy: 9.0, ears: 2, antennae: false, tail: true,  wing: false },
  bird:  { rx: 5.2, ry: 5.4, cy: 7.5, ears: 0, antennae: false, tail: true,  wing: true },
  fish:  { rx: 7.0, ry: 4.4, cy: 8.5, ears: 0, antennae: false, tail: true,  wing: false },
  bug:   { rx: 5.4, ry: 6.0, cy: 9.0, ears: 0, antennae: true,  tail: false, wing: false },
  golem: { rx: 6.0, ry: 6.0, cy: 8.5, ears: 0, antennae: false, tail: false, wing: false, blocky: true },
};

const cache = new Map();

export function buildSprite(id, type, body = 'blob') {
  const key = `${id}:${type}:${body}`;
  if (cache.has(key)) return cache.get(key);

  const rand = mulberry32((id * 2654435761) >>> 0);
  const t = TYPES[type] || TYPES.feuer;
  const base = t.color;
  const dark = t.dark;
  const light = mix(base, '#ffffff', 0.45);
  const cfg = BODY[body] || BODY.blob;
  const cx = 7.5;

  const grid = Array.from({ length: SZ }, () => Array(SZ).fill(null));
  const set = (x, y, c) => {
    if (x < 0 || x >= SZ || y < 0 || y >= SZ) return;
    grid[y][x] = c;
    grid[y][SZ - 1 - x] = c; // Spiegelung
  };

  // 1) Grundkörper
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x <= 7; x++) {
      let inside;
      if (cfg.blocky) {
        inside = x >= 2 && y >= cfg.cy - cfg.ry && y <= cfg.cy + cfg.ry - 1;
      } else {
        const nx = (x - cx) / cfg.rx;
        const ny = (y - cfg.cy) / cfg.ry;
        inside = nx * nx + ny * ny <= 1;
      }
      if (!inside) continue;
      // Highlight oben, sonst Grundfarbe, dazu zufällige Sprenkel
      let c = base;
      if (y < cfg.cy - 1 && rand() < 0.55) c = light;
      else if (rand() < 0.12) c = mix(base, dark, 0.5);
      set(x, y, c);
    }
  }

  // 2) Extras
  if (cfg.ears) {
    const topY = Math.round(cfg.cy - cfg.ry);
    set(3, topY - 1, base);
    set(4, topY - 1, base);
    set(3, topY - 2, base);
  }
  if (cfg.antennae) {
    const topY = Math.round(cfg.cy - cfg.ry);
    set(4, topY - 1, dark);
    set(4, topY - 2, dark);
    set(3, topY - 3, base);
  }
  if (cfg.tail) {
    const ty = Math.round(cfg.cy + cfg.ry * 0.4);
    grid[ty] && (grid[ty][SZ - 1] = base, grid[ty][SZ - 2] = base);
    grid[ty + 1] && (grid[ty + 1][SZ - 1] = base);
  }
  if (cfg.wing) {
    const wy = Math.round(cfg.cy);
    set(1, wy, light);
    set(1, wy + 1, base);
    set(2, wy - 1, light);
  }

  // 3) Outline (dunkler Rand)
  const snapshot = grid.map((r) => r.slice());
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      if (!snapshot[y][x]) continue;
      const empty =
        !snapshot[y - 1]?.[x] || !snapshot[y + 1]?.[x] ||
        !snapshot[y][x - 1] || !snapshot[y][x + 1];
      if (empty) grid[y][x] = dark;
    }
  }

  // 4) Augen (zuletzt, damit sie nicht übermalt werden):
  //    weiße Sklera oben, dunkle Pupille darunter; gespiegelt für zwei Augen.
  const eyeY = Math.max(2, Math.round(cfg.cy - cfg.ry * 0.3));
  const eyeX = 5;
  set(eyeX, eyeY, '#ffffff');
  set(eyeX, eyeY + 1, '#1b1b1b');

  cache.set(key, grid);
  return grid;
}

export { SZ as SPRITE_SIZE };
