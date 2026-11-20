// Kasse (/kasse): single-page checkout. Contact + address + shipping + note on
// the left, sticky order summary on the right (collapsible on phones). The
// final block shows the order summary directly above the order button
// ("Button-Lösung", § 312j BGB). Payment itself happens on Stripe's page.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Info, Loader2, Lock, Mail, MapPin, MessageSquare,
  Pencil, ShieldCheck, ShoppingBag, Truck, ClipboardList, Hourglass,
} from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { CartLine } from '../components/CartDrawer.jsx';
import { money } from '../lib/format.js';
import { usePageMeta, prefersReducedMotion } from '../lib/hooks.js';
import { R } from '../lib/routes.js';
import { LIVE } from '../lib/config.js';
import { getSupabase } from '../lib/supabase.js';
import {
  checkoutMode, startCheckout, loadDraft, saveDraft, CheckoutError,
} from '../lib/checkout.js';
import { CheckoutSteps, SummaryTotals, PayChips, CartEmpty, useShopInfo, TAX_NOTE } from './Cart.jsx';
import '../styles/checkout.css';

const NOTE_MAX = 1000;
const EMPTY = {
  email: '', phone: '',
  ship_first: '', ship_last: '', ship_company: '', ship_line1: '', ship_line2: '', ship_zip: '', ship_city: '',
  bill_same: true,
  bill_first: '', bill_last: '', bill_company: '', bill_line1: '', bill_line2: '', bill_zip: '', bill_city: '',
  note: '', shipping: '',
};
const MAXLEN = {
  email: 254, phone: 30, first: 60, last: 60, company: 100, line1: 120, line2: 120, zip: 5, city: 80,
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()/-]{4,28}$/;

const rateCost = (r, subtotal) => (r.free_from_cents != null && subtotal >= r.free_from_cents ? 0 : r.price_cents);

function addressErrors(v, p) {
  const e = {};
  const val = (k) => String(v[`${p}_${k}`] || '').trim();
  if (!val('first')) e[`${p}_first`] = 'Bitte gib den Vornamen ein.';
  if (!val('last')) e[`${p}_last`] = 'Bitte gib den Nachnamen ein.';
  if (!val('line1')) e[`${p}_line1`] = 'Bitte gib Straße und Hausnummer ein.';
  else if (!/\d/.test(val('line1'))) e[`${p}_line1`] = 'Bitte ergänze die Hausnummer.';
  else if (val('line1').length < 4) e[`${p}_line1`] = 'Bitte prüfe Straße und Hausnummer.';
  if (!val('zip')) e[`${p}_zip`] = 'Bitte PLZ eingeben.';
  else if (!/^\d{5}$/.test(val('zip'))) e[`${p}_zip`] = 'Bitte 5-stellige PLZ eingeben.';
  if (!val('city')) e[`${p}_city`] = 'Bitte gib den Ort ein.';
  else if (val('city').length < 2) e[`${p}_city`] = 'Bitte prüfe den Ort.';
  return e;
}

function validate(v, terms, rates) {
  const e = {};
  const email = v.email.trim();
  if (!email) e.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (!EMAIL_RE.test(email) || email.length > MAXLEN.email) e.email = 'Bitte gib eine gültige E-Mail-Adresse ein (z. B. name@beispiel.de).';
  const phone = v.phone.trim();
  if (phone && !PHONE_RE.test(phone)) e.phone = 'Bitte gib eine gültige Telefonnummer ein (Ziffern, Leerzeichen, +, -, /).';
  Object.assign(e, addressErrors(v, 'ship'));
  if (!v.bill_same) Object.assign(e, addressErrors(v, 'bill'));
  if (rates && rates.length && !rates.some((r) => r.name === v.shipping)) e.shipping = 'Bitte wähle eine Versandart.';
  if (v.note.length > NOTE_MAX) e.note = `Die Anmerkung darf höchstens ${NOTE_MAX} Zeichen lang sein.`;
  if (!terms) e.terms = 'Bitte bestätige die AGB, damit wir deine Bestellung annehmen können.';
  return e;
}

const ORDER = [
  'email', 'phone',
  'ship_first', 'ship_last', 'ship_company', 'ship_line1', 'ship_line2', 'ship_zip', 'ship_city',
  'bill_first', 'bill_last', 'bill_company', 'bill_line1', 'bill_line2', 'bill_zip', 'bill_city',
  'shipping', 'note', 'terms',
];

