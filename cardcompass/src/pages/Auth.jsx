import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Info, KeyRound, Loader2, MailCheck, MapPin, Package, TriangleAlert, Zap, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../lib/hooks.js';
import { R } from '../lib/routes.js';
import {
  AUTH_AVAILABLE, PREVIEW_MESSAGE, authErrorMessage, getSession, isEmail, onAuthChange, passwordStrength,
  safeNext, sendReset, signIn, signUp, updatePassword, validatePassword,
} from '../lib/auth.js';
import '../styles/pages.css';

const MODES = {
  login: {
    meta: 'Anmelden',
    title: 'Anmelden',
    sub: 'Mit deinem Kundenkonto bestellst du schneller und siehst deine Bestellungen.',
    brand: 'Willkommen zurück',
    brandSub: 'Melde dich an und behalte deine Sammlung im Blick.',
  },
  register: {
    meta: 'Konto erstellen',
    title: 'Konto erstellen',
    sub: 'Adressen speichern, schneller bestellen und Bestellungen im Blick behalten.',
    brand: 'Dein Sammler-Konto',
    brandSub: 'In einer Minute angelegt – kostenlos und jederzeit löschbar.',
  },
  forgot: {
    meta: 'Passwort vergessen',
    title: 'Passwort vergessen?',
    sub: 'Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.',
    brand: 'Kein Problem',
    brandSub: 'Mit einem neuen Passwort bist du gleich wieder drin.',
  },
  reset: {
    meta: 'Neues Passwort',
    title: 'Neues Passwort festlegen',
    sub: 'Wähle ein neues Passwort mit mindestens 10 Zeichen, Buchstaben und Zahlen.',
    brand: 'Fast geschafft',
    brandSub: 'Noch ein neues Passwort – dann geht es weiter.',
  },
};

const BENEFITS = [
  { Icon: Package, t: 'Bestellungen verfolgen', d: 'Status und Inhalt jeder Bestellung an einem Ort.' },
  { Icon: MapPin, t: 'Adressen speichern', d: 'Liefer- und Rechnungsadresse einmal hinterlegen.' },
  { Icon: Zap, t: 'Schneller zur Kasse', d: 'Deine Daten sind beim nächsten Einkauf schon da.' },
];

/* ---------------------------------------------------------------- bits */

function Notice({ tone = 'error', children, focusRef }) {
  const Icon = tone === 'error' ? TriangleAlert : tone === 'success' ? CheckCircle2 : Info;
  return (
    <p className={`pg-notice is-${tone}`} role={tone === 'error' ? 'alert' : 'status'} tabIndex={-1} ref={focusRef}>
      <Icon size={17} aria-hidden="true" /><span>{children}</span>
    </p>
  );
}

function Field({ id, label, error, hint, aside, children }) {
  return (
    <div className="field">
      <div className="au-label-row">
        <label className="label" htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children}
      {hint && !error && <small className="pg-hint" id={`${id}-hint`}>{hint}</small>}
      {error && <small className="field-error" id={`${id}-err`}>{error}</small>}
    </div>
  );
}

const describe = (id, error, hint) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': [error ? `${id}-err` : hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined,
});

