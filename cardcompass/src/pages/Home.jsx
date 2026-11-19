// CardCompass start page – reduced, editorial.
//   1. Hero: the promise (fair prices, no scalping) + one product in focus,
//      staged in front of a fine-line compass rose.
//   2. New arrivals: one row of uniform tiles.
//   3. Manifesto: "Fair statt Scalping" as a single confident colour block.
//   4. Franchise compass: a typographic list; the needle follows your pointer.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { ProductImage } from '../components/ProductVisual.jsx';
import { listProducts, getFranchises, minPrice, defaultVariant, fairLimit } from '../lib/catalog.js';
import { usePageMeta, useReveal } from '../lib/hooks.js';
import { money } from '../lib/format.js';
import { R, shopPath, productPath } from '../lib/routes.js';
import '../styles/home.css';

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  return <Tag ref={ref} className={`reveal ${delay ? `reveal-d${delay}` : ''} ${className}`} {...rest}>{children}</Tag>;
}

/* Fine-line compass rose (brand mark at scale). `angle` turns the needle. */
function CompassRose({ angle = 0, points = [], active = -1, className = '' }) {
  const ticks = Array.from({ length: 120 }, (_, i) => i);
  const R0 = 250;
  return (
    <svg viewBox="0 0 600 600" className={`rose ${className}`} aria-hidden="true">
      <circle cx="300" cy="300" r={R0} className="rose-line" />
      <circle cx="300" cy="300" r={R0 - 34} className="rose-line rose-faint" />
      <circle cx="300" cy="300" r="118" className="rose-line rose-faint" />
      {ticks.map((i) => {
        const a = (i / 120) * Math.PI * 2;
        const long = i % 10 === 0;
        const r1 = R0 - (long ? 16 : 8);
        return <line key={i} x1={300 + Math.cos(a) * r1} y1={300 + Math.sin(a) * r1} x2={300 + Math.cos(a) * R0} y2={300 + Math.sin(a) * R0} className={long ? 'rose-tick-l' : 'rose-tick'} />;
      })}
      {['N', 'O', 'S', 'W'].map((d, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        return <text key={d} x={300 + Math.cos(a) * (R0 - 52)} y={300 + Math.sin(a) * (R0 - 52) + 6} className="rose-letter">{d}</text>;
      })}
      {points.map((p, i) => {
        const a = (p.deg - 90) * Math.PI / 180;
        return <circle key={p.key} cx={300 + Math.cos(a) * R0} cy={300 + Math.sin(a) * R0} r={i === active ? 7 : 4} className={`rose-point ${i === active ? 'is-active' : ''}`} />;
      })}
      <g className="rose-needle" style={{ transform: `rotate(${angle}deg)` }}>
        <path d="M300 62 L309 300 L291 300 Z" className="rose-n" />
        <path d="M291 300 L309 300 L300 470 Z" className="rose-s" />
      </g>
      <circle cx="300" cy="300" r="9" className="rose-hub" />
    </svg>
  );
}

