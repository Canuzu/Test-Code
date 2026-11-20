// CardCompass start page.
// Signature ideas: (1) a deep-purple hero with drifting aurora light and a
// rotating compass around which real catalogue products orbit in 3D,
// (2) the "Franchise-Kompass": a dial whose needle swings to whichever game you
// point at, (3) a booster you can tear open to fan out holo cards.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, MousePointerClick, PackageOpen, CreditCard, Layers } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import ProductVisual, { ProductImage } from '../components/ProductVisual.jsx';
import FranchiseLogo from '../components/FranchiseLogo.jsx';
import { listProducts, getFranchises, minPrice, franchiseColors, getShippingRates } from '../lib/catalog.js';
import { usePageMeta, useReveal, prefersReducedMotion } from '../lib/hooks.js';
import { money } from '../lib/format.js';

// Whole euro amounts read better without cents in running text ("ab 100 €").
const euro = (c) => (c % 100 === 0 ? `${c / 100} €` : money(c));
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

function Hero({ products, freeFrom }) {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-panel">
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-grain" aria-hidden="true" />
          <div className="hero-copy">
            <h1 className="hero-h1">
              Deine nächste <span className="hero-hl">Karte</span> wartet schon auf dich.
            </h1>
            <p className="hero-lead">Booster, Displays und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr. Neue Sets bekommst du bei uns zum regulären Preis – ohne Scalper-Aufschlag.</p>
            <div className="hero-ctas">
              <Link to={R.shop} className="btn btn-white btn-lg">Zum Shop <ArrowRight size={18} /></Link>
              <Link to={shopPath({ sort: 'new' })} className="hero-link">Neu im Sortiment <ArrowRight size={16} /></Link>
            </div>
            <p className="hero-facts">
              {freeFrom != null && <span>Versandkostenfrei ab {euro(freeFrom)}</span>}
              <span>Schneller Versand</span>
              <span>14 Tage Widerrufsrecht</span>
            </p>
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
      <FranchiseLogo franchise={f} size="sm" />{f.name}
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
  const items = useMemo(() => [...franchises, { slug: '', name: 'Zubehör', short: 'Zubehör', c1: '#c084fc', c2: '#5b00c9', category: 'tcg-zubehoer', Icon: Layers }], [franchises]);
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
          <h2 className="h2">Wähle deine <span className="grad-text">Richtung.</span></h2>
          <p className="lead" style={{ marginTop: 14 }}>Such dir dein Spiel aus – dann siehst du alles, was es dafür bei uns gibt.</p>
          <div className="fc-current" style={{ '--c1': cur.c1, '--c2': cur.c2 }}>
            <FranchiseLogo key={cur.name} franchise={cur} icon={cur.Icon} size="md" className="fc-current-logo" />
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Kurs auf</span>
              <strong>{cur.name}</strong>
            </div>
            <button className="btn btn-primary" onClick={() => go(cur)}>Zum Sortiment <ArrowRight size={17} /></button>
          </div>
          <div className="fc-chips">
            {items.map((it, i) => (
              <button key={it.name} className={`chip ${i === active ? 'is-active' : ''}`} onMouseEnter={() => { touched.current = true; setActive(i); }} onFocus={() => { touched.current = true; setActive(i); }} onClick={() => go(it)}>
                {it.short || it.name}
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
                <span className="fc-point-inner"><FranchiseLogo franchise={it} icon={it.Icon} size="lg" /></span>
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
            <h2 className="h2">Beliebte Produkte</h2>
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
            : items.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
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
  { slug: 'booster-displays', name: 'Booster Displays', text: '24 bis 36 Booster im Original-Display.', visual: { kind: 'display', c1: '#c084fc', c2: '#4c0099', label: 'Displays', sub: 'Versiegelt' }, big: true },
  { slug: 'booster', name: 'Booster', text: 'Einzelne Booster zum Ausprobieren.', visual: { kind: 'booster', c1: '#ff7ad9', c2: '#6d00d6', label: 'Booster', sub: 'Einzeln' } },
  { slug: 'starter-decks', name: 'Starter Decks', text: 'Fertige Decks zum direkten Losspielen.', visual: { kind: 'deck', c1: '#7dd3fc', c2: '#3b0aa8', label: 'Decks', sub: 'Starter' } },
  { slug: 'boxen-und-kollektionen', name: 'Boxen & Kollektionen', text: 'Promos, Booster & Zubehör in einer Box.', visual: { kind: 'box', c1: '#fbbf24', c2: '#7000cc', label: 'Kollektion', sub: 'Box' } },
  { slug: 'tcg-zubehoer', name: 'TCG-Zubehör', text: 'Sleeves, Alben, Deckboxen & Playmats.', visual: { kind: 'sleeves', c1: '#b26bff', c2: '#4c0099', label: 'CardCompass', sub: 'Sleeves' } },
];

function Categories() {
  return (
    <section className="section cat-section">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <h2 className="h2">Alles für deine Sammlung</h2>
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
          <h2 className="h2">Kurz mal <span className="grad-text">aufreißen?</span></h2>
          <p className="lead" style={{ marginTop: 14 }}>Tipp auf den Booster. Den echten gibt’s im Shop.</p>
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
// "Gut zu wissen": the facts people check before buying – no slogans.
function Steps({ rate }) {
  const facts = [
    {
      Icon: Truck, t: 'Versand',
      d: rate
        ? `${money(rate.price_cents)} innerhalb Deutschlands${rate.free_from_cents != null ? `, ab ${euro(rate.free_from_cents)} versandkostenfrei` : ''}. Deine Bestellung geht zügig raus.`
        : 'Deine Bestellung geht zügig raus.',
      link: null,
    },
    { Icon: CreditCard, t: 'Bezahlen', d: 'Karte, PayPal, Klarna, Apple Pay, Google Pay oder SEPA – über die Bezahlseite von Stripe.', link: null },
    { Icon: RotateCcw, t: 'Rückgabe', d: '14 Tage Widerrufsrecht. Den Widerruf kannst du direkt hier online erklären.', link: { to: R.widerruf, label: 'Zum Widerrufsformular' } },
  ];
  return (
    <section className="section steps-section">
      <div className="container">
        <Reveal className="steps-head">
          <h2 className="h2">Gut zu wissen</h2>
        </Reveal>
        <div className="steps">
          {facts.map(({ Icon, t, d, link }, i) => (
            <Reveal key={t} delay={i + 1} className="step">
              <span className="step-ic"><Icon size={22} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
              {link && <Link to={link.to} className="link-arrow step-link">{link.label} <ArrowRight size={15} /></Link>}
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
            <h2 className="h2">Fragen zu einem Produkt?</h2>
            <p>Schreib uns – wir melden uns so schnell wie möglich.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={R.contact} className="btn btn-white btn-lg">Kontakt aufnehmen <ArrowRight size={18} /></Link>
              <Link to={R.shop} className="btn btn-glass btn-lg">Zum Shop</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(null, 'CardCompass: Booster, Displays und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr – neue Sets zum regulären Preis, schneller Versand.');
  const [heroProducts, setHeroProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [rate, setRate] = useState(null);
  useEffect(() => {
    getShippingRates().then((r) => setRate(r?.[0] || null)).catch(() => {});
    listProducts({ featured: true, limit: 6 }).then((r) => setHeroProducts(r.length >= 3 ? r : r)).catch(() => {});
    getFranchises().then((f) => setFranchises(f.map((x) => ({ ...x, ...franchiseColors(x.slug), short: x.short || franchiseColors(x.slug).short || x.name })))).catch(() => {});
  }, []);
  return (
    <div className="home">
      <Hero products={heroProducts} freeFrom={rate?.free_from_cents ?? null} />
      <Marquee franchises={franchises} />
      <Featured />
      <FranchiseCompass franchises={franchises} />
      <Categories />
      <PackOpening />
      <Steps rate={rate} />
      <FinalCta />
    </div>
  );
}