function PasswordInput({ id, value, onChange, error, hint, autoComplete, inputRef, extraDescribedBy }) {
  const [show, setShow] = useState(false);
  const d = describe(id, error, hint);
  const describedBy = [d['aria-describedby'], extraDescribedBy].filter(Boolean).join(' ') || undefined;
  return (
    <div className="au-pw">
      <input
        id={id} ref={inputRef} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange}
        autoComplete={autoComplete} aria-invalid={d['aria-invalid']} aria-describedby={describedBy}
        autoCapitalize="none" spellCheck={false}
      />
      <button type="button" className="au-pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Passwort verbergen' : 'Passwort anzeigen'} aria-pressed={show} aria-controls={id}>
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

function StrengthMeter({ id, value }) {
  const { score, label } = passwordStrength(value);
  if (!value) return null;
  return (
    <div className="au-meter" id={id} data-score={score}>
      <span className="au-meter-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= score ? 'is-on' : ''} />)}</span>
      <span className="au-meter-label">Passwortstärke: <strong>{label}</strong></span>
    </div>
  );
}

function SubmitButton({ busy, children }) {
  return (
    <button type="submit" className="btn btn-primary btn-block au-submit" disabled={busy} aria-busy={busy || undefined}>
      {busy ? <><Loader2 size={18} className="spin" aria-hidden="true" /> Einen Moment …</> : children}
    </button>
  );
}

// Shared submit flow: validate → (preview notice | async action) → messages.
function useAuthForm(initialNotice = null) {
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(initialNotice); // { tone, text }
  const [busy, setBusy] = useState(false);
  const noticeRef = useRef(null);

  useEffect(() => { if (notice && notice.tone !== 'error') noticeRef.current?.focus(); }, [notice]);

  const run = async (errs, refs, action) => {
    setErrors(errs);
    setNotice(null);
    const first = Object.keys(refs).find((k) => errs[k]);
    if (first) { refs[first].current?.focus(); return; }
    if (!AUTH_AVAILABLE) { setNotice({ tone: 'info', text: PREVIEW_MESSAGE }); return; }
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return { errors, setErrors, notice, setNotice, busy, run, noticeRef };
}

/* --------------------------------------------------------------- forms */

function LoginForm({ next, signedOut }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const refs = { email: useRef(null), pw: useRef(null) };
  const { errors, setErrors, notice, busy, run, noticeRef } = useAuthForm(signedOut ? { tone: 'success', text: 'Du hast dich abgemeldet. Bis bald!' } : null);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!isEmail(email)) errs.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
    if (!pw) errs.pw = 'Bitte gib dein Passwort ein.';
    run(errs, refs, async () => { await signIn(email, pw); nav(next, { replace: true }); });
  };

  return (
    <form onSubmit={submit} noValidate className="au-form">
      <Field id="au-email" label="E-Mail" error={errors.email}>
        <input id="au-email" ref={refs.email} className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} {...describe('au-email', errors.email)} />
      </Field>
      <Field id="au-pw" label="Passwort" error={errors.pw} aside={<Link to={R.forgot} className="au-mini-link">Passwort vergessen?</Link>}>
        <PasswordInput id="au-pw" inputRef={refs.pw} value={pw} onChange={(e) => { setPw(e.target.value); setErrors((x) => ({ ...x, pw: undefined })); }} error={errors.pw} autoComplete="current-password" />
      </Field>
      {notice && <Notice tone={notice.tone} focusRef={noticeRef}>{notice.text}</Notice>}
      <SubmitButton busy={busy}>Anmelden <ArrowRight size={18} aria-hidden="true" /></SubmitButton>
      <p className="au-switch">Noch kein Konto? <Link to={next !== R.account ? `${R.register}?weiter=${encodeURIComponent(next)}` : R.register}>Jetzt registrieren</Link></p>
    </form>
  );
}

