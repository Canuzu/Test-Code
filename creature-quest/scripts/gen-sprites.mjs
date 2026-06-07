// Hand-crafted pixel sprite generator for Beastlings Quest.
// Each sprite: 48×48 logical grid, SCALE=4 → 192×192 PNG.
// Output → creature-quest/public/sprites/creature-{id}.png
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 48, H = 48, SCALE = 4;
const OUT = path.join(__dirname, '../src/assets/sprites');
fs.mkdirSync(OUT, { recursive: true });

// ── PNG encoder ──────────────────────────────────────────────────────
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    let c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function toPng(px) {
  const OW = W * SCALE, OH = H * SCALE;
  const raw = Buffer.alloc(OH * (1 + OW * 4));
  for (let oy = 0; oy < OH; oy++) {
    raw[oy * (1 + OW * 4)] = 0;
    for (let ox = 0; ox < OW; ox++) {
      const rgba = px[Math.floor(ox / SCALE)][Math.floor(oy / SCALE)] || [0, 0, 0, 0];
      const off = oy * (1 + OW * 4) + 1 + ox * 4;
      raw[off] = rgba[0]; raw[off + 1] = rgba[1]; raw[off + 2] = rgba[2]; raw[off + 3] = rgba[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(OW); ihdr.writeUInt32BE(OH, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Drawing helpers ──────────────────────────────────────────────────
// px[x][y]: x=column(left→right), y=row(top→down)
const mkC = () => Array.from({ length: W }, () => Array(H).fill(null));

function sp(px, x, y, c) {
  const xi = Math.round(x), yi = Math.round(y);
  if (xi >= 0 && xi < W && yi >= 0 && yi < H) px[xi][yi] = c;
}
function el(px, cx, cy, rx, ry, c) {
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) sp(px, x, y, c);
}
function tr(px, ax, ay, bx, by, cx2, cy2, c) {
  const x0 = Math.floor(Math.min(ax, bx, cx2)), x1 = Math.ceil(Math.max(ax, bx, cx2));
  const y0 = Math.floor(Math.min(ay, by, cy2)), y1 = Math.ceil(Math.max(ay, by, cy2));
  const ar = (x, y, p, q, r, s) => (r - p) * (s - q) - (x - p) * (y - q); // unused; use cross product
  function cross(x, y, p1x, p1y, p2x, p2y) { return (p2x - p1x) * (y - p1y) - (p2y - p1y) * (x - p1x); }
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++) {
      const d1 = cross(x, y, ax, ay, bx, by);
      const d2 = cross(x, y, bx, by, cx2, cy2);
      const d3 = cross(x, y, cx2, cy2, ax, ay);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) sp(px, x, y, c);
    }
}
function ol(px, oc, skipFlame = false) {
  const sn = px.map(col => col.slice());
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      if (sn[x][y] !== null) continue;
      let near = false;
      outer: for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          const v = sn[nx][ny];
          if (v !== null && !(skipFlame && (v[0] > 220 && v[1] > 150 && v[2] < 80))) {
            near = true; break outer;
          }
        }
      if (near) px[x][y] = oc;
    }
}

function save(id, px) {
  const dest = path.join(OUT, `creature-${id}.png`);
  // Never clobber a real (AI-downloaded) sprite. In CI download-sprites.mjs
  // runs first; here we only fill in the procedural fallback where missing.
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    process.stdout.write(`  • creature-${id}.png (kept downloaded)\n`);
    return;
  }
  fs.writeFileSync(dest, toPng(px));
  process.stdout.write(`  ✓ creature-${id}.png\n`);
}

// ════════════════════════════════════════════════════════════════════
// STARTER LINE 1: FEUER (Fire)
// ════════════════════════════════════════════════════════════════════