function focusField(name) {
  const el = document.getElementById(name === 'shipping' ? 'co-shipping-0' : `co-${name}`);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function TextField({
  name, label, optional, value, error, hint, onChange, onBlur, className = '', type = 'text', autoComplete, inputMode, maxLength, readOnly, placeholder,
}) {
  const id = `co-${name}`;
  const showHint = hint && !error;
  const desc = [error ? `${id}-error` : null, showHint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field co-field ${className} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}{optional && <em className="co-opt">optional</em>}</label>
      <input
        id={id} name={name} className="input" type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)} onBlur={() => onBlur?.(name)}
        autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength} readOnly={readOnly}
        required={!optional && !readOnly} aria-invalid={error ? 'true' : undefined} aria-describedby={desc}
        spellCheck={type === 'email' || name.endsWith('zip') ? false : undefined}
      />
      {showHint && <small id={`${id}-hint`} className="co-hint">{hint}</small>}
      {error && <span id={`${id}-error`} className="field-error co-err"><AlertCircle size={14} aria-hidden="true" />{error}</span>}
    </div>
  );
}

function AddressFields({ prefix, ac, v, err, onChange, onBlur }) {
  const f = (k) => `${prefix}_${k}`;
  const common = (k) => ({ name: f(k), value: v[f(k)], error: err(f(k)), onChange, onBlur });
  return (
    <div className="co-fields">
      <TextField {...common('first')} label="Vorname" autoComplete={`${ac} given-name`} maxLength={MAXLEN.first} className="span-3" />
      <TextField {...common('last')} label="Nachname" autoComplete={`${ac} family-name`} maxLength={MAXLEN.last} className="span-3" />
      <TextField {...common('company')} label="Firma" optional autoComplete={`${ac} organization`} maxLength={MAXLEN.company} className="span-6" />
      <TextField {...common('line1')} label="Straße und Hausnummer" autoComplete={`${ac} address-line1`} maxLength={MAXLEN.line1} className="span-6" />
      <TextField {...common('line2')} label="Adresszusatz" optional placeholder="z. B. c/o, Hinterhaus, Etage" autoComplete={`${ac} address-line2`} maxLength={MAXLEN.line2} className="span-6" />
      <TextField {...common('zip')} label="PLZ" autoComplete={`${ac} postal-code`} inputMode="numeric" maxLength={5} className="span-2" />
      <TextField {...common('city')} label="Ort" autoComplete={`${ac} address-level2`} maxLength={MAXLEN.city} className="span-4" />
      <TextField name={f('country')} label="Land" value="Deutschland" readOnly autoComplete={`${ac} country-name`} className="span-6 co-fixed" hint="Wir liefern aktuell nur innerhalb Deutschlands." onChange={() => {}} />
    </div>
  );
}

