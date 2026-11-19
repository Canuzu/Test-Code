import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Copy, MailCheck, Minus, Plus, Send, TriangleAlert } from 'lucide-react';
import { OPERATOR, OpValue, isPlaceholder, missingOperatorFields } from '../content/operator.js';
import { usePageMeta } from '../lib/hooks.js';
import { isEmail } from '../lib/auth.js';
import { R } from '../lib/routes.js';
import '../styles/pages.css';

const MAX_MESSAGE = 1800; // mailto:-Links werden in manchen Programmen bei ~2000 Zeichen abgeschnitten

const FAQ = [
  {
    q: 'Wohin und wie schnell liefert ihr?',
    a: (
      <>
        <p>Wir liefern derzeit nur innerhalb Deutschlands. Die Lieferzeit beträgt 2–4 Werktage nach Zahlungseingang, sofern beim Produkt nichts anderes angegeben ist.</p>
        <p>Die Versandkosten siehst du im Warenkorb und an der Kasse, bevor du deine Bestellung absendest.</p>
      </>
    ),
  },
  {
    q: 'Welche Zahlungsarten kann ich nutzen?',
    a: (
      <>
        <p>Die Bezahlung läuft über unseren Zahlungsdienstleister Stripe. Je nach Bestellung stehen dir zum Beispiel Kredit- und Debitkarte, PayPal, Klarna, Apple Pay oder Google Pay zur Verfügung – welche genau, siehst du an der Kasse.</p>
        <p>Deine Zahlungsdaten gibst du direkt bei Stripe ein, wir bekommen sie nicht zu sehen. Der Kaufpreis ist mit der Bestellung fällig.</p>
      </>
    ),
  },
  {
    q: 'Warum gibt es bei manchen Produkten ein Fair-Limit?',
    a: <p>Bei begehrten Releases begrenzen wir die Stückzahl pro Bestellung. So kommen möglichst viele Sammlerinnen und Sammler zum Zug – und nicht Reseller, die alles aufkaufen. Das Limit steht direkt auf der Produktseite.</p>,
  },
  {
    q: 'Wie kann ich eine Bestellung widerrufen?',
    a: (
      <>
        <p>Als Verbraucher hast du ein Widerrufsrecht von 14 Tagen, einen Grund musst du nicht angeben. Am einfachsten geht es online über <Link to={R.widerruf}>„Vertrag widerrufen“</Link> – du bekommst dann eine Eingangsbestätigung per E-Mail.</p>
        <p>Die unmittelbaren Kosten der Rücksendung trägst du. Alle Einzelheiten stehen in der <Link to={R.widerrufsbelehrung}>Widerrufsbelehrung</Link>.</p>
      </>
    ),
  },
  {
    q: 'Wo sehe ich, wie es um meine Bestellung steht?',
    a: (
      <>
        <p>Nach dem Absenden bestätigen wir den Eingang deiner Bestellung per E-Mail. Wenn du mit Kundenkonto bestellst, siehst du deine Bestellungen und ihren aktuellen Status jederzeit unter <Link to={R.account}>Mein Konto</Link>.</p>
        <p>Du hast als Gast bestellt oder eine Frage? Schreib uns einfach mit deiner Bestellnummer.</p>
      </>
    ),
  },
  {
    q: 'Ist alles, was im Shop steht, auch auf Lager?',
    a: (
      <>
        <p>Die Verfügbarkeit siehst du direkt beim Produkt. Ausverkaufte Artikel kannst du nicht in den Warenkorb legen.</p>
        <p>Sollte ein bestelltes Produkt trotzdem einmal nicht verfügbar sein, weil wir selbst ohne eigenes Verschulden nicht beliefert werden, informieren wir dich unverzüglich und erstatten bereits gezahlte Beträge sofort.</p>
      </>
    ),
  },
];

function FaqItem({ item, open, onToggle }) {
  const id = useId();
  return (
    <div className={`ct-faq-item ${open ? 'is-open' : ''}`}>
      <h3 className="ct-faq-q">
        <button type="button" aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} onClick={onToggle}>
          <span>{item.q}</span>
          {open ? <Minus size={18} className="ct-faq-pm" aria-hidden="true" /> : <Plus size={18} className="ct-faq-pm" aria-hidden="true" />}
        </button>
      </h3>
      <div className="ct-faq-a" id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} data-open={open}>
        <div className="ct-faq-a-inner" inert={open ? undefined : ''}>{item.a}</div>
      </div>
    </div>
  );
}