function glutwelp() {
  // Fire fox puppy – sitting pose, curled tail with flame tip.
  const OT = [38, 18, 6, 255];    // outline
  const f  = [228, 108, 38, 255]; // fur orange
  const F  = [255, 168, 82, 255]; // fur highlight
  const d  = [176, 68, 18, 255];  // fur shadow
  const c  = [255, 232, 196, 255];// cream
  const C  = [222, 190, 148, 255];// cream shadow
  const e  = [30, 12, 6, 255];    // eye dark
  const w  = [255, 255, 255, 255];// white glint
  const n  = [255, 200, 56, 255]; // snout amber
  const N  = [255, 240, 158, 255];// snout bright
  const r  = [255, 78, 28, 255];  // flame red
  const y  = [255, 210, 56, 255]; // flame yellow
  const p  = [246, 148, 100, 255];// ear inner

  const px = mkC();

  // tail (drawn behind body – upper right)
  el(px, 36, 34, 5, 6.5, f);
  el(px, 39, 25, 4.5, 7, f);
  el(px, 41, 16, 3.5, 5.5, f);
  el(px, 42, 9,  3, 4.5, r);
  el(px, 42, 5,  2, 3.5, y);
  el(px, 41, 10, 1.8, 2.8, N);  // inner glow
  el(px, 39, 23, 2, 5, F);      // tail highlight stripe

  // body
  el(px, 21, 33, 10, 7.5, f);
  el(px, 20, 37, 6.5, 4.5, c);  // chest cream

  // hind legs
  el(px, 12, 41, 6, 3.5, f);
  el(px, 29, 42, 5.5, 3, f);
  el(px, 11, 44.5, 5.5, 2, c);  // left paw
  el(px, 29, 45,   5, 2, c);    // right paw
  // toe lines
  sp(px, 7,  46, d); sp(px, 10, 46, d); sp(px, 13, 46, d);
  sp(px, 25, 46, d); sp(px, 28, 46, d); sp(px, 31, 46, d);

  // head
  el(px, 20, 21, 8, 7.5, f);

  // ears
  tr(px, 12, 7,  10, 18, 17, 17, f);   // left outer
  tr(px, 12, 9,  11, 17, 16, 16, p);   // left inner
  tr(px, 29, 7,  24, 17, 30, 17, f);   // right outer
  tr(px, 29, 9,  25, 16, 29, 16, p);   // right inner

  // snout glow
  el(px, 17, 25, 5.5, 3.5, n);
  el(px, 16, 25, 3.2, 2.3, N);
  sp(px, 14, 23, e); sp(px, 18, 23, e); // nostrils

  // ember sparks near snout
  sp(px, 8,  23, N); sp(px, 7,  21, n); sp(px, 9,  20, N);
  sp(px, 6,  25, n); sp(px, 10, 18, N);

  // eyes
  el(px, 14, 18, 2.8, 3, e);
  el(px, 24, 18, 2.8, 3, e);
  sp(px, 13, 17, w); sp(px, 23, 17, w);
  sp(px, 14, 17, n); sp(px, 24, 17, n); // amber iris ring top

  // shading pass: lighten top of head, darken lower body
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === f) {
        if (y < 16 && x > 12 && x < 30) px[x][y] = F; // head highlight
        else if (y > 38)                 px[x][y] = d; // lower shadow
      }
      if (v === c && y > 41) px[x][y] = C;
    }

  ol(px, OT, true);
  return px;
}

function flammkater() {
  // Fire cat – crouching ready-to-pounce, longer body than Glutwelp.
  const OT = [38, 18, 6, 255];
  const f  = [210, 90, 28, 255]; // deeper orange
  const F  = [245, 148, 68, 255];
  const d  = [158, 55, 8, 255];
  const c  = [255, 228, 188, 255];
  const C  = [215, 182, 138, 255];
  const e  = [28, 10, 4, 255];
  const w  = [255, 255, 255, 255];
  const n  = [248, 195, 48, 255];
  const r  = [255, 68, 20, 255];
  const y  = [255, 205, 48, 255];
  const p  = [235, 130, 85, 255];

  const px = mkC();

  // bushy tail (large, curling)
  tr(px, 38, 46, 44, 28, 46, 10, f); // tail triangle base
  el(px, 43, 15, 3.5, 6, r);
  el(px, 43, 10, 2.5, 4, y);
  el(px, 41, 28, 3, 9, f);
  el(px, 40, 20, 2, 6, F);  // stripe

  // body (longer, crouching)
  el(px, 22, 36, 13, 7, f);
  el(px, 21, 40, 8, 4, c); // belly

  // front legs (reaching forward)
  el(px, 10, 42, 4, 5, f);
  el(px, 9,  46, 4.5, 2, c); // front paw
  el(px, 17, 44, 4, 4, f);
  el(px, 17, 47, 4, 1.5, c);

  // back legs
  el(px, 32, 41, 4, 5, f);
  el(px, 31, 46, 4.5, 2, c);

  // head
  el(px, 17, 24, 8, 7.5, f);

  // ears (pointed, adult)
  tr(px, 11, 8,  9,  19, 16, 18, f);
  tr(px, 11, 10, 10, 18, 15, 17, p);
  tr(px, 23, 8,  18, 18, 25, 19, f);
  tr(px, 23, 10, 19, 17, 24, 18, p);

  // snout / muzzle
  el(px, 14, 27, 5, 3.5, n);
  el(px, 13, 27, 3, 2, [255, 235, 145, 255]);
  sp(px, 12, 25, e); sp(px, 15, 25, e);

  // eyes (fierce, slanted)
  el(px, 13, 19, 3, 2.8, e);
  el(px, 21, 19, 3, 2.8, e);
  sp(px, 12, 18, w); sp(px, 20, 18, w);
  // subtle flame glint in eye
  sp(px, 14, 20, r); sp(px, 22, 20, r);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === f) {
        if (y < 18 && x > 10 && x < 28) px[x][y] = F;
        if (y > 40) px[x][y] = d;
      }
    }

  ol(px, OT, true);
  return px;
}

