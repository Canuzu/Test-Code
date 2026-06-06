import { useRef, useEffect } from 'react';
import { buildSprite, SPRITE_SIZE } from '../engine/sprite.js';

// Zeichnet einen prozeduralen Pixel-Sprite auf ein Canvas.
// Props: id, type, body, size (Pixel), flip (für Blickrichtung).
export default function PixelSprite({ id, type, body, size = 96, flip = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const grid = buildSprite(id, type, body);
    const px = size / SPRITE_SIZE;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    if (flip) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    for (let y = 0; y < SPRITE_SIZE; y++) {
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const c = grid[y][x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(Math.floor(x * px), Math.floor(y * px), Math.ceil(px), Math.ceil(px));
      }
    }
    ctx.restore();
  }, [id, type, body, size, flip]);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} />;
}
