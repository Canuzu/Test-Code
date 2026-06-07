import { useEffect, useState } from 'react';
import CreatureSprite from './CreatureSprite.jsx';
import { CREATURES } from '../data/creatures.js';

export default function EvolutionScreen({ fromName, toSpeciesId, onDone }) {
  const [phase, setPhase] = useState('flash'); // flash → silhouette → reveal → done
  const sp = CREATURES[toSpeciesId];

  useEffect(() => {
    // flash → silhouette after 600ms
    const t1 = setTimeout(() => setPhase('silhouette'), 600);
    // silhouette → reveal after 3.2s
    const t2 = setTimeout(() => setPhase('reveal'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: phase === 'flash' ? '#ffffff' : '#0a0a1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.5s ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={phase === 'reveal' ? onDone : undefined}
    >
      {phase !== 'flash' && (
        <>
          {/* Animated rings */}
          <div style={{
            position: 'absolute',
            width: 220, height: 220,
            borderRadius: '50%',
            border: '3px solid #ffffff30',
            animation: 'evoRing 1.8s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            width: 160, height: 160,
            borderRadius: '50%',
            border: '2px solid #ffffff20',
            animation: 'evoRing 1.8s ease-out 0.6s infinite',
          }} />

          {/* Creature sprite */}
          <div style={{
            position: 'relative',
            filter: phase === 'silhouette' ? 'brightness(0) invert(1)' : 'drop-shadow(0 0 16px #a080ff)',
            transition: phase === 'reveal' ? 'filter 1.2s ease' : 'none',
            animation: phase === 'silhouette'
              ? 'evoPulse 0.6s ease-in-out alternate infinite'
              : 'evoAppear 0.8s ease forwards',
          }}>
            <CreatureSprite id={toSpeciesId} type={sp?.type} body={sp?.body} size={160} />
          </div>

          {/* Text */}
          <div style={{
            marginTop: 24,
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: 10,
            color: '#e8e0ff',
            textAlign: 'center',
            textShadow: '0 0 8px #8060ff',
            lineHeight: 1.8,
            padding: '0 16px',
            animation: 'evoFadeIn 0.8s ease forwards',
          }}>
            {phase === 'silhouette' && (
              <span>{fromName} entwickelt sich…</span>
            )}
            {phase === 'reveal' && sp && (
              <>
                <div style={{ fontSize: 12, color: '#d0b8ff', marginBottom: 8 }}>
                  {fromName}
                </div>
                <div style={{ fontSize: 8, color: '#a090c0', marginBottom: 12 }}>
                  entwickelt sich zu
                </div>
                <div style={{ fontSize: 14, color: '#ffffff', textShadow: '0 0 12px #c0a0ff' }}>
                  {sp.name}!
                </div>
                <div style={{ marginTop: 20, fontSize: 7, color: '#8070a0', animation: 'blink 1s step-end infinite' }}>
                  ▼ Tippen zum Fortfahren
                </div>
              </>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes evoRing {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes evoPulse {
          0%   { transform: scale(1.0); }
          100% { transform: scale(1.12); }
        }
        @keyframes evoAppear {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1.0); opacity: 1; }
        }
        @keyframes evoFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