function infernox() {
  // Fire panther – upright, flame mane, blazing presence.
  const OT = [30, 10, 2, 255];
  const f  = [195, 68, 15, 255]; // deep red-orange
  const F  = [230, 120, 48, 255];
  const d  = [140, 42, 5, 255];
  const c  = [245, 215, 175, 255];
  const e  = [25, 8, 2, 255];
  const w  = [255, 255, 255, 255];
  const r  = [255, 58, 15, 255];
  const y  = [255, 195, 38, 255];
  const R  = [255, 130, 20, 255]; // mane mid

  const px = mkC();

  // mane (flame collar – drawn first, behind head/body)
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    const mx = 22 + Math.cos(ang) * 10, my = 26 + Math.sin(ang) * 8;
    el(px, mx, my, 2.8, 4, r);
  }
  el(px, 22, 26, 8, 7, R); // inner mane fill

  // body (powerful, upright)
  el(px, 22, 36, 10, 8, f);
  el(px, 21, 31, 9, 5, f); // chest/torso

  // tail
  el(px, 36, 34, 4.5, 6, f);
  el(px, 40, 24, 3.5, 7, f);
  el(px, 42, 16, 3, 5.5, r);
  el(px, 42, 10, 2, 4, y);

  // legs
  el(px, 14, 41, 4.5, 6, f);
  el(px, 29, 41, 4.5, 6, f);
  el(px, 13, 46.5, 5, 2, f); // front paws
  el(px, 29, 47,   5, 2, f);
  // claws
  sp(px, 10, 47, d); sp(px, 12, 47, d); sp(px, 14, 47, d);
  sp(px, 26, 47, d); sp(px, 28, 47, d); sp(px, 30, 47, d);

  // head
  el(px, 22, 20, 8, 7.5, f);

  // ears (sharp, swept back)
  tr(px, 16, 7,  13, 18, 19, 18, f);
  tr(px, 29, 7,  25, 18, 31, 18, f);

  // face markings
  el(px, 20, 16, 1.5, 1, y); // brow mark left
  el(px, 27, 16, 1.5, 1, y); // brow mark right

  // eyes – blazing amber
  el(px, 17, 19, 3.2, 3, e);
  el(px, 27, 19, 3.2, 3, e);
  el(px, 17, 19, 1.8, 1.8, y); // fire iris
  el(px, 27, 19, 1.8, 1.8, y);
  sp(px, 16, 18, w); sp(px, 26, 18, w);

  // snout
  el(px, 22, 24, 4.5, 3, [210, 145, 65, 255]);
  sp(px, 20, 23, e); sp(px, 23, 23, e);

  // body shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === f && y < 18) px[x][y] = F;
      if (v === f && y > 42) px[x][y] = d;
    }

  ol(px, OT, true);
  return px;
}

// ════════════════════════════════════════════════════════════════════
// STARTER LINE 2: WASSER (Water)
// ════════════════════════════════════════════════════════════════════

