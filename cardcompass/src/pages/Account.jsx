import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Check, Info, KeyRound, LayoutDashboard, Loader2, LogIn, LogOut, MapPin, Package, Pencil, Plus,
  RefreshCw, RotateCcw, ShoppingBag, Star, Trash2, TriangleAlert, UserPlus, UserRound,
} from 'lucide-react';
import { useAsync, usePageMeta } from '../lib/hooks.js';
import { money, fmtDate } from '../lib/format.js';
import { R } from '../lib/routes.js';
import {
  AUTH_AVAILABLE, EMPTY_ADDRESS, authErrorMessage, deleteAddress, getProfile, getSession, listAddresses, listOrders,
  onAuthChange, orderStatus, passwordStrength, saveAddress, setDefaultAddress, signOut, updatePassword, updateProfile, validatePassword,
} from '../lib/auth.js';
import { OPERATOR, OpValue } from '../content/operator.js';
import '../styles/pages.css';

const PREVIEW_SAVE = 'In der Vorschau ist das Kundenkonto nicht verbunden – es wird nichts gespeichert.';

const TABS = [
  { key: 'uebersicht', label: 'Übersicht', Icon: LayoutDashboard },
  { key: 'bestellungen', label: 'Bestellungen', Icon: Package },
  { key: 'adressen', label: 'Adressen', Icon: MapPin },
  { key: 'profil', label: 'Profil', Icon: UserRound },
];

const errText = (err) => (err?.code === 'not_signed_in' ? authErrorMessage(err) : null);

/* ------------------------------------------------------------ helpers */

function Notice({ tone = 'info', children }) {
  const Icon = tone === 'error' ? TriangleAlert : tone === 'success' ? Check : Info;
  return <p className={`pg-notice is-${tone}`} role={tone === 'error' ? 'alert' : 'status'}><Icon size={17} aria-hidden="true" /><span>{children}</span></p>;
}

function ErrorState({ text, onRetry }) {
  return (
    <div className="ac-error" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <p>{text}</p>
      {onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" /> Erneut versuchen</button>}
    </div>
  );
}

function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="ac-empty">
      <div className="empty-ic"><Icon size={30} aria-hidden="true" /></div>
      <h3 className="h3">{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}

const Skel = ({ h = 120, n = 1 }) => (
  <div className="ac-skels" aria-hidden="true">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" style={{ height: h }} />)}</div>
);

function StatusBadge({ status }) {
  const s = orderStatus(status);
  return <span className={`badge ac-status is-${s.tone}`}><span className="ac-status-dot" aria-hidden="true" />{s.label}</span>;
}

function Field({ id, label, error, hint, optional, children }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}{optional && <em className="pg-opt"> (optional)</em>}</label>
      {children}
      {hint && !error && <small className="pg-hint" id={`${id}-hint`}>{hint}</small>}
      {error && <small className="field-error" id={`${id}-err`}>{error}</small>}
    </div>
  );
}
const aria = (id, error, hint) => ({ 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined });

/* ------------------------------------------------------------- orders */

