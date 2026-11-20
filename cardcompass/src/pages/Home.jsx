// CardCompass start page.
// Signature ideas: (1) the hero compass (components/hero/HeroStage.jsx): the
// franchise logos are its directions and the needle swings to whichever game
// you point at, flanked by that game's products, (2) a booster you can tear
// open to fan out holo cards.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, MousePointerClick, PackageOpen, CreditCard } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import HeroStage from '../components/hero/HeroStage.jsx';
import { listProducts, getFranchises, minPrice, franchiseColors, getShippingRates } from '../lib/catalog.js';
import { usePageMeta, useReveal } from '../lib/hooks.js';
import { money } from '../lib/format.js';

// Whole euro amounts read better without cents in running text ("ab 100 €").
const euro = (c) => (c % 100 === 0 ? `${c / 100} €` : money(c));
import { R, shopPath } from '../lib/routes.js';
import '../styles/home.css';

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  return <Tag ref={ref} className={`reveal ${delay ? `reveal-d${delay}` : ''} ${className}`} {...rest}>{children}</Tag>;
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
  const [franchises, setFranchises] = useState([]);
  const [rate, setRate] = useState(null);
  useEffect(() => {
    getShippingRates().then((r) => setRate(r?.[0] || null)).catch(() => {});
    getFranchises().then((f) => setFranchises(f.map((x) => ({ ...x, ...franchiseColors(x.slug), short: x.short || franchiseColors(x.slug).short || x.name })))).catch(() => {});
  }, []);
  return (
    <div className="home">
      <HeroStage franchises={franchises} freeFrom={rate?.free_from_cents ?? null} />
      <Featured />
      <Categories />
      <PackOpening />
      <Steps rate={rate} />
      <FinalCta />
    </div>
  );
}