function troepfling() {
  // Water tadpole – big round body, ENORMOUS expressive eyes, short fin tail.
  const OT = [8, 28, 50, 255];
  const b  = [80, 165, 215, 255]; // body blue
  const B  = [148, 212, 242, 255];// body highlight
  const d  = [42, 108, 165, 255]; // body shadow
  const w  = [218, 245, 255, 255];// belly white-blue
  const W2 = [175, 218, 242, 255];// belly shadow
  const e  = [15, 32, 55, 255];   // eye dark outer ring
  const ib = [55, 128, 198, 255]; // eye blue iris
  const p  = [10, 18, 35, 255];   // pupil
  const g  = [255, 255, 255, 255];// glint
  const fi = [48, 178, 172, 255]; // fin teal
  const t  = [35, 130, 178, 255]; // tail blue

  const px = mkC();

  // caudal fin / tail (right side)
  tr(px, 32, 24, 46, 14, 44, 34, fi);
  tr(px, 34, 26, 44, 18, 43, 32, t);

  // main body (big round)
  el(px, 22, 27, 13, 12, b);

  // dorsal fin (top)
  tr(px, 18, 15, 24, 8, 29, 15, fi);
  tr(px, 19, 15, 24, 10, 28, 15, B); // inner bright

  // belly
  el(px, 20, 31, 8.5, 7.5, w);

  // side fins
  el(px, 9,  28, 3.5, 2, fi);
  el(px, 35, 26, 3, 2, fi);

  // EYES (defining feature – large and shiny)
  // Left eye
  el(px, 13, 22, 5.5, 6, e);    // outer dark ring
  el(px, 13, 22, 4, 4.8, ib);   // blue iris
  el(px, 13, 23, 2.2, 2.8, p);  // dark pupil
  sp(px, 11, 20, g);             // large highlight
  sp(px, 12, 20, g);
  sp(px, 11, 21, g);
  // Right eye
  el(px, 27, 22, 5.5, 6, e);
  el(px, 27, 22, 4, 4.8, ib);
  el(px, 27, 23, 2.2, 2.8, p);
  sp(px, 25, 20, g);
  sp(px, 26, 20, g);
  sp(px, 25, 21, g);

  // tiny mouth (happy curve)
  sp(px, 19, 30, p); sp(px, 20, 31, p); sp(px, 21, 31, p); sp(px, 22, 30, p);

  // water bubble above
  el(px, 11, 14, 2, 2, [200, 235, 255, 180]);
  sp(px, 10, 13, g);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === b && y < 20) px[x][y] = B;
      if (v === b && y > 34) px[x][y] = d;
      if (v === w && y > 36) px[x][y] = W2;
    }

  ol(px, OT);
  return px;
}

function wogefin() {
  // Fast water fish – streamlined silver-blue, leaping pose.
  const OT = [8, 25, 48, 255];
  const b  = [95, 178, 225, 255];
  const B  = [165, 218, 248, 255];
  const d  = [48, 118, 175, 255];
  const s  = [205, 235, 250, 255]; // silver belly
  const fi = [45, 165, 198, 255];
  const e  = [12, 28, 48, 255];
  const g  = [255, 255, 255, 255];
  const y  = [185, 238, 255, 255]; // speed glint

  const px = mkC();

  // tail fin (left)
  tr(px, 8, 28, 4, 18, 4, 38, fi);
  tr(px, 5, 23, 2, 14, 2, 32, B);

  // body (elongated, angled – leaping)
  el(px, 26, 28, 16, 7, b); // main body
  el(px, 26, 30, 12, 4.5, s); // belly stripe

  // dorsal fin (top)
  tr(px, 20, 21, 28, 15, 34, 21, fi);
  tr(px, 22, 21, 28, 17, 32, 21, B);

  // pectoral fin
  tr(px, 20, 28, 15, 24, 18, 34, fi);

  // head/snout
  el(px, 40, 28, 6, 5.5, b);
  el(px, 44, 29, 3, 3.5, s); // snout tip

  // eye
  el(px, 38, 26, 3, 3, e);
  el(px, 38, 26, 1.5, 1.8, [85, 160, 215, 255]);
  sp(px, 37, 25, g);
  sp(px, 38, 25, g);

  // speed lines
  sp(px, 8,  24, y); sp(px, 6, 26, y); sp(px, 7, 28, y);
  sp(px, 10, 22, B); sp(px, 8, 20, B);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === b && y < 24) px[x][y] = B;
    }

  ol(px, OT);
  return px;
}

function tidehorn() {
  // Majestic sea beast with a forehead horn – rearing up powerfully.
  const OT = [5, 20, 42, 255];
  const b  = [38, 110, 178, 255]; // deep ocean blue
  const B  = [68, 155, 215, 255];
  const d  = [18, 65, 125, 255];
  const s  = [178, 225, 248, 255]; // light belly
  const fi = [25, 148, 188, 255];
  const h  = [215, 228, 245, 255]; // horn ivory
  const e  = [8, 18, 35, 255];
  const g  = [255, 255, 255, 255];

  const px = mkC();

  // tail fin (right, wide)
  tr(px, 36, 36, 45, 24, 46, 42, fi);
  tr(px, 38, 36, 45, 28, 45, 40, B);

  // body (large, upright)
  el(px, 22, 34, 12, 11, b);
  el(px, 20, 38, 7, 7, s);  // belly

  // flippers
  el(px, 9,  36, 5, 4, fi);  // left
  el(px, 34, 30, 4.5, 3.5, fi); // right

  // neck/head
  el(px, 20, 22, 9, 8, b);
  el(px, 18, 26, 5, 4.5, s); // chin

  // HORN (forehead, pointing up-right)
  tr(px, 22, 13, 18, 21, 26, 21, h);
  el(px, 22, 16, 1.5, 2, [235, 245, 255, 255]); // horn highlight

  // crest fins on head
  tr(px, 25, 14, 28, 20, 30, 14, fi);
  tr(px, 29, 12, 31, 18, 33, 14, fi);

  // eyes (wise, large)
  el(px, 15, 21, 3.8, 3.8, e);
  el(px, 15, 21, 2.2, 2.2, [58, 128, 198, 255]);
  el(px, 15, 21, 1, 1, e);
  sp(px, 14, 20, g); sp(px, 15, 20, g);

  // nostrils
  sp(px, 16, 27, e); sp(px, 19, 27, e);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === b && y < 20) px[x][y] = B;
      if (v === b && y > 40) px[x][y] = d;
    }

  ol(px, OT);
  return px;
}

