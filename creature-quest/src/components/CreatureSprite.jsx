import PixelSprite from './PixelSprite.jsx';

// Vite bundles every sprite under assets/ and gives us a correctly-based URL
// (works under any deploy subpath – no more 404 on GitHub Pages).
const SPRITE_URLS = import.meta.glob('../assets/sprites/creature-*.png', {
  eager: true,
  import: 'default',
});

function spriteUrl(id) {
  for (const [path, url] of Object.entries(SPRITE_URLS)) {
    if (path.endsWith(`creature-${id}.png`)) return url;
  }
  return null;
}

// Shows the hand-crafted/AI PNG sprite when one exists for this id,
// otherwise falls back to the procedural renderer.
export default function CreatureSprite({ id, type, body, size = 96, flip = false }) {
  const url = spriteUrl(id);
  if (!url) return <PixelSprite id={id} type={type} body={body} size={size} flip={flip} />;

  return (
    <img
      src={url}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
      }}
      alt=""
      draggable="false"
    />
  );
}