const EMPTY = { name: '', email: '', order: '', message: '' };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Bitte gib deinen Namen an.';
  if (!isEmail(f.email)) e.email = 'Bitte prüfe deine E-Mail-Adresse.';
  if (f.order.trim() && !/^[A-Za-z0-9-]{3,40}$/.test(f.order.trim())) e.order = 'Bitte prüfe die Bestellnummer, z. B. CC-2026-000123.';
  if (f.message.trim().length < 10) e.message = 'Bitte schreib uns ein paar Worte (mindestens 10 Zeichen).';
  else if (f.message.length > MAX_MESSAGE) e.message = `Bitte kürzer fassen (max. ${MAX_MESSAGE} Zeichen).`;
  return e;
}

function buildMail(f) {
  const subject = 'Anfrage über cardcompass.de';
  const body = [
    `Name: ${f.name.trim()}`,
    `E-Mail: ${f.email.trim()}`,
    f.order.trim() ? `Bestellnummer: ${f.order.trim().toUpperCase()}` : null,
    '',
    f.message.trim(),
  ].filter((l) => l !== null).join('\n');
  return { subject, body, href: `mailto:${OPERATOR.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

function ContactForm() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null);
  const [copied, setCopied] = useState(false);
  const refs = { name: useRef(null), email: useRef(null), order: useRef(null), message: useRef(null) };
  const doneRef = useRef(null);
  const noRecipient = isPlaceholder(OPERATOR.email);

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    const first = ['name', 'email', 'order', 'message'].find((k) => errs[k]);
    if (first) { refs[first].current?.focus(); return; }
    const mail = buildMail(f);
    setSent(mail);
    setCopied(false);
    if (!noRecipient) window.location.href = mail.href;
    setTimeout(() => doneRef.current?.focus(), 50);
  };

  const copy = async () => {
    if (!sent) return;
    try { await navigator.clipboard.writeText(`${sent.subject}\n\n${sent.body}`); setCopied(true); } catch { setCopied(false); }
  };

  const fieldProps = (k) => ({
    id: `ct-${k}`, ref: refs[k], value: f[k], onChange: set(k),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `ct-${k}-err` : (k === 'order' ? 'ct-order-hint' : undefined),
  });

  if (sent) {
    return (
      <div className="ct-done" role="status">
        <div className="ct-done-ic"><MailCheck size={26} aria-hidden="true" /></div>
        <h3 className="h3" tabIndex={-1} ref={doneRef}>Fast geschafft!</h3>
        {noRecipient ? (
          <p className="ct-warn"><TriangleAlert size={16} aria-hidden="true" /> Die Empfängeradresse ist noch ein Platzhalter. Im Livebetrieb öffnet sich hier dein E-Mail-Programm mit der vorbereiteten Nachricht.</p>
        ) : (
          <p className="muted">Dein E-Mail-Programm sollte sich mit deiner vorbereiteten Nachricht geöffnet haben. Schick sie dort ab, dann landet sie direkt bei uns.</p>
        )}
        <p className="muted ct-done-small">Hat sich nichts geöffnet? Kopiere den Text und schreib uns an <OpValue value={OPERATOR.email} link="mail" />.</p>
        <div className="ct-done-actions">
          {!noRecipient && <a className="btn btn-primary btn-sm" href={sent.href}><Send size={15} aria-hidden="true" /> Erneut öffnen</a>}
          <button type="button" className="btn btn-outline btn-sm" onClick={copy}>{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? 'Kopiert' : 'Text kopieren'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSent(null); setF(EMPTY); }}>Neue Nachricht</button>
        </div>
      </div>
    );
  }

  return (
    <form className="ct-form" onSubmit={submit} noValidate>
      <div className="pg-grid-2">
        <div className="field">
          <label className="label" htmlFor="ct-name">Name</label>
          <input className="input" autoComplete="name" {...fieldProps('name')} />
          {errors.name && <small className="field-error" id="ct-name-err">{errors.name}</small>}
        </div>
        <div className="field">
          <label className="label" htmlFor="ct-email">E-Mail</label>
          <input className="input" type="email" autoComplete="email" inputMode="email" {...fieldProps('email')} />
          {errors.email && <small className="field-error" id="ct-email-err">{errors.email}</small>}
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="ct-order">Bestellnummer <em className="pg-opt">(optional)</em></label>
        <input className="input" autoComplete="off" placeholder="CC-2026-000123" {...fieldProps('order')} />
        {errors.order ? <small className="field-error" id="ct-order-err">{errors.order}</small> : <small className="pg-hint" id="ct-order-hint">Bei Fragen zu einer Bestellung gib bitte die Bestellnummer an.</small>}
      </div>
      <div className="field">
        <label className="label" htmlFor="ct-message">Nachricht</label>
        <textarea className="textarea" rows={6} maxLength={MAX_MESSAGE + 200} {...fieldProps('message')} />
        <span className="pg-field-foot">
          {errors.message ? <small className="field-error" id="ct-message-err">{errors.message}</small> : <span />}
          <small className={`pg-count ${f.message.length > MAX_MESSAGE ? 'is-over' : ''}`} aria-hidden="true">{f.message.length}/{MAX_MESSAGE}</small>
        </span>
      </div>
      <p className="pg-privacy">Wie wir mit deiner Nachricht umgehen, steht in der <Link to={R.datenschutz}>Datenschutzerklärung</Link>. Beim Absenden öffnet sich dein E-Mail-Programm mit der fertigen Nachricht – es werden keine Daten über diese Seite übertragen.</p>
      <button type="submit" className="btn btn-primary ct-submit"><Send size={17} aria-hidden="true" /> Nachricht vorbereiten</button>
    </form>
  );
}

export default function Contact() {
  usePageMeta('Kontakt', 'Fragen zu Produkten, Bestellungen oder Rücksendungen? So erreichst du CardCompass per E-Mail, Telefon oder Post.');
  const [openFaq, setOpenFaq] = useState(0);
  const missing = missingOperatorFields();

  return (
    <div className="ct-page">
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Brotkrumen">
            <Link to={R.home}>Start</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Kontakt</span>
          </nav>
          <p className="eyebrow">Service</p>
          <h1 className="h1 pg-title">Kontakt</h1>
          <p className="lead pg-lead">Du hast eine Frage zu einem Produkt, deiner Bestellung oder einer Rücksendung? Schreib uns, wir melden uns so schnell wie möglich.</p>
        </div>
      </section>

      <div className="container ct-grid">
        <section className="ct-side" aria-labelledby="ct-info-h">
          <h2 id="ct-info-h" className="sr-only">So erreichst du uns</h2>
          {missing.length > 0 && (
            <p className="pg-ph-note"><TriangleAlert size={16} aria-hidden="true" /> Gelb markierte Kontaktdaten sind Platzhalter und müssen vor dem Livegang ausgefüllt werden.</p>
          )}
          <dl className="ct-info">
            <div className="ct-info-row">
              <dt>E-Mail</dt>
              <dd>
                <p className="ct-info-v"><OpValue value={OPERATOR.email} link="mail" /></p>
                <p className="ct-info-d">Für alle Fragen rund um Produkte, Bestellungen und Rücksendungen.</p>
              </dd>
            </div>
            <div className="ct-info-row">
              <dt>Telefon</dt>
              <dd>
                <p className="ct-info-v"><OpValue value={OPERATOR.phone} link="tel" /></p>
                <p className="ct-info-d">Halte bei Fragen zu einer Bestellung bitte die Bestellnummer bereit.</p>
              </dd>
            </div>
            <div className="ct-info-row">
              <dt>Anschrift</dt>
              <dd>
                <address className="ct-info-addr">
                  <OpValue value={OPERATOR.name} /><br />
                  {OPERATOR.business}<br />
                  <OpValue value={OPERATOR.street} /><br />
                  <OpValue value={OPERATOR.city} /><br />
                  {OPERATOR.country}
                </address>
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel ct-form-panel" aria-labelledby="ct-form-h">
          <p className="eyebrow">Nachricht schreiben</p>
          <h2 id="ct-form-h" className="h3 ct-form-h">Wie können wir dir helfen?</h2>
          <ContactForm />
        </section>
      </div>

      <section className="section-sm" aria-labelledby="ct-faq-h">
        <div className="container ct-faq">
          <div className="ct-faq-side">
            <p className="eyebrow">Häufige Fragen</p>
            <h2 id="ct-faq-h" className="h2">Schnelle Antworten</h2>
            <p className="muted">Das Wichtigste auf einen Blick. Verbindlich sind die <Link to={R.agb} className="pg-link">AGB</Link> und die <Link to={R.widerrufsbelehrung} className="pg-link">Widerrufsbelehrung</Link>.</p>
            <div className="ct-quick">
              <Link to={R.account} className="ct-quick-link"><span>Bestellungen ansehen</span><ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to={R.widerruf} className="ct-quick-link"><span>Vertrag widerrufen</span><ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to={R.agb} className="ct-quick-link"><span>AGB lesen</span><ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="ct-faq-list">
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq((o) => (o === i ? -1 : i))} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