// ════════════════════════════════════════════════════════════════════
// STARTER LINE 3: PFLANZE (Plant)
// ════════════════════════════════════════════════════════════════════

function knospling() {
  // Plant sprout – round green body, pink bud on head stem, leaf arms.
  const OT = [22, 48, 12, 255];
  const g  = [108, 188, 72, 255]; // body green
  const G  = [162, 228, 108, 255];// highlight
  const d  = [68, 128, 32, 255];  // shadow
  const w  = [245, 248, 228, 255];// belly white
  const W2 = [205, 215, 175, 255];// belly shadow
  const lv = [88, 168, 45, 255];  // leaf
  const LV = [128, 205, 72, 255]; // leaf highlight
  const ld = [55, 118, 22, 255];  // leaf shadow / vein
  const pk = [245, 118, 128, 255];// bud pink
  const PK = [255, 185, 192, 255];// bud light
  const st = [75, 138, 38, 255];  // stem
  const e  = [22, 45, 12, 255];   // eye
  const g2 = [255, 255, 255, 255];// glint

  const px = mkC();

  // stem (thin, from body top to bud)
  el(px, 24, 18, 1.5, 5, st);

  // bud (the defining feature)
  el(px, 24, 11, 5, 4.5, pk);    // outer bud
  el(px, 23, 10, 3, 2.8, PK);    // bright inner
  sp(px, 22, 9, g2);               // tip highlight
  // petal hints
  sp(px, 19, 12, pk); sp(px, 29, 12, pk);
  sp(px, 22, 8,  PK); sp(px, 26, 8,  PK);

  // leaf arms
  tr(px, 15, 30, 7,  22, 16, 22, lv);  // left leaf
  tr(px, 15, 30, 8,  24, 15, 22, LV);  // left highlight
  sp(px, 9,  23, ld); sp(px, 10, 25, ld); sp(px, 11, 27, ld); // left vein
  tr(px, 34, 30, 41, 22, 33, 22, lv);  // right leaf
  tr(px, 34, 30, 40, 24, 34, 22, LV);
  sp(px, 39, 23, ld); sp(px, 38, 25, ld); sp(px, 37, 27, ld);

  // body (round, cheerful)
  el(px, 24, 30, 10, 10, g);
  el(px, 23, 34, 6,  6, w);  // belly

  // tiny feet
  el(px, 18, 42, 4.5, 2.5, g);
  el(px, 30, 42, 4.5, 2.5, g);

  // eyes (big, hopeful)
  el(px, 19, 27, 3, 3.2, e);
  el(px, 29, 27, 3, 3.2, e);
  el(px, 19, 27, 1.5, 1.8, G);  // green iris
  el(px, 29, 27, 1.5, 1.8, G);
  sp(px, 18, 26, g2); sp(px, 28, 26, g2);

  // happy mouth
  sp(px, 22, 33, e); sp(px, 23, 34, e); sp(px, 24, 34, e); sp(px, 25, 33, e);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === g && y < 24) px[x][y] = G;
      if (v === g && y > 36) px[x][y] = d;
      if (v === w && y > 37) px[x][y] = W2;
    }

  ol(px, OT);
  return px;
}

