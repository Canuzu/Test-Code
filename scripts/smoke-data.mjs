// Data smoke-test: validates each game's committed snapshot so a broken/empty
// catalogue is caught before deploy (the headless equivalent of clicking through
// every game). Checks that cards carry the fields the UI needs to render a tile
// and a price. Empty Magic is a warning (it fills on first deploy), not a fail.
//
// Run: node scripts/smoke-data.mjs   (exit 1 if any catalogue is malformed)

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const D = (f) => resolve(__dirname, '../public/data', f);

const FILES = [
  ['Pokémon', 'cards.json'],
  ['One Piece', 'onepiece.json'],
  ['Yu-Gi-Oh!', 'yugioh.json'],
  ['Magic', 'magic.json'],
];

const imgOf = (c) => c?.image?.small || c?.image?.large || null;
const ok = (c) =>
  c && c.id != null && c.name && imgOf(c) &&
  c.prices && (c.prices.market != null || c.prices.trend != null);

let fail = 0;
for (const [label, file] of FILES) {
  let data;
  try { data = JSON.parse(await readFile(D(file), 'utf8')); }
  catch (e) { console.log(`✗ ${label}: cannot read ${file} (${e.message})`); fail++; continue; }

  const cards = Array.isArray(data) ? data : (data.cards || []);
  if (cards.length === 0) { console.log(`⚠ ${label}: 0 cards — placeholder, awaiting deploy`); continue; }

  // Sample head/middle/tail for shape, and scan the whole set for missing images.
  const n = cards.length;
  const bad = [0, n >> 1, n - 1].filter((i) => !ok(cards[i]));
  const missingImg = cards.reduce((a, c) => a + (imgOf(c) ? 0 : 1), 0);
  const host = (imgOf(cards[0]) || '').split('/')[2] || '—';

  if (bad.length) { console.log(`✗ ${label}: ${n} cards — malformed at idx ${bad.join(',')}`); fail++; }
  else console.log(`✓ ${label}: ${n} cards · img host ${host} · missing-img ${missingImg}`);
}

console.log(fail ? `\n✗ ${fail} catalogue(s) failed` : '\n✓ all catalogues OK');
process.exit(fail ? 1 : 0);
