// Start-page hero PROPOSALS (prototype for review, selected via ?hero=a|b|c).
// A – "Kompass-Bühne": the compass is the centrepiece, products flank it.
// B – "Kompass-Rad": a curved compass scale you turn/swipe; the chosen game's
//     products are the main visual.
// C – "Ruhig & klassisch": one highlight product, the compass becomes a calm
//     logo bar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import FranchiseLogo from '../FranchiseLogo.jsx';
import { ProductImage } from '../ProductVisual.jsx';
import { listProducts, minPrice } from '../../lib/catalog.js';
import { prefersReducedMotion } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { R, shopPath, productPath } from '../../lib/routes.js';
import '../../styles/hero-variants.css';

const LOGO = `${import.meta.env.BASE_URL}cardcompass-logo.png`;
const ACCESSORIES = { slug: '', name: 'Zubehör', short: 'Zubehör', c1: '#c084fc', c2: '#5b00c9', category: 'tcg-zubehoer', Icon: Layers };
const keyOf = (it) => it.category || it.slug;
const dest = (it) => (it.category ? shopPath({ category: it.category }) : shopPath({ franchise: it.slug }));
const euro = (c) => (c % 100 === 0 ? `${c / 100} €` : money(c));
const H1 = () => <>Deine nächste <span className="hero-hl">Karte</span> wartet schon auf dich.</>;

// ---- shared state: directions, active one, its products, idle wandering ----
function useCompass(franchises, interval = 3800) {
  const items = useMemo(() => (franchises.length ? [...franchises, ACCESSORIES] : []), [franchises]);
  const n = items.length;
  const [active, setActive] = useState(0);
  const [lists, setLists] = useState({});
  const touched = useRef(false);
  useEffect(() => {
    let alive = true;
    items.forEach((it) => {
      listProducts(it.category ? { category: it.category } : { franchise: it.slug })
        .then((list) => { if (alive) setLists((m) => ({ ...m, [keyOf(it)]: list })); })
        .catch(() => {});
    });
    return () => { alive = false; };
  }, [items]);
  useEffect(() => {
    if (prefersReducedMotion() || n < 2) return undefined;
    const t = setInterval(() => { if (!touched.current) setActive((a) => (a + 1) % n); }, interval);
    return () => clearInterval(t);
  }, [n, interval]);
  const pick = (i) => { touched.current = true; setActive(((i % n) + n) % n); };
  const cur = items[active] || null;
  const list = cur ? lists[keyOf(cur)] || [] : [];
  const from = list.length ? Math.min(...list.map(minPrice)) : null;
  return { items, n, active, pick, cur, list, from };
}

function useParallax(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0; let e0 = null;
    const apply = () => { raf = 0; if (!e0) return; const r = el.getBoundingClientRect(); el.style.setProperty('--px', (((e0.clientX - r.left) / r.width) - .5).toFixed(3)); el.style.setProperty('--py', (((e0.clientY - r.top) / r.height) - .5).toFixed(3)); };
    const move = (e) => { e0 = e; if (!raf) raf = requestAnimationFrame(apply); };
    const leave = () => { e0 = null; el.style.setProperty('--px', 0); el.style.setProperty('--py', 0); };
    const host = el.closest('.hero') || el;
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
    return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
}

function Readout({ c, className = '' }) {
  const { cur, list, from } = c;
  if (!cur) return null;
  return (
    <Link to={dest(cur)} className={`hc-readout ${className}`} style={{ '--c1': cur.c1, '--c2': cur.c2 }}>
      <FranchiseLogo key={keyOf(cur)} franchise={cur} icon={cur.Icon} size="md" className="hc-readout-logo" />
      <span className="hc-readout-txt">
        <span className="hc-readout-k">Kurs auf</span>
        <strong><span className="hc-name">{cur.name}</span><span className="hc-name-s">{cur.short || cur.name}</span></strong>
        <span className="hc-readout-meta">{list.length ? `${list.length} ${list.length === 1 ? 'Produkt' : 'Produkte'}${from != null ? ` · ab ${money(from)}` : ''}` : ' '}</span>
      </span>
      <span className="hc-readout-go"><span className="hc-readout-go-t">Zum Sortiment</span><ArrowRight size={18} /></span>
    </Link>
  );
}