function rankgar() {
  // Plant vine warrior – taller, darker, vine tendrils, leaf shield.
  const OT = [18, 40, 8, 255];
  const g  = [78, 155, 42, 255];
  const G  = [128, 198, 78, 255];
  const d  = [48, 105, 18, 255];
  const lv = [68, 145, 32, 255];
  const LV = [108, 188, 58, 255];
  const vn = [55, 118, 22, 255];  // vine dark
  const fl = [228, 95, 108, 255]; // flower accents
  const e  = [18, 38, 8, 255];
  const g2 = [255, 255, 255, 255];
  const w  = [235, 245, 215, 255];

  const px = mkC();

  // vine arms (raised and splayed)
  el(px, 8,  22, 2.5, 8, vn);  // left vine upper
  el(px, 6,  32, 2.5, 5, vn);  // left vine lower
  el(px, 40, 20, 2.5, 9, vn);  // right vine upper
  el(px, 42, 32, 2.5, 5, vn);  // right vine lower
  // vine tips with leaves
  tr(px, 4,  14, 1, 22, 10, 18, lv);
  tr(px, 44, 12, 39, 22, 46, 18, lv);
  tr(px, 2,  30, 0, 40, 8, 36, lv);
  tr(px, 46, 28, 48, 40, 40, 35, lv);

  // leaf shield (left arm feature)
  tr(px, 8, 25, 2, 15, 14, 19, LV);

  // body
  el(px, 24, 33, 10, 9, g);
  el(px, 23, 37, 6, 5.5, w);

  // legs
  el(px, 17, 42, 4.5, 5, g);
  el(px, 30, 42, 4.5, 5, g);
  el(px, 16, 46.5, 5.5, 2, g);
  el(px, 30, 46.5, 5.5, 2, g);

  // head
  el(px, 24, 21, 8.5, 8, g);

  // crown of leaves
  tr(px, 18, 12, 14, 21, 20, 21, lv);
  tr(px, 24, 10, 22, 21, 28, 21, LV);
  tr(px, 30, 12, 28, 21, 34, 21, lv);
  sp(px, 24, 9, [255, 165, 172, 255]); // crown flower

  // eyes (fierce)
  el(px, 18, 20, 3, 3, e);
  el(px, 29, 20, 3, 3, e);
  el(px, 18, 20, 1.5, 1.5, G);
  el(px, 29, 20, 1.5, 1.5, G);
  sp(px, 17, 19, g2); sp(px, 28, 19, g2);

  // flower accents on body
  sp(px, 21, 32, fl); sp(px, 27, 30, fl); sp(px, 24, 35, fl);

  // shading
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === g && y < 18) px[x][y] = G;
      if (v === g && y > 40) px[x][y] = d;
    }

  ol(px, OT);
  return px;
}

function florwucht() {
  // Plant fortress – massive, wide, multiple flowers, armored root legs.
  const OT = [15, 35, 5, 255];
  const g  = [62, 138, 32, 255];
  const G  = [108, 182, 68, 255];
  const d  = [38, 92, 12, 255];
  const lv = [55, 128, 25, 255];
  const LV = [95, 172, 55, 255];
  const rt = [145, 112, 62, 255]; // root brown
  const fl = [218, 78, 92, 255];  // flower red-pink
  const FL = [248, 148, 158, 255];// flower light
  const yw = [255, 215, 62, 255]; // flower center yellow
  const e  = [15, 32, 5, 255];
  const g2 = [255, 255, 255, 255];
  const w  = [228, 242, 205, 255];

  const px = mkC();

  // root-legs (thick, gnarled)
  el(px, 14, 43, 7, 5, rt);
  el(px, 32, 43, 7, 5, rt);
  el(px, 12, 47, 7, 2.5, [118, 88, 42, 255]);
  el(px, 33, 47, 7, 2.5, [118, 88, 42, 255]);

  // body (wide, fortress-like)
  el(px, 23, 34, 14, 11, g);
  el(px, 22, 38, 9, 7, w); // lighter front

  // large leaf mantle
  tr(px, 8,  26, 4,  38, 18, 32, lv);
  tr(px, 38, 26, 44, 38, 30, 32, lv);
  tr(px, 8,  26, 4,  36, 16, 29, LV);
  tr(px, 38, 26, 44, 36, 32, 29, LV);
  tr(px, 16, 22, 12, 32, 22, 28, LV); // front leaves
  tr(px, 30, 22, 36, 32, 26, 28, LV);

  // head
  el(px, 23, 20, 10, 9, g);

  // flower crown (multiple blooms)
  const blooms = [[16, 10], [23, 7], [30, 10], [20, 8], [27, 8]];
  for (const [bx, by] of blooms) {
    el(px, bx, by, 4, 3.5, fl);
    el(px, bx, by, 2, 2, FL);
    sp(px, bx, by, yw);
  }

  // eyes (ancient, wide)
  el(px, 17, 20, 3.5, 3.2, e);
  el(px, 29, 20, 3.5, 3.2, e);
  el(px, 17, 20, 2, 1.8, G);
  el(px, 29, 20, 2, 1.8, G);
  sp(px, 16, 19, g2); sp(px, 28, 19, g2);

  // bark texture lines on body
  sp(px, 20, 30, d); sp(px, 26, 31, d); sp(px, 22, 36, d); sp(px, 30, 33, d);

  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const v = px[x][y];
      if (v === g && y < 17) px[x][y] = G;
      if (v === g && y > 42) px[x][y] = d;
    }

  ol(px, OT);
  return px;
}

