// CardCompass start page.
// Signature ideas: (1) a deep-purple hero with drifting aurora light and a
// rotating compass around which real catalogue products orbit in 3D,
// (2) the "Franchise-Kompass": a dial whose needle swings to whichever game you
// point at, (3) a booster you can tear open to fan out holo cards.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Truck, RotateCcw, MousePointerClick, PackageOpen, CreditCard, Search } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import ProductVisual, { ProductImage } from '../components/ProductVisual.jsx';
import { listProducts, getFranchises, minPrice, franchiseColors } from '../lib/catalog.js';
import { usePageMeta, useReveal, prefersReducedMotion } from '../lib/hooks.js';
import { money } from '../lib/format.js';
import { R, shopPath, productPath } from '../lib/routes.js';
import '../styles/home.css';

const LOGO = `${import.meta.env.BASE_URL}cardcompass-logo.png`;

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  return <Tag ref={ref} className={`reveal ${delay ? `reveal-d${delay}` : ''} ${className}`} {...rest}>{children}</Tag>;
}

/* ---------------------------------------------------------------- hero ---- */
function CompassRings() {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg className="hero-rings" viewBox="0 0 600 600" aria-hidden="true">
      <defs>
        <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="1" stopColor="#e9d5ff" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g className="ring-slow">
        <circle cx="300" cy="300" r="286" fill="none" stroke="url(#ringG)" strokeOpacity=".35" strokeWidth="1.2" />
        {ticks.map((i) => {
          const a = (i / 72) * Math.PI * 2; const long = i % 9 === 0;
          const r1 = long ? 262 : 272; const r2 = 284;
          return <line key={i} x1={300 + Math.cos(a) * r1} y1={300 + Math.sin(a) * r1} x2={300 + Math.cos(a) * r2} y2={300 + Math.sin(a) * r2} stroke="#fff" strokeOpacity={long ? .7 : .3} strokeWidth={long ? 2 : 1} />;
        })}
        {['N', 'O', 'S', 'W'].map((d, i) => {
          const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
          return <text key={d} x={300 + Math.cos(a) * 240} y={300 + Math.sin(a) * 240 + 6} textAnchor="middle" fill="#fff" fillOpacity=".75" fontFamily="Poppins" fontWeight="700" fontSize="17">{d}</text>;
        })}
      </g>
      <g className="ring-rev">
        <circle cx="300" cy="300" r="200" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="300" cy="300" r="150" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="26" />
      </g>
      <g className="needle">
        <path d="M300 92 L318 300 L300 508 L282 300 Z" fill="url(#ringG)" opacity=".55" />
        <path d="M92 300 L300 286 L508 300 L300 314 Z" fill="#fff" opacity=".18" />
      </g>
    </svg>
  );
}

