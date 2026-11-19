// /kasse/danke (status="success") and /kasse/abgebrochen (status="cancel").
// Success: a calm confirmation – check mark in a square tile, order number in
// a bordered box, the next steps as a numbered list. The cart and checkout
// draft are cleared when we arrive from Stripe (?session_id=cs_…) or from the
// demo flow.
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Copy, Info, PackageSearch, ShoppingBag, UserRound, Lock,
} from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { money } from '../lib/format.js';
import { usePageMeta } from '../lib/hooks.js';
import { R } from '../lib/routes.js';
import { clearDraft, lastOrderNumber } from '../lib/checkout.js';
import { ProductImage } from '../components/ProductVisual.jsx';
import { CheckoutSteps } from './Cart.jsx';
import '../styles/checkout.css';

// Only show things that look like our order numbers (no arbitrary URL text).
const cleanOrderNo = (s) => (typeof s === 'string' && /^CC-[A-Z0-9-]{4,32}$/i.test(s) ? s.toUpperCase() : null);
const isSessionId = (s) => typeof s === 'string' && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(s);

const NEXT_STEPS = [
  { t: 'Bestätigung per E-Mail', d: 'Schau auch im Spam-Ordner nach, falls sie nicht gleich ankommt. Bei SEPA-Lastschrift kann die Zahlungsbestätigung einige Werktage dauern.' },
  { t: 'Wir packen', d: 'Wir bereiten deine Bestellung für den Versand vor.' },
  { t: 'Schneller Versand', d: 'Deine Bestellung geht zügig raus – direkt an deine Lieferadresse.' },
];

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard blocked – number stays selectable */ }
  };
  return (
    <button type="button" className="co-copy" onClick={copy} aria-label={done ? 'Bestellnummer kopiert' : 'Bestellnummer kopieren'}>
      {done ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{done ? 'Kopiert' : 'Kopieren'}</span>
    </button>
  );
}

