// Kundenkonto: dünne Hülle um Supabase Auth + die Konto-Tabellen
// (cc_customer_profiles, cc_customer_addresses, cc_orders). Ohne LIVE-Supabase
// (Design-Vorschau / Demo) ist alles deaktiviert: Lesefunktionen liefern null
// bzw. werfen einen PreviewAuthError, den die Seiten als Hinweis anzeigen.
import { getSupabase } from './supabase.js';
import { HASH_ROUTER, LIVE } from './config.js';
import { R } from './routes.js';

export const AUTH_AVAILABLE = LIVE;
export const PREVIEW_MESSAGE = 'In der Vorschau ist die Anmeldung deaktiviert.';

export class PreviewAuthError extends Error {
  constructor() { super(PREVIEW_MESSAGE); this.name = 'PreviewAuthError'; this.code = 'preview_disabled'; }
}

function client() {
  const sb = getSupabase();
  if (!sb) throw new PreviewAuthError();
  return sb;
}

const normEmail = (e) => String(e || '').trim().toLowerCase();
const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Absolute URL einer App-Route für E-Mail-Links (Bestätigung, Passwort-Reset).
// Berücksichtigt die Vite-Base und Hash-Routing (GitHub-Pages-Vorschau).
export function appUrl(path) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return HASH_ROUTER ? `${origin}${base}/#${path}` : `${origin}${base}${path}`;
}

// Nur interne Weiterleitungsziele zulassen (?weiter=/konto).
export function safeNext(value, fallback = R.account) {
  const v = String(value || '');
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback;
}

/* ------------------------------------------------------------------ auth */

export async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email: normEmail(email), password });
  if (error) throw error;
  return data.session;
}

// Ohne Session in der Antwort muss die E-Mail-Adresse erst bestätigt werden.
// (Ist die Adresse schon registriert, antwortet Supabase bewusst genauso –
// so lässt sich nicht herausfinden, wer ein Konto hat.)
export async function signUp(email, password, { first_name = '', last_name = '' } = {}) {
  const { data, error } = await client().auth.signUp({
    email: normEmail(email),
    password,
    options: {
      emailRedirectTo: appUrl(R.account),
      data: { first_name: first_name.trim(), last_name: last_name.trim() },
    },
  });
  if (error) throw error;
  return { session: data.session || null, needsConfirmation: !data.session };
}

export async function sendReset(email) {
  const { error } = await client().auth.resetPasswordForEmail(normEmail(email), { redirectTo: appUrl(R.resetPassword) });
  if (error) throw error;
}

export async function updatePassword(pw) {
  const { error } = await client().auth.updateUser({ password: pw });
  if (error) throw error;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.auth.signOut();
  // Server nicht erreichbar → wenigstens lokal abmelden.
  if (error) await sb.auth.signOut({ scope: 'local' });
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

// cb(event, session) – gibt eine Abmelde-Funktion zurück.
export function onAuthChange(cb) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    if (!AUTH_AVAILABLE) throw new PreviewAuthError();
    const e = new Error('Nicht angemeldet.');
    e.code = 'not_signed_in';
    throw e;
  }
  return session.user;
}

/* --------------------------------------------------------------- profile */

export async function getProfile() {
  const user = await requireUser();
  const { data, error } = await client()
    .from('cc_customer_profiles')
    .select('id, email, first_name, last_name, phone')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return { ...data, email: data.email || user.email };
  // Profilzeile (noch) nicht vorhanden → Daten aus der Registrierung.
  const meta = user.user_metadata || {};
  return { id: user.id, email: user.email, first_name: meta.first_name || '', last_name: meta.last_name || '', phone: '' };
}

export async function updateProfile({ first_name = '', last_name = '', phone = '' }) {
  const user = await requireUser();
  const { error } = await client()
    .from('cc_customer_profiles')
    .update({ first_name: clean(first_name), last_name: clean(last_name), phone: clean(phone) })
    .eq('id', user.id);
  if (error) throw error;
}

/* ------------------------------------------------------------- addresses */

const ADDRESS_FIELDS = 'id, first_name, last_name, company, address_line1, address_line2, postal_code, city, country_code, phone, is_default_billing, is_default_shipping';

export const EMPTY_ADDRESS = {
  first_name: '', last_name: '', company: '', address_line1: '', address_line2: '', postal_code: '', city: '', country_code: 'DE', phone: '',
};

