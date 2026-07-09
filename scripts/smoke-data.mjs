// Data smoke-test: validates each game's committed snapshot so a broken/empty
// catalogue is caught before deploy (the headless equivalent of clicking through
// every game). Checks that cards carry the fields the UI needs to render a tile
// and a price. Empty Magic is a warning (it fills on first deploy), not a fail.
//
// Newly auto-detected cards are shown before their first price is fetched and
// carry `prices.pricePending: true`. Those are valid (the UI renders them as
// "Preis folgt"), so they pass the shape check. To still catch a catalogue whose
// prices genuinely failed to load, we require a minimum share of priced cards.
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
const priced = (c) => !!c?.prices && (c.prices.market != null || c.prices.trend != null);
const pending = (c) => c?.prices?.pricePending === true;
// A card is well-formed if it can render a tile and either has a price or is
// explicitly awaiting its first price (newly detected set).
const ok = (c) => !!c && c.id != null && !!c.name && !!imgOf(c) && (priced(c) || pending(c));

// A catalogue with almost no priced cards means the price fetch broke — fail it
// even if every card is individually "pending".
const MIN_PRICED_SHARE = 0.5;

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
  const pendingCount = cards.reduce((a, c) => a + (pending(c) ? 1 : 0), 0);
  const pricedShare = cards.reduce((a, c) => a + (priced(c) ? 1 : 0), 0) / n;
  const host = (imgOf(cards[0]) || '').split('/')[2] || '—';

  if (bad.length) {
    console.log(`✗ ${label}: ${n} cards — malformed at idx ${bad.join(',')}`); fail++;
  } else if (pricedShare < MIN_PRICED_SHARE) {
    console.log(`✗ ${label}: ${n} cards — only ${(pricedShare * 100).toFixed(0)}% priced (prices likely failed to load)`); fail++;
  } else {
    const pend = pendingCount ? ` · pending ${pendingCount}` : '';
    console.log(`✓ ${label}: ${n} cards · img host ${host} · missing-img ${missingImg} · priced ${(pricedShare * 100).toFixed(0)}%${pend}`);
  }
}

console.log(fail ? `\n✗ ${fail} catalogue(s) failed` : '\n✓ all catalogues OK');
process.exit(fail ? 1 : 0);
