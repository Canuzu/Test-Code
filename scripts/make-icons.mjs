// Generates the PWA PNG icons (192 / 512, plus maskable) with no image deps:
// a gold lightning bolt on the app's dark gradient — matching the favicon.
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

// Lightning bolt polygon in a 64×64 space (same shape as the SVG favicon).
const BOLT = [[36, 8], [18, 36], [30, 36], [28, 56], [46, 26], [34, 26]];
const inPoly = (px, py, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const makeIcon = (size, padding = 0) => {
  const rgba = Buffer.alloc(size * size * 4);
  const s = size / 64;
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = y / size;
      // dark gradient background (#0a0a18 → #1a0a2e)
      let r = Math.round(10 + 16 * t);
      let g = Math.round(10 + 4 * t);
      let b = Math.round(24 + 22 * t);
      // soft golden glow toward the centre
      const d = Math.hypot(x - cx, y - cy) / (size / 2);
      const glow = Math.max(0, 1 - d) * 0.10;
      r = Math.min(255, r + 255 * glow);
      g = Math.min(255, g + 200 * glow);
      // bolt (apply optional padding for the maskable safe zone)
      const bx = 32 + (x / s - 32) / (1 - padding);
      const by = 32 + (y / s - 32) / (1 - padding);
      if (inPoly(bx, by, BOLT)) { r = 255; g = 215; b = 0; }
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