function Rings() {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg className="hero-rings" viewBox="0 0 600 600" aria-hidden="true">
      <g className="ring-slow">
        <circle cx="300" cy="300" r="286" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.2" />
        {ticks.map((i) => {
          const a = (i / 72) * Math.PI * 2; const long = i % 9 === 0;
          const r1 = long ? 262 : 272; const r2 = 284;
          return <line key={i} x1={300 + Math.cos(a) * r1} y1={300 + Math.sin(a) * r1} x2={300 + Math.cos(a) * r2} y2={300 + Math.sin(a) * r2} stroke="#fff" strokeOpacity={long ? .7 : .3} strokeWidth={long ? 2 : 1} />;
        })}
      </g>
      <g className="ring-rev">
        <circle cx="300" cy="300" r="200" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="300" cy="300" r="150" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="26" />
      </g>
    </svg>
  );
}

// Full compass (needle swings to the active direction) – used by A.
function Dial({ c, className = '' }) {
  const nav = useNavigate();
  const ref = useRef(null);
  useParallax(ref);
  const { items, n, active, pick, cur } = c;
  const offset = n % 2 === 0 ? 180 / n : 0;
  const angle = (i) => offset + (360 / n) * i;
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    if (!n) return;
    const t = angle(active);
    setDeg((d) => d + ((((t - d) % 360) + 540) % 360) - 180);
  }, [active, n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`hc ${className}`} ref={ref} style={cur ? { '--c1': cur.c1, '--c2': cur.c2 } : undefined}>
      <div className="hc-box">
        <div className="hero-stage">
          <div className="hero-glow" />
          <Rings />
          {n > 0 && (
            <div className="hc-rot" style={{ transform: `rotate(${deg}deg)` }} aria-hidden="true">
              <span className="hc-beam" />
              <svg className="hc-needle" viewBox="0 0 600 600">
                <defs>
                  <linearGradient id="hvNorth" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--c1) 70%, #fff)' }} />
                  </linearGradient>
                </defs>
                <path d="M300 96 L317 300 L283 300 Z" fill="url(#hvNorth)" />
                <path d="M283 300 L317 300 L300 452 Z" fill="#fff" opacity=".22" />
              </svg>
            </div>
          )}
          <div className="hero-core"><span className="hero-core-ring" /><img src={LOGO} alt="" width="120" height="120" /></div>
        </div>
        <div className="hc-points">
          {items.map((it, i) => (
            <button key={keyOf(it) || it.name} type="button" className={`hc-point ${i === active ? 'is-active' : ''}`} style={{ '--a': `${angle(i)}deg`, '--i': i }}
              onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onClick={() => nav(dest(it))} aria-label={`${it.name} – Sortiment öffnen`}>
              <span className="hc-point-inner"><FranchiseLogo franchise={it} icon={it.Icon} size="lg" /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniProduct({ p, i }) {
  return (
    <Link to={productPath(p.slug)} className="hv-mini" style={{ '--i': i }}>
      <span className="hv-mini-img"><ProductImage product={p} /></span>
      <span className="hv-mini-txt"><span className="hv-mini-name">{p.name}</span><strong className="hv-mini-price">{money(minPrice(p))}</strong></span>
    </Link>
  );
}

function Shell({ variant, children }) {
  return (
    <section className={`hero hv hv-${variant}`}>
      <div className="container">
        <div className={`hero-panel hv-panel hv-${variant}-panel`}>
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-grain" aria-hidden="true" />
          {children}
        </div>
      </div>
    </section>
  );
}

function Facts({ freeFrom }) {
  return (
    <p className="hero-facts hv-facts">
      {freeFrom != null && <span>Versandkostenfrei ab {euro(freeFrom)}</span>}
      <span>Schneller Versand</span>
      <span>14 Tage Widerrufsrecht</span>
    </p>
  );
}

/* ================================================================ A ==== */
export function HeroStage({ franchises, freeFrom }) {
  const c = useCompass(franchises);
  const prods = c.list.slice(0, 4);
  const k = c.cur ? keyOf(c.cur) : '';
  return (
    <Shell variant="a">
      <div className="hv-a-head">
        <h1 className="hero-h1 hv-h1"><H1 /></h1>
        <p className="hero-lead hv-lead">Booster, Displays und Zubehör – neue Sets zum regulären Preis, ohne Scalper-Aufschlag.</p>
      </div>
      <div className="hv-a-row">
        <div className="hv-a-side is-left" key={`l${k}`}>{prods.filter((_, i) => i % 2 === 0).map((p, i) => <MiniProduct key={p.id} p={p} i={i} />)}</div>
        <Dial c={c} className="hv-a-dial" />
        <div className="hv-a-side is-right" key={`r${k}`}>{prods.filter((_, i) => i % 2 === 1).map((p, i) => <MiniProduct key={p.id} p={p} i={i + 1} />)}</div>
      </div>
      <div className="hv-a-foot">
        <Readout c={c} />
        <Link to={R.shop} className="hero-link">Alle Produkte <ArrowRight size={16} /></Link>
      </div>
      <Facts freeFrom={freeFrom} />
    </Shell>
  );
}

/* ================================================================ B ==== */
function Fan({ c }) {
  const items = c.list.slice(0, 3);
  // order: centre first in data, drawn as left – centre – right
  const pos = [{ x: '0px', r: '0deg', z: 3, w: 'var(--fw1)', d: '0ms' }, { x: 'calc(var(--fx) * -1)', r: '-9deg', z: 2, w: 'var(--fw2)', d: '90ms' }, { x: 'var(--fx)', r: '9deg', z: 2, w: 'var(--fw2)', d: '160ms' }];
  return (
    <div className="hv-fan" key={c.cur ? keyOf(c.cur) : 'x'}>
      {items.map((p, i) => (
        <Link key={p.id} to={productPath(p.slug)} className="hv-fan-item" style={{ '--x': pos[i].x, '--r': pos[i].r, zIndex: pos[i].z, '--w': pos[i].w, '--d': pos[i].d }} aria-label={p.name}>
          <span className="hv-fan-img"><ProductImage product={p} /></span>
          <span className="hv-fan-price">{money(minPrice(p))}</span>
        </Link>
      ))}
    </div>
  );
}

function Wheel({ c }) {
  const nav = useNavigate();
  const { items, n, active, pick } = c;
  // Endless wheel: three copies of the directions; `pos` is the unwrapped
  // index under the needle, snapped back into the middle copy after each turn.
  const [pos, setPos] = useState(0);
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    if (!n) return;
    setPos((p) => {
      const base = p - (((p % n) + n) % n);
      let best = base + active;
      for (const k of [best - n, best + n]) if (Math.abs(k - p) < Math.abs(best - p)) best = k;
      return best;
    });
  }, [active, n]);
  const settle = () => {
    if (pos >= 0 && pos < n) return;
    setSnap(true);
    setPos(((pos % n) + n) % n);
    requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
  };
  const start = useRef(null);
  const moved = useRef(false);
  const onDown = (e) => { start.current = e.clientX; moved.current = false; };
  const onUp = (e) => {
    if (start.current == null) return;
    const dx = e.clientX - start.current; start.current = null;
    if (Math.abs(dx) > 30) { moved.current = true; pick(active + (dx < 0 ? 1 : -1)); }
  };
  const click = (i, it) => { if (moved.current) return; if (i === active) nav(dest(it)); else pick(i); };
  return (
    <div className="hv-wheel-wrap" style={c.cur ? { '--c1': c.cur.c1 } : undefined}>
      <div className="hv-wheel" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { start.current = null; }}>
        <span className="hv-wheel-beam" aria-hidden="true" />
        <div className={`hv-wheel-disc ${snap ? 'is-snap' : ''}`} style={{ '--rot': `calc(${-pos} * var(--step))` }} onTransitionEnd={settle}>
          <span className="hv-wheel-face" aria-hidden="true" />
          <span className="hv-wheel-ticks" aria-hidden="true" />
          <span className="hv-wheel-ticks is-major" aria-hidden="true" />
          {[-1, 0, 1].map((m) => items.map((it, i) => {
            const k = i + m * n;
            const main = m === 0;
            return (
              <button key={`${m}:${keyOf(it) || it.name}`} type="button" className={`hv-wheel-item ${k === pos ? 'is-active' : ''}`} style={{ '--i': k }}
                tabIndex={main ? 0 : -1} aria-hidden={main ? undefined : 'true'}
                onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onClick={() => click(i, it)} aria-label={i === active ? `${it.name} – Sortiment öffnen` : `${it.name} auswählen`}>
                <FranchiseLogo franchise={it} icon={it.Icon} size="lg" />
              </button>
            );
          }))}
        </div>
        <span className="hv-wheel-needle" aria-hidden="true" />
      </div>
      <button type="button" className="hv-wheel-arrow is-prev" onClick={() => pick(active - 1)} aria-label="Vorheriges Spiel"><ChevronLeft size={20} /></button>
      <button type="button" className="hv-wheel-arrow is-next" onClick={() => pick(active + 1)} aria-label="Nächstes Spiel"><ChevronRight size={20} /></button>
    </div>
  );
}

