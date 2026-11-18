// Build-time highlights for the landing page. Reads the four committed catalogue
// snapshots and writes a tiny public/data/highlights.json (~10 KB) with, per
// game: card/set counts, the most valuable cards, the biggest 7-day risers (only
// for games with REAL market prices — estimated catalogues would show fake
// movement), and the newest set. The landing page fetches this instead of the
// 30+ MB of full catalogues, so it can show live prices instantly.
//
// Runs automatically before every `npm run build` (prebuild), locally and in CI,
// so it always reflects the freshest snapshots. Never fails the build: a missing
// or broken snapshot just leaves that game out.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rehydrateCards } from '../src/lib/cardCodec.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '../public/data');
const GAMES = [
  { id: 'pokemon', file: 'cards.json', realPrices: true },
  { id: 'magic', file: 'magic.json', realPrices: true },
  { id: 'onepiece', file: 'onepiece.json', realPrices: false },
  { id: 'yugioh', file: 'yugioh.json', realPrices: false },
];
const TOP_N = 6;
const MOVERS_N = 6;
const MIN_MOVER_BASE = 5; // 30-day base price floor: cheap cards' % swings are noise
const MOVER_PCT = [5, 100]; // a credible 30-day rise; above that is almost always a data spike
// Keep one entry per card name (several printings of the same card otherwise
// crowd the list), preserving the incoming order.
const uniqueByName = (list) => {
  const seen = new Set();
  return list.filter((c) => { const k = (c.name || '').toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
};

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const recentPrice = (p = {}) => num(p.avg1) ?? num(p.trend) ?? num(p.market) ?? num(p.avg7) ?? num(p.avg30);
const marketPrice = (p = {}) => num(p.trend) ?? num(p.market) ?? num(p.avg7) ?? recentPrice(p);
// 30-day change (trend vs 30-day average): far steadier than the 1-day figure,
// which is spiky in the source data.
const change30 = (p = {}) => {
  const base = num(p.avg30);
  const now = marketPrice(p);
  return base && now != null ? ((now - base) / base) * 100 : null;
};
const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

const slim = (c, game) => ({
  id: c.id,
  game,
  name: c.name,
  set: c.set || '',
  rarity: c.rarity || '',
  image: c.image?.small || c.image?.large || null,
  price: round2(marketPrice(c.prices)),
  change30: round2(change30(c.prices)),
  estimated: !!c.prices?.estimated,
});

async function build(g) {
  let snap;
  try { snap = JSON.parse(await readFile(resolve(DATA, g.file), 'utf8')); } catch { return null; }
  const cards = Array.isArray(snap.cards) ? snap.cards : [];
  if (!cards.length) return null;
  rehydrateCards(cards, g.id, snap.pricesUpdatedAt);

  const priced = cards.filter((c) => (c.image?.small || c.image?.large) && marketPrice(c.prices) != null);
  const top = uniqueByName([...priced].sort((a, b) => marketPrice(b.prices) - marketPrice(a.prices))).slice(0, TOP_N);
  // Movers: credible 30-day risers on cards worth tracking, ranked by the absolute
  // EUR gain so valuable cards with real moves lead (not 8 x "+79%" penny cards).
  const gain = (c) => marketPrice(c.prices) - num(c.prices?.avg30);
  const movers = g.realPrices
    ? uniqueByName(priced
      .filter((c) => {
        const ch = change30(c.prices);
        return (num(c.prices?.avg30) ?? 0) >= MIN_MOVER_BASE && ch != null && ch >= MOVER_PCT[0] && ch <= MOVER_PCT[1];
      })
      .sort((a, b) => gain(b) - gain(a)))
      .slice(0, MOVERS_N)
    : [];

  // Newest set = the latest release date present in the catalogue.
  const bySet = new Map();
  for (const c of cards) {
    const k = c.setId || c.set;
    if (!k) continue;
    const s = bySet.get(k) || { id: k, name: c.set || k, releaseDate: c.setReleaseDate || '', count: 0 };
    s.count += 1;
    if ((c.setReleaseDate || '') > s.releaseDate) s.releaseDate = c.setReleaseDate;
    bySet.set(k, s);
  }
  const newestSet = [...bySet.values()].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))[0] || null;

  return {
    count: cards.length,
    sets: bySet.size,
    updatedAt: snap.generatedAt || null,
    estimated: !g.realPrices,
    top: top.map((c) => slim(c, g.id)),
    movers: movers.map((c) => slim(c, g.id)),
    newestSet,
  };
}

async function main() {
  const games = {};
  for (const g of GAMES) {
    try {
      const h = await build(g);
      if (h) games[g.id] = h;
    } catch (e) {
      console.error(`[highlights] ${g.id} skipped: ${e.message}`);
    }
  }
  await mkdir(DATA, { recursive: true });
  const out = { generatedAt: new Date().toISOString(), games };
  await writeFile(resolve(DATA, 'highlights.json'), JSON.stringify(out));
  const total = Object.values(games).reduce((s, g) => s + g.count, 0);
  console.log(`[highlights] ✓ ${Object.keys(games).length} games · ${total} cards → public/data/highlights.json`);
}

main().catch((e) => { console.error('[highlights] failed (non-fatal):', e.message); });
