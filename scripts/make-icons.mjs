// Generates the PWA PNG icons (192 / 512, plus maskable) with no image deps:
// the Cartograph mark — a rounded trading card with an upward price line/arrow,
// in gold on the app's dark gradient — matching the favicon and header logo.
// Run: node scripts/make-icons.mjs  (output → public/icons/)

import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
};
const png = (size, rgba) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) { raw[y * stride] = 0; rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};

// --- Cartograph mark geometry, authored in the same 64×64 space as the favicon.
// Drawn with signed-distance helpers so edges stay smooth (anti-aliased) at any
// output size. The whole mark is rotated -7° about its centre, like the SVG.
const ROT = (-7 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const CXY = 32;
const rot = (x, y) => {
  const dx = x - CXY;
  const dy = y - CXY;
  return [CXY + dx * COS - dy * SIN, CXY + dx * SIN + dy * COS];
};

// Rounded-rect signed distance (negative inside). Card body: x19..49, y12..52, r6.
const sdRoundRect = (px, py, x0, y0, x1, y1, r) => {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hx = (x1 - x0) / 2 - r;
  const hy = (y1 - y0) / 2 - r;
  const qx = Math.abs(px - cx) - hx;
  const qy = Math.abs(py - cy) - hy;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
};

// Distance from point to a segment (for stroking the price line/arrow).
const sdSeg = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
};

// The price line + arrowhead as a polyline of segments (same coords as favicon,
// scaled to the 64 space): card-relative line then the two arrow wings.
const LINE = [[24, 45], [31, 39], [36, 42], [43, 30], [49, 24]];
const WINGS = [[[43.2, 25], [49, 24]], [[49, 24], [47.3, 29.6]]];
const lineDist = (x, y) => {
  let d = Infinity;
  for (let i = 0; i < LINE.length - 1; i++) d = Math.min(d, sdSeg(x, y, LINE[i][0], LINE[i][1], LINE[i + 1][0], LINE[i + 1][1]));
  for (const [[ax, ay], [bx, by]] of WINGS) d = Math.min(d, sdSeg(x, y, ax, ay, bx, by));
  return d;
};

// gold→orange gradient sample (diagonal), matching the brand gradient.
const goldAt = (u) => [Math.round(255 - 0 * u), Math.round(215 - 108 * u), Math.round(0 + 53 * u)]; // #ffd700→#ff6b35

const makeIcon = (size, padding = 0) => {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const aa = size / 64;        // output px per 64-space unit
  const fw = 0.9 / aa;         // ~0.9 output-px feather, expressed in 64-space units
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = y / size;
      // dark gradient background (#0a0a18 → #1a0a2e)
      let r = Math.round(10 + 16 * t);
      let g = Math.round(10 + 4 * t);
      let b = Math.round(24 + 22 * t);
      const d = Math.hypot(x - cx, y - cy) / (size / 2);
      const glow = Math.max(0, 1 - d) * 0.10;
      r = Math.min(255, r + 255 * glow);
      g = Math.min(255, g + 200 * glow);

      // map pixel → 64-space, applying maskable padding (safe zone) then rotate
      const u64 = 32 + (x / aa - 32) / (1 - padding);
      const v64 = 32 + (y / aa - 32) / (1 - padding);
      const [mx, my] = rot(u64, v64);

      // card fill + gold border ring
      const card = sdRoundRect(mx, my, 19, 12, 49, 52, 6);
      if (card < 0) { r = 23; g = 23; b = 51; }            // #171733 body
      const border = Math.abs(card) - 1.4;                 // ~2.8(64-space) ring
      const gcol = goldAt((mx - 19) / 30 * 0.5 + (my - 12) / 40 * 0.5);
      let cov = Math.max(0, Math.min(1, 0.5 - border / fw));
      if (cov > 0) { r = r + (gcol[0] - r) * cov; g = g + (gcol[1] - g) * cov; b = b + (gcol[2] - b) * cov; }

      // price line + arrow (slightly brighter gold), stroked ~3(64-space)
      const ld = lineDist(mx, my) - 1.5;
      const lcov = Math.max(0, Math.min(1, 0.5 - ld / fw));
      if (lcov > 0) { r = r + (255 - r) * lcov; g = g + (210 - g) * lcov; b = b + (60 - b) * lcov; }

      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
    }
  }
  return png(size, rgba);
};

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'icon-192.png'), makeIcon(192));
writeFileSync(resolve(OUT, 'icon-512.png'), makeIcon(512));
writeFileSync(resolve(OUT, 'icon-maskable-512.png'), makeIcon(512, 0.2));
console.log('[make-icons] wrote icon-192.png, icon-512.png, icon-maskable-512.png to public/icons/');
