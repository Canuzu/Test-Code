// Landing page (game selection) — the first thing every visitor sees.
//
// Concept: "Cartograph" is the map-maker of the card market, so the signature
// visual is an animated TOPOGRAPHIC CONTOUR map behind a holographic card fan
// built from the real most-valuable / fastest-rising cards. Below: a live price
// ticker, four immersive game tiles (live counts + newest set + a holo top card)
// and a short "what you can do" strip. Data comes from the tiny build-time
// data/highlights.json (~8 KB) instead of the 30+ MB catalogues, so the page is
// instant; everything degrades to skeletons if it is missing.
//
// Styling lives in index.css under "Landing page". Per-game colours arrive as
// inline custom properties (--a, --a2, --a-soft, --a-glow); pointer-driven tilt
// and holo shine write CSS variables directly (no React re-render per frame).
// All motion stops under prefers-reduced-motion.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Moon, HelpCircle, ArrowRight, ArrowDown, TrendingUp, LineChart, Library, BellRing, ClipboardList } from 'lucide-react';
import { GAMES } from '../data/providers/index.js';
import { globalStore } from '../lib/storage.js';
import { fmtEur } from '../lib/format.js';
import LogoMark from './LogoMark.jsx';
import GameMark from './GameMark.jsx';
import { CardImage } from './ui.jsx';

// Short, scannable taglines for the tiles (the registry's longer blurbs are for
// the in-game header and SEO).
const TAGLINES = {
  pokemon: 'Cardmarket-Preise · 2× täglich aktuell',
  onepiece: 'Offizielle Artworks · Preisschätzung',
  magic: 'Cardmarket-Preise · Scryfall-Artworks',
  yugioh: 'Deutsche Kartennamen · Preisschätzung',
};

const FEATURES = [
  { Icon: LineChart, title: 'Preise & Charts', text: 'Trend, 7- und 30-Tage-Schnitt für jede Karte.' },
  { Icon: Library, title: 'Sammlung', text: 'Bestand erfassen und den Wert mitverfolgen.' },
  { Icon: BellRing, title: 'Preisalarme', text: 'Benachrichtigung, sobald dein Zielpreis fällt.' },
  { Icon: ClipboardList, title: 'Buylist & Export', text: 'Einkaufslisten als PDF oder CSV.' },
];

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};
const fmtInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('de-DE') : '–');
const fmtPct = (v) => `${v > 0 ? '+' : ''}${v.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
const priceLabel = (c) => (c.price == null ? '–' : `${c.estimated ? '≈ ' : ''}${fmtEur(c.price, c.price >= 1000 ? 0 : 2)}`);
// CardImage expects the catalogue's { image: { small } } shape.
const asCard = (c) => (c ? { ...c, image: { small: c.image } } : null);

// ---- data -------------------------------------------------------------------
let hlCache = null;
let hlInflight = null;
function loadHighlights() {
  if (hlCache) return Promise.resolve(hlCache);
  if (!hlInflight) {
    hlInflight = fetch(`${import.meta.env.BASE_URL}data/highlights.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { hlCache = j && j.games ? j : null; return hlCache; })
      .catch(() => null)
      .finally(() => { hlInflight = null; });
  }
  return hlInflight;
}
function useHighlights() {
  const [h, setH] = useState(hlCache);
  useEffect(() => {
    if (hlCache) return undefined;
    let alive = true;
    loadHighlights().then((j) => { if (alive && j) setH(j); });
    return () => { alive = false; };
  }, []);
  return h;
}

