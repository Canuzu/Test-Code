// Warenkorb (/warenkorb): lines on the left, sticky summary on the right,
// sticky checkout bar on phones. Also exports the small building blocks the
// checkout and result pages share (progress steps, totals, payment methods).
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ShoppingBag, ArrowRight, ArrowLeft, ChevronRight, Info } from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { CartLine, FreeShippingMeter } from '../components/CartDrawer.jsx';
import { TRUST } from '../components/Footer.jsx';
import { getShippingRates, getSettings, shippingFor } from '../lib/catalog.js';
import { money } from '../lib/format.js';
import { usePageMeta } from '../lib/hooks.js';
import { R } from '../lib/routes.js';
import { SHOP } from '../lib/config.js';
import '../styles/checkout.css';

export const PAYMENT_METHODS = ['Karte', 'PayPal', 'Klarna', 'Apple Pay', 'Google Pay', 'SEPA'];
export const TAX_NOTE = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).';

// Shipping rates + Kleinunternehmer setting (live from Supabase, demo otherwise).
export function useShopInfo() {
  const [rates, setRates] = useState(null);
  const [smallBusiness, setSmallBusiness] = useState(SHOP.smallBusiness);
  useEffect(() => {
    let alive = true;
    getShippingRates().then((r) => { if (alive) setRates(r?.length ? r : SHOP.shipping); }).catch(() => { if (alive) setRates(SHOP.shipping); });
    getSettings().then((s) => { if (alive) setSmallBusiness(!!s?.smallBusiness); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { rates, smallBusiness };
}

const STEPS = ['Warenkorb', 'Daten', 'Bezahlen'];

// 3-step progress indicator. current: 0 Warenkorb, 1 Daten, 2 Bezahlen, 3 = all done.
export function CheckoutSteps({ current = 0 }) {
  return (
    <ol className="co-steps" aria-label="Bestellfortschritt">
      {STEPS.map((label, i) => {
        const done = i < current;
        const now = i === current;
        const inner = (
          <>
            <span className="co-step-dot" aria-hidden="true">{done ? <Check size={13} strokeWidth={2.75} /> : i + 1}</span>
            <span className="co-step-label">{label}</span>
            {done && <span className="sr-only"> (erledigt)</span>}
          </>
        );
        return (
          <li key={label} className={`co-step ${done ? 'is-done' : ''} ${now ? 'is-current' : ''}`} aria-current={now ? 'step' : undefined}>
            {done && i === 0 && current < 3 ? <Link to={R.cart} className="co-step-in">{inner}</Link> : <span className="co-step-in">{inner}</span>}
          </li>
        );
      })}
    </ol>
  );
}

// Zwischensumme / Ersparnis / Versand / Gesamt.
export function SummaryTotals({ subtotal, savings = 0, ship, count, smallBusiness }) {
  return (
    <div className="co-totals">
      <dl>
        <div className="co-row"><dt>Zwischensumme{count ? <small> ({count} Artikel)</small> : null}</dt><dd>{money(subtotal)}</dd></div>
        {savings > 0 && (
          <div className="co-row is-save"><dt>Deine Ersparnis</dt><dd>{money(savings)}</dd></div>
        )}
        <div className="co-row">
          <dt>Versand{ship?.name ? <small className="co-row-sub">{ship.name}</small> : null}</dt>
          <dd>{ship.cents === 0 ? <span className="co-free">kostenlos</span> : money(ship.cents)}</dd>
        </div>
        <div className="co-row co-total"><dt>Gesamt</dt><dd>{money(subtotal + ship.cents)}</dd></div>
      </dl>
      {smallBusiness && <p className="co-tax">{TAX_NOTE}</p>}
    </div>
  );
}

// Accepted payment methods as one plain line of text (no logos, no chips).
export function PayMethods({ label = 'Sicher bezahlen mit' }) {
  return (
    <p className="co-pay">
      <span className="co-pay-label">{label}</span>
      <span>{PAYMENT_METHODS.join(' · ')}</span>
    </p>
  );
}

export function TrustList() {
  return (
    <ul className="co-trust">
      {TRUST.map(({ Icon, t, d }) => (
        <li key={t}><span className="co-trust-ic"><Icon size={17} strokeWidth={1.75} aria-hidden="true" /></span><span><strong>{t}</strong><small>{d}</small></span></li>
      ))}
    </ul>
  );
}

export function CartEmpty({ title = 'Dein Warenkorb ist leer', text = 'Entdecke Displays, Booster und Zubehör – deine nächste Karte wartet schon.' }) {
  return (
    <div className="container co-empty fade-up">
      <div className="empty-ic co-empty-ic"><ShoppingBag size={34} aria-hidden="true" /></div>
      <h1 className="h2">{title}</h1>
      <p className="lead">{text}</p>
      <div className="co-empty-actions">
        <Link to={R.shop} className="btn btn-primary btn-lg">Zum Shop <ArrowRight size={18} aria-hidden="true" /></Link>
        <Link to={R.home} className="btn btn-outline btn-lg">Startseite</Link>
      </div>
    </div>
  );
}

export default function Cart() {
  usePageMeta('Warenkorb', 'Dein Warenkorb bei CardCompass – prüfe deine Artikel und gehe sicher zur Kasse.');
  const { lines, count, subtotal, savings } = useCart();
  const { rates, smallBusiness } = useShopInfo();
  const nav = useNavigate();
  const ctaRef = useRef(null);
  const [showBar, setShowBar] = useState(false);
  const ship = shippingFor(subtotal, rates);
  const total = subtotal + ship.cents;

  // Phone: show the sticky checkout bar while the summary's button is still
  // below the viewport (hide once it is visible or scrolled past).
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => {
      setShowBar(!e.isIntersecting && e.boundingClientRect.top > 0);
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [lines.length > 0]);

  if (!lines.length) {
    return (
      <div className="co-page">
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="co-page">
      <section className="page-hero co-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Brotkrumen">
            <Link to={R.home}>Startseite</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Warenkorb</span>
          </nav>
          <div className="co-hero-row">
            <div>
              <p className="eyebrow">Schritt 1 von 3</p>
              <h1 className="h2 co-title">Dein Warenkorb <span className="co-count">{count} Artikel</span></h1>
            </div>
            <CheckoutSteps current={0} />
          </div>
        </div>
      </section>

      <div className="container co-grid">
        <div className="co-main">
          <section className="co-lines" aria-label="Artikel im Warenkorb">
            <div className="co-lines-head">
              <span className="co-lines-title">Artikel</span>
              <Link to={R.shop} className="co-back"><ArrowLeft size={16} aria-hidden="true" /> Weiter einkaufen</Link>
            </div>
            <div className="co-lines-list">
              {lines.map((l) => <CartLine key={l.variantId} line={l} />)}
            </div>
          </section>
          <p className="co-hint-row muted">
            <Info size={14} aria-hidden="true" /> Artikel im Warenkorb werden erst mit Abschluss der Bezahlung für dich reserviert.
          </p>
        </div>

        <aside className="co-aside" aria-label="Zusammenfassung">
          <div className="card co-sum">
            <h2 className="co-sum-title">Zusammenfassung</h2>
            <SummaryTotals subtotal={subtotal} savings={savings} ship={ship} count={count} smallBusiness={smallBusiness} />
            <FreeShippingMeter subtotal={subtotal} rates={rates} />
            <button ref={ctaRef} type="button" className="btn btn-primary btn-lg btn-block co-cta" onClick={() => nav(R.checkout)}>
              Zur Kasse <ArrowRight size={18} aria-hidden="true" className="co-cta-arrow" />
            </button>
            <PayMethods />
          </div>
          <TrustList />
        </aside>
      </div>

      <div className={`co-sticky ${showBar ? 'is-on' : ''}`} aria-hidden={!showBar}>
        <div className="co-sticky-sum">
          <small>Gesamt{ship.cents === 0 ? ' · versandkostenfrei' : ' inkl. Versand'}</small>
          <strong>{money(total)}</strong>
        </div>
        <button type="button" className="btn btn-primary co-sticky-btn" onClick={() => nav(R.checkout)} tabIndex={showBar ? 0 : -1}>
          Zur Kasse <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