function RegisterForm({ next, onDone }) {
  const nav = useNavigate();
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', pw: '', accept: false });
  const refs = { first_name: useRef(null), last_name: useRef(null), email: useRef(null), pw: useRef(null), accept: useRef(null) };
  const { errors, setErrors, notice, busy, run, noticeRef } = useAuthForm();
  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setF((s) => ({ ...s, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.first_name.trim()) errs.first_name = 'Bitte gib deinen Vornamen an.';
    if (!f.last_name.trim()) errs.last_name = 'Bitte gib deinen Nachnamen an.';
    if (!isEmail(f.email)) errs.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
    const pwErr = validatePassword(f.pw);
    if (pwErr) errs.pw = pwErr;
    if (!f.accept) errs.accept = 'Bitte bestätige, dass du die Datenschutzerklärung gelesen hast.';
    run(errs, refs, async () => {
      const res = await signUp(f.email, f.pw, { first_name: f.first_name, last_name: f.last_name });
      if (res.session) nav(next, { replace: true });
      else onDone(f.email.trim());
    });
  };

  return (
    <form onSubmit={submit} noValidate className="au-form">
      <div className="pg-grid-2">
        <Field id="au-first" label="Vorname" error={errors.first_name}>
          <input id="au-first" ref={refs.first_name} className="input" autoComplete="given-name" value={f.first_name} onChange={set('first_name')} {...describe('au-first', errors.first_name)} />
        </Field>
        <Field id="au-last" label="Nachname" error={errors.last_name}>
          <input id="au-last" ref={refs.last_name} className="input" autoComplete="family-name" value={f.last_name} onChange={set('last_name')} {...describe('au-last', errors.last_name)} />
        </Field>
      </div>
      <Field id="au-email" label="E-Mail" error={errors.email}>
        <input id="au-email" ref={refs.email} className="input" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} {...describe('au-email', errors.email)} />
      </Field>
      <Field id="au-pw" label="Passwort" error={errors.pw} hint="Mindestens 10 Zeichen, Buchstaben und Zahlen.">
        <PasswordInput id="au-pw" inputRef={refs.pw} value={f.pw} onChange={set('pw')} error={errors.pw} hint autoComplete="new-password" extraDescribedBy={f.pw ? 'au-pw-meter' : undefined} />
        <StrengthMeter id="au-pw-meter" value={f.pw} />
      </Field>
      <div className="field">
        <label className="checkbox" htmlFor="au-accept">
          <input id="au-accept" ref={refs.accept} type="checkbox" checked={f.accept} onChange={set('accept')} aria-invalid={errors.accept ? true : undefined} aria-describedby={errors.accept ? 'au-accept-err' : 'au-accept-hint'} />
          <span>Ich habe die <Link to={R.datenschutz} className="pg-link" target="_blank" rel="noopener">Datenschutzerklärung</Link> gelesen.</span>
        </label>
        {errors.accept
          ? <small className="field-error" id="au-accept-err">{errors.accept}</small>
          : <small className="pg-hint au-accept-hint" id="au-accept-hint">Wie wir deine Daten verarbeiten, steht in der Datenschutzerklärung. Du kannst dein Konto jederzeit löschen lassen.</small>}
      </div>
      {notice && <Notice tone={notice.tone} focusRef={noticeRef}>{notice.text}</Notice>}
      <SubmitButton busy={busy}>Konto erstellen <ArrowRight size={18} aria-hidden="true" /></SubmitButton>
      <p className="au-switch">Schon registriert? <Link to={next !== R.account ? `${R.login}?weiter=${encodeURIComponent(next)}` : R.login}>Anmelden</Link></p>
    </form>
  );
}

function ForgotForm({ onDone }) {
  const [email, setEmail] = useState('');
  const refs = { email: useRef(null) };
  const { errors, setErrors, notice, busy, run, noticeRef } = useAuthForm();
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!isEmail(email)) errs.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
    run(errs, refs, async () => { await sendReset(email); onDone(email.trim()); });
  };
  return (
    <form onSubmit={submit} noValidate className="au-form">
      <Field id="au-email" label="E-Mail" error={errors.email}>
        <input id="au-email" ref={refs.email} className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }} {...describe('au-email', errors.email)} />
      </Field>
      {notice && <Notice tone={notice.tone} focusRef={noticeRef}>{notice.text}</Notice>}
      <SubmitButton busy={busy}>Link anfordern <ArrowRight size={18} aria-hidden="true" /></SubmitButton>
      <p className="au-switch"><Link to={R.login} className="au-back"><ArrowLeft size={15} aria-hidden="true" /> Zurück zur Anmeldung</Link></p>
    </form>
  );
}

