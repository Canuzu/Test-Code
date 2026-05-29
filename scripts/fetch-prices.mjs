// Build-time price fetcher. Runs on the GitHub Actions server (no browser CORS
// limits) and writes a static snapshot to public/data/cards.json, which the
// app loads same-origin. Scheduled daily in the deploy workflow.
//
// Contents: EVERY priced card of EVERY set, added newest → oldest, one complete
// set at a time (a set is only started once the previous one is fully added).
// We stop only at a SET boundary once HARD_CAP is reached, so no set is ever
// half-included. If the keyless rate limit cuts the run short, the newest sets
// are still complete and older ones simply aren't reached yet.
//
// Works with or without a pokemontcg.io API key (POKEMONTCG_API_KEY env var) —
// a key is strongly recommended here for the higher rate limit (more sets).
// On any failure it writes an empty snapshot and exits 0 so the deploy still
// succeeds (the app falls back to its bundled sample data).

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/pokemon.js';
import { fetchCardmarket } from './fetch-cardmarket.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/cards.json');
const BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMONTCG_API_KEY || '';
const HARD_CAP = 9000; // soft bound — we only stop at a SET boundary, never mid-set
const SELECT = 'id,name,number,rarity,supertype,subtypes,images,set,cardmarket';
const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {};

async function getJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ALL sets, newest → oldest by release date.
async function allSetsDesc() {
  const json = await getJSON(`${BASE}/sets?pageSize=250&select=id,name,releaseDate`);
  return (json.data || [])
    .filter((s) => s.releaseDate)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

async function allCardsInSet(setId) {
  const out = [];
  for (let page = 1; page <= 6; page++) {
    const params = new URLSearchParams({ q: `set.id:${setId}`, pageSize: '250', page: String(page), select: SELECT });
    const json = await getJSON(`${BASE}/cards?${params}`);
    const data = json.data || [];
    out.push(...data);
    if (data.length < 250) break;
  }
  return out;
}

async function writeSnapshot(payload) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
}

// ---- German names (official, from PokéAPI) ----------------------------------
const speciesSlug = (name) => (name || '')
  .toLowerCase()
  .replace(/[.'’:]/g, '')
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/(^-|-$)/g, '');

async function mapPool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await fn(items[idx]); }
  });
  await Promise.all(workers);
}

// Translate the Pokémon part of each card name to its official German name.
// Trainer/Energy cards (no matching species) and set names stay English.
async function applyGermanNames(cards) {
  const slugToBase = new Map();
  for (const c of cards) {
    const slug = speciesSlug(c.baseName);
    if (slug && !slugToBase.has(slug)) slugToBase.set(slug, c.baseName);
  }
  const de = new Map();
  await mapPool([...slugToBase.keys()], 8, async (slug) => {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`);
      if (!res.ok) return;
      const json = await res.json();
      const name = (json.names || []).find((n) => n.language?.name === 'de')?.name;
      if (name) de.set(slug, name);
    } catch { /* keep English for this one */ }
  });

  let translated = 0;
  for (const c of cards) {
    const g = de.get(speciesSlug(c.baseName));
    if (g && c.baseName && c.name.includes(c.baseName)) {
      const next = c.name.replace(c.baseName, g);
      if (next !== c.name) { c.nameEn = c.name; c.name = next; translated++; }
    }
  }
  console.log(`[fetch-prices] German names: ${de.size} species resolved, ${translated} cards translated`);
}

async function main() {
  console.log(`[fetch-prices] API key: ${API_KEY ? 'present' : 'none (keyless)'}`);
  const byId = new Map();
  let anyOk = false;

  // EVERY card of EVERY set, newest → oldest, one complete set at a time.
  let sets = [];
  try {
    sets = await allSetsDesc();
  } catch (e) {
    console.error(`[fetch-prices] sets list failed: ${e.message}`);
  }
  console.log(`[fetch-prices] ${sets.length} sets found · adding newest→oldest, all cards per set (cap ${HARD_CAP})`);

  let setsDone = 0;
  for (const s of sets) {
    if (byId.size >= HARD_CAP) {
      console.log(`[fetch-prices] cap ${HARD_CAP} reached after ${setsDone} complete sets (${byId.size} cards) — stopping at set boundary`);
      break;
    }
    try {
      const raw = await allCardsInSet(s.id); // full set before moving on
      anyOk = true;
      let kept = 0;
      for (const r of raw) {
        const c = normalize(r);
        if (c.prices.market != null) { byId.set(c.id, c); kept++; }
      }
      setsDone++;
      console.log(`[fetch-prices] [${setsDone}] ${s.name} (${s.id}, ${s.releaseDate}): ${raw.length} cards, ${kept} priced · total ${byId.size}`);
    } catch (e) {
      console.error(`[fetch-prices] set ${s.id} (${s.name}) failed, skipping: ${e.message}`);
    }
  }

  // 3) Official Cardmarket API (opt-in via CM_* secrets). Merged on top; these
  //    are real MKM products with full price guides. No-op without credentials.
  try {
    const cmCards = await fetchCardmarket({ limit: 120 });
    if (cmCards.length) {
      cmCards.forEach((c) => byId.set(c.id, c));
      anyOk = true;
      console.log(`[fetch-prices] merged ${cmCards.length} cards from the official Cardmarket API`);
    }
  } catch (e) {
    console.error(`[fetch-prices] Cardmarket API step failed (keeping pokemontcg.io): ${e.message}`);
  }

  const cards = [...byId.values()]; // already bounded at set boundaries above

  if (!anyOk || cards.length === 0) {
    console.error('[fetch-prices] ⚠️  No live data fetched — app will use bundled sample data.');
    await writeSnapshot({ generatedAt: new Date().toISOString(), source: 'pokemontcg.io', error: 'fetch_failed_or_empty', count: 0, cards: [] });
    return;
  }

  try {
    await applyGermanNames(cards);
  } catch (e) {
    console.error(`[fetch-prices] German-name step failed (keeping English): ${e.message}`);
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
