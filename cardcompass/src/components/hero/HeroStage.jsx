// Start-page hero ("Kompass-Bühne"): the compass is the centrepiece. The
// franchise logos are its directions; the needle (with a light beam) swings to
// the one you point at – on its own while idle – products of that franchise
// flank the compass and the "Kurs auf" readout leads straight to its range.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import FranchiseLogo from '../FranchiseLogo.jsx';
import { ProductImage } from '../ProductVisual.jsx';
import { listProducts, minPrice } from '../../lib/catalog.js';
import { prefersReducedMotion } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { R, shopPath, productPath } from '../../lib/routes.js';

const LOGO = `${import.meta.env.BASE_URL}cardcompass-logo.png`;
const ACCESSORIES = { slug: '', name: 'Zubehör', short: 'Zubehör', c1: '#c084fc', c2: '#5b00c9', category: 'tcg-zubehoer', Icon: Layers };
const keyOf = (it) => it.category || it.slug;
const dest = (it) => (it.category ? shopPath({ category: it.category }) : shopPath({ franchise: it.slug }));
const euro = (c) => (c % 100 === 0 ? `${c / 100} €` : money(c));

// Directions, the active one, its products, and the idle wandering.
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

// Pointer parallax for the compass (CSS vars, rAF-throttled).
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

function Dial({ c }) {
  const nav = useNavigate();
  const ref = useRef(null);
  useParallax(ref);
  const { items, n, active, pick, cur } = c;
  // Even counts: shift by half a step so no tile sits exactly at 6 o'clock.
  const offset = n % 2 === 0 ? 180 / n : 0;
  const angle = (i) => offset + (360 / n) * i;
  const [deg, setDeg] = useState(0);
  // Needle: always turn the short way round.
  useEffect(() => {
    if (!n) return;
    const t = angle(active);
    setDeg((d) => d + ((((t - d) % 360) + 540) % 360) - 180);
  }, [active, n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="hc hero-center-dial" ref={ref} style={cur ? { '--c1': cur.c1, '--c2': cur.c2 } : undefined}>
      <div className="hc-box">
        <div className="hero-stage">
          <div className="hero-glow" />
          <Rings />
          {n > 0 && (
            <div className="hc-rot" style={{ transform: `rotate(${deg}deg)` }} aria-hidden="true">
              <span className="hc-beam" />
              <svg className="hc-needle" viewBox="0 0 600 600">
                <defs>
                  <linearGradient id="hcNorth" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--c1) 70%, #fff)' }} />
                  </linearGradient>
                </defs>
                <path d="M300 96 L317 300 L283 300 Z" fill="url(#hcNorth)" />
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

function Readout({ c }) {
  const { cur, list, from } = c;
  if (!cur) return null;
  return (
    <Link to={dest(cur)} className="hc-readout" style={{ '--c1': cur.c1, '--c2': cur.c2 }}>
      <FranchiseLogo key={keyOf(cur)} franchise={cur} icon={cur.Icon} size="md" className="hc-readout-logo" />
      <span className="hc-readout-txt">
        <span className="hc-readout-k">Kurs auf</span>
        <strong>{cur.short || cur.name}</strong>
        <span className="hc-readout-meta">{list.length ? `${list.length} ${list.length === 1 ? 'Produkt' : 'Produkte'}${from != null ? ` · ab ${money(from)}` : ''}` : ' '}</span>
      </span>
      <span className="hc-readout-go"><span className="hc-readout-go-t">Zum Sortiment</span><ArrowRight size={18} /></span>
    </Link>
  );
}

function MiniProduct({ p, i }) {
  return (
    <Link to={productPath(p.slug)} className="hero-mini" style={{ '--i': i }}>
      <span className="hero-mini-img"><ProductImage product={p} /></span>
      <span className="hero-mini-txt"><span className="hero-mini-name">{p.name}</span><strong className="hero-mini-price">{money(minPrice(p))}</strong></span>
    </Link>
  );
}

export default function HeroStage({ franchises, freeFrom }) {
  const c = useCompass(franchises);
  const prods = c.list.slice(0, 4);
  const k = c.cur ? keyOf(c.cur) : '';
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-panel hero-center">
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-grain" aria-hidden="true" />
          <div className="hero-center-head">
            <h1 className="hero-h1">Deine nächste <span className="hero-hl">Karte</span> wartet schon auf dich.</h1>
            <p className="hero-lead">Booster, Displays und Zubehör – neue Sets zum regulären Preis, ohne Scalper-Aufschlag.</p>
          </div>
          <div className="hero-center-row">
            <div className="hero-center-side is-left" key={`l${k}`}>{prods.filter((_, i) => i % 2 === 0).map((p, i) => <MiniProduct key={p.id} p={p} i={i} />)}</div>
            <Dial c={c} />
            <div className="hero-center-side is-right" key={`r${k}`}>{prods.filter((_, i) => i % 2 === 1).map((p, i) => <MiniProduct key={p.id} p={p} i={i + 1} />)}</div>
          </div>
          <div className="hero-center-foot">
            <Readout c={c} />
            <Link to={R.shop} className="hero-link">Alle Produkte <ArrowRight size={16} /></Link>
          </div>
          <p className="hero-facts">
            {freeFrom != null && <span>Versandkostenfrei ab {euro(freeFrom)}</span>}
            <span>Schneller Versand</span>
            <span>14 Tage Widerrufsrecht</span>
          </p>
        </div>
      </div>
    </section>
  );
}