// Reads Supabase error params from the recovery link (…#error_code=otp_expired).
function linkError() {
  try {
    let hash = window.location.hash.replace(/^#/, '');
    if (hash.includes('?')) hash = hash.slice(hash.indexOf('?') + 1); // hash routing: #/route?…
    else if (hash.startsWith('/')) hash = '';
    const p = new URLSearchParams(`${window.location.search.slice(1)}&${hash}`);
    return p.get('error_code') || p.get('error') || null;
  } catch { return null; }
}

function ResetForm({ onDone }) {
  const [state, setState] = useState(AUTH_AVAILABLE ? 'checking' : 'ready'); // checking | ready | invalid
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const refs = { pw: useRef(null), pw2: useRef(null) };
  const { errors, setErrors, notice, busy, run, noticeRef } = useAuthForm();

  useEffect(() => {
    if (!AUTH_AVAILABLE) return undefined;
    let alive = true;
    if (linkError()) { setState('invalid'); return undefined; }
    const off = onAuthChange((event, session) => { if (alive && session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setState('ready'); });
    getSession().then((s) => { if (alive) setState((cur) => (s ? 'ready' : cur === 'checking' ? 'pending' : cur)); }).catch(() => alive && setState('invalid'));
    // Give the client a moment to exchange the token from the link.
    const t = setTimeout(() => { if (alive) setState((cur) => (cur === 'ready' ? cur : 'invalid')); }, 2500);
    return () => { alive = false; off(); clearTimeout(t); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    const pwErr = validatePassword(pw);
    if (pwErr) errs.pw = pwErr;
    if (!errs.pw && pw !== pw2) errs.pw2 = 'Die Passwörter stimmen nicht überein.';
    run(errs, refs, async () => { await updatePassword(pw); onDone(); });
  };

  if (state === 'checking' || state === 'pending') {
    return <div className="au-checking" role="status"><Loader2 size={22} className="spin" aria-hidden="true" /> Link wird geprüft …</div>;
  }
  if (state === 'invalid') {
    return (
      <div className="au-form">
        <Notice tone="error">Der Link ist ungültig oder abgelaufen. Fordere bitte einen neuen an.</Notice>
        <Link to={R.forgot} className="btn btn-primary btn-block">Neuen Link anfordern <ArrowRight size={18} aria-hidden="true" /></Link>
        <p className="au-switch"><Link to={R.login} className="au-back"><ArrowLeft size={15} aria-hidden="true" /> Zurück zur Anmeldung</Link></p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="au-form">
      <Field id="au-pw" label="Neues Passwort" error={errors.pw} hint="Mindestens 10 Zeichen, Buchstaben und Zahlen.">
        <PasswordInput id="au-pw" inputRef={refs.pw} value={pw} onChange={(e) => { setPw(e.target.value); setErrors({}); }} error={errors.pw} hint autoComplete="new-password" extraDescribedBy={pw ? 'au-pw-meter' : undefined} />
        <StrengthMeter id="au-pw-meter" value={pw} />
      </Field>
      <Field id="au-pw2" label="Neues Passwort wiederholen" error={errors.pw2}>
        <PasswordInput id="au-pw2" inputRef={refs.pw2} value={pw2} onChange={(e) => { setPw2(e.target.value); setErrors((x) => ({ ...x, pw2: undefined })); }} error={errors.pw2} autoComplete="new-password" />
      </Field>
      {notice && <Notice tone={notice.tone} focusRef={noticeRef}>{notice.text}</Notice>}
      <SubmitButton busy={busy}>Passwort speichern <KeyRound size={18} aria-hidden="true" /></SubmitButton>
    </form>
  );
}

/* ---------------------------------------------------------------- done */

function DoneView({ icon: Icon, title, children, actions }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="au-done" role="status">
      <div className="au-done-ic"><Icon size={28} aria-hidden="true" /></div>
      <h1 className="au-title" tabIndex={-1} ref={ref}>{title}</h1>
      <div className="au-done-txt">{children}</div>
      <div className="au-done-actions">{actions}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export default function Auth({ mode = 'login' }) {
  const m = MODES[mode] || MODES.login;
  usePageMeta(m.meta);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('weiter'));
  const [done, setDone] = useState(null); // { kind, email }
  const signedOut = params.get('abgemeldet') === '1';

  useEffect(() => { setDone(null); }, [mode]);

  // Already signed in? Skip login/register.
  useEffect(() => {
    if (!AUTH_AVAILABLE || (mode !== 'login' && mode !== 'register')) return undefined;
    let alive = true;
    getSession().then((s) => { if (alive && s) nav(next, { replace: true }); }).catch(() => {});
    return () => { alive = false; };
  }, [mode, next, nav]);

  let body;
  if (done?.kind === 'registered') {
    body = (
      <DoneView icon={MailCheck} title="Bitte bestätige deine E-Mail" actions={<Link to={R.login} className="btn btn-outline btn-block">Zur Anmeldung</Link>}>
        <p>Wir haben dir eine E-Mail an <strong>{done.email}</strong> geschickt. Klick auf den Link darin, um dein Konto zu aktivieren – danach kannst du dich anmelden.</p>
        <p className="muted">Keine E-Mail bekommen? Schau bitte auch im Spam-Ordner nach.</p>
      </DoneView>
    );
  } else if (done?.kind === 'sent') {
    body = (
      <DoneView icon={MailCheck} title="Wir haben dir einen Link geschickt" actions={<Link to={R.login} className="btn btn-outline btn-block"><ArrowLeft size={17} aria-hidden="true" /> Zurück zur Anmeldung</Link>}>
        <p>Falls zu <strong>{done.email}</strong> ein Kundenkonto existiert, ist die E-Mail mit dem Link zum Zurücksetzen unterwegs. Der Link ist nur kurze Zeit gültig.</p>
        <p className="muted">Keine E-Mail bekommen? Schau bitte auch im Spam-Ordner nach.</p>
      </DoneView>
    );
  } else if (done?.kind === 'reset') {
    body = (
      <DoneView icon={CheckCircle2} title="Passwort geändert" actions={<Link to={R.account} className="btn btn-primary btn-block">Zu meinem Konto <ArrowRight size={17} aria-hidden="true" /></Link>}>
        <p>Dein neues Passwort ist gespeichert. Ab jetzt meldest du dich damit an.</p>
      </DoneView>
    );
  } else {
    body = (
      <>
        <header className="au-head">
          <h1 className="au-title">{m.title}</h1>
          <p className="muted">{m.sub}</p>
        </header>
        {!AUTH_AVAILABLE && (
          <p className="au-preview-chip"><Info size={14} aria-hidden="true" /> Vorschau – Anmeldung deaktiviert</p>
        )}
        {mode === 'login' && <LoginForm next={next} signedOut={signedOut} />}
        {mode === 'register' && <RegisterForm next={next} onDone={(email) => setDone({ kind: 'registered', email })} />}
        {mode === 'forgot' && <ForgotForm onDone={(email) => setDone({ kind: 'sent', email })} />}
        {mode === 'reset' && <ResetForm onDone={() => setDone({ kind: 'reset' })} />}
      </>
    );
  }

  return (
    <div className="container au-page">
      <div className="au-shell">
        <aside className="au-brand" aria-label="Vorteile eines Kundenkontos">
          <span className="au-orb au-orb-1" aria-hidden="true" />
          <span className="au-orb au-orb-2" aria-hidden="true" />
          <span className="au-orb au-orb-3" aria-hidden="true" />
          <span className="au-cards" aria-hidden="true"><span /><span /><span /></span>
          <div className="au-brand-inner">
            <p className="au-brand-eyebrow">CardCompass Konto</p>
            <p className="au-brand-title">{m.brand}</p>
            <p className="au-brand-sub">{m.brandSub}</p>
            <ul className="au-benefits">
              {BENEFITS.map(({ Icon, t, d }) => (
                <li key={t}><span className="au-benefit-ic"><Icon size={18} aria-hidden="true" /></span><span><strong>{t}</strong><span>{d}</span></span></li>
              ))}
            </ul>
            <p className="au-guest"><ShieldCheck size={16} aria-hidden="true" /> Bestellen geht auch ohne Konto als Gast.</p>
          </div>
        </aside>
        <div className="au-main">
          <div className="au-card">{body}</div>
        </div>
      </div>
    </div>
  );
}