function OrderCard({ order, compact = false }) {
  const items = order.items || [];
  const shown = items.slice(0, compact ? 2 : 6);
  const more = items.length - shown.length;
  const qty = items.reduce((n, i) => n + (i.quantity || 0), 0);
  return (
    <article className="ac-order" aria-label={`Bestellung ${order.order_number}`}>
      <header className="ac-order-head">
        <div>
          <p className="ac-order-no pg-mono">{order.order_number}</p>
          <p className="ac-order-date">Bestellt am {fmtDate(order.placed_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>
      {shown.length > 0 && (
        <ul className="ac-order-items">
          {shown.map((i, k) => (
            <li key={k}><span className="ac-qty">{i.quantity}×</span><span>{i.product_name}{i.variant_title ? <span className="muted"> · {i.variant_title}</span> : null}</span></li>
          ))}
        </ul>
      )}
      {more > 0 && <p className="ac-order-more">+ {more} weitere{more === 1 ? 'r Artikel' : ' Artikel'}</p>}
      <footer className="ac-order-foot">
        <span className="muted">{qty} Artikel</span>
        <strong>{money(order.total_cents)}</strong>
      </footer>
    </article>
  );
}

function OrdersPanel({ orders, retry }) {
  if (orders.loading && !orders.data) return <Skel h={150} n={3} />;
  if (orders.error) return <ErrorState text={errText(orders.error) || 'Deine Bestellungen konnten gerade nicht geladen werden.'} onRetry={retry} />;
  const list = orders.data || [];
  if (!list.length) {
    return (
      <Empty icon={Package} title="Noch keine Bestellungen" text="Sobald du mit deinem Konto bestellst, findest du hier jede Bestellung mit Status und Inhalt.">
        <Link to={R.shop} className="btn btn-primary">Zum Shop <ArrowRight size={17} aria-hidden="true" /></Link>
      </Empty>
    );
  }
  return (
    <div className="ac-orders">
      {list.map((o) => <OrderCard key={o.id} order={o} />)}
      <p className="ac-help">Fragen zu einer Bestellung? <Link to={R.contact} className="pg-link">Schreib uns</Link> · Widerrufen? <Link to={R.widerruf} className="pg-link">Vertrag widerrufen</Link></p>
    </div>
  );
}

/* ---------------------------------------------------------- overview */

function Overview({ orders, addresses, retryOrders, go, preview }) {
  const latest = orders.data?.[0];
  const tiles = [
    { key: 'bestellungen', Icon: Package, t: 'Bestellungen', d: orders.data ? `${orders.data.length} ${orders.data.length === 1 ? 'Bestellung' : 'Bestellungen'}` : 'Status & Inhalt' },
    { key: 'adressen', Icon: MapPin, t: 'Adressen', d: addresses.data ? `${addresses.data.length} gespeichert` : 'Liefer- & Rechnungsadresse' },
    { key: 'profil', Icon: UserRound, t: 'Profil', d: 'Name, Telefon & Passwort' },
  ];
  return (
    <div className="ac-overview">
      <section className="ac-latest" aria-labelledby="ac-latest-h">
        <div className="ac-block-head">
          <h3 id="ac-latest-h" className="ac-block-h">Letzte Bestellung</h3>
          {latest && <button type="button" className="link-arrow ac-linkbtn" onClick={() => go('bestellungen')}>Alle ansehen <ArrowRight size={15} aria-hidden="true" /></button>}
        </div>
        {orders.loading && !orders.data ? <Skel h={150} />
          : orders.error ? <ErrorState text={errText(orders.error) || 'Deine Bestellungen konnten gerade nicht geladen werden.'} onRetry={retryOrders} />
            : latest ? <OrderCard order={latest} compact />
              : (
                <Empty icon={ShoppingBag} title="Noch keine Bestellungen" text={preview ? 'Hier erscheint später deine letzte Bestellung mit Status.' : 'Entdecke Booster, Displays und Zubehör für deine Sammlung.'}>
                  <Link to={R.shop} className="btn btn-primary btn-sm">Zum Shop <ArrowRight size={16} aria-hidden="true" /></Link>
                </Empty>
              )}
      </section>
      <div className="ac-tiles">
        {tiles.map(({ key, Icon, t, d }) => (
          <button key={key} type="button" className="ac-tile" onClick={() => go(key)}>
            <span className="ac-tile-ic"><Icon size={20} aria-hidden="true" /></span>
            <span className="ac-tile-txt"><strong>{t}</strong><span>{d}</span></span>
            <ArrowRight size={17} className="ac-tile-arrow" aria-hidden="true" />
          </button>
        ))}
        <Link to={R.widerruf} className="ac-tile">
          <span className="ac-tile-ic"><RotateCcw size={20} aria-hidden="true" /></span>
          <span className="ac-tile-txt"><strong>Vertrag widerrufen</strong><span>Online in wenigen Schritten</span></span>
          <ArrowRight size={17} className="ac-tile-arrow" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- addresses */

function validateAddress(a) {
  const e = {};
  if (!a.first_name.trim()) e.first_name = 'Pflichtfeld';
  if (!a.last_name.trim()) e.last_name = 'Pflichtfeld';
  if (!a.address_line1.trim()) e.address_line1 = 'Pflichtfeld';
  if (!/^\d{5}$/.test(a.postal_code.trim())) e.postal_code = 'Fünfstellige PLZ';
  if (!a.city.trim()) e.city = 'Pflichtfeld';
  if (a.phone && a.phone.trim() && !/^[+0-9 ()/-]{6,40}$/.test(a.phone.trim())) e.phone = 'Bitte prüfen';
  return e;
}

function AddressForm({ initial, onCancel, onSave, busy, error }) {
  const [a, setA] = useState(() => ({ ...EMPTY_ADDRESS, ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, v ?? ''])) }));
  const [errs, setErrs] = useState({});
  const firstRef = useRef(null);
  const formRef = useRef(null);
  const uid = useId();
  const id = (k) => `${uid}-${k}`;
  useEffect(() => { firstRef.current?.focus(); }, []);
  const set = (k) => (e) => { setA((s) => ({ ...s, [k]: e.target.value })); if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined })); };
  const submit = (e) => {
    e.preventDefault();
    const v = validateAddress(a);
    setErrs(v);
    const first = Object.keys(v)[0];
    if (first) { formRef.current?.querySelector(`#${CSS.escape(id(first))}`)?.focus(); return; }
    onSave(a);
  };
  const input = (k, props = {}) => <input id={id(k)} className="input" value={a[k]} onChange={set(k)} {...aria(id(k), errs[k])} {...props} />;
  return (
    <form className="ac-addr-form" onSubmit={submit} noValidate ref={formRef}>
      <h3 className="ac-block-h">{initial?.id ? 'Adresse bearbeiten' : 'Neue Adresse'}</h3>
      <div className="pg-grid-2">
        <Field id={id('first_name')} label="Vorname" error={errs.first_name}>{input('first_name', { autoComplete: 'given-name', ref: firstRef })}</Field>
        <Field id={id('last_name')} label="Nachname" error={errs.last_name}>{input('last_name', { autoComplete: 'family-name' })}</Field>
      </div>
      <Field id={id('company')} label="Firma" optional>{input('company', { autoComplete: 'organization' })}</Field>
      <Field id={id('address_line1')} label="Straße und Hausnummer" error={errs.address_line1}>{input('address_line1', { autoComplete: 'address-line1' })}</Field>
      <Field id={id('address_line2')} label="Adresszusatz" optional>{input('address_line2', { autoComplete: 'address-line2', placeholder: 'z. B. Hinterhaus, c/o' })}</Field>
      <div className="ac-plz-row">
        <Field id={id('postal_code')} label="PLZ" error={errs.postal_code}>{input('postal_code', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 5 })}</Field>
        <Field id={id('city')} label="Ort" error={errs.city}>{input('city', { autoComplete: 'address-level2' })}</Field>
      </div>
      <div className="pg-grid-2">
        <Field id={id('country')} label="Land" hint="Wir liefern derzeit nur innerhalb Deutschlands.">
          <input id={id('country')} className="input" value="Deutschland" readOnly aria-describedby={`${id('country')}-hint`} />
        </Field>
        <Field id={id('phone')} label="Telefon" optional error={errs.phone}>{input('phone', { autoComplete: 'tel', type: 'tel', inputMode: 'tel' })}</Field>
      </div>
      {error && <Notice tone={error.tone}>{error.text}</Notice>}
      <div className="ac-form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />} Adresse speichern</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Abbrechen</button>
      </div>
    </form>
  );
}

