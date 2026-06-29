// Build-time price fetcher. Runs on the GitHub Actions server (no browser CORS
// limits) and writes a snapshot to public/data/cards.json, which the app loads
// same-origin. Scheduled daily in the deploy workflow.
//
// INCREMENTAL catalogue: the snapshot is committed to the repo and GROWS over
// runs, newest → oldest, one complete set at a time. Each run:
//   1. always re-fetches the REFRESH_RECENT newest sets (fresh prices), and
//   2. adds the next BATCH_NEW sets that aren't complete yet (coverage),
// then remembers which sets are done so the next run continues where it left
// off. This way the catalogue keeps advancing to older sets even under the
// keyless rate limit; an API key (POKEMONTCG_API_KEY) makes each run add far
// more sets at once.
//
// On a transient failure it keeps the existing snapshot (never clobbers it) and
// exits 0 so the deploy still succeeds.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/pokemon.js';
import { slimSnapshot } from '../src/lib/cardCodec.js';
import { fetchCardmarket } from './fetch-cardmarket.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/cards.json');
const BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMONTCG_API_KEY || '';
const REFRESH_RECENT = 8; // newest sets re-fetched every run for fresh prices
// Sets added per run, newest→oldest, continuing from the committed snapshot.
// With an API key we pull the whole remaining archive in one run; keyless stays
// moderate to respect the rate limit (failed sets simply retry next run).
const BATCH_NEW = API_KEY ? 300 : 40; // additional not-yet-fetched sets per run
// Upper bound on catalogue size. Set well above the full Pokémon archive
// (~20k priced cards across all sets) so the crawler keeps adding sets until
// every set is complete, then only refreshes the newest sets.
const HARD_CAP = 30000; // full archive: never bound out before all sets are in
const SELECT = 'id,name,number,rarity,supertype,subtypes,images,set,cardmarket';
const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch with retry/backoff. The keyless pokemontcg.io tier is rate-limited, so a
// plain fetch often 429s and a whole set gets skipped (this is why the crawl can
// stall on the newest sets). Honour Retry-After and back off so older sets
// actually come through over the run.
async function getJSON(url, tries = 5) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= tries - 1) throw new Error(`HTTP ${res.status}`);
    const ra = Number(res.headers.get('retry-after'));
    const wait = (ra > 0 ? ra * 1000 : Math.min(30000, 1500 * 2 ** attempt)) + Math.floor(Math.random() * 500);
    console.log(`[fetch-prices] HTTP ${res.status} — retry in ${Math.round(wait / 1000)}s (${attempt + 1}/${tries})`);
    await sleep(wait);
  }
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
  await writeFile(OUT, JSON.stringify(slimSnapshot(payload, 'pokemon')));
}

// Load the previously committed snapshot so this run continues from it.
async function readExisting() {
  try {
    const j = JSON.parse(await readFile(OUT, 'utf8'));
    return {
      byId: new Map((j.cards || []).map((c) => [c.id, c])),
      completed: new Set(j.completedSets || []),
      deNames: j.deNames && typeof j.deNames === 'object' ? j.deNames : {},
    };
  } catch {
    return { byId: new Map(), completed: new Set(), deNames: {} };
  }
}

// ---- German names (official, from PokéAPI), cached across runs ----------------
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