function Section({ n, icon: Icon, title, id, aside, children, className = '' }) {
  return (
    <section className={`card co-sec ${className}`} aria-labelledby={id}>
      <header className="co-sec-head">
        <span className="co-num" aria-hidden="true">{n}</span>
        <h2 id={id} className="co-sec-title">{Icon && <Icon size={18} aria-hidden="true" />}{title}</h2>
        {aside && <div className="co-sec-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export default function Checkout() {
  usePageMeta('Kasse', 'Sicher bestellen bei CardCompass – bezahle mit Karte, PayPal, Klarna, Apple Pay, Google Pay oder SEPA.');
  const nav = useNavigate();
  const { lines, count, subtotal, savings, clear, setQty, remove } = useCart();
  const { rates, smallBusiness } = useShopInfo();
  const mode = checkoutMode();

  const [v, setV] = useState(() => ({ ...EMPTY, ...loadDraft() }));
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | processing | redirect
  const [serverError, setServerError] = useState(null);
  const [adjusted, setAdjusted] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);
  const alertRef = useRef(null);

  // Persist the form as a draft while typing (no consent, nothing payment-related).
  useEffect(() => {
    const t = setTimeout(() => saveDraft(v), 300);
    return () => clearTimeout(t);
  }, [v]);

  // Default / repair the selected shipping method once rates are known.
  useEffect(() => {
    if (rates?.length && !rates.some((r) => r.name === v.shipping)) setV((s) => ({ ...s, shipping: rates[0].name }));
  }, [rates, v.shipping]);

  // Logged-in customers: prefill empty contact fields from their profile.
  useEffect(() => {
    if (!LIVE) return undefined;
    let alive = true;
    (async () => {
      try {
        const sb = await getSupabase();
        const { data: { session } = {} } = await sb.auth.getSession();
        const user = session?.user;
        if (!user || !alive) return;
        const { data: prof } = await sb.from('cc_customer_profiles').select('email, first_name, last_name, phone').eq('id', user.id).maybeSingle();
        if (!alive) return;
        setV((s) => ({
          ...s,
          email: s.email || prof?.email || user.email || '',
          phone: s.phone || prof?.phone || '',
          ship_first: s.ship_first || prof?.first_name || '',
          ship_last: s.ship_last || prof?.last_name || '',
        }));
      } catch { /* prefill is a convenience only */ }
    })();
    return () => { alive = false; };
  }, []);

  // Back from Stripe via the browser's back button (bfcache): unlock the form.
  useEffect(() => {
    const onShow = (e) => { if (e.persisted) setPhase('idle'); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const rate = rates?.find((r) => r.name === v.shipping) || rates?.[0] || null;
  const shipCents = rate ? rateCost(rate, subtotal) : 0;
  const ship = { name: rate?.name, cents: subtotal === 0 ? 0 : shipCents };
  const total = subtotal + ship.cents;

  const errors = useMemo(() => validate(v, terms, rates), [v, terms, rates]);
  const err = useCallback((name) => ((submitted || touched[name]) ? errors[name] : undefined), [errors, submitted, touched]);
  const errorCount = ORDER.filter((k) => errors[k] && (k !== 'terms' || submitted)).length;

  const onChange = useCallback((name, value) => {
    let val = value;
    if (name.endsWith('_zip')) val = value.replace(/\D/g, '').slice(0, 5);
    if (name === 'note') val = value.slice(0, NOTE_MAX);
    setV((s) => ({ ...s, [name]: val }));
    setServerError((e) => (e?.code === 'invalid' ? null : e));
  }, []);
  const vRef = useRef(v);
  vRef.current = v;
  // Mark as touched only when something was typed (no errors for tabbing through).
  const onBlur = useCallback((name) => {
    if (String(vRef.current[name] || '').trim()) setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    setSubmitted(true);
    setServerError(null);
    setAdjusted(false);
    const first = ORDER.find((k) => errors[k]);
    if (first) { focusField(first); return; }
    if (mode === 'disabled') return;

    const tr = (k) => String(v[k] || '').trim();
    const address = (p) => ({
      first_name: tr(`${p}_first`),
      last_name: tr(`${p}_last`),
      company: tr(`${p}_company`) || null,
      address_line1: tr(`${p}_line1`),
      address_line2: tr(`${p}_line2`) || null,
      postal_code: tr(`${p}_zip`),
      city: tr(`${p}_city`),
      country_code: 'DE',
    });
    setPhase('processing');
    try {
      const res = await startCheckout({
        lines,
        customer: { email: tr('email').toLowerCase(), phone: tr('phone') || null, first_name: tr('ship_first'), last_name: tr('ship_last') },
        shippingAddress: address('ship'),
        billingAddress: v.bill_same ? null : address('bill'),
        note: tr('note'),
        shippingMethodName: rate?.name || null,
      });
      if (res?.demo) {
        nav(`${R.checkoutSuccess}?demo=${encodeURIComponent(res.orderNumber)}`, {
          replace: true,
          state: { demo: true, orderNumber: res.orderNumber, email: tr('email'), total },
        });
        clear();
        return;
      }
      setPhase('redirect');
    } catch (ex) {
      setPhase('idle');
      setServerError(ex instanceof CheckoutError ? ex : new CheckoutError('server', 'Die Bezahlung konnte gerade nicht gestartet werden. Bitte versuche es noch einmal – es wurde nichts berechnet.'));
      requestAnimationFrame(() => {
        alertRef.current?.focus({ preventScroll: true });
        alertRef.current?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }
  };

  // Out-of-stock: reduce quantities to what is available (or remove the line).
  const adjustCart = () => {
    (serverError?.items || []).forEach((it) => {
      const avail = Math.max(0, Number(it.available) || 0);
      if (avail > 0) setQty(it.variant_id, avail); else remove(it.variant_id);
    });
    setServerError(null);
    setAdjusted(true);
  };

  if (!lines.length && phase === 'idle') {
    return <div className="co-page"><CartEmpty text="Lege zuerst etwas in deinen Warenkorb – danach kannst du hier sicher bestellen." /></div>;
  }

  const nameOf = (id) => {
    const l = lines.find((x) => x.variantId === id);
    return l ? `${l.name}${l.variantTitle ? ` (${l.variantTitle})` : ''}` : null;
  };
  const shipTo = [
    [v.ship_first, v.ship_last].filter(Boolean).join(' '),
    v.ship_company,
    v.ship_line1,
    v.ship_line2,
    [v.ship_zip, v.ship_city].filter(Boolean).join(' '),
  ].map((s) => String(s || '').trim()).filter(Boolean);

  return (
    <div className="co-page">
      <section className="page-hero co-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Brotkrumen">
            <Link to={R.cart}>Warenkorb</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Kasse</span>
          </nav>
          <div className="co-hero-row">
            <div>
              <p className="eyebrow">Schritt 2 von 3</p>
              <h1 className="h2 co-title">Kasse</h1>
              <p className="co-sub">Nur noch ein paar Angaben – bezahlt wird anschließend sicher über Stripe.</p>
            </div>
            <CheckoutSteps current={1} />
          </div>
        </div>
      </section>

      <div className="container co-grid co-grid-checkout">
        <form className="co-form" onSubmit={onSubmit} noValidate aria-describedby={mode !== 'stripe' ? 'co-mode-note' : undefined}>
          {mode === 'demo' && (
            <div id="co-mode-note" className="co-alert is-info" role="note">
              <Info size={18} aria-hidden="true" />
              <div><strong>Vorschau-Modus</strong><span>Du kannst den Ablauf gefahrlos ausprobieren – es wird nichts bestellt oder bezahlt.</span></div>
            </div>
          )}
          {mode === 'disabled' && (
            <div id="co-mode-note" className="co-alert is-warn" role="note">
              <Hourglass size={18} aria-hidden="true" />
              <div><strong>Bald geht's los</strong><span>Die Bezahlung wird gerade eingerichtet. Bald kannst du hier mit Karte, PayPal und weiteren Zahlarten bezahlen. Bis dahin wird noch keine Bestellung ausgelöst.</span></div>
            </div>
          )}

          <Section n={1} icon={Mail} title="Kontakt" id="co-h-contact" aside={<Link to={R.login} className="co-login">Schon Kunde? Anmelden</Link>}>
            <div className="co-fields">
              <TextField name="email" label="E-Mail-Adresse" type="email" inputMode="email" autoComplete="email" value={v.email} error={err('email')} onChange={onChange} onBlur={onBlur} maxLength={MAXLEN.email} className="span-6" hint="Hierhin schicken wir deine Bestellbestätigung." />
              <TextField name="phone" label="Telefon" optional type="tel" inputMode="tel" autoComplete="tel" value={v.phone} error={err('phone')} onChange={onChange} onBlur={onBlur} maxLength={MAXLEN.phone} className="span-6" hint="Nur für Rückfragen zur Lieferung." />
            </div>
          </Section>

          <Section n={2} icon={MapPin} title="Lieferadresse" id="co-h-address">
            <AddressFields prefix="ship" ac="shipping" v={v} err={err} onChange={onChange} onBlur={onBlur} />
            <label className="checkbox co-check-same">
              <input type="checkbox" checked={v.bill_same} onChange={(e) => setV((s) => ({ ...s, bill_same: e.target.checked }))} aria-controls="co-billing" />
              <span>Rechnungsadresse entspricht Lieferadresse</span>
            </label>
            {!v.bill_same && (
              <div id="co-billing" className="co-billing fade-up">
                <h3 className="co-sub-title">Rechnungsadresse</h3>
                <AddressFields prefix="bill" ac="billing" v={v} err={err} onChange={onChange} onBlur={onBlur} />
              </div>
            )}
          </Section>

          <Section n={3} icon={Truck} title="Versandart" id="co-h-shipping">
            {!rates ? (
              <div className="co-ship"><div className="skeleton co-ship-skel" /></div>
            ) : (
              <fieldset className="co-ship" aria-describedby={err('shipping') ? 'co-shipping-error' : undefined}>
                <legend className="sr-only">Versandart wählen</legend>
                {rates.map((r, i) => {
                  const cost = rateCost(r, subtotal);
                  const checked = v.shipping === r.name;
                  return (
                    <label key={r.name} className={`co-radio ${checked ? 'is-checked' : ''}`}>
                      <input type="radio" id={`co-shipping-${i}`} name="shipping" value={r.name} checked={checked} onChange={() => setV((s) => ({ ...s, shipping: r.name }))} />
                      <span className="co-radio-mark" aria-hidden="true" />
                      <span className="co-radio-body">
                        <strong>{r.name}</strong>
                        <small>{r.free_from_cents != null ? (cost === 0 ? 'Gratisversand ist freigeschaltet' : `Kostenlos ab ${money(r.free_from_cents)} Bestellwert`) : 'Lieferung innerhalb Deutschlands'}</small>
                      </span>
                      <span className={`co-radio-price ${cost === 0 ? 'is-free' : ''}`}>{cost === 0 ? 'kostenlos' : money(cost)}</span>
                    </label>
                  );
                })}
                {err('shipping') && <span id="co-shipping-error" className="field-error co-err"><AlertCircle size={14} aria-hidden="true" />{err('shipping')}</span>}
              </fieldset>
            )}
          </Section>

          <Section n={4} icon={MessageSquare} title={<>Anmerkung <em className="co-opt">optional</em></>} id="co-h-note">
            <div className={`field co-field ${err('note') ? 'has-error' : ''}`}>
              <label htmlFor="co-note" className="sr-only">Anmerkung zur Bestellung</label>
              <textarea
                id="co-note" name="note" className="textarea" rows={3} value={v.note} maxLength={NOTE_MAX}
                placeholder="Hast du einen Wunsch zur Lieferung oder eine Frage zu deiner Bestellung?"
                onChange={(e) => onChange('note', e.target.value)} aria-describedby="co-note-count" aria-invalid={err('note') ? 'true' : undefined}
              />
              <small id="co-note-count" className="co-hint co-count-hint">{v.note.length} / {NOTE_MAX} Zeichen</small>
              {err('note') && <span className="field-error co-err"><AlertCircle size={14} aria-hidden="true" />{err('note')}</span>}
            </div>
          </Section>

          <Section n={5} icon={ClipboardList} title="Prüfen & bestellen" id="co-h-review" className="co-review">
            <ul className="co-review-items" aria-label="Artikel">
              {lines.map((l) => (
                <li key={l.variantId}>
                  <span className="co-ri-qty">{l.qty}×</span>
                  <span className="co-ri-name">{l.name}{l.variantTitle && <small>{l.variantTitle}</small>}</span>
                  <span className="co-ri-price">{money(l.priceCents * l.qty)}</span>
                </li>
              ))}
            </ul>
            <SummaryTotals subtotal={subtotal} ship={ship} smallBusiness={false} />
            <div className="co-recap">
              <div>
                <span className="co-recap-k">Lieferung an</span>
                <span className="co-recap-v">{shipTo.length ? shipTo.join(', ') : '–'}</span>
              </div>
              <div>
                <span className="co-recap-k">Zahlung</span>
                <span className="co-recap-v">Auswahl im nächsten Schritt bei Stripe</span>
              </div>
            </div>
            {smallBusiness && <p className="co-tax">{TAX_NOTE}</p>}

            <div className={`co-terms ${err('terms') ? 'has-error' : ''}`}>
              <label className="checkbox" htmlFor="co-terms">
                <input
                  id="co-terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required
                  aria-invalid={err('terms') ? 'true' : undefined} aria-describedby={err('terms') ? 'co-terms-error' : undefined}
                />
                <span>
                  Ich habe die <Link to={R.agb} target="_blank" rel="noopener">AGB</Link> gelesen und akzeptiere sie.
                  {' '}Die <Link to={R.widerrufsbelehrung} target="_blank" rel="noopener">Widerrufsbelehrung</Link> und
                  die <Link to={R.datenschutz} target="_blank" rel="noopener">Datenschutzerklärung</Link> habe ich zur Kenntnis genommen.
                </span>
              </label>
              {err('terms') && <span id="co-terms-error" className="field-error co-err"><AlertCircle size={14} aria-hidden="true" />{err('terms')}</span>}
            </div>

            {serverError && (
              <div ref={alertRef} tabIndex={-1} className={`co-alert ${serverError.code === 'out_of_stock' ? 'is-warn' : 'is-error'}`} role="alert">
                <AlertTriangle size={18} aria-hidden="true" />
                <div>
                  <strong>{serverError.code === 'out_of_stock' ? 'Nicht mehr genug auf Lager' : serverError.code === 'invalid' ? 'Bitte prüfe deine Angaben' : 'Das hat leider nicht geklappt'}</strong>
                  <span>{serverError.message}</span>
                  {serverError.code === 'out_of_stock' && serverError.items?.length > 0 && (
                    <>
                      <ul className="co-oos">
                        {serverError.items.map((it) => (
                          <li key={it.variant_id}>
                            <b>{nameOf(it.variant_id) || it.name || 'Artikel'}</b>
                            {' – '}
                            {Number(it.available) > 0 ? `nur noch ${it.available} verfügbar (du wolltest ${it.requested})` : 'leider ausverkauft'}
                          </li>
                        ))}
                      </ul>
                      <button type="button" className="btn btn-outline btn-sm" onClick={adjustCart}>Warenkorb automatisch anpassen</button>
                    </>
                  )}
                </div>
              </div>
            )}
            {adjusted && (
              <div className="co-alert is-info" role="status">
                <Info size={18} aria-hidden="true" />
                <div><strong>Warenkorb angepasst</strong><span>Bitte prüfe die neue Summe und bestelle dann erneut.</span></div>
              </div>
            )}

            <p className="sr-only" aria-live="polite">{submitted && errorCount ? `Bitte prüfe ${errorCount === 1 ? 'das markierte Feld' : `die ${errorCount} markierten Felder`}.` : ''}</p>
            {submitted && errorCount > 0 && (
              <p className="co-form-err" aria-hidden="true"><AlertCircle size={15} /> Bitte prüfe {errorCount === 1 ? 'das markierte Feld' : `die ${errorCount} markierten Felder`}.</p>
            )}

            {mode === 'disabled' && (
              <p id="co-disabled-note" className="co-disabled-note"><Hourglass size={15} aria-hidden="true" /> Die Bezahlung wird gerade eingerichtet – bis dahin wird noch keine Bestellung ausgelöst.</p>
            )}
            <button
              type="submit" className="btn btn-primary btn-lg btn-block co-submit" disabled={mode === 'disabled' || phase !== 'idle'} aria-busy={phase !== 'idle' || undefined}
              aria-describedby={mode === 'disabled' ? 'co-disabled-note' : undefined}
            >
              {phase === 'idle' ? <Lock size={18} aria-hidden="true" /> : <Loader2 size={18} aria-hidden="true" className="spin" />}
              Zahlungspflichtig bestellen
            </button>
            <p className="co-redirect-note">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>Du wirst zur sicheren Bezahlseite von Stripe weitergeleitet (Karte, PayPal, Klarna, Apple Pay, Google Pay, SEPA).</span>
            </p>
          </Section>
        </form>
        <aside className={`co-aside ${sumOpen ? 'is-open' : ''}`} aria-label="Deine Bestellung">
          <div className="card co-sum">
            <button type="button" className="co-sum-toggle" aria-expanded={sumOpen} aria-controls="co-sum-body" onClick={() => setSumOpen((o) => !o)}>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>{sumOpen ? 'Bestellung ausblenden' : 'Bestellung anzeigen'}</span>
              <ChevronDown size={16} aria-hidden="true" className="co-sum-chev" />
              <strong>{money(total)}</strong>
            </button>
            <div id="co-sum-body" className="co-sum-body">
              <div className="co-sum-head">
                <h2 className="co-sum-title">Deine Bestellung <small>{count} Artikel</small></h2>
                <Link to={R.cart} className="co-edit"><Pencil size={14} aria-hidden="true" /> Bearbeiten</Link>
              </div>
              <div className="co-sum-lines">
                {lines.map((l) => <CartLine key={l.variantId} line={l} compact />)}
              </div>
              <SummaryTotals subtotal={subtotal} savings={savings} ship={ship} smallBusiness={smallBusiness} />
            </div>
          </div>
          <div className="co-assure">
            <div className="co-assure-row"><ShieldCheck size={18} aria-hidden="true" /><span><strong>Sicher bezahlen über Stripe</strong><small>Deine Zahlungsdaten gibst du nur bei Stripe ein – verschlüsselt und PCI-zertifiziert.</small></span></div>
            <PayChips label="Verfügbare Zahlarten" />
          </div>
        </aside>
      </div>

      {phase !== 'idle' && (
        <div className="co-overlay" role="status" aria-live="polite">
          <div className="co-overlay-card">
            <span className="co-overlay-ic"><Loader2 size={26} aria-hidden="true" className="spin" /></span>
            <strong>{mode === 'demo' ? 'Bestellung wird simuliert …' : phase === 'redirect' ? 'Weiterleitung zu Stripe …' : 'Bestellung wird vorbereitet …'}</strong>
            <span>{mode === 'demo' ? 'Vorschau – es wird nichts bestellt oder bezahlt.' : 'Einen Moment bitte – schließe dieses Fenster nicht.'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
