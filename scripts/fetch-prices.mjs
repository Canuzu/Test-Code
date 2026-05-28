// Build-time price fetcher. Runs on the GitHub Actions server (no browser CORS
// limits) and writes a static snapshot to public/data/cards.json, which the
// app loads same-origin. Scheduled daily in the deploy workflow.
//
// Contents:
//   1. ALL priced cards from the 2 newest Pokémon sets (determined live).
//   2. A curated breadth of high-value cards across other sets.
//
// Works with or without a pokemontcg.io API key (POKEMONTCG_API_KEY env var).
// On any failure it writes an empty snapshot and exits 0 so the deploy still
// succeeds (the app falls back to its bundled sample data).

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/pokemon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/cards.json');
const BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMONTCG_API_KEY || '';
const CURATED_LIMIT = 200; // top valuable cards from the breadth queries
const HARD_CAP = 1200; // safety bound on snapshot size
const SELECT = 'id,name,number,rarity,supertype,subtypes,images,set,cardmarket';
const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {};

// Breadth queries: valuable, German-market-relevant cards across many sets.
const QUERIES = [
  'rarity:"Special Illustration Rare"',
  'rarity:"Illustration Rare"',
  'rarity:"Hyper Rare"',
  'set.id:swsh7', // Evolving Skies (Moonbreon & alt arts)
  'set.id:base1', // Base Set classics
  'set.id:sv3pt5', // Pokémon 151
  'set.id:swsh12pt5', // Crown Zenith
];

async function getJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// The 2 newest sets, by release date (fetch all sets and sort — robust).
async function newestSets(n = 2) {
  const json = await getJSON(`${BASE}/sets?pageSize=250&select=id,name,releaseDate`);
  return (json.data || [])
    .filter((s) => s.releaseDate)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, n);
}

async function allCardsInSet(setId) {
  const out = [];
  for (let page = 1; page <= 4; page++) {
    const params = new URLSearchParams({ q: `set.id:${setId}`, pageSize: '250', page: String(page), select: SELECT });
    const json = await getJSON(`${BASE}/cards?${params}`);
    const data = json.data || [];
    out.push(...data);
    if (data.length < 250) break;
  }
  return out;
}

async function runQuery(q) {
  const params = new URLSearchParams({ q, pageSize: '80', orderBy: '-set.releaseDate', select: SELECT });
  const json = await getJSON(`${BASE}/cards?${params}`);
  return json.data || [];
}

async function writeSnapshot(payload) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
}

async function main() {
  console.log(`[fetch-prices] API key: ${API_KEY ? 'present' : 'none (keyless)'}`);
  const byId = new Map();
  let anyOk = false;

  // 1) ALL cards from the 2 newest sets.
  try {
    const sets = await newestSets(2);
    console.log(`[fetch-prices] newest sets: ${sets.map((s) => `${s.name} (${s.id}, ${s.releaseDate})`).join(', ')}`);
    for (const s of sets) {
      const raw = await allCardsInSet(s.id);
      anyOk = true;
      let kept = 0;
      for (const r of raw) {
        const c = normalize(r);
        if (c.prices.market != null) { byId.set(c.id, c); kept++; }
      }
      console.log(`[fetch-prices] set ${s.id}: ${raw.length} cards, ${kept} priced`);
    }
  } catch (e) {
    console.error(`[fetch-prices] newest-sets step failed: ${e.message}`);
  }

  // 2) Curated breadth: keep the most valuable across the queries.
  const curated = new Map();
  for (const q of QUERIES) {
    try {
      const raw = await runQuery(q);
      anyOk = true;
      for (const r of raw) {
        const c = normalize(r);
        if (c.prices.market != null) curated.set(c.id, c);
      }
      console.log(`[fetch-prices] "${q}" -> ${raw.length} cards`);
    } catch (e) {
      console.error(`[fetch-prices] query "${q}" failed: ${e.message}`);
    }
  }
  [...curated.values()]
    .sort((a, b) => (b.prices.market ?? 0) - (a.prices.market ?? 0))
    .slice(0, CURATED_LIMIT)
    .forEach((c) => byId.set(c.id, c));

  const cards = [...byId.values()].slice(0, HARD_CAP);

  if (!anyOk || cards.length === 0) {
    console.error('[fetch-prices] ⚠️  No live data fetched — app will use bundled sample data.');
    await writeSnapshot({ generatedAt: new Date().toISOString(), source: 'pokemontcg.io', error: 'fetch_failed_or_empty', count: 0, cards: [] });
    return;
  }

  await writeSnapshot({
    generatedAt: new Date().toISOString(),
    source: 'Cardmarket EU via pokemontcg.io',
    count: cards.length,
    cards,
  });
  console.log(`[fetch-prices] ✓ wrote ${cards.length} cards to public/data/cards.json`);
}

main().catch((e) => {
  console.error('[fetch-prices] fatal:', e);
  process.exit(0); // never block the deploy
});