/* ------------------------------------------------------------------ hero -- */
function Hero({ focus }) {
  const v = defaultVariant(focus);
  const limit = fairLimit(v);
  return (
    <section className="h-hero">
      <div className="container h-hero-grid">
        <div className="h-hero-copy">
          <p className="eyebrow">Trading Cards & Zubehör</p>
          <h1 className="h-title">Faire Preise.<br /><span>Kein Scalping.</span></h1>
          <p className="h-lead">
            Booster, Displays und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr. Hype-Releases verkaufen wir
            zum regulären Preis – mit Fair-Limit pro Bestellung und schnellem Versand.
          </p>
          <div className="h-ctas">
            <Link to={R.shop} className="btn btn-primary btn-lg">Zum Shop <ArrowRight size={18} /></Link>
            <Link to={shopPath({ sort: 'new' })} className="btn btn-outline btn-lg">Neuheiten</Link>
          </div>
        </div>
        <div className="h-stage">
          <CompassRose className="h-rose" angle={34} />
          {focus ? (
            <Link to={productPath(focus.slug)} className="h-focus" aria-label={`${focus.name} ansehen`}>
              <span className="h-focus-img"><ProductImage product={focus} eager /></span>
            </Link>
          ) : <span className="h-focus-img skeleton" />}
          {focus && (
            <Link to={productPath(focus.slug)} className="h-caption">
              <span className="h-caption-k">Im Fokus</span>
              <span className="h-caption-name">{focus.name}</span>
              <span className="h-caption-meta">
                <strong>{money(minPrice(focus))}</strong>
                {limit && <span>Fair-Limit {limit} pro Bestellung</span>}
              </span>
              <ArrowUpRight size={20} className="h-caption-arrow" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- new arrivals -- */
function NewArrivals({ items }) {
  return (
    <section className="section h-new">
      <div className="container">
        <Reveal className="section-head">
          <h2 className="h2">Neu eingetroffen</h2>
          <Link to={shopPath({ sort: 'new' })} className="link-arrow">Alle Neuheiten <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="h-row">
          {items == null
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ manifesto -- */
const PROMISES = [
  { t: 'Regulärer Preis', d: 'Auch bei begehrten Releases verlangen wir den normalen Verkaufspreis – keinen Hype-Aufschlag.' },
  { t: 'Fair-Limit', d: 'Gefragte Produkte gibt es in begrenzter Stückzahl pro Bestellung. So kommen Sammler zum Zug, nicht Reseller.' },
  { t: 'Schneller Versand', d: 'Deine Bestellung geht zügig raus – damit du nicht länger warten musst als nötig.' },
];

function Manifesto() {
  return (
    <section className="h-manifesto">
      <div className="container h-manifesto-grid">
        <Reveal className="h-manifesto-head">
          <p className="h-manifesto-k">Unser Versprechen</p>
          <h2>Fair statt Scalping.</h2>
        </Reveal>
        <div className="h-promises">
          {PROMISES.map((p, i) => (
            <Reveal key={p.t} delay={i + 1} className="h-promise">
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ franchise compass -- */
function FranchiseCompass({ franchises, counts }) {
  const items = useMemo(() => franchises.map((f, i) => ({ ...f, key: f.slug, deg: (360 / franchises.length) * i })), [franchises]);
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  return (
    <section className="section h-compass">
      <div className="container h-compass-grid">
        <div>
          <Reveal className="section-head">
            <h2 className="h2">Finde dein Spiel</h2>
          </Reveal>
          <ul className="h-flist">
            {items.map((f, i) => (
              <li key={f.slug}>
                <Link
                  to={shopPath({ franchise: f.slug })}
                  className={`h-fitem ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                >
                  <span className="h-fname">{f.name}</span>
                  <span className="h-fcount">{counts[f.slug] ?? 0} {(counts[f.slug] ?? 0) === 1 ? 'Produkt' : 'Produkte'}</span>
                  <ArrowRight size={18} className="h-farrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-compass-dial">
          <CompassRose angle={items[active]?.deg ?? 0} points={items} active={active} />
          <div className="h-compass-label">
            <span>Kurs auf</span>
            <strong>{items[active]?.name}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(null, 'CardCompass: Booster, Displays und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr – faire Preise statt Scalping, schneller Versand.');
  const [focus, setFocus] = useState(null);
  const [newItems, setNewItems] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let alive = true;
    listProducts({ featured: true, available: true }).then((r) => {
      if (!alive) return;
      // Prefer a featured display/box with a Fair-Limit for the hero.
      const pick = r.find((p) => fairLimit(defaultVariant(p)) && ['display', 'box'].includes(p.visual?.kind)) || r[0] || null;
      setFocus(pick);
    }).catch(() => {});
    listProducts({ sort: 'new', available: true, limit: 4 }).then((r) => alive && setNewItems(r)).catch(() => alive && setNewItems([]));
    Promise.all([getFranchises(), listProducts({})]).then(([fr, all]) => {
      if (!alive) return;
      const c = {};
      all.forEach((p) => { const s = p.franchise?.slug; if (s) c[s] = (c[s] || 0) + 1; });
      setFranchises(fr); setCounts(c);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="home">
      <Hero focus={focus} />
      <NewArrivals items={newItems} />
      <Manifesto />
      <FranchiseCompass franchises={franchises} counts={counts} />
    </div>
  );
}
