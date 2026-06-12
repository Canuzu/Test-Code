// One-off: slim the already-committed public/data/*.json snapshots in place, so
// the branch ships the smaller payload immediately (the daily build also slims
// its fresh output — see slimCards() wired into each fetch-*.mjs). Idempotent:
// re-running on an already-slim file is a no-op. The app rehydrates on load, so
// behaviour is unchanged — only the download/parse gets cheaper.
//
// Run: node scripts/slim-snapshots.mjs

import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slimCards } from '../src/lib/cardCodec.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const D = (f) => resolve(__dirname, '../public/data', f);

const FILES = [
  ['pokemon', 'cards.json'],
  ['yugioh', 'yugioh.json'],
  ['magic', 'magic.json'],
  ['onepiece', 'onepiece.json'],
];

for (const [game, file] of FILES) {
  const path = D(file);
  let data;
  try { data = JSON.parse(await readFile(path, 'utf8')); }
  catch (e) { console.log(`✗ ${file}: cannot read (${e.message})`); continue; }
  if (!Array.isArray(data.cards)) { console.log(`⚠ ${file}: no cards array — skipped`); continue; }

  const before = (await stat(path)).size;
  data.cards = slimCards(data.cards, game);
  await writeFile(path, JSON.stringify(data));
  const after = (await stat(path)).size;
  const pct = before ? Math.round((1 - after / before) * 100) : 0;
  console.log(`✓ ${file}: ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB  (−${pct}%)`);
}
