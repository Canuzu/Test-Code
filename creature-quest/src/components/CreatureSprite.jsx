import { useState } from 'react';
import PixelSprite from './PixelSprite.jsx';

// Displays a hand-crafted PNG sprite if available, falls back to procedural.
export default function CreatureSprite({ id, type, body, size = 96, flip = false }) {
  const [err, setErr] = useState(false);

  if (!err) {
    return (
      <img
        src={`/sprites/creature-${id}.png`}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
          transform: flip ? 'scaleX(-1)' : undefined,
          display: 'block',
        }}
        onError={() => setErr(true)}
        alt=""
        draggable="false"
      />
    );
  }

  return <PixelSprite id={id} type={type} body={body} size={size} flip={flip} />;
}
