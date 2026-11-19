import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Info, Loader2, MailCheck, MessageSquareOff, Printer, ShieldCheck, TriangleAlert } from 'lucide-react';
import { OPERATOR, OpValue } from '../content/operator.js';
import { usePageMeta } from '../lib/hooks.js';
import { getSupabase } from '../lib/supabase.js';
import { LIVE } from '../lib/config.js';
import { R } from '../lib/routes.js';
import '../styles/pages.css';

const EMPTY = { name: '', email: '', order_number: '', scope: '' };
const SCOPE_MAX = 1000;
const STEPS = ['Angaben', 'Bestätigen', 'Eingegangen'];

// Gleiche Regeln wie die Edge Function „submit-withdrawal“ bzw. der bisherige Shop.
function validate(f) {
  const e = {};
  const name = f.name.trim();
  if (name.length < 2 || name.length > 200) e.name = 'Bitte gib deinen Namen an.';
  const email = f.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) e.email = 'Bitte prüfe deine E-Mail-Adresse.';
  if (!/^[A-Za-z0-9-]{3,40}$/.test(f.order_number.trim())) e.order_number = 'Bitte gib die Bestellnummer an, z. B. CC-2026-000123.';
  if (f.scope.trim().length > SCOPE_MAX) e.scope = `Bitte kürzer fassen (max. ${SCOPE_MAX} Zeichen).`;
  return e;
}

async function submitWithdrawal(f) {
  if (!LIVE) {
    // Design-Vorschau: nichts wird übermittelt.
    await new Promise((r) => setTimeout(r, 700));
    return { received_at: new Date().toISOString(), reference: null, confirmation_sent: false, preview: true };
  }
  const scope = f.scope.trim();
  const { data, error } = await getSupabase().functions.invoke('submit-withdrawal', {
    body: {
      name: f.name.trim(),
      email: f.email.trim(),
      order_number: f.order_number.trim(),
      ...(scope ? { scope } : {}),
      confirm: true,
    },
  });
  if (error || !data) throw new Error('submit_failed');
  return data;
}

const fmtReceived = (iso) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long', timeStyle: 'medium' }).format(new Date(iso));

