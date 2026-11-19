// Checkout: mode detection, draft persistence and the hand-off to Stripe.
//
//   checkoutMode()  → 'demo'     preview build or no Supabase configured: the
//                                 flow is simulated, nothing is ordered or paid
//                   → 'disabled' live shop, but Stripe is not switched on yet
//                                 (VITE_STRIPE_ENABLED !== '1')
//                   → 'stripe'   live: the Edge Function `create-checkout`
//                                 creates the order + a Stripe Checkout Session
//
// The client NEVER sends prices: the server loads prices, stock and shipping
// from the database and computes every amount itself.
import { LIVE, PREVIEW, STRIPE_ENABLED, HASH_ROUTER } from './config.js';
import { getSupabase } from './supabase.js';

export const DRAFT_KEY = 'cc_checkout_draft';
const LAST_ORDER_KEY = 'cc_last_order';

export function checkoutMode() {
  if (PREVIEW || !LIVE) return 'demo';
  if (!STRIPE_ENABLED) return 'disabled';
  return 'stripe';
}

// Absolute base URL of the shop, without trailing slash. Stripe sends the
// customer back to `${base}/kasse/danke…` – in hash-routing builds the routes
// live behind '#', so the base ends in '/#'.
export function returnBase() {
  const { origin, pathname } = window.location;
  if (HASH_ROUTER) {
    // Hash builds may be served from a sub-folder or a relative base: use the
    // folder of the current document.
    const dir = pathname.replace(/index\.html$/, '').replace(/\/+$/, '');
    return `${origin}${dir}/#`;
  }
  const base = (import.meta.env.BASE_URL || '/').startsWith('/') ? import.meta.env.BASE_URL || '/' : '/';
  return `${origin}${base.replace(/\/+$/, '')}`;
}

// ---- draft (form values only – never anything payment-related) -------------
const DRAFT_FIELDS = [
  'email', 'phone',
  'ship_first', 'ship_last', 'ship_company', 'ship_line1', 'ship_line2', 'ship_zip', 'ship_city',
  'bill_same',
  'bill_first', 'bill_last', 'bill_company', 'bill_line1', 'bill_line2', 'bill_zip', 'bill_city',
  'note', 'shipping',
];

export function loadDraft() {
  try {
    const v = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!v || typeof v !== 'object') return {};
    const out = {};
    DRAFT_FIELDS.forEach((k) => { if (k in v) out[k] = k === 'bill_same' ? v[k] !== false : String(v[k] ?? '').slice(0, 1000); });
    return out;
  } catch { return {}; }
}

export function saveDraft(values) {
  try {
    const out = {};
    DRAFT_FIELDS.forEach((k) => { if (k in values) out[k] = values[k]; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(out));
  } catch { /* storage full/blocked */ }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// Order number of the last hand-off (fallback for the thank-you page).
export function rememberOrder(orderNumber) {
  try { sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderNumber, at: Date.now() })); } catch { /* ignore */ }
}
export function lastOrderNumber() {
  try {
    const v = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null');
    return v && Date.now() - v.at < 6 * 3600 * 1000 ? v.orderNumber : null;
  } catch { return null; }
}

// ---- errors ------------------------------------------------------------------
export class CheckoutError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'CheckoutError';
    this.code = code;
    this.items = extra.items || [];
    this.fields = extra.fields || [];
  }
}

const GENERIC = 'Die Bezahlung konnte gerade nicht gestartet werden. Bitte versuche es in einem Moment noch einmal – es wurde nichts berechnet.';

async function readFunctionError(error) {
  // FunctionsHttpError → error.context is the Response of the Edge Function.
  const res = error?.context;
  if (res && typeof res.json === 'function') {
    try {
      const body = await res.clone().json();
      return { status: res.status, body };
    } catch { return { status: res.status, body: null }; }
  }
  return { status: 0, body: null };
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

const demoNumber = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i += 1) s += abc[Math.floor(Math.random() * abc.length)];
  return `CC-DEMO-${s}`;
};

// startCheckout → { demo: true, orderNumber } in demo mode,
//               → { redirecting: true, orderNumber } after handing off to Stripe.
// Throws CheckoutError(code: 'disabled' | 'out_of_stock' | 'invalid' | 'network' | 'server').
export async function startCheckout({ lines, customer, shippingAddress, billingAddress, note, shippingMethodName }) {
  const mode = checkoutMode();
  if (mode === 'disabled') {
    throw new CheckoutError('disabled', 'Die Bezahlung wird gerade eingerichtet. Bis dahin wird noch keine Bestellung ausgelöst.');
  }
  if (!lines?.length) throw new CheckoutError('empty', 'Dein Warenkorb ist leer.');

  if (mode === 'demo') {
    await sleep(1200);
    const orderNumber = demoNumber();
    return { demo: true, orderNumber };
  }

  const body = {
    items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.qty })),
    customer,
    shipping_address: shippingAddress,
    billing_address: billingAddress || null,
    customer_note: note || '',
    shipping_method: shippingMethodName || null,
    accept_terms: true,
    return_base: returnBase(),
  };

  let res;
  try {
    res = await getSupabase().functions.invoke('create-checkout', { body, timeout: 30000 });
  } catch {
    throw new CheckoutError('network', GENERIC);
  }
  const { data, error } = res || {};
  if (error) {
    if (error.name === 'FunctionsFetchError') {
      throw new CheckoutError('network', 'Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es noch einmal.');
    }
    const { status, body: eb } = await readFunctionError(error);
    if (status === 409 && eb?.error === 'out_of_stock') {
      throw new CheckoutError('out_of_stock', eb.message || 'Einige Artikel sind nicht mehr in der gewünschten Menge verfügbar.', { items: eb.items || [] });
    }
    if (status === 400 && eb?.error) {
      throw new CheckoutError('invalid', eb.message || 'Bitte prüfe deine Angaben.', { fields: eb.fields || [] });
    }
    throw new CheckoutError('server', GENERIC);
  }
  if (!data?.url || !/^https:\/\//.test(data.url)) throw new CheckoutError('server', GENERIC);

  if (data.order_number) rememberOrder(data.order_number);
  window.location.assign(data.url);
  return { redirecting: true, orderNumber: data.order_number || null };
}