export async function listAddresses(customerId) {
  const id = customerId || (await requireUser()).id;
  const { data, error } = await client()
    .from('cc_customer_addresses')
    .select(ADDRESS_FIELDS)
    .eq('customer_id', id)
    .order('is_default_shipping', { ascending: false })
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

const addressRow = (a) => ({
  first_name: a.first_name.trim(),
  last_name: a.last_name.trim(),
  company: clean(a.company),
  address_line1: a.address_line1.trim(),
  address_line2: clean(a.address_line2),
  postal_code: a.postal_code.trim(),
  city: a.city.trim(),
  country_code: 'DE', // Lieferung derzeit nur innerhalb Deutschlands (AGB § 6)
  phone: clean(a.phone),
});

// Mit a.id → aktualisieren, sonst neu anlegen. Die erste Adresse wird
// automatisch Standard-Liefer- und -Rechnungsadresse.
export async function saveAddress(a) {
  const sb = client();
  if (a.id) {
    const { error } = await sb.from('cc_customer_addresses').update(addressRow(a)).eq('id', a.id);
    if (error) throw error;
    return;
  }
  const user = await requireUser();
  const { count, error: countError } = await sb.from('cc_customer_addresses').select('id', { count: 'exact', head: true }).eq('customer_id', user.id);
  if (countError) throw countError;
  const first = (count ?? 0) === 0;
  const { error } = await sb.from('cc_customer_addresses').insert({ ...addressRow(a), customer_id: user.id, is_default_billing: first, is_default_shipping: first });
  if (error) throw error;
}

export async function setDefaultAddress(id) {
  const sb = client();
  const user = await requireUser();
  const reset = await sb.from('cc_customer_addresses').update({ is_default_billing: false, is_default_shipping: false }).eq('customer_id', user.id).neq('id', id);
  if (reset.error) throw reset.error;
  const { error } = await sb.from('cc_customer_addresses').update({ is_default_billing: true, is_default_shipping: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteAddress(id) {
  const { error } = await client().from('cc_customer_addresses').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------------------------------------------------------- orders */

export async function listOrders(customerId) {
  const id = customerId || (await requireUser()).id;
  const { data, error } = await client()
    .from('cc_orders')
    .select('id, order_number, status, total_cents, placed_at, items:cc_order_items(product_name, variant_title, quantity)')
    .eq('customer_id', id)
    .order('placed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export const ORDER_STATUS = {
  pending: { label: 'Offen', tone: 'warn' },
  pending_payment: { label: 'Zahlung ausstehend', tone: 'warn' },
  awaiting_payment: { label: 'Zahlung ausstehend', tone: 'warn' },
  paid: { label: 'Bezahlt', tone: 'violet' },
  processing: { label: 'In Bearbeitung', tone: 'violet' },
  shipped: { label: 'Versendet', tone: 'info' },
  delivered: { label: 'Zugestellt', tone: 'ok' },
  cancelled: { label: 'Storniert', tone: 'off' },
  refunded: { label: 'Erstattet', tone: 'off' },
  partially_refunded: { label: 'Teilweise erstattet', tone: 'off' },
};
export const orderStatus = (s) => ORDER_STATUS[s] || { label: s || 'Unbekannt', tone: 'off' };

/* ------------------------------------------------------------ validation */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v) => EMAIL_RE.test(String(v || '').trim()) && String(v).trim().length <= 254;

// Gleiche Regeln wie im bisherigen Shop (mind. 10 Zeichen, Buchstaben + Zahlen).
export function validatePassword(pw) {
  if (!pw || pw.length < 10) return 'Mindestens 10 Zeichen.';
  if (pw.length > 72) return 'Höchstens 72 Zeichen.';
  if (!/[A-Za-zÄÖÜäöüß]/.test(pw) || !/\d/.test(pw)) return 'Bitte Buchstaben und Zahlen kombinieren.';
  return null;
}

// 0 … 4 für die Stärkeanzeige.
export function passwordStrength(pw = '') {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 10) s += 1;
  if (/[A-Za-zÄÖÜäöüß]/.test(pw) && /\d/.test(pw)) s += 1;
  if (/[a-zäöüß]/.test(pw) && /[A-ZÄÖÜ]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9ÄÖÜäöüß]/.test(pw) || pw.length >= 16) s += 1;
  if (pw.length < 10) s = Math.min(s, 1);
  const labels = ['Zu kurz', 'Schwach', 'Okay', 'Gut', 'Stark'];
  return { score: s, label: pw.length < 10 ? 'Zu kurz' : labels[s] };
}

/* ---------------------------------------------------------------- errors */

export function authErrorMessage(err) {
  if (!err) return '';
  if (err instanceof PreviewAuthError || err.code === 'preview_disabled') return PREVIEW_MESSAGE;
  const code = err.code ?? err.error_code ?? '';
  const msg = err.message ?? '';
  if (err.name === 'AuthRetryableFetchError' || /failed to fetch|networkerror|load failed/i.test(msg)) return 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung und versuch es noch einmal.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return 'E-Mail oder Passwort ist falsch.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in unserer E-Mail.';
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(msg)) return 'Zu dieser E-Mail gibt es schon ein Konto. Melde dich an oder setze dein Passwort zurück.';
  if (code === 'weak_password' || (/password/i.test(msg) && /weak|short|characters/i.test(msg))) return 'Das Passwort ist zu schwach. Bitte mindestens 10 Zeichen mit Buchstaben und Zahlen.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit/i.test(msg)) return 'Zu viele Versuche. Bitte warte ein paar Minuten.';
  if (code === 'same_password') return 'Das neue Passwort muss sich vom alten unterscheiden.';
  if (code === 'otp_expired' || /expired|invalid.*(link|token)/i.test(msg)) return 'Der Link ist abgelaufen oder wurde schon benutzt. Fordere bitte einen neuen an.';
  if (code === 'not_signed_in' || code === 'session_not_found' || /auth session missing/i.test(msg)) return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
  return 'Das hat nicht geklappt. Bitte versuche es später noch einmal.';
}