function Success() {
  usePageMeta('Danke für deine Bestellung');
  const [params] = useSearchParams();
  const { state } = useLocation();
  const { clear } = useCart();
  const sessionId = params.get('session_id');
  const demoParam = params.get('demo');
  const isDemo = !!(cleanOrderNo(demoParam) || state?.demo);
  const fromStripe = isSessionId(sessionId);
  const confirmed = isDemo || fromStripe;
  const orderNumber = cleanOrderNo(params.get('order')) || cleanOrderNo(demoParam) || cleanOrderNo(state?.orderNumber) || (fromStripe ? cleanOrderNo(lastOrderNumber()) : null);
  const email = typeof state?.email === 'string' ? state.email : '';

  useEffect(() => {
    if (!confirmed) return;
    clear();
    clearDraft();
  }, [confirmed, clear]);

  if (!confirmed) {
    return (
      <div className="co-page">
        <div className="container co-empty fade-up">
          <div className="empty-ic co-empty-ic"><PackageSearch size={32} aria-hidden="true" /></div>
          <h1 className="h2">Keine aktuelle Bestellung gefunden</h1>
          <p className="lead">Wenn du gerade bestellt hast, findest du die Bestätigung in deinem E-Mail-Postfach. Deine Bestellungen siehst du auch in deinem Kundenkonto.</p>
          <div className="co-empty-actions">
            <Link to={R.shop} className="btn btn-primary btn-lg">Zum Shop <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link to={R.account} className="btn btn-outline btn-lg">Mein Konto</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      <section className="page-hero co-result-hero">
        <div className="container">
          {isDemo && (
            <div className="co-alert is-info co-result-demo" role="note">
              <Info size={18} aria-hidden="true" />
              <div><strong>Vorschau – es wurde nichts bestellt oder bezahlt</strong><span>So sieht die Bestätigung nach einer echten Bestellung aus.</span></div>
            </div>
          )}
          <span className="co-badge" aria-hidden="true"><Check size={28} strokeWidth={2.5} /></span>
          <p className="eyebrow">Bestellung eingegangen</p>
          <h1 className="h1 co-result-title">Danke für deine Bestellung!</h1>
          <p className="lead co-result-lead">
            Du erhältst gleich eine Bestätigung per E-Mail{email ? <> an <strong className="co-mail">{email}</strong></> : null}.
          </p>
          {orderNumber && (
            <div className="co-orderno">
              <span className="co-orderno-k">Bestellnummer</span>
              <strong className="co-orderno-v">{orderNumber}</strong>
              <CopyButton text={orderNumber} />
            </div>
          )}
          {isDemo && Number.isFinite(state?.total) && <p className="muted co-result-total">Simulierter Bestellwert: {money(state.total)}</p>}
        </div>
      </section>

      <section className="container co-result-body" aria-labelledby="co-next-h">
        <div className="section-head"><h2 id="co-next-h" className="h3">So geht es weiter</h2></div>
        <ol className="co-next">
          {NEXT_STEPS.map(({ t, d }) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
        </ol>
        <div className="co-result-actions">
          <Link to={R.shop} className="btn btn-primary btn-lg">Weiter einkaufen <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link to={R.account} className="btn btn-outline btn-lg"><UserRound size={18} aria-hidden="true" /> Zu meinem Konto</Link>
        </div>
        <p className="co-result-help muted">
          Fragen zu deiner Bestellung? <Link to={R.contact}>Schreib uns</Link>{orderNumber ? ' – gib dabei gern deine Bestellnummer an.' : '.'}
        </p>
      </section>
    </div>
  );
}

function Cancelled() {
  usePageMeta('Bezahlung abgebrochen');
  const { lines, count, subtotal } = useCart();
  return (
    <div className="co-page">
      <section className="page-hero co-result-hero">
        <div className="container">
          <CheckoutSteps current={2} />
          <p className="eyebrow">Keine Sorge</p>
          <h1 className="h2 co-result-title">Bezahlung abgebrochen – dein Warenkorb ist noch da</h1>
          <p className="lead co-result-lead">Es wurde nichts berechnet. Du kannst es jederzeit noch einmal versuchen – gern auch mit einer anderen Zahlart.</p>
        </div>
      </section>

      <div className="container co-result-body">
        {lines.length > 0 ? (
          <div className="card co-cancel-cart">
            <div className="co-cancel-thumbs" aria-hidden="true">
              {lines.slice(0, 4).map((l) => (
                <span key={l.variantId} className="co-thumb"><ProductImage product={{ name: l.name, visual: l.visual, images: l.image ? [{ url: l.image }] : [] }} /></span>
              ))}
            </div>
            <div className="co-cancel-sum">
              <strong>{count} Artikel</strong>
              <span className="muted">Zwischensumme {money(subtotal)}</span>
            </div>
            <Link to={R.cart} className="co-edit">Ansehen</Link>
          </div>
        ) : null}

        <div className="co-result-actions">
          {lines.length > 0 ? (
            <>
              <Link to={R.checkout} className="btn btn-primary btn-lg"><Lock size={18} aria-hidden="true" /> Zurück zur Kasse</Link>
              <Link to={R.cart} className="btn btn-outline btn-lg"><ArrowLeft size={18} aria-hidden="true" /> Zum Warenkorb</Link>
            </>
          ) : (
            <Link to={R.shop} className="btn btn-primary btn-lg"><ShoppingBag size={18} aria-hidden="true" /> Zum Shop</Link>
          )}
        </div>
        <p className="co-result-help muted">Probleme beim Bezahlen? <Link to={R.contact}>Schreib uns</Link> – wir helfen dir gern weiter.</p>
      </div>
    </div>
  );
}

export default function CheckoutResult({ status = 'success' }) {
  return status === 'cancel' ? <Cancelled /> : <Success />;
}
