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
import { normalize, SET_META } from '../src/data/providers/onepiece.js';
import { fetchCardmarket, fetchCardmarketFull } from './fetch-cardmarket.mjs';
import { slimSnapshot } from '../src/lib/cardCodec.js';

// Opt-in full Cardmarket coverage: walk every expansion → single → priceGuide so
// ALL cards get real MKM prices (not just name-search hits). Heavy on the MKM
// request budget, so it is off unless CM_ONEPIECE_FULL is set, and resumes
// across runs (already-priced products are skipped). See docs/BACKEND.md.
const FULL_CM = /^(1|true|yes|on)$/i.test(process.env.CM_ONEPIECE_FULL || '');

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

// Reads the existing snapshot: card count plus the set of MKM product ids we
// already priced for real (so a resuming full crawl can skip them).
async function readExisting() {
  try {
    const j = JSON.parse(await readFile(OUT, 'utf8'));
    const cards = Array.isArray(j.cards) ? j.cards : [];
    const pricedIds = new Set();
    for (const c of cards) if (c?.cmPid != null && c?.prices?.estimated === false) pricedIds.add(c.cmPid);
    return { count: cards.length, pricedIds };
  } catch { return { count: 0, pricedIds: new Set() }; }
}

async function writeSnapshot(payload) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(slimSnapshot(payload, 'onepiece')));
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
  const { count: had, pricedIds } = await readExisting();
  console.log(`[fetch-onepiece] source ${RAW} · existing snapshot: ${had} cards` +
    (FULL_CM ? ` · full Cardmarket crawl ON (${pricedIds.size} already priced)` : ''));

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

  // Build a set-metadata map LIVE from the source's pack list so a newly released
  // set automatically gets a proper name and is treated as the newest — no manual
  // SET_META edit needed. Curated SET_META wins (nicer names + real dates); any
  // set not yet in it is named from the pack title and dated just after the
  // latest known set so it sorts to the top.
  const bumpDay = (ymd) => {
    const d = new Date(`${ymd.replace(/\//g, '-')}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
  };
  const titleCase = (s) => (s || '').toLowerCase().replace(/(^|\s)([a-z])/g, (_, sp, c) => sp + c.toUpperCase());
  // Parse only the FIRST "LETTERS[-]DIGITS" token of a pack label (some packs
  // carry compound labels like "OP-14 [EB-04]") so we never invent bogus codes.
  const codeOfLabel = (label) => {
    const m = String(label || '').match(/^\s*([A-Za-z]{1,4})-?(\d{1,3})?/);
    return m ? (m[1] + (m[2] || '')).toUpperCase() : '';
  };
  const latestKnown = Object.values(SET_META).map((m) => m.releaseDate).filter(Boolean).sort().pop() || '2020/01/01';
  const newSetDate = bumpDay(latestKnown);
  const metaByCode = { ...SET_META };
  let newSets = 0;
  for (const p of Object.values(packs || {})) {
    const code = codeOfLabel(p?.title_parts?.label);
    const title = p?.title_parts?.title;
    if (!code || metaByCode[code]) continue;
    metaByCode[code] = { name: title ? titleCase(title) : code, releaseDate: newSetDate };
    newSets++;
    console.log(`[fetch-onepiece] ＋ new set auto-added: ${code} "${metaByCode[code].name}" (${newSetDate})`);
  }
  if (!newSets) console.log('[fetch-onepiece] no unseen sets in pack list (SET_META covers all)');

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
      try { byId.set(raw.id, normalize(raw, stamp, metaByCode)); } catch { /* skip malformed */ }
    }
  }

  if (byId.size === 0) {
    console.error('[fetch-onepiece] no cards parsed — keeping existing snapshot.');
    process.exit(0);
  }

  // Optional: official Cardmarket (MKM) API. With the CM_* secrets set, real MKM
  // prices REPLACE the estimate on every card we can match — by collector code
  // (e.g. OP01-001), or by set name + number. No-op without credentials.
  //   • default: a quick name-search (fast, top cards only).
  //   • CM_ONEPIECE_FULL: a full expansion crawl so ALL cards get real prices,
  //     resuming across runs (skips products priced in earlier runs).
  let cmEnriched = 0;
  try {
    let cmCards = [];
    if (FULL_CM) {
      const res = await fetchCardmarketFull({ game: 'onepiece', skipIds: pricedIds });
      cmCards = res.cards;
      if (res.done) console.log('[fetch-onepiece] full Cardmarket crawl: all outstanding products priced this run');
    } else {
      cmCards = await fetchCardmarket({ game: 'onepiece', limit: 800, perTerm: 20 });
    }
    if (cmCards.length) {
      const nameToCode = new Map(Object.entries(metaByCode).map(([code, m]) => [m.name.toLowerCase(), code]));
      const pad3 = (s) => String(s ?? '').replace(/\D/g, '').padStart(3, '0');
      for (const cm of cmCards) {
        let id = cm.code && byId.has(cm.code) ? cm.code : null;
        if (!id) { // secondary match: MKM expansion name → our set code, + number
          const setCode = nameToCode.get((cm.set || '').toLowerCase());
          const num = pad3(cm.number);
          if (setCode && num !== '000' && byId.has(`${setCode}-${num}`)) id = `${setCode}-${num}`;
        }
        if (!id) continue;
        const base = byId.get(id);
        base.prices = { ...cm.prices, estimated: false };
        if (cm.cardmarketUrl) base.cardmarketUrl = cm.cardmarketUrl;
        // Remember the MKM product id so a resuming full crawl can skip this card.
        const pid = Number(String(cm.id).replace(/^cm-/, ''));
        if (Number.isFinite(pid)) base.cmPid = pid;
        base.source = 'cardmarket';
        cmEnriched++;
      }
      console.log(`[fetch-onepiece] Cardmarket: ${cmCards.length} products → ${cmEnriched} cards upgraded to real MKM prices`);
    }
  } catch (e) {
    console.error(`[fetch-onepiece] Cardmarket step failed: ${e.message}`);
  }

  // Re-apply real prices that earlier runs already fetched (full-crawl resume):
  // the catalogue is rebuilt fresh each run, so carry the persisted MKM prices
  // forward instead of reverting those cards to the estimate.
  let cmCarried = 0;
  if (FULL_CM && pricedIds.size) {
    try {
      const prev = JSON.parse(await readFile(OUT, 'utf8'));
      for (const c of (Array.isArray(prev.cards) ? prev.cards : [])) {
        if (c?.cmPid == null || c?.prices?.estimated !== false) continue;
        const base = byId.get(c.id);
        if (!base || base.source === 'cardmarket') continue; // freshly priced this run wins
        base.prices = { ...c.prices, currency: 'EUR', estimated: false };
        if (c.cardmarketUrl) base.cardmarketUrl = c.cardmarketUrl;
        base.cmPid = c.cmPid;
        base.source = 'cardmarket';
        cmEnriched++; cmCarried++;
      }
      if (cmCarried) console.log(`[fetch-onepiece] carried ${cmCarried} real MKM prices forward from the previous snapshot`);
    } catch (e) {
      console.error(`[fetch-onepiece] carry-forward failed: ${e.message}`);
    }
  }

  // Newest set first, then by card number within a set.
  const cards = [...byId.values()].sort((a, b) =>
    (b.setReleaseDate || '').localeCompare(a.setReleaseDate || '') ||
    String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));

  const completedSets = [...new Set(cards.map((c) => c.setId))];
  const allReal = cmEnriched >= cards.length;
  await writeSnapshot({
    generatedAt: now.toISOString(),
    source: cmEnriched
      ? `One Piece Card Game (official art) via punk-records · ${cmEnriched} live Cardmarket prices${allReal ? '' : ', rest estimated'}`
      : 'One Piece Card Game (official art) via punk-records · prices estimated',
    pricesEstimated: !allReal,
    cmEnriched,
    count: cards.length,
    completedSets,
    cards,
  });
  console.log(`[fetch-onepiece] ✓ wrote ${cards.length} cards · ${completedSets.length} sets · ${okPacks}/${packIds.length} packs ok · ${cmEnriched} live MKM prices`);
}

main().catch((e) => {
  console.error('[fetch-onepiece] fatal:', e);
  process.exit(0); // never block the deploy
});