// Resolves German names for any species not already in the cache, then applies
// them. Returns the updated cache (incl. '' for known misses, e.g. Trainers).
async function resolveGermanNames(cards, deCache) {
  const de = new Map(Object.entries(deCache || {}));
  const need = new Set();
  for (const c of cards) {
    const slug = speciesSlug(c.baseName);
    if (slug && !de.has(slug)) need.add(slug);
  }
  await mapPool([...need], 8, async (slug) => {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`);
      if (!res.ok) { de.set(slug, ''); return; } // remember permanent miss
      const json = await res.json();
      const name = (json.names || []).find((n) => n.language?.name === 'de')?.name;
      de.set(slug, name || '');
    } catch { /* transient: leave unknown, retried next run */ }
  });

  let translated = 0;
  for (const c of cards) {
    const g = de.get(speciesSlug(c.baseName));
    if (g && c.baseName && c.name.includes(c.baseName)) {
      const next = c.name.replace(c.baseName, g);
      if (next !== c.name) { c.nameEn = c.name; c.name = next; translated++; }
    }
  }
  console.log(`[fetch-prices] German names: ${need.size} new lookups, ${translated} cards (re)translated`);
  return Object.fromEntries(de);
}

async function main() {
  console.log(`[fetch-prices] API key: ${API_KEY ? 'present' : 'none (keyless)'}`);
  const { byId, completed, deNames } = await readExisting();
  console.log(`[fetch-prices] existing snapshot: ${byId.size} cards, ${completed.size} complete sets`);

  let anyOk = false;
  let sets = [];
  try { sets = await allSetsDesc(); anyOk = true; } catch (e) { console.error(`[fetch-prices] sets list failed: ${e.message}`); }

  // Work list: refresh the newest sets (fresh prices) + the next not-yet-done
  // sets (coverage), de-duplicated, kept newest → oldest.
  const recent = sets.slice(0, REFRESH_RECENT);
  const pending = sets.filter((s) => !completed.has(s.id)).slice(0, BATCH_NEW);
  const seen = new Set();
  const work = [...recent, ...pending]
    .filter((s) => (seen.has(s.id) ? false : seen.add(s.id)))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  // A just-released set often has no Cardmarket prices yet. For the newest sets we
  // still include those cards (flagged pricePending) so the set is fully browsable
  // on day one; the UI shows "Preis folgt" and the price fills in on a later run.
  // Older sets keep the strict "must be priced" rule so the archive stays clean.
  const recentIds = new Set(recent.map((s) => s.id));
  console.log(`[fetch-prices] this run: refresh ${recent.length} newest + ${pending.length} new = ${work.length} sets`);

  for (const s of work) {
    const isNew = !completed.has(s.id);
    if (isNew && byId.size >= HARD_CAP) continue; // bound growth at a set boundary
    const allowUnpriced = recentIds.has(s.id);
    try {
      const raw = await allCardsInSet(s.id); // full set before moving on
      anyOk = true;
      let kept = 0;
      let pendingPrices = 0;
      for (const r of raw) {
        const c = normalize(r);
        if (c.prices.market != null) { byId.set(c.id, c); kept++; }
        else if (allowUnpriced) {
          c.prices = { ...c.prices, pricePending: true };
          byId.set(c.id, c); kept++; pendingPrices++;
        }
      }
      completed.add(s.id);
      console.log(`[fetch-prices] ${isNew ? '＋' : '↻'} ${s.name} (${s.id}, ${s.releaseDate}): ${kept} kept${pendingPrices ? ` (${pendingPrices} price pending)` : ''} · total ${byId.size}`);
    } catch (e) {
      console.error(`[fetch-prices] set ${s.id} (${s.name}) failed, skipping: ${e.message}`);
    }
  }

  // Official Cardmarket API (opt-in via CM_* secrets). No-op without credentials.
  try {
    const cmCards = await fetchCardmarket({ limit: 120 });
    if (cmCards.length) { cmCards.forEach((c) => byId.set(c.id, c)); anyOk = true; console.log(`[fetch-prices] merged ${cmCards.length} Cardmarket-API cards`); }
  } catch (e) {
    console.error(`[fetch-prices] Cardmarket API step failed: ${e.message}`);
  }

  if (byId.size === 0) {
    console.error('[fetch-prices] ⚠️  No data at all — writing empty snapshot (app uses sample data).');
    await writeSnapshot({ generatedAt: new Date().toISOString(), source: 'pokemontcg.io', error: 'fetch_failed_or_empty', count: 0, completedSets: [], deNames: {}, cards: [] });
    return;
  }
  if (!anyOk) console.error('[fetch-prices] live fetch failed this run — keeping existing snapshot unchanged.');

  // Newest → oldest by set release date, then by card number within a set.
  const cards = [...byId.values()].sort((a, b) =>
    (b.setReleaseDate || '').localeCompare(a.setReleaseDate || '') ||
    String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));

  let de = deNames;
  try { de = await resolveGermanNames(cards, deNames); } catch (e) { console.error(`[fetch-prices] German-name step failed: ${e.message}`); }

  await writeSnapshot({
    generatedAt: new Date().toISOString(),
    source: 'Cardmarket EU via pokemontcg.io',
    count: cards.length,
    completedSets: [...completed],
    deNames: de,
    cards,
  });
  console.log(`[fetch-prices] ✓ wrote ${cards.length} cards · ${completed.size}/${sets.length || '?'} sets complete`);
}

main().catch((e) => {
  console.error('[fetch-prices] fatal:', e);
  process.exit(0); // never block the deploy
});