// ════════════════════════════════════════════════════════════════════
// WILD CREATURES
// ════════════════════════════════════════════════════════════════════

function funkmaus() {
  // Electric mouse – yellow with lightning markings, perky ears.
  const OT = [45, 38, 5, 255];
  const y  = [252, 218, 38, 255];
  const Y  = [255, 242, 128, 255];
  const d  = [195, 158, 10, 255];
  const r  = [228, 58, 45, 255];   // cheek pouch
  const e  = [22, 15, 5, 255];
  const w  = [255, 255, 255, 255];
  const lt = [255, 245, 88, 255];  // lightning mark

  const px = mkC();

  // tail (lightning bolt shape)
  sp(px, 39, 34, y); sp(px, 40, 33, y); sp(px, 41, 31, y);
  sp(px, 40, 30, y); sp(px, 42, 28, y); sp(px, 43, 26, y);
  sp(px, 42, 25, y); sp(px, 44, 23, y);
  // thicken tail
  for (let tx = 38; tx <= 44; tx++)
    for (let ty = 22; ty <= 35; ty++)
      if (Math.abs(tx + ty - 72) < 2 || Math.abs(tx - ty + 14) < 2) sp(px, tx, ty, y);

  // body
  el(px, 22, 32, 10, 9, y);
  el(px, 21, 36, 6.5, 5, Y); // belly

  // cheek pouches (red)
  el(px, 13, 27, 4, 3, r);
  el(px, 30, 27, 4, 3, r);

  // legs
  el(px, 15, 40, 4.5, 3.5, y);
  el(px, 28, 40, 4.5, 3.5, y);
  el(px, 14, 43.5, 5, 2, d); // paws
  el(px, 28, 43.5, 5, 2, d);

  // head
  el(px, 22, 21, 8, 7.5, y);

  // ears (large, round-tipped)
  el(px, 13, 11, 4.5, 6, y);   // left ear
  el(px, 13, 11, 2.5, 4, r);   // inner red
  el(px, 30, 11, 4.5, 6, y);   // right ear
  el(px, 30, 11, 2.5, 4, r);

  // lightning bolt marking on forehead
  sp(px, 20, 16, lt); sp(px, 22, 15, lt); sp(px, 21, 17, lt); sp(px, 23, 18, lt);

  // eyes
  el(px, 17, 20, 2.5, 2.8, e);
  el(px, 26, 20, 2.5, 2.8, e);
  sp(px, 16, 19, w); sp(px, 25, 19, w);

  // nose
  sp(px, 21, 24, e); sp(px, 23, 24, e);

  for (let x = 0; x < W; x++)
    for (let y2 = 0; y2 < H; y2++) {
      const v = px[x][y2];
      if (v === y && y2 < 16) px[x][y2] = Y;
      if (v === y && y2 > 38) px[x][y2] = d;
    }

  ol(px, OT);
  return px;
}

function flatterling() {
  // Small air bird – light blue-white, round body, tiny wings spread.
  const OT = [22, 42, 68, 255];
  const b  = [145, 205, 235, 255];
  const B  = [205, 232, 248, 255];
  const d  = [85, 148, 188, 255];
  const w  = [242, 248, 255, 255];
  const y  = [248, 215, 58, 255]; // beak/feet yellow
  const e  = [12, 25, 42, 255];
  const g  = [255, 255, 255, 255];

  const px = mkC();

  // wings (spread, slightly raised)
  tr(px, 14, 26, 3,  18, 11, 30, b);   // left wing upper
  tr(px, 14, 26, 3,  32, 10, 30, d);   // left wing lower
  tr(px, 33, 26, 45, 18, 37, 30, b);   // right wing upper
  tr(px, 33, 26, 45, 32, 38, 30, d);
  // wing tips
  tr(px, 5,  20, 2, 26, 8, 18, B);
  tr(px, 43, 20, 46, 26, 40, 18, B);

  // tail (fan shape)
  tr(px, 18, 40, 15, 46, 22, 46, b);
  tr(px, 28, 40, 33, 46, 25, 46, b);
  sp(px, 21, 47, d); sp(px, 24, 47, d); sp(px, 26, 47, d);

  // body (round)
  el(px, 24, 30, 9, 9, b);
  el(px, 23, 33, 5.5, 5.5, w); // white belly

  // head
  el(px, 22, 20, 7, 7, b);

  // crest feathers
  tr(px, 20, 12, 18, 20, 23, 20, B);
  tr(px, 24, 10, 22, 20, 26, 20, b);

  // beak
  tr(px, 15, 22, 11, 25, 15, 26, y);

  // eyes (bright, alert)
  el(px, 18, 19, 3, 3, e);
  el(px, 18, 19, 1.5, 1.5, [125, 185, 225, 255]);
  sp(px, 17, 18, g); sp(px, 18, 18, g);

  // feet
  sp(px, 20, 40, y); sp(px, 22, 41, y);
  sp(px, 25, 40, y); sp(px, 27, 41, y);

  for (let x = 0; x < W; x++)
    for (let yy = 0; yy < H; yy++) {
      const v = px[x][yy];
      if (v === b && yy < 18) px[x][yy] = B;
    }

  ol(px, OT);
  return px;
}

