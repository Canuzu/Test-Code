// Downloads AI-generated sprites and tiles from CDN into src/assets/.
// Runs in GitHub Actions before `npm run build`. Safe to re-run (skips cached).
import https from 'node:https';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'sprite-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.log('sprite-manifest.json not found – skipping download.');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const SPRITE_DIR = path.join(__dirname, '../src/assets/sprites');
const TILE_DIR   = path.join(__dirname, '../src/assets/tiles');
fs.mkdirSync(SPRITE_DIR, { recursive: true });
fs.mkdirSync(TILE_DIR,   { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      resolve('cached'); return;
    }
    const tmp = dest + '.tmp';
    const file = fs.createWriteStream(tmp);
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        file.destroy();
        try { fs.unlinkSync(tmp); } catch {}
        reject(new Error(`HTTP ${res.statusCode}`)); return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.renameSync(tmp, dest);
          resolve('downloaded');
        });
      });
    });
    req.on('error', (e) => { file.destroy(); try { fs.unlinkSync(tmp); } catch {} reject(e); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

let ok = 0, skip = 0, fail = 0;

console.log('Downloading creature sprites…');
for (const [id, url] of Object.entries(manifest.sprites || {})) {
  const dest = path.join(SPRITE_DIR, `creature-${id}.png`);
  try {
    const r = await download(url, dest);
    if (r === 'cached') { skip++; } else { ok++; console.log(`  ↓ creature-${id}.png`); }
  } catch (e) { fail++; console.warn(`  ✗ creature-${id}: ${e.message}`); }
}

console.log('Downloading tiles…');
for (const [name, url] of Object.entries(manifest.tiles || {})) {
  const dest = path.join(TILE_DIR, `${name}.png`);
  try {
    const r = await download(url, dest);
    if (r === 'cached') { skip++; } else { ok++; console.log(`  ↓ ${name}.png`); }
  } catch (e) { fail++; console.warn(`  ✗ ${name}: ${e.message}`); }
}

if (manifest.player) {
  console.log('Downloading player sprite…');
  const dest = path.join(SPRITE_DIR, 'player.png');
  try {
    const r = await download(manifest.player, dest);
    if (r === 'cached') { skip++; } else { ok++; console.log(`  ↓ player.png`); }
  } catch (e) { fail++; console.warn(`  ✗ player: ${e.message}`); }
}

console.log(`Done: ${ok} downloaded, ${skip} cached, ${fail} failed.`);
if (fail > 0 && ok + skip === 0) process.exit(1);
