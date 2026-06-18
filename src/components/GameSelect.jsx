// Game-selection landing page. Shows the Cartograph logo centred on top and the
// available TCGs as cards below; picking one enters that game's tracker. This is
// the new entry point — the per-game tracker (the old "home") opens on click.
//
// Visual treatment lives in index.css under "Game-selection landing page": an
// animated backdrop (drifting colour blobs + slowly rising translucent cards), a
// floating logo, a shimmering wordmark and rich per-card hover effects. Per-game
// colours are passed to the CSS as inline custom properties (--accent etc.). All
// motion is disabled under prefers-reduced-motion.
import { Sun, Moon } from 'lucide-react';
import { C } from '../lib/theme.js';
import { GAMES } from '../data/providers/index.js';
import LogoMark from './LogoMark.jsx';
import GameMark from './GameMark.jsx';

// Small feature pills under the wordmark — what every game gives you.
const FEATURES = ['Live-Preise', 'Charts', 'Sammlung', 'Watchlist', 'Alerts'];

// Backdrop cards: scattered positions/sizes/speeds, tinted with the game accents
// so the falling deck matches the four TCGs on offer. Pure decoration.
const ACCENTS = GAMES.map((g) => g.accent);
const FLOAT_CARDS = [
  { left: '6%', s: 1.1, dur: 17, delay: 0, r0: '-14deg', r1: '8deg' },
  { left: '18%', s: 0.8, dur: 23, delay: 6, r0: '10deg', r1: '-12deg' },
  { left: '30%', s: 1.3, dur: 20, delay: 11, r0: '-6deg', r1: '14deg' },
  { left: '43%', s: 0.9, dur: 26, delay: 3, r0: '16deg', r1: '-6deg' },
  { left: '55%', s: 1.15, dur: 19, delay: 9, r0: '-12deg', r1: '10deg' },
  { left: '67%', s: 0.85, dur: 24, delay: 14, r0: '8deg', r1: '-14deg' },
  { left: '79%', s: 1.25, dur: 21, delay: 2, r0: '-10deg', r1: '12deg' },
  { left: '90%', s: 0.95, dur: 28, delay: 7, r0: '12deg', r1: '-8deg' },
  { left: '12%', s: 1.0, dur: 25, delay: 16, r0: '6deg', r1: '-10deg' },
  { left: '72%', s: 1.05, dur: 18, delay: 12, r0: '-16deg', r1: '6deg' },
];

export default function GameSelect({ onPick, onLegal, onFaq, theme = 'dark', onToggleTheme }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: `linear-gradient(160deg, ${C.appGrad1} 0%, ${C.appGrad2} 100%)`, color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px calc(40px + env(safe-area-inset-bottom))' }}>
      {/* Animated backdrop */}
      <div className="ls-backdrop" aria-hidden="true">
        <div className="ls-blob ls-blob-a" />
        <div className="ls-blob ls-blob-b" />
        <div className="ls-blob ls-blob-c" />
        {FLOAT_CARDS.map((c, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <div
              key={i}
              className="ls-card"
              style={{
                left: c.left,
                width: 34 * c.s, height: 48 * c.s,
                background: `linear-gradient(150deg, ${accent}, ${accent}22)`,
                animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`,
                '--r0': c.r0, '--r1': c.r1,
              }}
            />
          );
        })}
      </div>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginTop: 'min(12vh, 90px)', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div className="ls-logo" style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 30px #ffd70044)' }}>
          <LogoMark size={96} />
        </div>
        <div className="ls-title" style={{ fontWeight: 800, fontSize: 38, letterSpacing: '0.5px', marginTop: 12, background: 'linear-gradient(90deg, #ffd700, #ff6b35, #ffd700)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cartograph</div>
        <div style={{ fontSize: 13.5, color: C.textDim, marginTop: 6 }}>Wähle dein Trading Card Game</div>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {FEATURES.map((f) => (
            <span key={f} className="ls-chip" style={{ fontSize: 11, fontWeight: 600, color: C.textDim, background: `${C.surface}cc`, border: `1px solid ${C.line}`, borderRadius: 20, padding: '5px 12px' }}>{f}</span>
          ))}
        </div>

        {/* Theme toggle (device-wide, manual only) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="ls-chip"
            aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
            title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
            style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: C.textDim, background: `${C.surface}cc`, border: `1px solid ${C.line}`, borderRadius: 20, padding: '7px 14px' }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
          </button>
        )}
      </div>

      {/* Game cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16, width: '100%', maxWidth: 720, marginTop: 28, position: 'relative', zIndex: 1 }}>
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            onClick={() => g.enabled && onPick(g.id)}
            disabled={!g.enabled}
            className={g.enabled ? 'ls-game fade-in' : 'fade-in'}
            style={{
              position: 'relative', textAlign: 'left', cursor: g.enabled ? 'pointer' : 'not-allowed',
              background: C.surface, border: `1px solid ${g.enabled ? C.line : C.lineStrong}`, borderRadius: 18,
              padding: 20, color: C.text, overflow: 'hidden', opacity: g.enabled ? 1 : 0.62,
              animationDelay: `${i * 90}ms`,
              '--accent': g.accent, '--accent2': g.accent2, '--accentGlow': `${g.accent}66`, '--accentSoft': `${g.accent}22`,
            }}
          >
            {/* accent glow */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 100% at 0% 0%, ${g.accent}22, transparent 55%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div className="ls-iconwrap" style={{ flexShrink: 0 }}>
                <div className="ls-icon" style={{ width: 56, height: 56, position: 'relative', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${g.accent}, ${g.accent2})`, boxShadow: `0 6px 16px ${g.accent}55, inset 0 1px 0 #ffffff80, inset 0 0 0 1px #ffffff24` }}>
                  {/* top sheen for an app-icon look (sits behind the glyph) */}
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 15, background: 'linear-gradient(180deg, #ffffff42, #ffffff00 52%)', pointerEvents: 'none' }} />
                  <GameMark id={g.id} size={34} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {g.label}
                  {!g.enabled && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textFaint, border: `1px solid ${C.lineStrong}`, borderRadius: 20, padding: '2px 8px' }}>BALD</span>}
                </div>
                <div style={{ fontSize: 11.5, color: g.enabled ? g.accent : C.textFaint, fontWeight: 600, marginTop: 3 }}>{g.tagline}</div>
              </div>
              {g.enabled && <span className="ls-arrow" style={{ fontSize: 20, color: C.textFaint, flexShrink: 0 }}>→</span>}
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 12, lineHeight: 1.5, position: 'relative' }}>{g.blurb}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: C.textGhost, marginTop: 32, textAlign: 'center', maxWidth: 560, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
        Jedes Spiel hat seine eigene Sammlung, Watchlist & Alerts. Du kannst jederzeit oben links über das Logo zurück zur Spiel-Auswahl.
      </div>
      <div style={{ fontSize: 10, color: C.textGhost, marginTop: 16, textAlign: 'center', maxWidth: 600, lineHeight: 1.6, opacity: 0.85, position: 'relative', zIndex: 1 }}>
        Inoffizielles Fan-Projekt – nicht verbunden mit Nintendo/The Pokémon Company, Bandai, Konami oder Wizards of the Coast. Marken & Kartenbilder gehören ihren Rechteinhabern.
        {onFaq && <> · <button onClick={onFaq} style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', fontSize: 10, textDecoration: 'underline', padding: 0 }}>Hilfe & FAQ</button></>}
        {onLegal && <> · <button onClick={onLegal} style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', fontSize: 10, textDecoration: 'underline', padding: 0 }}>Impressum & Datenschutz</button></>}
      </div>
    </div>
  );
}
