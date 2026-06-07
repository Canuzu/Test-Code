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
const CHAR_DIR   = path.join(__dirname, '../src/assets/characters');
const BG_DIR     = path.join(__dirname, '../src/assets/battle-bg');
for (const d of [SPRITE_DIR, TILE_DIR, CHAR_DIR, BG_DIR])
  fs.mkdirSync(d, { recursive: true });

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
        file.close(() => { fs.renameSync(tmp, dest); resolve('downloaded'); });
      });
    });
    req.on('error', (e) => { file.destroy(); try { fs.unlinkSync(tmp); } catch {} reject(e); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Derive local filename: strip query string, keep extension from URL
function localExt(url) {
  const base = url.split('?')[0];
  return base.endsWith('.jpeg') ? '.jpeg' : '.png';
}

let ok = 0, skip = 0, fail = 0;

async function dl(url, dest) {
  try {
    const r = await download(url, dest);
    if (r === 'cached') { skip++; } else { ok++; console.log(`  ↓ ${path.basename(dest)}`); }
  } catch (e) { fail++; console.warn(`  ✗ ${path.basename(dest)}: ${e.message}`); }
}

console.log('Downloading creature sprites…');
for (const [id, url] of Object.entries(manifest.sprites || {}))
  await dl(url, path.join(SPRITE_DIR, `creature-${id}.png`));

console.log('Downloading tiles…');
for (const [name, url] of Object.entries(manifest.tiles || {}))
  await dl(url, path.join(TILE_DIR, `${name}.png`));

if (manifest.player) {
  console.log('Downloading player sprite…');
  await dl(manifest.player, path.join(SPRITE_DIR, 'player.png'));
}

console.log('Downloading character sprites…');
for (const [name, url] of Object.entries(manifest.characters || {}))
  await dl(url, path.join(CHAR_DIR, `${name}${localExt(url)}`));

console.log('Downloading battle backgrounds…');
for (const [name, url] of Object.entries(manifest['battle-bg'] || {}))
  await dl(url, path.join(BG_DIR, `${name}.png`));

console.log(`Done: ${ok} downloaded, ${skip} cached, ${fail} failed.`);
if (fail > 0 && ok + skip === 0) process.exit(1);
