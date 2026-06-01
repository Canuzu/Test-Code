// Build-time Magic: The Gathering catalogue builder. Writes
// public/data/magic.json, loaded same-origin by the app.
//
// Source: Scryfall bulk data (https://scryfall.com/docs/api/bulk-data). We use
// the "default_cards" export (every printing) and keep the cards that carry a
// real Cardmarket EUR price, newest set first. This runs server-side in CI
// (Scryfall blocks browser CORS for bulk files, and asks API users to send a
// User-Agent + a small delay). Genuine EU prices — no estimate.
//
// Size control: the full default_cards file is large; we cap at HARD_CAP cards
// (newest first) so the committed snapshot stays reasonable. Raise/lower via
// MAGIC_HARD_CAP. On any failure it keeps the existing snapshot and exits 0.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/data/providers/magic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/magic.json');
const BULK = 'https://api.scryfall.com/bulk-data';
const HARD_CAP = Number(process.env.MAGIC_HARD_CAP || 16000);
const UA = { 'User-Agent': 'CartographTCG/1.0 (+https://canuzu.github.io/Test-Code)', Accept: 'application/json' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
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

  let downloadUri;
  try {
    const bulk = await getJSON(BULK);
    const entry = (bulk.data || []).find((d) => d.type === 'default_cards');
    downloadUri = entry?.download_uri;
    if (!downloadUri) throw new Error('default_cards not listed');
  } catch (e) {
    console.error(`[fetch-magic] bulk index failed (${e.message}) — keeping existing snapshot.`);
    process.exit(0);
  }

  let all;
  try {
    await sleep(120); // be polite to Scryfall between calls
    all = await getJSON(downloadUri);
  } catch (e) {
    console.error(`[fetch-magic] bulk download failed (${e.message}) — keeping existing snapshot.`);
    process.exit(0);
  }
  if (!Array.isArray(all) || all.length === 0) {
    console.error('[fetch-magic] empty bulk — keeping existing snapshot.');
    process.exit(0);
  }
  console.log(`[fetch-magic] downloaded ${all.length} printings`);

  const now = new Date();
  const stamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  // Newest set first so the cap keeps the most relevant cards; skip non-card
  // layouts (tokens, art series, etc.) and anything without a real EUR price.
  const SKIP = new Set(['token', 'double_faced_token', 'emblem', 'art_series', 'scheme', 'planar', 'vanguard']);
  all.sort((a, b) => String(b.released_at || '').localeCompare(String(a.released_at || '')));

  const out = [];
  const seen = new Set();
  for (const raw of all) {
    if (out.length >= HARD_CAP) break;
    if (SKIP.has(raw.layout)) continue;
    const card = normalize(raw, stamp);
    if (!card || !card.image) continue;
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    out.push(card);
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
  console.log(`[fetch-magic] ✓ wrote ${out.length} cards · ${completedSets.length} sets (cap ${HARD_CAP})`);
}

main().catch((e) => { console.error('[fetch-magic] fatal:', e); process.exit(0); });
