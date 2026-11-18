// Header game switcher: a compact chip showing the current game; it opens a small
// menu to jump straight to another TCG (or back to the landing page) without the
// detour via the start screen. Closes on outside click, Escape or selection.
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Home } from 'lucide-react';
import { C } from '../lib/theme.js';
import { GAMES } from '../data/providers/index.js';
import GameMark from './GameMark.jsx';

const Badge = ({ g, size = 22 }) => (
  <span style={{ display: 'inline-flex', width: size, height: size, borderRadius: Math.round(size * 0.3), alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${g.accent}, ${g.accent2})`, boxShadow: 'inset 0 1px 0 #ffffff70', flexShrink: 0 }}>
    <GameMark id={g.id} size={Math.round(size * 0.68)} />
  </span>
);

export default function GameSwitcher({ game, onSwitch, onHome, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
      <button
        type="button"
        className="game-chip"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Spiel wechseln"
      >
        <Badge g={game} size={compact ? 20 : 22} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{compact && game.id === 'magic' ? 'Magic' : game.label}</span>
        <ChevronDown size={15} style={{ flexShrink: 0, opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div role="menu" className="game-menu">
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.textFaint, padding: '6px 10px 8px' }}>Spiel wechseln</div>
          {GAMES.filter((g) => g.enabled).map((g) => (
            <button
              key={g.id}
              type="button"
              role="menuitem"
              className="game-menu-item"
              onClick={() => { setOpen(false); if (g.id !== game.id) onSwitch(g.id); }}
            >
              <Badge g={g} size={26} />
              <span style={{ flex: 1, minWidth: 0 }}>{g.label}</span>
              {g.id === game.id && <Check size={16} color={C.gold} />}
            </button>
          ))}
          <div style={{ height: 1, background: C.line, margin: '6px 4px' }} />
          <button type="button" role="menuitem" className="game-menu-item" onClick={() => { setOpen(false); onHome(); }}>
            <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', color: C.textDim }}><Home size={16} /></span>
            <span style={{ flex: 1 }}>Startseite</span>
          </button>
        </div>
      )}
    </div>
  );
}