export function HeroWheel({ franchises, freeFrom }) {
  const c = useCompass(franchises, 3400);
  return (
    <Shell variant="b">
      <div className="hero-copy hv-b-copy">
        <h1 className="hero-h1 hv-h1"><H1 /></h1>
        <p className="hero-lead hv-lead">Booster, Displays und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr – neue Sets zum regulären Preis, ohne Scalper-Aufschlag.</p>
        <div className="hero-ctas hv-ctas">
          <Link to={R.shop} className="btn btn-white btn-lg">Zum Shop <ArrowRight size={18} /></Link>
          <Link to={shopPath({ sort: 'new' })} className="hero-link">Neu im Sortiment <ArrowRight size={16} /></Link>
        </div>
        <Facts freeFrom={freeFrom} />
      </div>
      <div className="hv-b-show">
        <Fan c={c} />
        <Readout c={c} />
      </div>
      <Wheel c={c} />
    </Shell>
  );
}

/* ================================================================ C ==== */
function LogoBar({ c }) {
  const { items, active, pick, cur } = c;
  const nav = useNavigate();
  const row = useRef(null);
  const [mark, setMark] = useState(null);
  // needle marker glides above the active tile
  useEffect(() => {
    const el = row.current?.children[active];
    if (!el) return;
    setMark(el.offsetLeft + el.offsetWidth / 2);
    if (row.current.scrollWidth > row.current.clientWidth) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active, items.length]);
  return (
    <div className="hv-bar" style={cur ? { '--c1': cur.c1 } : undefined}>
      <div className="hv-bar-head">
        <span className="hv-bar-ic"><Compass size={18} /></span>
        <strong>Wähle deine Richtung</strong>
        {cur && <Link to={dest(cur)} className="hv-bar-go">{cur.short || cur.name}: {c.list.length} Produkte <ArrowRight size={15} /></Link>}
      </div>
      <div className="hv-bar-track">
        {mark != null && <span className="hv-bar-mark" style={{ transform: `translateX(${mark}px)` }} aria-hidden="true" />}
        <div className="hv-bar-row" ref={row}>
          {items.map((it, i) => (
            <button key={keyOf(it) || it.name} type="button" className={`hv-bar-item ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onClick={() => nav(dest(it))} aria-label={`${it.name} – Sortiment öffnen`}>
              <FranchiseLogo franchise={it} icon={it.Icon} size="lg" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroCalm({ franchises, freeFrom }) {
  const c = useCompass(franchises, 3000);
  const [hi, setHi] = useState(null);
  useEffect(() => { listProducts({ featured: true, sort: 'new', limit: 1 }).then((r) => setHi(r[0] || null)).catch(() => {}); }, []);
  return (
    <>
      <Shell variant="c">
        <div className="hero-copy hv-c-copy">
          <h1 className="hero-h1 hv-h1"><H1 /></h1>
          <p className="hero-lead hv-lead">Booster, Displays und Zubehör – neue Sets zum regulären Preis, ohne Scalper-Aufschlag.</p>
          <div className="hero-ctas hv-ctas">
            <Link to={R.shop} className="btn btn-white btn-lg">Zum Shop <ArrowRight size={18} /></Link>
            <Link to={shopPath({ sort: 'new' })} className="hero-link">Neu im Sortiment <ArrowRight size={16} /></Link>
          </div>
          <Facts freeFrom={freeFrom} />
        </div>
        {hi && (
          <Link to={productPath(hi.slug)} className="hv-c-hi">
            <span className="hv-c-glow" aria-hidden="true" />
            <span className="hv-c-img"><ProductImage product={hi} eager /></span>
            <span className="hv-c-card">
              <span className="hv-c-tag">Highlight</span>
              <strong>{hi.name}</strong>
              <span className="hv-c-price">ab {money(minPrice(hi))} <span>Ansehen <ArrowRight size={15} /></span></span>
            </span>
          </Link>
        )}
      </Shell>
      <div className="container"><LogoBar c={c} /></div>
    </>
  );
}