function AddressCard({ a, onEdit, onDefault, onDelete, busy }) {
  const [confirm, setConfirm] = useState(false);
  const both = a.is_default_billing && a.is_default_shipping;
  return (
    <article className={`ac-addr ${both || a.is_default_shipping ? 'is-default' : ''}`}>
      <div className="ac-addr-badges">
        {both && <span className="badge badge-soft"><Star size={12} aria-hidden="true" /> Standard</span>}
        {!both && a.is_default_shipping && <span className="badge badge-soft">Standard-Lieferadresse</span>}
        {!both && a.is_default_billing && <span className="badge badge-soft">Standard-Rechnungsadresse</span>}
      </div>
      <address className="ac-addr-body">
        <strong>{a.first_name} {a.last_name}</strong><br />
        {a.company && <>{a.company}<br /></>}
        {a.address_line1}<br />
        {a.address_line2 && <>{a.address_line2}<br /></>}
        {a.postal_code} {a.city}<br />
        {a.country_code === 'DE' || !a.country_code ? 'Deutschland' : a.country_code}
        {a.phone && <><br /><span className="muted">Tel. {a.phone}</span></>}
      </address>
      <div className="ac-addr-actions">
        {confirm ? (
          <>
            <span className="ac-addr-confirm">Wirklich löschen?</span>
            <button type="button" className="btn btn-sm ac-danger" onClick={() => onDelete(a.id)} disabled={busy} autoFocus>{busy ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />} Löschen</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)} disabled={busy}>Abbrechen</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(a)} disabled={busy}><Pencil size={14} aria-hidden="true" /> Bearbeiten</button>
            {!both && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDefault(a.id)} disabled={busy}><Star size={14} aria-hidden="true" /> Als Standard</button>}
            <button type="button" className="btn btn-ghost btn-sm ac-del" onClick={() => setConfirm(true)} disabled={busy} aria-label={`Adresse ${a.address_line1} löschen`}><Trash2 size={14} aria-hidden="true" /> Löschen</button>
          </>
        )}
      </div>
    </article>
  );
}

