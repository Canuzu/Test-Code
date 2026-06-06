// Kleiner deterministischer Zufallsgenerator (mulberry32).
// Gleicher Seed -> gleiche Folge: wichtig für reproduzierbare Sprites.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function pickWeighted(rand, entries) {
  const total = entries.reduce((s, e) => s + (e.weight || 1), 0);
  let r = rand() * total;
  for (const e of entries) {
    r -= e.weight || 1;
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
}
