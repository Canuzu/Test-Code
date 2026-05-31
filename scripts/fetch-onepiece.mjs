// Build-time One Piece catalogue builder. Runs on the GitHub Actions server and
// writes public/data/onepiece.json, which the app loads same-origin — exactly
// like the Pokémon snapshot.
//
// Source: the open, versioned "punk-records" dataset on GitHub
// (https://github.com/buhbbl/punk-records), which mirrors EVERY English set and
// card from the official One Piece TCG site, including the official card images.
// We pull it from raw.githubusercontent.com (no CORS / no Cloudflare block),
// dedupe cards by id (the same card is reprinted across many packs), normalise
// to our Card shape and attach a transparent price estimate (see provider).
//
// On any failure it keeps the existing snapshot (never clobbers it) and exits 0
// so the deploy still succeeds.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/onepiece.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/onepiece.json');
const REPO = process.env.PUNK_RECORDS_REPO || 'buhbbl/punk-records';
const REF = process.env.PUNK_RECORDS_REF || 'main';
const LANG = process.env.PUNK_RECORDS_LANG || 'english';
const RAW = `https://raw.githubusercontent.com/${REPO}/${REF}/${LANG}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
      if (res.status === 404) throw new Error('HTTP 404');
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt >= tries - 1) throw e;
      await sleep(800 * 2 ** attempt + Math.floor(Math.random() * 300));
    }
  }
}

async function readExisting() {
  try {
    const j = JSON.parse(await readFile(OUT, 'utf8'));
    return Array.isArray(j.cards) ? j.cards.length : 0;
  } catch { return 0; }
}

async function writeSnapshot(payload) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
}

// Limited-concurrency map so we don't fire 50+ requests at once.
async function mapPool(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const had = await readExisting();
  console.log(`[fetch-onepiece] source ${RAW} · existing snapshot: ${had} cards`);

  let packs;
  try {
    packs = await getJSON(`${RAW}/packs.json`);
  } catch (e) {
    console.error(`[fetch-onepiece] packs.json failed (${e.message}) — keeping existing snapshot.`);
    process.exit(0);
  }
  const packIds = Object.keys(packs || {});
  console.log(`[fetch-onepiece] ${packIds.length} packs`);

  const now = new Date();
  const stamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  // Pull every pack's card list (concurrency-limited), dedupe by card id.
  const byId = new Map();
  let okPacks = 0;
  const lists = await mapPool(packIds, 8, async (pid) => {
    try { const a = await getJSON(`${RAW}/data/${pid}.json`); okPacks++; return a; }
    catch (e) { console.error(`[fetch-onepiece] pack ${pid} failed: ${e.message}`); return []; }
  });
  for (const list of lists) {
    for (const raw of list || []) {
      if (!raw?.id || byId.has(raw.id)) continue;
      try { byId.set(raw.id, normalize(raw, stamp)); } catch { /* skip malformed */ }
    }
  }

  if (byId.size === 0) {
    console.error('[fetch-onepiece] no cards parsed — keeping existing snapshot.');
    process.exit(0);
  }

  // Newest set first, then by card number within a set.
  const cards = [...byId.values()].sort((a, b) =>
    (b.setReleaseDate || '').localeCompare(a.setReleaseDate || '') ||
    String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));

  const completedSets = [...new Set(cards.map((c) => c.setId))];
  await writeSnapshot({
    generatedAt: now.toISOString(),
    source: 'One Piece Card Game (official art) via punk-records · prices estimated',
    pricesEstimated: true,
    count: cards.length,
    completedSets,
    cards,
  });
  console.log(`[fetch-onepiece] ✓ wrote ${cards.length} cards · ${completedSets.length} sets · ${okPacks}/${packIds.length} packs ok`);
}

main().catch((e) => {
  console.error('[fetch-onepiece] fatal:', e);
  process.exit(0); // never block the deploy
});
