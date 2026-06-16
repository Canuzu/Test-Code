// Build-time Yu-Gi-Oh! catalogue builder. Writes public/data/yugioh.json, loaded
// same-origin by the app — exactly like the Pokémon / One Piece snapshots.
//
// Source: the open YGOJSON dataset (https://github.com/iconmaster5326/YGOJSON),
// `v1/aggregate` branch, which mirrors every TCG card from yugipedia/ygoprodeck
// with official images, localized (incl. German) names, card types and set
// membership. We fetch the two aggregate files over raw.githubusercontent.com
// (no CORS / no allowlist issue), flatten each card to its earliest TCG set +
// representative rarity, normalise to our Card shape, and attach a transparent
// price estimate (see provider). Prices can later be upgraded to real Cardmarket
// values via scripts/fetch-cardmarket.mjs (game 'yugioh').
//
// On any failure it keeps the existing snapshot (never clobbers it) and exits 0.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize, rarityLabel } from '../src/data/providers/yugioh.js';
import { slimCards } from '../src/lib/cardCodec.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/yugioh.json');
const REPO = process.env.YGOJSON_REPO || 'iconmaster5326/YGOJSON';
const REF = process.env.YGOJSON_REF || 'v1/aggregate';
const RAW = `https://raw.githubusercontent.com/${REPO}/${REF}`;
// Allow building from local clones in CI/dev (fast path, no re-download).
const LOCAL = process.env.YGOJSON_LOCAL || '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt >= tries - 1) throw e;
      await sleep(800 * 2 ** attempt + Math.floor(Math.random() * 300));
    }
  }
}

async function loadFile(name) {
  if (LOCAL) return JSON.parse(await readFile(resolve(LOCAL, name), 'utf8'));
  return getJSON(`${RAW}/${name}`);
}

const asArray = (d) => (Array.isArray(d) ? d : Object.values(d || {}));

// Rank rarities so a card reprinted across sets shows its highest-tier printing.
const RARITY_RANK = {
  common: 0, short: 1, normal: 0, rare: 2, super: 3, ultra: 4, gold: 4, platinum: 5,
  parallel: 3, duelterminal: 2, mosaic: 3, secret: 6, prismaticsecret: 7,
  ultimate: 7, '25thsecret': 7, ghost: 8, collector: 8, starlight: 9,
};
const rank = (r) => RARITY_RANK[(r || '').toLowerCase()] ?? 1;

// Fallback set code from a set name (e.g. "Legend of Blue Eyes" → "LOBE").
const initials = (name) => {
  if (!name) return '';
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 5);
  return code.length >= 2 ? code : '';
};

async function main() {
  let had = 0;
  try { had = asArray(JSON.parse(await readFile(OUT, 'utf8')).cards).length; } catch { /* none */ }
  console.log(`[fetch-yugioh] source ${LOCAL || RAW} · existing: ${had} cards`);

  let cardsRaw; let setsRaw;
  try {
    [cardsRaw, setsRaw] = await Promise.all([loadFile('cards.json'), loadFile('sets.json')]);
  } catch (e) {
    console.error(`[fetch-yugioh] source load failed (${e.message}) — keeping existing snapshot.`);
    process.exit(0);
  }
  const cards = asArray(cardsRaw);
  const sets = asArray(setsRaw);

  // Index sets: id → { name, date, code, cardRarity: Map(cardUuid → rarity) }.
  // We read the English locale (TCG) and remember the earliest release date.
  const setById = new Map();
  for (const s of sets) {
    const loc = s.locales?.en || Object.values(s.locales || {})[0];
    if (!loc) continue;
    const name = s.name?.en || Object.values(s.name || {})[0] || '';
    const date = loc.date || '';
    const rar = new Map();
    const codeVotes = new Map();
    for (const content of s.contents || []) {
      for (const c of content.cards || []) {
        if (c.card && c.rarity) {
          const prev = rar.get(c.card);
          if (prev == null || rank(c.rarity) > rank(prev)) rar.set(c.card, c.rarity);
        }
        // Set code = the LETTER prefix of a card suffix, e.g. "LOB" from
        // "LOB-EN001". Tally across all cards and take the most common, so a
        // stray off-set suffix can't mislabel (or fragment) the whole set.
        if (c.suffix) {
          const m = String(c.suffix).match(/^([A-Za-z]{2,6})-?[A-Za-z]{0,2}\d/);
          if (m) { const k = m[1].toUpperCase(); codeVotes.set(k, (codeVotes.get(k) || 0) + 1); }
        }
      }
    }
    const code = [...codeVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    setById.set(s.id, { name, date, code, rar });
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  const out = [];
  for (const c of cards) {
    const name = c.text?.de?.name || c.text?.en?.name;
    const nameEn = c.text?.en?.name || name;
    if (!name) continue;
    const image = c.images?.[0]?.card || c.images?.[0]?.art || null;
    if (!image) continue; // skip imageless (keeps the catalogue all-art like the others)

    // Earliest TCG set this card belongs to → set name/date/code + its rarity.
    let best = null;
    for (const sid of c.sets || []) {
      const s = setById.get(sid);
      if (!s || !s.date) continue;
      if (!best || s.date < best.date) best = s;
    }
    const rarSlug = best?.rar?.get(c.id) || 'common';
    const subType = c.subcategory ? c.subcategory.replace(/\b\w/g, (x) => x.toUpperCase()) : '';

    out.push(normalize({
      id: c.id,
      name,
      nameEn,
      image,
      cardType: c.cardType,
      subType,
      rarity: rarityLabel(rarSlug),
      setName: best?.name || 'Yu-Gi-Oh!',
      setId: best?.code || initials(best?.name) || 'YGO',
      releaseDate: best?.date ? best.date.replace(/-/g, '/') : '',
    }, stamp));
  }

  if (out.length === 0) {
    console.error('[fetch-yugioh] no cards parsed — keeping existing snapshot.');
    process.exit(0);
  }

  // Newest set first, then by name.
  out.sort((a, b) =>
    (b.setReleaseDate || '').localeCompare(a.setReleaseDate || '') ||
    String(a.name).localeCompare(String(b.name)));

  const completedSets = [...new Set(out.map((c) => c.setId))];
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({
    generatedAt: now.toISOString(),
    source: 'Yu-Gi-Oh! (official art) via YGOJSON · prices estimated',
    pricesEstimated: true,
    count: out.length,
    completedSets,
    cards: slimCards(out, 'yugioh'),
  }));
  console.log(`[fetch-yugioh] ✓ wrote ${out.length} cards · ${completedSets.length} sets`);
}

main().catch((e) => { console.error('[fetch-yugioh] fatal:', e); process.exit(0); });