// Animated count-up (once per page load; later visits show the number at once).
let countedOnce = false;
function useCountUp(target, ms = 1500) {
  const [v, setV] = useState(countedOnce ? target : 0);
  useEffect(() => {
    if (!target) return undefined;
    if (countedOnce || reducedMotion()) { setV(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(step);
      else countedOnce = true;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// "heute, 06:14 Uhr" / "gestern, 18:02 Uhr" / "12.11., 06:14 Uhr"
function fmtUpdated(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(d)) / 86400000);
  const date = diff === 0 ? 'heute' : diff === 1 ? 'gestern' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `${date}, ${time} Uhr`;
}

// Pointer → CSS variables (tilt -1..1 and shine position in %), rAF-throttled.
function usePointerVars(ref, { idle = {}, active = {} } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return undefined;
    let raf = 0;
    let last = null;
    const apply = () => {
      raf = 0;
      if (!last) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (last.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (last.clientY - r.top) / r.height));
      el.style.setProperty('--px', (x * 2 - 1).toFixed(3));
      el.style.setProperty('--py', (y * 2 - 1).toFixed(3));
      el.style.setProperty('--tx', (x * 2 - 1).toFixed(3));
      el.style.setProperty('--ty', (y * 2 - 1).toFixed(3));
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    };
    const set = (vars) => Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = (e) => { if (e.pointerType !== 'touch') set(active); };
    const onLeave = () => {
      last = null;
      set({ '--px': '0', '--py': '0', '--tx': '0', '--ty': '0', '--mx': '50%', '--my': '40%', ...idle });
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

// ---- topographic backdrop ---------------------------------------------------
// Deterministic wobbly contour rings around a few "hills". Each ring perturbs its
// radius with low-frequency sines whose phase drifts per ring, so neighbouring
// lines bend slightly differently — the look of a real elevation map.
function ringPath(cx, cy, r, seed, wob) {
  const N = 72;
  let d = '';
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const k = 1 + wob * (0.9 * Math.sin(2 * t + seed) + 0.55 * Math.sin(3 * t + seed * 1.7) + 0.3 * Math.sin(5 * t + seed * 2.3));
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * r * k).toFixed(1)} ${(cy + Math.sin(t) * r * k * 0.8).toFixed(1)}`;
  }
  return `${d}Z`;
}
const HILLS = [
  { cx: 1080, cy: 330, base: 46, step: 36, rings: 12, seed: 0.6 },
  { cx: 140, cy: 820, base: 34, step: 32, rings: 10, seed: 2.1 },
  { cx: 1330, cy: 1260, base: 40, step: 34, rings: 9, seed: 4.2 },
];
const TOPO = HILLS.map((h) => Array.from({ length: h.rings }, (_, j) =>
  ringPath(h.cx, h.cy, h.base + j * h.step, h.seed + j * 0.14, 0.07 + j * 0.006)));

function Topo() {
  return (
    <svg className="lp-topo" viewBox="0 0 1440 1500" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <linearGradient id="lpTopoGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd700" />
          <stop offset="1" stopColor="#ff3d7f" />
        </linearGradient>
      </defs>
      {TOPO.map((rings, i) => (
        <g key={i} className="lp-topo-g">
          {rings.map((d, j) => (
            <path key={j} d={d} className={j % 4 === 3 ? 'lp-topo-major' : undefined} stroke={i === 0 && j === 1 ? 'url(#lpTopoGold)' : undefined} />
          ))}
        </g>
      ))}
    </svg>
  );
}

// ---- holographic card fan ---------------------------------------------------
const FAN_SLOTS = [
  { x: '-196px', y: '26px', r: '-15deg', z: 1, d: 0.55, w: 176, delay: '-1.2s' },
  { x: '-104px', y: '-2px', r: '-7.5deg', z: 2, d: 0.8, w: 198, delay: '-3.4s' },
  { x: '0px', y: '-22px', r: '0deg', z: 5, d: 1.15, w: 232, delay: '0s' },
  { x: '104px', y: '-2px', r: '7.5deg', z: 2, d: 0.8, w: 198, delay: '-2.2s' },
  { x: '196px', y: '26px', r: '15deg', z: 1, d: 0.55, w: 176, delay: '-4.6s' },
];

function HoloFan({ cards, hero, onOpenCard }) {
  const ref = useRef(null);
  usePointerVars(ref, { idle: { '--shine': '.42', '--holo': '.3' }, active: { '--shine': '.75', '--holo': '.6' } });
  return (
    <div className="lp-fan" ref={ref}>
      <div className="lp-fan-inner">
        {FAN_SLOTS.map((s, i) => {
          const c = cards[i];
          const h = Math.round(s.w / 0.716);
          return (
            <button
              key={i}
              type="button"
              className="lp-fan-card"
              tabIndex={c ? 0 : -1}
              disabled={!c}
              onClick={() => c && onOpenCard?.(c.game, c.id)}
              aria-label={c ? `${c.name} – ${priceLabel(c)} – Karte öffnen` : 'Karte lädt'}
              title={c ? `${c.name} · ${priceLabel(c)}` : undefined}
              style={{ '--x': s.x, '--y': s.y, '--r': s.r, '--z': s.z, '--d': s.d, '--w': `${s.w}px`, '--h': `${h}px`, '--delay': s.delay }}
            >
              <div className="lp-fan-float">
                {c ? (
                  <div className="lp-holo"><CardImage card={asCard(c)} height={h} radius={14} /></div>
                ) : <div className="lp-skel" />}
              </div>
            </button>
          );
        })}
      </div>
      {hero && (
        <button type="button" className="lp-pricechip" onClick={() => onOpenCard?.(hero.game, hero.id)} aria-label={`${hero.name} öffnen`}>
          <TrendingUp size={16} color="#00e676" />
          <span className="lp-pricechip-name">{hero.name}</span>
          <b>{priceLabel(hero)}</b>
          {hero.change30 != null && <span className="lp-up">{fmtPct(hero.change30)}</span>}
          <span className="lp-pricechip-note">30 T.</span>
        </button>
      )}
    </div>
  );
}

// ---- live ticker ------------------------------------------------------------
function Ticker({ items, onOpenCard }) {
  if (!items.length) return null;
  const row = (copy) => items.map((c, i) => {
    const g = GAMES.find((x) => x.id === c.game);
    return (
      <button
        key={`${copy}-${i}`}
        type="button"
        className="lp-tick"
        tabIndex={copy ? -1 : 0}
        aria-hidden={copy ? 'true' : undefined}
        onClick={() => onOpenCard?.(c.game, c.id)}
        title={`${c.name} · ${g?.label || ''}`}
      >
        <span className="lp-tick-img"><CardImage card={asCard(c)} height={40} radius={4} /></span>
        <span className="lp-tick-game"><GameMark id={c.game} size={18} /></span>
        <span className="lp-tick-name">{c.name}</span>
        <span className="lp-tick-price">{priceLabel(c)}</span>
        {c.kind === 'mover' && c.change30 != null && <span className="lp-up">{fmtPct(c.change30)}</span>}
      </button>
    );
  });
  return (
    <section className="lp-ticker" aria-label="Aktuelle Marktbewegungen">
      <div className="lp-ticker-label"><span className="lp-live-dot" /><span>Markt live</span></div>
      <div className="lp-ticker-viewport">
        <div className="lp-ticker-track" style={{ '--dur': `${Math.max(40, items.length * 4.5)}s` }}>
          {row(0)}{row(1)}
        </div>
      </div>
    </section>
  );
}

// ---- game tile --------------------------------------------------------------
function GameTile({ g, h, onPick, index }) {
  const ref = useRef(null);
  usePointerVars(ref);
  const top = h?.top?.[0];
  const ns = h?.newestSet;
  const recent = ns?.releaseDate && (Date.now() - new Date(ns.releaseDate.replace(/\//g, '-')).getTime()) < 60 * 86400000;
  return (
    <button
      ref={ref}
      type="button"
      className="lp-tile fade-in"
      onClick={() => onPick(g.id)}
      aria-label={`${g.label} öffnen`}
      style={{ '--a': g.accent, '--a2': g.accent2, '--a-soft': `${g.accent}24`, '--a-glow': `${g.accent}66`, animationDelay: `${index * 80}ms` }}
    >
      <div className="lp-tile-pattern" aria-hidden="true" />
      <div className="lp-tile-body">
        <div className="lp-tile-mark"><GameMark id={g.id} size={56} /></div>
        <div className="lp-tile-name">{g.label}</div>
        <div className="lp-tile-tag">{TAGLINES[g.id] || g.tagline}</div>
        <div className="lp-tile-meta">
          {h ? <>
            <span className="lp-pill">{fmtInt(h.count)} Karten</span>
            <span className="lp-pill">{fmtInt(h.sets)} Sets</span>
            {ns && <span className="lp-pill lp-pill-new" title={ns.name}>{recent ? 'Neu' : 'Neuestes Set'}: {ns.name}</span>}
          </> : <span className="lp-pill">Lädt …</span>}
        </div>
        <span className="lp-tile-cta">Öffnen <ArrowRight size={16} /></span>
      </div>
      {top && (
        <div className="lp-tile-art" aria-hidden="true">
          <div className="lp-holo"><CardImage card={asCard(top)} height={212} radius={12} /></div>
        </div>
      )}
    </button>
  );
}

// ---- page -------------------------------------------------------------------
export default function GameSelect({ onPick, onOpenCard, onLegal, onFaq, theme = 'dark', onToggleTheme }) {
  const hl = useHighlights();
  const games = hl?.games || {};
  const lastGame = useMemo(() => {
    const id = globalStore.get('lastGame');
    return GAMES.find((g) => g.id === id && g.enabled) || null;
  }, []);

  const totals = useMemo(() => {
    const list = Object.values(games);
    return {
      cards: list.reduce((s, g) => s + (g.count || 0), 0),
      sets: list.reduce((s, g) => s + (g.sets || 0), 0),
      updated: list.map((g) => g.updatedAt).filter(Boolean).sort().pop() || null,
    };
  }, [games]);
  const cardsN = useCountUp(totals.cards);
  const setsN = useCountUp(totals.sets);

  // Fan: the hottest real mover in the centre, flanked by each game's top card.
  const { fan, hero, ticker } = useMemo(() => {
    const p = games.pokemon || {};
    const pick = (id, k = 0) => games[id]?.top?.[k] || null;
    const heroCard = p.movers?.[0] || pick('pokemon');
    const used = new Set(heroCard ? [heroCard.id] : []);
    const firstUnused = (id) => (games[id]?.top || []).find((c) => !used.has(c.id)) || null;
    const others = ['yugioh', 'onepiece', 'magic', 'pokemon'].map((id) => { const c = firstUnused(id); if (c) used.add(c.id); return c; });
    const fanCards = [others[0], others[1], heroCard, others[2], others[3]];
    // Ticker: interleave risers (real prices only) with each game's top values.
    const movers = [...(p.movers || []), ...(games.magic?.movers || [])].map((c) => ({ ...c, kind: 'mover' }));
    const tops = ['magic', 'onepiece', 'yugioh', 'pokemon'].flatMap((id) => (games[id]?.top || []).slice(0, 3)).map((c) => ({ ...c, kind: 'top' }));
    const mixed = [];
    for (let i = 0; i < Math.max(movers.length, tops.length); i++) {
      if (movers[i]) mixed.push(movers[i]);
      if (tops[i]) mixed.push(tops[i]);
    }
    return { fan: fanCards, hero: heroCard, ticker: mixed.slice(0, 18) };
  }, [games]);

  const scrollToGames = () => document.getElementById('lp-games')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const updated = fmtUpdated(totals.updated);

  return (
    <div className="lp">
      <Topo />
      <div className="lp-glow lp-glow-a" aria-hidden="true" />
      <div className="lp-glow lp-glow-b" aria-hidden="true" />
      <div className="lp-glow lp-glow-c" aria-hidden="true" />

      <header className="lp-top">
        <div className="lp-brand"><LogoMark size={34} /><span className="lp-brand-word">Cartograph</span></div>
        <div className="lp-top-actions">
          {onFaq && (
            <button type="button" className="lp-chipbtn" onClick={onFaq} aria-label="Hilfe & FAQ" title="Hilfe & FAQ">
              <HelpCircle size={16} /><span className="lp-chip-label">Hilfe</span>
            </button>
          )}
          {onToggleTheme && (
            <button type="button" className="lp-chipbtn" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'} title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}<span className="lp-chip-label">{theme === 'dark' ? 'Hell' : 'Dunkel'}</span>
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-copy">
            <div className="lp-eyebrow">
              <span className="lp-live-dot" />
              {updated ? <>Live-Preise · aktualisiert {updated}</> : <>Live-Preise vom deutschen Markt</>}
            </div>
            <h1 className="lp-h1">
              <span>Jede Karte.</span>
              <span>Jeder Preis.</span>
              <span className="lp-grad">Auf einen Blick.</span>
            </h1>
            <p className="lp-sub">
              Cartograph kartiert den Markt für <strong>Pokémon, Magic, One Piece &amp; Yu-Gi-Oh!</strong> – mit
              Cardmarket-Preisen, Charts, Sammlung und Preisalarmen. Kostenlos und ohne Anmeldung.
            </p>
            <div className="lp-ctas">
              {lastGame ? (
                <>
                  <button type="button" className="lp-btn lp-btn-primary" onClick={() => onPick(lastGame.id)}>
                    Weiter mit {lastGame.id === 'magic' ? 'Magic' : lastGame.label} <ArrowRight size={18} />
                  </button>
                  <button type="button" className="lp-btn lp-btn-ghost" onClick={scrollToGames}>Alle Spiele <ArrowDown size={17} /></button>
                </>
              ) : (
                <>
                  <button type="button" className="lp-btn lp-btn-primary" onClick={scrollToGames}>Spiel wählen <ArrowDown size={18} /></button>
                  {onFaq && <button type="button" className="lp-btn lp-btn-ghost" onClick={onFaq}>So funktioniert&apos;s</button>}
                </>
              )}
            </div>
          </div>

          <div className="lp-fan-wrap">
            <HoloFan cards={fan} hero={hero} onOpenCard={onOpenCard} />
          </div>

          <dl className="lp-stats">
            <div><dt className="lp-stat-l">Karten</dt><dd className="lp-stat-n">{totals.cards ? fmtInt(cardsN) : '–'}</dd></div>
            <div><dt className="lp-stat-l">Sets</dt><dd className="lp-stat-n">{totals.sets ? fmtInt(setsN) : '–'}</dd></div>
            <div><dt className="lp-stat-l">Spiele</dt><dd className="lp-stat-n">{GAMES.filter((g) => g.enabled).length}</dd></div>
            <div><dt className="lp-stat-l">Updates</dt><dd className="lp-stat-n">2× tägl.</dd></div>
          </dl>
        </section>

        <Ticker items={ticker} onOpenCard={onOpenCard} />

        <section className="lp-games" id="lp-games" aria-labelledby="lp-games-h">
          <div className="lp-section-head">
            <div>
              <div className="lp-kicker">Wähle dein Spiel</div>
              <h2 className="lp-h2" id="lp-games-h">Vier Spiele. Ein Tracker.</h2>
            </div>
            <div className="lp-section-note">Jedes Spiel hat eigene Sammlung, Watchlist &amp; Alerts – über das Logo kommst du jederzeit hierher zurück.</div>
          </div>
          <div className="lp-grid">
            {GAMES.filter((g) => g.enabled).map((g, i) => (
              <GameTile key={g.id} g={g} h={games[g.id]} onPick={onPick} index={i} />
            ))}
          </div>
        </section>

        <section className="lp-features" aria-label="Funktionen">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="lp-feature">
              <span className="lp-feature-icon"><Icon size={18} /></span>
              <div><div className="lp-feature-t">{title}</div><div className="lp-feature-d">{text}</div></div>
            </div>
          ))}
        </section>
      </main>

      <div className="lp-foot-rule" />
      <footer className="lp-foot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 640, lineHeight: 1.55 }}>
          <span style={{ flexShrink: 0, opacity: 0.85 }}><LogoMark size={22} /></span>
          <span>Inoffizielles Fan-Projekt – nicht verbunden mit Nintendo/The Pokémon Company, Bandai, Konami oder Wizards of the Coast. Marken &amp; Kartenbilder gehören ihren Rechteinhabern. Preise ohne Gewähr.</span>
        </div>
        <nav aria-label="Rechtliches">
          {onFaq && <button type="button" className="lp-link" onClick={onFaq}>Hilfe &amp; FAQ</button>}
          {onLegal && <button type="button" className="lp-link" onClick={onLegal}>Impressum &amp; Datenschutz</button>}
        </nav>
      </footer>
    </div>
  );
}