function AddressesPanel({ addresses, retry, reload, preview }) {
  const [editing, setEditing] = useState(null); // null | {} (new) | address
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [formErr, setFormErr] = useState(null);

  const act = async (key, fn, success) => {
    setMsg(null);
    if (preview) { setMsg({ tone: 'info', text: PREVIEW_SAVE }); return false; }
    setBusy(key);
    try { await fn(); reload(); if (success) setMsg({ tone: 'success', text: success }); return true; } catch (err) { setMsg({ tone: 'error', text: errText(err) || 'Das hat nicht geklappt. Bitte versuche es noch einmal.' }); return false; } finally { setBusy(null); }
  };

  const save = async (a) => {
    setFormErr(null);
    if (preview) { setFormErr({ tone: 'info', text: PREVIEW_SAVE }); return; }
    setBusy('form');
    try { await saveAddress(a); reload(); setEditing(null); setMsg({ tone: 'success', text: 'Adresse gespeichert.' }); } catch (err) { setFormErr({ tone: 'error', text: errText(err) || 'Die Adresse konnte nicht gespeichert werden. Bitte versuche es noch einmal.' }); } finally { setBusy(null); }
  };

  if (editing) {
    return <AddressForm initial={editing} busy={busy === 'form'} error={formErr} onSave={save} onCancel={() => { setEditing(null); setFormErr(null); }} />;
  }
  if (addresses.loading && !addresses.data) return <Skel h={170} n={2} />;
  if (addresses.error) return <ErrorState text={errText(addresses.error) || 'Deine Adressen konnten gerade nicht geladen werden.'} onRetry={retry} />;
  const list = addresses.data || [];
  return (
    <div>
      <div aria-live="polite">{msg && <Notice tone={msg.tone}>{msg.text}</Notice>}</div>
      {!list.length ? (
        <Empty icon={MapPin} title="Noch keine Adressen" text="Speichere deine Lieferadresse, dann ist sie beim nächsten Einkauf schon ausgefüllt.">
          <button type="button" className="btn btn-primary" onClick={() => { setMsg(null); setEditing({}); }}><Plus size={17} aria-hidden="true" /> Adresse hinzufügen</button>
        </Empty>
      ) : (
        <div className="ac-addr-grid">
          {list.map((a) => (
            <AddressCard
              key={a.id} a={a} busy={busy === a.id}
              onEdit={(x) => { setMsg(null); setEditing(x); }}
              onDefault={(id) => act(id, () => setDefaultAddress(id), 'Standardadresse geändert.')}
              onDelete={(id) => act(id, () => deleteAddress(id), 'Adresse gelöscht.')}
            />
          ))}
          <button type="button" className="ac-addr-add" onClick={() => { setMsg(null); setEditing({}); }}>
            <span className="ac-tile-ic"><Plus size={20} aria-hidden="true" /></span>
            Neue Adresse
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ profile */

function ProfileForm({ profile, preview, onSaved }) {
  const [f, setF] = useState({ first_name: profile?.first_name || '', last_name: profile?.last_name || '', phone: profile?.phone || '' });
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrs((x) => ({ ...x, [k]: undefined })); };
  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!f.first_name.trim()) v.first_name = 'Bitte gib deinen Vornamen an.';
    if (!f.last_name.trim()) v.last_name = 'Bitte gib deinen Nachnamen an.';
    if (f.phone.trim() && !/^[+0-9 ()/-]{6,40}$/.test(f.phone.trim())) v.phone = 'Bitte prüfe die Telefonnummer.';
    setErrs(v);
    setMsg(null);
    if (Object.keys(v).length) { document.getElementById(`ac-p-${Object.keys(v)[0]}`)?.focus(); return; }
    if (preview) { setMsg({ tone: 'info', text: PREVIEW_SAVE }); return; }
    setBusy(true);
    try { await updateProfile(f); setMsg({ tone: 'success', text: 'Deine Daten sind gespeichert.' }); onSaved(); } catch (err) { setMsg({ tone: 'error', text: errText(err) || 'Speichern hat nicht geklappt. Bitte versuche es noch einmal.' }); } finally { setBusy(false); }
  };
  return (
    <form className="ac-block" onSubmit={submit} noValidate aria-labelledby="ac-pd-h">
      <h3 id="ac-pd-h" className="ac-block-h">Persönliche Daten</h3>
      <div className="pg-grid-2">
        <Field id="ac-p-first_name" label="Vorname" error={errs.first_name}><input id="ac-p-first_name" className="input" autoComplete="given-name" value={f.first_name} onChange={set('first_name')} {...aria('ac-p-first_name', errs.first_name)} /></Field>
        <Field id="ac-p-last_name" label="Nachname" error={errs.last_name}><input id="ac-p-last_name" className="input" autoComplete="family-name" value={f.last_name} onChange={set('last_name')} {...aria('ac-p-last_name', errs.last_name)} /></Field>
      </div>
      <div className="pg-grid-2">
        <Field id="ac-p-email" label="E-Mail" hint="Zum Ändern der E-Mail-Adresse schreib uns kurz.">
          <input id="ac-p-email" className="input ac-readonly" type="email" value={profile?.email || ''} readOnly aria-describedby="ac-p-email-hint" placeholder={preview ? 'du@beispiel.de' : undefined} />
        </Field>
        <Field id="ac-p-phone" label="Telefon" optional error={errs.phone}><input id="ac-p-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} {...aria('ac-p-phone', errs.phone)} /></Field>
      </div>
      <div aria-live="polite">{msg && <Notice tone={msg.tone}>{msg.text}</Notice>}</div>
      <div className="ac-form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />} Speichern</button>
      </div>
    </form>
  );
}

function PasswordForm({ preview }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(pw);
  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    const pErr = validatePassword(pw);
    if (pErr) v.pw = pErr; else if (pw !== pw2) v.pw2 = 'Die Passwörter stimmen nicht überein.';
    setErrs(v);
    setMsg(null);
    if (v.pw || v.pw2) { document.getElementById(v.pw ? 'ac-pw' : 'ac-pw2')?.focus(); return; }
    if (preview) { setMsg({ tone: 'info', text: PREVIEW_SAVE }); return; }
    setBusy(true);
    try { await updatePassword(pw); setPw(''); setPw2(''); setMsg({ tone: 'success', text: 'Dein Passwort wurde geändert.' }); } catch (err) { setMsg({ tone: 'error', text: authErrorMessage(err) }); } finally { setBusy(false); }
  };
  return (
    <form className="ac-block" onSubmit={submit} noValidate aria-labelledby="ac-pw-h">
      <h3 id="ac-pw-h" className="ac-block-h"><KeyRound size={17} aria-hidden="true" /> Passwort ändern</h3>
      <div className="pg-grid-2">
        <Field id="ac-pw" label="Neues Passwort" error={errs.pw} hint="Mindestens 10 Zeichen, Buchstaben und Zahlen.">
          <input id="ac-pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setErrs({}); }} {...aria('ac-pw', errs.pw, true)} />
        </Field>
        <Field id="ac-pw2" label="Wiederholen" error={errs.pw2}>
          <input id="ac-pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => { setPw2(e.target.value); setErrs((x) => ({ ...x, pw2: undefined })); }} {...aria('ac-pw2', errs.pw2)} />
        </Field>
      </div>
      {pw && (
        <div className="au-meter" data-score={strength.score}>
          <span className="au-meter-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= strength.score ? 'is-on' : ''} />)}</span>
          <span className="au-meter-label">Passwortstärke: <strong>{strength.label}</strong></span>
        </div>
      )}
      <div aria-live="polite">{msg && <Notice tone={msg.tone}>{msg.text}</Notice>}</div>
      <div className="ac-form-actions">
        <button type="submit" className="btn btn-outline" disabled={busy}>{busy && <Loader2 size={17} className="spin" aria-hidden="true" />} Passwort ändern</button>
      </div>
    </form>
  );
}