function nebelkraehe() {
  // Air crow – dark blue-grey, mysterious, mist-trailing feathers.
  const OT = [8, 10, 18, 255];
  const b  = [52, 62, 95, 255];   // dark blue-grey
  const B  = [78, 95, 138, 255];  // highlight
  const d  = [28, 32, 55, 255];   // deep shadow
  const w  = [185, 198, 228, 255];// mist accent
  const y  = [215, 188, 55, 255]; // beak
  const e  = [8, 12, 25, 255];
  const g  = [255, 255, 255, 255];
  const mb = [105, 118, 165, 255];// mist blue

  const px = mkC();

  // mist trail (behind, ethereal)
  el(px, 38, 38, 6, 4, mb);
  el(px, 42, 33, 4, 3, mb);
  el(px, 44, 26, 3, 3, w);
  el(px, 41, 41, 3, 2.5, w);

  // large dark wings
  tr(px, 16, 24, 2,  14, 10, 30, b);
  tr(px, 16, 24, 2,  34, 8,  32, d);
  tr(px, 32, 24, 46, 14, 38, 30, b);
  tr(px, 32, 24, 46, 34, 40, 32, d);
  // wing highlights
  tr(px, 5,  17, 2, 22, 9, 17, B);
  tr(px, 43, 17, 46, 22, 39, 17, B);

  // tail (dramatic fan)
  tr(px, 16, 40, 12, 47, 20, 46, d);
  tr(px, 28, 40, 36, 47, 24, 46, d);
  tr(px, 20, 41, 18, 47, 28, 47, b);

  // body
  el(px, 24, 31, 8.5, 8, b);

  // head
  el(px, 22, 20, 7.5, 7, b);

  // crown feathers
  tr(px, 18, 11, 15, 20, 21, 20, d);
  tr(px, 22, 9,  20, 20, 25, 20, b);
  tr(px, 27, 11, 25, 20, 30, 20, B);

  // beak (sharp, slightly hooked)
  tr(px, 13, 21, 8, 25, 13, 26, y);
  sp(px, 8, 25, d); // hook tip

  // eyes (piercing, with purple glint)
  el(px, 18, 19, 3.2, 3, e);
  el(px, 18, 19, 1.8, 1.8, [88, 72, 148, 255]); // purple iris
  sp(px, 17, 18, g); sp(px, 18, 18, g);

  // mist wisps around body
  sp(px, 10, 28, w); sp(px, 9, 32, mb); sp(px, 11, 35, w);
  sp(px, 35, 28, w); sp(px, 36, 32, mb);

  for (let x = 0; x < W; x++)
    for (let yy = 0; yy < H; yy++) {
      const v = px[x][yy];
      if (v === b && yy < 16) px[x][yy] = B;
      if (v === b && yy > 38) px[x][yy] = d;
    }

  ol(px, OT);
  return px;
}

// ════════════════════════════════════════════════════════════════════
// Generate all sprites
// ════════════════════════════════════════════════════════════════════
const SPRITES = {
  1: glutwelp,
  2: flammkater,
  3: infernox,
  4: troepfling,
  5: wogefin,
  6: tidehorn,
  7: knospling,
  8: rankgar,
  9: florwucht,
  13: funkmaus,
  15: flatterling,
  28: nebelkraehe,
};

console.log(`Generating ${Object.keys(SPRITES).length} sprites → ${OUT}`);
for (const [id, fn] of Object.entries(SPRITES)) {
  save(id, fn());
}
console.log('Done.');
