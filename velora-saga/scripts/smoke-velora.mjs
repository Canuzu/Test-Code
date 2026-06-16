// Velora Saga smoke-test: the headless equivalent of opening index.html and
// clicking through the game. Catches the things that would white-screen the
// canvas before a deploy:
//   1. the inline game <script> must compile (no syntax errors)
//   2. every creature in SPECIES must map to a real, non-empty PNG sprite
//   3. every asset path referenced in the code must exist on disk as a PNG
//
// Run: node scripts/smoke-velora.mjs   (exit 1 on any failure)

import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const R = (p) => resolve(ROOT, p);

let fail = 0;
const bad = (m) => { console.log('✗ ' + m); fail++; };
const ok  = (m) => console.log('✓ ' + m);

const html = await readFile(R('index.html'), 'utf8');

// --- 1. inline script compiles ------------------------------------------------
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const game = scripts.sort((a, b) => b.length - a.length)[0] || '';
try {
  new vm.Script(game, { filename: 'index.html#inline' }); // compile only, no run
  ok(`game script compiles (${game.length} chars)`);
} catch (e) {
  bad(`game script syntax error: ${e.message}`);
}

// --- 2. PNG validity helper ---------------------------------------------------
async function pngOk(rel) {
  try {
    const s = await stat(R(rel));
    if (!s.isFile() || s.size === 0) return `empty: ${rel}`;
    const fd = await readFile(R(rel));
    // PNG magic number
    if (!(fd[0] === 0x89 && fd[1] === 0x50 && fd[2] === 0x4e && fd[3] === 0x47))
      return `not a PNG: ${rel}`;
    return null;
  } catch {
    return `missing: ${rel}`;
  }
}

// --- 3. every SPECIES key has a sprite ---------------------------------------
const speciesBlock = (game.match(/const SPECIES\s*=\s*\{([\s\S]*?)\n\};/) || [])[1] || '';
const speciesKeys = [...speciesBlock.matchAll(/^\s*'?([a-zäöü]+)'?\s*:\s*\{id:/gim)].map((m) => m[1]);
const fileBlock = (game.match(/const CREATURE_FILE\s*=\s*\{([\s\S]*?)\};/) || [])[1] || '';
const fileMap = Object.fromEntries(
  [...fileBlock.matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)].map((m) => [m[1], m[2]])
);

if (speciesKeys.length < 18) bad(`expected at least 18 species, found ${speciesKeys.length}`);
else ok(`${speciesKeys.length} species defined`);

let spriteMiss = 0;
for (const k of speciesKeys) {
  const fileBase = fileMap[k];
  if (!fileBase) { bad(`SPECIES '${k}' has no CREATURE_FILE entry`); spriteMiss++; continue; }
  const err = await pngOk(`assets/creatures/${fileBase}.png`);
  if (err) { bad(err); spriteMiss++; }
}
if (!spriteMiss && speciesKeys.length) ok(`all ${speciesKeys.length} creature sprites present & valid`);

// --- 4. every asset path referenced in code exists ----------------------------
const refs = [...game.matchAll(/'(assets\/[^']+\.png)'/g)].map((m) => m[1]);
// expand the creatures/<file>.png template into concrete files
const concrete = new Set();
for (const r of refs) {
  if (r.includes('+')) continue; // skip dynamic concatenations
  concrete.add(r);
}
for (const base of Object.values(fileMap)) concrete.add(`assets/creatures/${base}.png`);

let refMiss = 0;
for (const r of [...concrete].sort()) {
  const err = await pngOk(r);
  if (err) { bad(err); refMiss++; }
}
if (!refMiss) ok(`all ${concrete.size} referenced asset files present & valid`);

console.log(fail ? `\n✗ ${fail} check(s) failed` : '\n✓ Velora Saga smoke-test passed');
process.exit(fail ? 1 : 0);