function OrbitProducts({ products }) {
  const ref = useRef(null);
  // Pointer parallax for the whole stage (cheap: CSS vars, rAF-throttled).
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
  }, []);
  const items = products.slice(0, 6);
  return (
    <div className="hero-stage" ref={ref}>
      <div className="hero-glow" />
      <CompassRings />
      <div className="hero-core">
        <span className="hero-core-ring" />
        <img src={LOGO} alt="" width="120" height="120" />
      </div>
      {/* 3D orbit: tilted plane → spinning ring → items placed on the circle;
          each item cancels the ring spin and the tilt so cards face the viewer. */}
      <div className="orbit">
        <div className="orbit-ring">
          {items.map((p, i) => (
            <Link key={p.id} to={productPath(p.slug)} className="orbit-item" style={{ '--a': `${(360 / items.length) * i}deg` }} aria-label={p.name}>
              <span className="orbit-counter">
                <span className="orbit-card">
                  <span className="orbit-img"><ProductImage product={p} /></span>
                  <span className="orbit-price">{money(minPrice(p))}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ products, franchiseCount }) {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-panel">
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-grain" aria-hidden="true" />
          <div className="hero-copy">
            <span className="hero-pill"><Sparkles size={14} /> Trading Cards & Zubehör</span>
            <h1 className="hero-h1">
              Deine nächste <span className="hero-hl">Karte</span> wartet schon auf dich.
            </h1>
            <p className="hero-lead">Booster, Displays, Kollektionen und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr – original versiegelt, sicher bezahlt, schnell bei dir.</p>
            <div className="hero-ctas">
              <Link to={R.shop} className="btn btn-white btn-lg">Jetzt entdecken <ArrowRight size={18} /></Link>
              <Link to={shopPath({ available: true })} className="btn btn-glass btn-lg">Sofort lieferbar</Link>
            </div>
            <ul className="hero-usp">
              <li><ShieldCheck size={16} /> Sicher bezahlen</li>
              <li><Truck size={16} /> Schneller Versand</li>
              <li><RotateCcw size={16} /> 14 Tage Widerruf</li>
            </ul>
            <div className="hero-stats">
              <div><strong>{franchiseCount || 7}</strong><span>Franchises</span></div>
              <div><strong>100 %</strong><span>Originalware</span></div>
              <div><strong>14 Tage</strong><span>Rückgaberecht</span></div>
            </div>
          </div>
          <OrbitProducts products={products} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ marquee ---- */
function Marquee({ franchises }) {
  if (!franchises.length) return null;
  const row = (dup) => franchises.map((f) => (
    <Link key={`${dup}-${f.slug}`} to={shopPath({ franchise: f.slug })} className="mq-item" tabIndex={dup ? -1 : 0} aria-hidden={dup ? 'true' : undefined}>
      <span className="mq-dot" style={{ background: `linear-gradient(135deg, ${f.c1}, ${f.c2})` }} />{f.name}
    </Link>
  ));
  return (
    <div className="mq" aria-label="Franchises">
      <div className="mq-track">{row(0)}{row(1)}</div>
    </div>
  );
}

/* ------------------------------------------------- franchise compass ---- */
function FranchiseCompass({ franchises }) {
  const nav = useNavigate();
  const items = useMemo(() => [...franchises, { slug: '', name: 'Zubehör', short: 'Zubehör', c1: '#c084fc', c2: '#5b00c9', category: 'tcg-zubehoer' }], [franchises]);
  const [active, setActive] = useState(0);
  const n = items.length || 1;
  const angle = (i) => (360 / n) * i;
  const cur = items[active] || items[0];
  const go = (it) => nav(it.category ? shopPath({ category: it.category }) : shopPath({ franchise: it.slug }));
  // Idle: the needle wanders through the directions until the user interacts.
  const touched = useRef(false);
  useEffect(() => {
    if (prefersReducedMotion() || n < 2) return undefined;
    const t = setInterval(() => { if (!touched.current) setActive((a) => (a + 1) % n); }, 2600);
    return () => clearInterval(t);
  }, [n]);
  if (!franchises.length) return null;
  return (
    <section className="section fc-section">
      <div className="container fc-grid">
        <Reveal className="fc-copy">
          <p className="eyebrow">Der Franchise-Kompass</p>
          <h2 className="h2" style={{ marginTop: 10 }}>Wähle deine <span className="grad-text">Richtung.</span></h2>
          <p className="lead" style={{ marginTop: 14 }}>Ob Pokémon, One Piece oder Magic – richte den Kompass auf dein Spiel und finde Booster, Displays und Zubehör in Sekunden.</p>
          <div className="fc-current" style={{ '--c1': cur.c1, '--c2': cur.c2 }}>
            <span className="fc-current-dot" />
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Kurs auf</span>
              <strong>{cur.name}</strong>
            </div>
            <button className="btn btn-primary" onClick={() => go(cur)}>Zum Sortiment <ArrowRight size={17} /></button>
          </div>
          <div className="fc-chips">
            {items.map((it, i) => (
              <button key={it.name} className={`chip ${i === active ? 'is-active' : ''}`} onMouseEnter={() => { touched.current = true; setActive(i); }} onFocus={() => { touched.current = true; setActive(i); }} onClick={() => go(it)}>
                <span className="mega-dot" style={{ background: `linear-gradient(135deg, ${it.c1}, ${it.c2})` }} />{it.short || it.name}
              </button>
            ))}
          </div>
        </Reveal>
        <Reveal className="fc-dial-wrap" delay={1}>
          <div className="fc-dial" style={{ '--c1': cur.c1, '--c2': cur.c2 }}>
            <div className="fc-face" />
            {items.map((it, i) => (
              <button
                key={it.name}
                className={`fc-point ${i === active ? 'is-active' : ''}`}
                style={{ '--a': `${angle(i)}deg`, '--c1': it.c1, '--c2': it.c2 }}
                onMouseEnter={() => { touched.current = true; setActive(i); }}
                onFocus={() => { touched.current = true; setActive(i); }}
                onClick={() => go(it)}
                aria-label={`${it.name} öffnen`}
              >
                <span className="fc-point-inner"><span className="fc-point-dot" /><span className="fc-point-label">{it.short || it.name}</span></span>
              </button>
            ))}
            <div className="fc-needle" style={{ transform: `rotate(${angle(active)}deg)` }} aria-hidden="true">
              <span className="fc-needle-n" /><span className="fc-needle-s" />
            </div>
            <div className="fc-hub"><img src={LOGO} alt="" width="64" height="64" /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------ featured products ---- */
const TABS = [
  { id: 'featured', label: 'Highlights', opts: { featured: true, limit: 8 } },
  { id: 'new', label: 'Neuheiten', opts: { sort: 'new', limit: 8 } },
  { id: 'cheap', label: 'Unter 10 €', opts: { sort: 'price-asc', limit: 8 }, filter: (p) => minPrice(p) < 1000 },
];

function Featured() {
  const [tab, setTab] = useState('featured');
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    const t = TABS.find((x) => x.id === tab);
    setItems(null);
    listProducts(t.opts).then((r) => { if (alive) setItems(t.filter ? r.filter(t.filter) : r); }).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [tab]);
  return (
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Highlights</p>
            <h2 className="h2" style={{ marginTop: 8 }}>Beliebte Produkte</h2>
          </div>
          <div className="seg" role="tablist" aria-label="Produktauswahl">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`seg-btn ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </Reveal>
        <div className="grid-products">
          {items == null
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : items.slice(0, 8).map((p, i) => <div key={p.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}><ProductCard product={p} index={i} /></div>)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <Link to={R.shop} className="btn btn-outline btn-lg">Alle Produkte ansehen <ArrowRight size={18} /></Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ categories ---- */
const CATS = [
  { slug: 'booster-displays', name: 'Booster Displays', text: 'Der große Pull – 24 bis 36 Booster im Original-Display.', visual: { kind: 'display', c1: '#c084fc', c2: '#4c0099', label: 'Displays', sub: 'Versiegelt' }, big: true },
  { slug: 'booster', name: 'Booster', text: 'Einzeln öffnen, sofort Spaß.', visual: { kind: 'booster', c1: '#ff7ad9', c2: '#6d00d6', label: 'Booster', sub: 'Einzeln' } },
  { slug: 'starter-decks', name: 'Starter Decks', text: 'Spielbereit in Minuten.', visual: { kind: 'deck', c1: '#7dd3fc', c2: '#3b0aa8', label: 'Decks', sub: 'Starter' } },
  { slug: 'boxen-und-kollektionen', name: 'Boxen & Kollektionen', text: 'Promos, Booster & Zubehör in einer Box.', visual: { kind: 'box', c1: '#fbbf24', c2: '#7000cc', label: 'Kollektion', sub: 'Box' } },
  { slug: 'tcg-zubehoer', name: 'TCG-Zubehör', text: 'Sleeves, Alben, Deckboxen & Playmats.', visual: { kind: 'sleeves', c1: '#b26bff', c2: '#4c0099', label: 'CardCompass', sub: 'Sleeves' } },
];

function Categories() {
  return (
    <section className="section cat-section">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Kategorien</p>
            <h2 className="h2" style={{ marginTop: 8 }}>Alles für deine Sammlung</h2>
          </div>
          <Link to={R.shop} className="link-arrow">Zum Shop <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="bento">
          {CATS.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(3, i)} className={`bento-cell ${c.big ? 'is-big' : ''}`}>
              <Link to={shopPath({ category: c.slug })} className="bento-tile">
                <div className="bento-text">
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  <span className="link-arrow">Entdecken <ArrowRight size={15} /></span>
                </div>
                <div className="bento-art"><ProductVisual visual={c.visual} /></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- pack opening ---- */
const CARD_HUES = [['#ff7ad9', '#7c3aed'], ['#38e1ff', '#5b21b6'], ['#ffd166', '#9333ea'], ['#7cf5c4', '#6d28d9'], ['#c084fc', '#4c0099']];

function PackOpening() {
  const [open, setOpen] = useState(false);
  return (
    <section className="section pack-section">
      <div className="container pack-grid">
        <Reveal className="pack-copy">
          <p className="eyebrow">Der Moment</p>
          <h2 className="h2" style={{ marginTop: 10 }}>Für dieses Gefühl <span className="grad-text">sammeln wir.</span></h2>
          <p className="lead" style={{ marginTop: 14 }}>Folie auf, Herz klopft, Holo blitzt. Probier's aus – und hol dir danach den echten Booster.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
            <button className="btn btn-primary btn-lg" onClick={() => setOpen((o) => !o)}>
              {open ? 'Nochmal' : 'Booster öffnen'} <PackageOpen size={18} />
            </button>
            <Link to={shopPath({ category: 'booster' })} className="btn btn-outline btn-lg">Booster kaufen</Link>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <button type="button" className={`pack ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-pressed={open} aria-label={open ? 'Booster schließen' : 'Booster öffnen'}>
            <span className="pack-cards" aria-hidden="true">
              {CARD_HUES.map(([a, b], i) => (
                <span key={i} className="pack-card" style={{ '--i': i - 2, '--ay': Math.abs(i - 2), '--c1': a, '--c2': b }}>
                  <span className="pack-card-art" />
                  <span className="pack-card-holo" />
                </span>
              ))}
            </span>
            <span className="pack-wrap" aria-hidden="true">
              <span className="pack-top"><ProductVisual visual={{ kind: 'booster', c1: '#c084fc', c2: '#4c0099', label: 'CardCompass', sub: 'Tear here' }} /></span>
              <span className="pack-bottom"><ProductVisual visual={{ kind: 'booster', c1: '#c084fc', c2: '#4c0099', label: 'CardCompass', sub: 'Tear here' }} /></span>
            </span>
            {!open && <span className="pack-hint"><MousePointerClick size={15} /> Klick zum Öffnen</span>}
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- steps ---- */
const STEPS = [
  { Icon: Search, t: 'Finden', d: 'Stöbere nach Franchise und Kategorie oder nutze die Suche – alles mit Live-Lagerbestand.' },
  { Icon: CreditCard, t: 'Sicher bezahlen', d: 'Karte, PayPal, Klarna, Apple Pay oder SEPA – über die sichere Bezahlseite von Stripe.' },
  { Icon: Truck, t: 'Auspacken', d: 'Wir verpacken alles sammlergerecht und schicken es mit DHL direkt zu dir.' },
];

function Steps() {
  return (
    <section className="section steps-section">
      <div className="container">
        <Reveal className="steps-head">
          <p className="eyebrow">So einfach geht's</p>
          <h2 className="h2" style={{ marginTop: 8 }}>In drei Schritten zur nächsten Karte</h2>
        </Reveal>
        <div className="steps">
          {STEPS.map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i + 1} className="step">
              <span className="step-n">0{i + 1}</span>
              <span className="step-ic"><Icon size={24} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="section-sm">
      <div className="container">
        <Reveal className="final-cta">
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="final-inner">
            <h2 className="h2">Bereit für deinen nächsten Pull?</h2>
            <p>Neue Displays, Booster und Zubehör – entdecke, was heute rausgehen kann.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={R.shop} className="btn btn-white btn-lg">Jetzt shoppen <ArrowRight size={18} /></Link>
              <Link to={R.contact} className="btn btn-glass btn-lg">Frage stellen</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(null, 'CardCompass: Booster, Displays, Kollektionen und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr – sicher bezahlen, schnell geliefert.');
  const [heroProducts, setHeroProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  useEffect(() => {
    listProducts({ featured: true, limit: 6 }).then((r) => setHeroProducts(r.length >= 3 ? r : r)).catch(() => {});
    getFranchises().then((f) => setFranchises(f.map((x) => ({ ...x, ...franchiseColors(x.slug), short: x.short || franchiseColors(x.slug).short || x.name })))).catch(() => {});
  }, []);
  return (
    <div className="home">
      <Hero products={heroProducts} franchiseCount={franchises.length} />
      <Marquee franchises={franchises} />
      <Featured />
      <FranchiseCompass franchises={franchises} />
      <Categories />
      <PackOpening />
      <Steps />
      <FinalCta />
    </div>
  );
}