function ProfilePanel({ profile, retry, reload, preview }) {
  if (profile.loading && !profile.data) return <Skel h={220} n={2} />;
  if (profile.error) return <ErrorState text={errText(profile.error) || 'Deine Profildaten konnten gerade nicht geladen werden.'} onRetry={retry} />;
  return (
    <div className="ac-profile">
      <ProfileForm key={profile.data?.id || 'p'} profile={profile.data} preview={preview} onSaved={reload} />
      <PasswordForm preview={preview} />
      <section className="ac-block ac-delete" aria-labelledby="ac-del-h">
        <h3 id="ac-del-h" className="ac-block-h">Konto löschen</h3>
        <p className="muted">Du kannst dein Konto jederzeit löschen lassen; eine E-Mail an <OpValue value={OPERATOR.email} link="mail" /> genügt. Bestelldaten bewahren wir nur so lange auf, wie es die gesetzlichen Aufbewahrungspflichten verlangen.</p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------- shell */

const PREVIEW_STATE = { data: [], error: null, loading: false };
const PREVIEW_PROFILE = { data: { id: 'preview', email: '', first_name: '', last_name: '', phone: '' }, error: null, loading: false };

function AccountShell({ preview = false, session, onLogout }) {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('bereich')) ? params.get('bereich') : 'uebersicht';
  const [keys, setKeys] = useState({ p: 0, o: 0, a: 0 });
  const bump = (k) => setKeys((s) => ({ ...s, [k]: s[k] + 1 }));
  const [loggingOut, setLoggingOut] = useState(false);
  const tabRefs = useRef({});
  const panelRef = useRef(null);
  const uid = useId();

  const liveProfile = useAsync(() => (preview ? null : getProfile()), [preview, keys.p]);
  const liveOrders = useAsync(() => (preview ? [] : listOrders()), [preview, keys.o]);
  const liveAddresses = useAsync(() => (preview ? [] : listAddresses()), [preview, keys.a]);
  const profile = preview ? PREVIEW_PROFILE : liveProfile;
  const orders = preview ? PREVIEW_STATE : liveOrders;
  const addresses = preview ? PREVIEW_STATE : liveAddresses;

  const meta = session?.user?.user_metadata || {};
  const firstName = profile.data?.first_name || meta.first_name || '';
  const lastName = profile.data?.last_name || meta.last_name || '';
  const email = profile.data?.email || session?.user?.email || '';
  const initials = useMemo(() => ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || (email[0] || 'C').toUpperCase(), [firstName, lastName, email]);

  const go = (key, focusPanel = true) => {
    const next = new URLSearchParams(params);
    if (key === 'uebersicht') next.delete('bereich'); else next.set('bereich', key);
    setParams(next, { replace: true });
    if (focusPanel) setTimeout(() => panelRef.current?.focus({ preventScroll: false }), 0);
  };

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.key === tab);
    let n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % TABS.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = TABS.length - 1;
    if (n === null) return;
    e.preventDefault();
    go(TABS[n].key, false);
    tabRefs.current[TABS[n].key]?.focus();
  };

  const logout = async () => { setLoggingOut(true); await onLogout(); };
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="ac-page">
      <section className="page-hero ac-hero">
        <div className="container ac-hero-row">
          <div className="ac-avatar" aria-hidden="true">{preview ? <UserRound size={28} /> : initials}</div>
          <div className="ac-hello">
            <p className="eyebrow">Mein Konto</p>
            <h1 className="ac-title">{firstName ? `Hallo, ${firstName}!` : 'Hallo!'}</h1>
            <p className="muted ac-mail">{preview ? 'Willkommen in deinem Kundenkonto' : email}</p>
          </div>
          {preview ? (
            <div className="ac-hero-actions">
              <Link to={R.login} className="btn btn-primary btn-sm"><LogIn size={16} aria-hidden="true" /> Anmelden</Link>
              <Link to={R.register} className="btn btn-outline btn-sm"><UserPlus size={16} aria-hidden="true" /> Konto erstellen</Link>
            </div>
          ) : (
            <div className="ac-hero-actions ac-hero-logout">
              <button type="button" className="btn btn-outline btn-sm" onClick={logout} disabled={loggingOut}>
                {loggingOut ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />} Abmelden
              </button>
            </div>
          )}
        </div>
      </section>

      {preview && (
        <div className="container">
          <div className="ac-preview" role="note">
            <span className="ac-preview-ic"><Info size={20} aria-hidden="true" /></span>
            <div>
              <strong>Vorschau des Kundenkontos</strong>
              <p>In der Design-Vorschau ist das Kundenkonto nicht mit dem Shop verbunden. So sieht dein Bereich aus, sobald du angemeldet bist: Bestellungen, Adressen und Profil an einem Ort.</p>
            </div>
          </div>
        </div>
      )}

      <div className="container ac-layout">
        <nav className="ac-nav" aria-label="Kontobereiche">
          <div className="ac-tabs" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {TABS.map(({ key, label, Icon }) => {
              const count = key === 'bestellungen' ? orders.data?.length : key === 'adressen' ? addresses.data?.length : null;
              return (
                <button
                  key={key} type="button" role="tab" id={`${uid}-tab-${key}`} aria-controls={`${uid}-panel`}
                  aria-selected={tab === key} tabIndex={tab === key ? 0 : -1}
                  ref={(el) => { tabRefs.current[key] = el; }}
                  className={`ac-tab ${tab === key ? 'is-active' : ''}`} onClick={() => go(key, false)}
                >
                  <Icon size={18} aria-hidden="true" /><span>{label}</span>
                  {count ? <span className="ac-count">{count}</span> : null}
                </button>
              );
            })}
          </div>
          {!preview && (
            <button type="button" className="ac-tab ac-tab-out" onClick={logout} disabled={loggingOut}><LogOut size={18} aria-hidden="true" /><span>Abmelden</span></button>
          )}
        </nav>

        <div className="ac-panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`} tabIndex={-1} ref={panelRef}>
          <div className="ac-panel-head">
            <h2 className="h3">{current.label}</h2>
            {tab === 'adressen' && !!addresses.data?.length && <p className="muted">Die Standardadresse wird an der Kasse vorausgewählt.</p>}
          </div>
          {tab === 'uebersicht' && <Overview orders={orders} addresses={addresses} retryOrders={() => bump('o')} go={go} preview={preview} />}
          {tab === 'bestellungen' && <OrdersPanel orders={orders} retry={() => bump('o')} />}
          {tab === 'adressen' && <AddressesPanel addresses={addresses} retry={() => bump('a')} reload={() => bump('a')} preview={preview} />}
          {tab === 'profil' && <ProfilePanel profile={profile} retry={() => bump('p')} reload={() => bump('p')} preview={preview} />}
        </div>
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="ac-page" aria-busy="true" aria-label="Konto wird geladen">
      <section className="page-hero ac-hero">
        <div className="container ac-hero-row">
          <div className="skeleton ac-avatar" />
          <div className="ac-hello" style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, width: 110, marginBottom: 12 }} /><div className="skeleton" style={{ height: 34, width: 'min(320px, 70%)' }} /></div>
        </div>
      </section>
      <div className="container ac-layout"><Skel h={190} /><Skel h={300} /></div>
    </div>
  );
}

function AccountGate() {
  const nav = useNavigate();
  const [session, setSession] = useState(undefined);
  const loggingOut = useRef(false);

  useEffect(() => {
    let alive = true;
    getSession().then((s) => { if (alive) setSession(s); }).catch(() => { if (alive) setSession(null); });
    const off = onAuthChange((event, s) => {
      if (!alive) return;
      if (event === 'SIGNED_OUT') setSession(null);
      else if (s) setSession(s);
    });
    return () => { alive = false; off(); };
  }, []);

  const onLogout = async () => {
    loggingOut.current = true;
    try { await signOut(); } finally { nav(`${R.login}?abgemeldet=1`, { replace: true }); }
  };

  if (session === undefined) return <AccountSkeleton />;
  if (!session) return <Navigate to={loggingOut.current ? `${R.login}?abgemeldet=1` : `${R.login}?weiter=${R.account}`} replace />;
  return <AccountShell session={session} onLogout={onLogout} />;
}

export default function Account() {
  usePageMeta('Mein Konto');
  return AUTH_AVAILABLE ? <AccountGate /> : <AccountShell preview />;
}
