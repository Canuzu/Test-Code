// Game-selection landing page. Shows the Cartograph logo centred on top and the
// available TCGs as cards below; picking one enters that game's tracker. This is
// the new entry point — the per-game tracker (the old "home") opens on click.
import { C } from '../lib/theme.js';
import { GAMES } from '../data/providers/index.js';
import LogoMark from './LogoMark.jsx';
import GameMark from './GameMark.jsx';

export default function GameSelect({ onPick }) {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.appGrad1} 0%, ${C.appGrad2} 100%)`, color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px calc(40px + env(safe-area-inset-bottom))' }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginTop: 'min(12vh, 90px)', marginBottom: 8 }}>
        <div style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 26px #ffd70033)' }}>
          <LogoMark size={96} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 38, letterSpacing: '0.5px', marginTop: 12, background: 'linear-gradient(90deg, #ffd700, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cartograph</div>
        <div style={{ fontSize: 13.5, color: C.textDim, marginTop: 6 }}>Wähle dein Trading Card Game</div>
      </div>

      {/* Game cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16, width: '100%', maxWidth: 720, marginTop: 26 }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => g.enabled && onPick(g.id)}
            disabled={!g.enabled}
            className={g.enabled ? 'card-hover fade-in' : 'fade-in'}
            style={{
              position: 'relative', textAlign: 'left', cursor: g.enabled ? 'pointer' : 'not-allowed',
              background: C.surface, border: `1px solid ${g.enabled ? C.line : C.lineStrong}`, borderRadius: 18,
              padding: 20, color: C.text, overflow: 'hidden', opacity: g.enabled ? 1 : 0.62,
            }}
          >
            {/* accent glow */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 100% at 0% 0%, ${g.accent}22, transparent 55%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${g.accent}, ${g.accent2})`, boxShadow: `0 4px 18px ${g.accent}44` }}>
                <GameMark id={g.id} size={34} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {g.label}
                  {!g.enabled && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textFaint, border: `1px solid ${C.lineStrong}`, borderRadius: 20, padding: '2px 8px' }}>BALD</span>}
                </div>
                <div style={{ fontSize: 11.5, color: g.enabled ? g.accent : C.textFaint, fontWeight: 600, marginTop: 3 }}>{g.tagline}</div>
              </div>
              {g.enabled && <span style={{ fontSize: 20, color: C.textFaint, flexShrink: 0 }}>→</span>}
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 12, lineHeight: 1.5, position: 'relative' }}>{g.blurb}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: C.textGhost, marginTop: 32, textAlign: 'center', maxWidth: 560, lineHeight: 1.6 }}>
        Jedes Spiel hat seine eigene Sammlung, Watchlist & Alerts. Du kannst jederzeit oben links über das Logo zurück zur Spiel-Auswahl.
      </div>
    </div>
  );
}
