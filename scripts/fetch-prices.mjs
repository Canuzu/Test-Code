// Build-time price fetcher. Runs on the GitHub Actions server (no browser CORS
// limits) and writes a static snapshot to public/data/cards.json, which the
// app then loads same-origin. This is what makes "live" data work on a static
// GitHub Pages site. Scheduled daily in the deploy workflow.
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
const TARGET = 90; // how many cards to keep in the snapshot
const SELECT = 'id,name,number,rarity,supertype,subtypes,images,set,cardmarket';

// Curated queries that reliably return valuable, German-market-relevant cards
// with real Cardmarket prices. We merge, keep priced cards, sort by price.
const QUERIES = [
  'rarity:"Special Illustration Rare"',
  'rarity:"Illustration Rare"',
  'set.id:swsh7', // Evolving Skies (Moonbreon & alt arts)
  'set.id:base1', // Base Set classics
  'set.id:sv3pt5', // Pokémon 151
];

async function fetchQuery(q, pageSize = 60) {
  const params = new URLSearchParams({ q, pageSize: String(pageSize), orderBy: '-set.releaseDate', select: SELECT });
  const res = await fetch(`${BASE}/cards?${params}`, {
    headers: API_KEY ? { 'X-Api-Key': API_KEY } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
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

  for (const q of QUERIES) {
    try {
      const raw = await fetchQuery(q);
      anyOk = true;
      let kept = 0;
      for (const r of raw) {
        const c = normalize(r);
        if (c.prices.market != null) { byId.set(c.id, c); kept++; }
      }
      console.log(`[fetch-prices] "${q}" -> ${raw.length} cards, ${kept} priced`);
    } catch (e) {
      console.error(`[fetch-prices] query "${q}" failed: ${e.message}`);
    }
  }

  const cards = [...byId.values()]
    .sort((a, b) => (b.prices.market ?? 0) - (a.prices.market ?? 0))
    .slice(0, TARGET);

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