function Field({ id, label, hint, error, counter, children }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      <div className="wd-foot">
        {hint && !error && <small className="pg-hint" id={`${id}-hint`}>{hint}</small>}
        {error && <small className="field-error" id={`${id}-err`}>{error}</small>}
        {counter}
      </div>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <ol className="wd-steps" aria-label="Fortschritt">
      {STEPS.map((s, i) => (
        <li key={s} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} aria-current={i === step ? 'step' : undefined}>
          <span className="wd-step-dot" aria-hidden="true">{i < step ? <Check size={14} /> : i + 1}</span>
          <span className="wd-step-label">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Summary({ f, result }) {
  const scope = f.scope.trim();
  return (
    <dl className="wd-summary">
      {result && <div><dt>Eingang</dt><dd><strong>{fmtReceived(result.received_at)}</strong></dd></div>}
      {result?.reference && <div><dt>Vorgangsnummer</dt><dd><strong className="pg-mono">{result.reference}</strong></dd></div>}
      <div><dt>Name</dt><dd>{f.name.trim()}</dd></div>
      <div><dt>Bestellnummer</dt><dd className="pg-mono">{f.order_number.trim().toUpperCase()}</dd></div>
      <div><dt>Widerrufen wird</dt><dd className="wd-scope">{scope || 'die gesamte Bestellung'}</dd></div>
      <div><dt>Bestätigung an</dt><dd>{f.email.trim()}</dd></div>
    </dl>
  );
}

export default function Withdrawal() {
  usePageMeta('Vertrag widerrufen', 'Widerruf deiner Bestellung bei CardCompass online erklären.');
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0); // 0 edit · 1 confirm · 2 done
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState(null);
  const headRef = useRef(null);
  const refs = { name: useRef(null), order_number: useRef(null), scope: useRef(null), email: useRef(null) };
  const firstRender = useRef(true);

  // Bei jedem Schrittwechsel: nach oben + Fokus auf die Überschrift.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0 });
    headRef.current?.focus({ preventScroll: true });
  }, [step]);

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const aria = (k, hint) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `w-${k}-err` : hint ? `w-${k}-hint` : undefined,
  });

  const toConfirm = (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    const first = ['name', 'order_number', 'scope', 'email'].find((k) => errs[k]);
    if (first) { refs[first].current?.focus(); return; }
    setFailed(false);
    setStep(1);
  };

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setResult(await submitWithdrawal(f));
      setStep(2);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const headline = ['Deine Angaben', 'Bitte prüfe deine Angaben', 'Dein Widerruf ist eingegangen'][step];

  return (
    <div className="wd-page pg-print">
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Brotkrumen">
            <Link to={R.home}>Start</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Vertrag widerrufen</span>
          </nav>
          <p className="eyebrow">Widerrufsrecht</p>
          <h1 className="h1 pg-title">Vertrag widerrufen</h1>
          <p className="lead pg-lead">
            Hier kannst du deinen Kaufvertrag innerhalb der Widerrufsfrist widerrufen. Einen Grund musst du nicht angeben. Alle Einzelheiten stehen in der{' '}
            <Link to={R.widerrufsbelehrung} className="pg-link">Widerrufsbelehrung</Link>.
          </p>
        </div>
      </section>

      <div className="container wd-grid">
        <div className="wd-main">
          <Stepper step={step} />
          <section className={`panel wd-panel ${step === 2 ? 'is-done' : ''}`} aria-labelledby="wd-head">
            {step === 2 && (
              <div className="wd-success-ic" aria-hidden="true"><Check size={30} strokeWidth={2.6} /></div>
            )}
            <h2 id="wd-head" className="h3 wd-head" tabIndex={-1} ref={headRef}>{headline}</h2>

            {step === 0 && (
              <form onSubmit={toConfirm} noValidate className="wd-form">
                <Field id="w-name" label="Dein Name" error={errors.name}>
                  <input id="w-name" ref={refs.name} className="input" autoComplete="name" value={f.name} onChange={set('name')} {...aria('name')} />
                </Field>
                <Field id="w-order_number" label="Bestellnummer" hint="Steht in deiner Bestellbestätigung, z. B. CC-2026-000123." error={errors.order_number}>
                  <input id="w-order_number" ref={refs.order_number} className="input pg-mono" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={f.order_number} onChange={set('order_number')} {...aria('order_number', true)} />
                </Field>
                <Field
                  id="w-scope" label="Nur bestimmte Artikel widerrufen? (optional)" hint="Leer lassen, um die gesamte Bestellung zu widerrufen." error={errors.scope}
                  counter={<small className={`pg-count ${f.scope.length >= SCOPE_MAX ? 'is-over' : ''}`} aria-hidden="true">{f.scope.length}/{SCOPE_MAX}</small>}
                >
                  <textarea id="w-scope" ref={refs.scope} className="textarea" rows={3} maxLength={SCOPE_MAX} value={f.scope} onChange={set('scope')} {...aria('scope', true)} />
                </Field>
                <Field id="w-email" label="E-Mail für die Eingangsbestätigung" error={errors.email}>
                  <input id="w-email" ref={refs.email} className="input" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} {...aria('email')} />
                </Field>
                <div className="wd-actions">
                  <button type="submit" className="btn btn-primary">Weiter zur Bestätigung <ArrowRight size={17} aria-hidden="true" /></button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="wd-review">
                <Summary f={f} />
                <p className="wd-legal">Mit dem Klick auf „Widerruf bestätigen“ widerrufst du den oben genannten Vertrag verbindlich.</p>
                {!LIVE && (
                  <p className="pg-notice is-info" role="note"><Info size={17} aria-hidden="true" /> Vorschau: In der Design-Vorschau wird der Widerruf nicht übermittelt.</p>
                )}
                <div aria-live="assertive">
                  {failed && (
                    <p className="pg-notice is-error" role="alert">
                      <TriangleAlert size={17} aria-hidden="true" />
                      <span>Das hat gerade nicht geklappt. Versuch es bitte noch einmal oder widerrufe per E-Mail an <OpValue value={OPERATOR.email} link="mail" />.</span>
                    </p>
                  )}
                </div>
                <div className="wd-actions">
                  <button type="button" className="btn btn-primary" onClick={confirm} disabled={busy} aria-busy={busy || undefined}>
                    {busy ? <><Loader2 size={17} className="spin" aria-hidden="true" /> Wird gesendet …</> : <>Widerruf bestätigen <Check size={17} aria-hidden="true" /></>}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(0)} disabled={busy}><ArrowLeft size={17} aria-hidden="true" /> Angaben ändern</button>
                </div>
              </div>
            )}

            {step === 2 && result && (
              <div className="wd-done" role="status">
                {result.preview ? (
                  <p className="pg-notice is-info"><Info size={17} aria-hidden="true" /> Vorschau: Es wurde kein echter Widerruf übermittelt und keine E-Mail verschickt. Im Livebetrieb bekommst du hier zusätzlich eine Vorgangsnummer und die Eingangsbestätigung per E-Mail.</p>
                ) : result.confirmation_sent ? (
                  <p>Die Eingangsbestätigung mit dem Inhalt deiner Erklärung haben wir an <strong>{f.email.trim()}</strong> geschickt.</p>
                ) : (
                  <p className="pg-notice is-warn"><TriangleAlert size={17} aria-hidden="true" /> Die Bestätigungs-E-Mail konnte gerade nicht verschickt werden. Dein Widerruf ist trotzdem gespeichert, wir senden dir die Bestätigung so schnell wie möglich. Bitte notiere dir die Vorgangsnummer.</p>
                )}
                <Summary f={f} result={result} />
                <p>Wir melden uns mit den nächsten Schritten zur Rücksendung.</p>
                <div className="wd-actions">
                  <button type="button" className="btn btn-outline" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Bestätigung drucken</button>
                  <Link to={R.shop} className="btn btn-ghost">Zurück zum Shop</Link>
                </div>
              </div>
            )}
          </section>
          <p className="wd-alt">
            Du kannst den Widerruf auch formlos per E-Mail an <OpValue value={OPERATOR.email} link="mail" /> oder per Post erklären.
          </p>
        </div>

        <aside className="wd-aside" aria-label="Gut zu wissen">
          <div className="wd-info">
            <h2 className="wd-info-h">Gut zu wissen</h2>
            <ul className="wd-facts">
              <li><span className="wd-fact-ic"><Clock size={18} aria-hidden="true" /></span><span><strong>14 Tage Zeit</strong>Die Frist beginnt, wenn du die letzte Ware erhalten hast. Es reicht, den Widerruf vor Ablauf abzusenden.</span></li>
              <li><span className="wd-fact-ic"><MessageSquareOff size={18} aria-hidden="true" /></span><span><strong>Kein Grund nötig</strong>Du musst nicht erklären, warum du widerrufst.</span></li>
              <li><span className="wd-fact-ic"><MailCheck size={18} aria-hidden="true" /></span><span><strong>Eingangsbestätigung</strong>Du bekommst eine Bestätigung mit Datum und Uhrzeit des Eingangs per E-Mail.</span></li>
              <li><span className="wd-fact-ic"><ShieldCheck size={18} aria-hidden="true" /></span><span><strong>Erstattung</strong>Wir erstatten deine Zahlung über dasselbe Zahlungsmittel – Details in der <Link to={R.widerrufsbelehrung} className="pg-link">Widerrufsbelehrung</Link>.</span></li>
            </ul>
            <div className="wd-post">
              <p className="wd-post-h">Per Post an</p>
              <address>
                <OpValue value={OPERATOR.name} /><br />
                {OPERATOR.business}<br />
                <OpValue value={OPERATOR.street} /><br />
                <OpValue value={OPERATOR.city} />
              </address>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
