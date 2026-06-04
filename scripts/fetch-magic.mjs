// Build-time Magic: The Gathering catalogue builder. Writes
// public/data/magic.json, loaded same-origin by the app.
//
// Source: Scryfall (https://scryfall.com/docs/api). We page through the SEARCH
// API (newest set first) keeping printings that carry a real Cardmarket EUR
// price — genuine EU prices, no estimate. We deliberately do NOT use the
// `default_cards` bulk export: that single file is ~500 MB, and buffering it via
// res.json() in CI was failing (the script then kept the empty placeholder,
// which is why Magic shipped empty). The paginated search streams ~175 cards per
// request with a tiny memory footprint and stops at HARD_CAP.
//
// On any failure it keeps the existing snapshot (never clobbers it) and exits 0.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/magic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/magic.json');
const HARD_CAP = Number(process.env.MAGIC_HARD_CAP || 16000);
// Newest first; one row per printing; only cards Scryfall lists with a Cardmarket
// EUR (non-foil or foil) price, on paper. Filtering server-side keeps it lean.
const QUERY = '(eur>=0.01 or eurfoil>=0.01) game:paper';
const SEARCH = `https://api.scryfall.com/cards/search?order=released&dir=desc&unique=prints&q=${encodeURIComponent(QUERY)}`;
const UA = { 'User-Agent': 'CartographTCG/1.0 (+https://canuzu.github.io/Test-Code)', Accept: 'application/json' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.status === 404) return { data: [], has_more: false }; // no matches
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt >= tries - 1) throw e;
      await sleep(1000 * 2 ** attempt + Math.floor(Math.random() * 400));
    }
  }
}

async function main() {
  let had = 0;
  try { had = (JSON.parse(await readFile(OUT, 'utf8')).cards || []).length; } catch { /* none */ }
  console.log(`[fetch-magic] existing snapshot: ${had} cards`);

  const now = new Date();
  const stamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  const out = [];
  const seen = new Set();
  let url = SEARCH;
  let pages = 0;
  try {
    while (url && out.length < HARD_CAP) {
      const page = await getJSON(url);
      pages++;
      for (const raw of page.data || []) {
        if (out.length >= HARD_CAP) break;
        const card = normalize(raw, stamp); // drops cards without a real EUR price / image
        if (!card || !card.image?.small) continue;
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        out.push(card);
      }
      url = page.has_more ? page.next_page : null;
      if (url) await sleep(110); // Scryfall asks ~50–100 ms between requests
    }
  } catch (e) {
    console.error(`[fetch-magic] search failed after ${pages} page(s) (${e.message}) — keeping existing snapshot.`);
    process.exit(0);
  }

  // --- German names overlay (Scryfall lang:de). Magic is officially printed in
  //     German; the English pass above gives full coverage, this pass swaps the
  //     display name to German where an exact printing exists. Matched by set
  //     code + collector number (the SAME card across languages), so a match is
  //     always the correct German name. Fail-safe: any error keeps English. ---
  try {
    const de = new Map();
    let durl = `https://api.scryfall.com/cards/search?order=released&dir=desc&unique=prints&q=${encodeURIComponent('game:paper lang:de')}`;
    let dpages = 0;
    while (durl && dpages < 600) {
      const page = await getJSON(durl);
      dpages++;
      for (const raw of page.data || []) {
        const nm = raw.printed_name;
        if (nm && raw.set && raw.collector_number != null) {
          de.set(`${String(raw.set).toLowerCase()}/${String(raw.collector_number).toLowerCase()}`, nm);
        }
      }
      durl = page.has_more ? page.next_page : null;
      if (durl) await sleep(110);
    }
    let overlaid = 0;
    for (const c of out) {
      const nm = de.get(`${String(c.setId).toLowerCase()}/${String(c.number).toLowerCase()}`);
      if (nm && nm !== c.name) { c.nameEn = c.nameEn || c.name; c.name = nm; overlaid++; }
    }
    console.log(`[fetch-magic] German overlay: ${de.size} DE names · ${overlaid}/${out.length} cards localised · ${dpages} pages`);
  } catch (e) {
    console.error(`[fetch-magic] German overlay skipped (${e.message}) — English names kept.`);
  }

  if (out.length === 0) {
    console.error('[fetch-magic] nothing priced — keeping existing snapshot.');
    process.exit(0);
  }

  const completedSets = [...new Set(out.map((c) => c.setId))];
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({
    generatedAt: now.toISOString(),
    source: 'Magic: The Gathering · Cardmarket EUR via Scryfall',
    count: out.length,
    completedSets,
    cards: out,
  }));
  console.log(`[fetch-magic] ✓ wrote ${out.length} cards · ${completedSets.length} sets · ${pages} pages (cap ${HARD_CAP})`);
}

main().catch((e) => { console.error('[fetch-magic] fatal:', e); process.exit(0); });
