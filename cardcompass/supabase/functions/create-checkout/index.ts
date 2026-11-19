// Supabase Edge Function: create-checkout
// ---------------------------------------------------------------------------
// Called by the shop (supabase.functions.invoke('create-checkout')) when the
// customer clicks "Zahlungspflichtig bestellen". It
//   1. validates the request strictly (types, lengths, max 50 lines, qty 1–20,
//      accept_terms === true, German postal codes, return URL allow-list),
//   2. loads variants, product names and stock with the service role and
//      rejects unpublished / unavailable / insufficient items (409 + list),
//   3. computes every amount on the server (the client never sends prices),
//   4. creates the order + items with status 'pending_payment',
//   5. creates a Stripe Checkout Session and returns { url, order_number }.
//
// Secrets (supabase secrets set …): STRIPE_SECRET_KEY, SITE_URL
// (comma-separated list of allowed shop origins, e.g. https://cardcompass.de).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Payment methods are NOT hard-coded: Checkout shows every method enabled in
// the Stripe Dashboard (card, PayPal, Klarna, SEPA, Apple Pay, Google Pay …).

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ---- configuration ----------------------------------------------------------
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URLS = (Deno.env.get('SITE_URL') ?? '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Order status values written by this function and the webhook. If cc_orders
// uses an enum / check constraint with other names, change them HERE (and in
// stripe-webhook/index.ts + the SQL function cc_apply_paid_order).
const ORDER_STATUS_PENDING = 'pending_payment';
const PAYMENT_STATUS_UNPAID = 'unpaid';

const MAX_LINES = 50;
const MAX_QTY = 20;
const MAX_BODY_BYTES = 32 * 1024;
const SESSION_TTL_SECONDS = 30 * 60 + 60; // Stripe minimum is 30 min after creation → +60 s buffer
const FALLBACK_SHIPPING = { name: 'Standardversand (Deutschland)', price_cents: 549, free_from_cents: 10000 };

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 2,
});
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- small helpers ------------------------------------------------------------
type Json = Record<string, unknown>;

const allowedOrigins = new Set(
  SITE_URLS.map((u) => {
    try { return new URL(u).origin; } catch { return ''; }
  }).filter(Boolean),
);

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-region',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins.has(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(body: Json, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

class InputError extends Error {
  fields: string[];
  constructor(message: string, fields: string[] = []) {
    super(message);
    this.fields = fields;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()/-]{4,28}$/;
// Control characters are never legitimate in names/addresses (newlines only in the note).
// deno-lint-ignore no-control-regex
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function str(v: unknown, field: string, { min = 0, max, optional = false, multiline = false }: { min?: number; max: number; optional?: boolean; multiline?: boolean }): string | null {
  if (v === undefined || v === null || v === '') {
    if (optional) return null;
    throw new InputError(`Pflichtfeld fehlt: ${field}`, [field]);
  }
  if (typeof v !== 'string') throw new InputError(`Ungültiger Wert: ${field}`, [field]);
  let s = v.replace(CTRL_RE, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').trim() : s.replace(/\s+/g, ' ').trim();
  if (!s) {
    if (optional) return null;
    throw new InputError(`Pflichtfeld fehlt: ${field}`, [field]);
  }
  if (s.length < min || s.length > max) throw new InputError(`Ungültige Länge: ${field}`, [field]);
  return s;
}

type Address = {
  first_name: string; last_name: string; company: string | null;
  address_line1: string; address_line2: string | null;
  postal_code: string; city: string; country_code: 'DE';
};

function parseAddress(v: unknown, prefix: string): Address {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new InputError(`Adresse fehlt: ${prefix}`, [prefix]);
  const a = v as Json;
  const country = a.country_code ?? 'DE';
  if (country !== 'DE') throw new InputError('Wir liefern aktuell nur innerhalb Deutschlands.', [`${prefix}.country_code`]);
  const postal = str(a.postal_code, `${prefix}.postal_code`, { max: 5 })!;
  if (!/^\d{5}$/.test(postal)) throw new InputError('Bitte gib eine gültige fünfstellige PLZ an.', [`${prefix}.postal_code`]);
  return {
    first_name: str(a.first_name, `${prefix}.first_name`, { min: 1, max: 60 })!,
    last_name: str(a.last_name, `${prefix}.last_name`, { min: 1, max: 60 })!,
    company: str(a.company, `${prefix}.company`, { max: 100, optional: true }),
    address_line1: str(a.address_line1, `${prefix}.address_line1`, { min: 3, max: 120 })!,
    address_line2: str(a.address_line2, `${prefix}.address_line2`, { max: 120, optional: true }),
    postal_code: postal,
    city: str(a.city, `${prefix}.city`, { min: 2, max: 80 })!,
    country_code: 'DE',
  };
}

type Input = {
  items: { variant_id: string; quantity: number }[];
  customer: { email: string; phone: string | null; first_name: string; last_name: string };
  shipping_address: Address;
  billing_address: Address;
  billing_same: boolean;
  customer_note: string | null;
  shipping_method: string | null;
  return_base: string | null;
};

function parseInput(body: unknown): Input {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Ungültige Anfrage.');
  const b = body as Json;

  if (b.accept_terms !== true) throw new InputError('Bitte bestätige die AGB.', ['accept_terms']);

  if (!Array.isArray(b.items) || b.items.length < 1) throw new InputError('Dein Warenkorb ist leer.', ['items']);
  if (b.items.length > MAX_LINES) throw new InputError(`Höchstens ${MAX_LINES} verschiedene Artikel pro Bestellung.`, ['items']);
  const merged = new Map<string, number>();
  for (const it of b.items as unknown[]) {
    if (!it || typeof it !== 'object') throw new InputError('Ungültiger Artikel.', ['items']);
    const { variant_id, quantity } = it as Json;
    if (typeof variant_id !== 'string' || !UUID_RE.test(variant_id)) throw new InputError('Ungültiger Artikel.', ['items']);
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new InputError(`Die Menge muss zwischen 1 und ${MAX_QTY} liegen.`, ['items']);
    }
    const id = variant_id.toLowerCase();
    merged.set(id, (merged.get(id) ?? 0) + quantity);
  }
  for (const q of merged.values()) if (q > MAX_QTY) throw new InputError(`Die Menge muss zwischen 1 und ${MAX_QTY} liegen.`, ['items']);

  const c = b.customer;
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new InputError('Kontaktdaten fehlen.', ['customer']);
  const cj = c as Json;
  const email = str(cj.email, 'customer.email', { min: 6, max: 254 })!.toLowerCase();
  if (!EMAIL_RE.test(email)) throw new InputError('Bitte gib eine gültige E-Mail-Adresse an.', ['customer.email']);
  const phone = str(cj.phone, 'customer.phone', { max: 30, optional: true });
  if (phone && !PHONE_RE.test(phone)) throw new InputError('Bitte gib eine gültige Telefonnummer an.', ['customer.phone']);

  const shipping = parseAddress(b.shipping_address, 'shipping_address');
  const billingSame = b.billing_address === null || b.billing_address === undefined;
  const billing = billingSame ? shipping : parseAddress(b.billing_address, 'billing_address');

  const note = str(b.customer_note, 'customer_note', { max: 1000, optional: true, multiline: true });
  const method = str(b.shipping_method, 'shipping_method', { max: 120, optional: true });
  const returnBase = typeof b.return_base === 'string' && b.return_base.length <= 300 ? b.return_base : null;

  return {
    items: [...merged.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity })),
    customer: {
      email,
      phone,
      first_name: str(cj.first_name, 'customer.first_name', { max: 60, optional: true }) ?? shipping.first_name,
      last_name: str(cj.last_name, 'customer.last_name', { max: 60, optional: true }) ?? shipping.last_name,
    },
    shipping_address: shipping,
    billing_address: billing,
    billing_same: billingSame,
    customer_note: note,
    shipping_method: method,
    return_base: returnBase,
  };
}

// Absolute base URL to send the customer back to. Accepts "<origin>[/path]" and
// "<origin>[/path]/#" (hash routing). The origin must be listed in SITE_URL;
// otherwise the first SITE_URL entry is used.
function resolveReturnBase(candidate: string | null): string {
  const fallback = SITE_URLS[0];
  if (candidate) {
    const m = candidate.match(/^(https?:\/\/[^/?#\s]+)((?:\/[A-Za-z0-9._~%-]+)*)\/?(\/#|#)?$/);
    if (m) {
      try {
        const origin = new URL(m[1]).origin;
        const localhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (allowedOrigins.has(origin) && (origin.startsWith('https://') || localhost)) {
          return `${origin}${m[2] || ''}${m[3] ? '/#' : ''}`;
        }
      } catch { /* fall through */ }
    }
    console.warn('[create-checkout] return_base not allowed, using SITE_URL', candidate);
  }
  if (!fallback) throw new Error('SITE_URL secret is not configured');
  return fallback.replace(/\/+$/, '');
}

// ---- database access ---------------------------------------------------------------
type VariantRow = {
  id: string;
  title: string | null;
  price_cents: number;
  max_per_order?: number | null; // Fair-Limit (anti-scalping), see migration
  product_id: string;
  product: { id: string; name: string; published_at: string | null } | null;
  inventory: { available: number | null } | { available: number | null }[] | null;
};

async function loadVariants(ids: string[]): Promise<Map<string, VariantRow>> {
  const base = 'id, title, price_cents, product_id, product:cc_products(id, name, published_at), inventory:cc_inventory(available)';
  let { data, error } = await admin.from('cc_product_variants').select(`${base}, max_per_order`).in('id', ids);
  // Fair-Limit column not migrated yet → run without it (no limit enforced).
  if (error && (error.code === '42703' || /max_per_order/.test(error.message))) {
    ({ data, error } = await admin.from('cc_product_variants').select(base).in('id', ids));
  }
  if (error) throw new Error(`variants: ${error.message}`);
  return new Map((data as unknown as VariantRow[]).map((v) => [v.id.toLowerCase(), v]));
}

type Rate = { name: string; price_cents: number; free_from_cents: number | null; sort: number };

async function loadShippingRates(): Promise<Rate[]> {
  const { data, error } = await admin
    .from('cc_shipping_rates')
    .select('price_cents, free_from_cents, method:cc_shipping_methods(name, sort_order)')
    .eq('country_code', 'DE');
  if (error) {
    console.error('[create-checkout] shipping rates', error.message);
    return [{ ...FALLBACK_SHIPPING, sort: 0 }];
  }
  type Row = { price_cents: number; free_from_cents: number | null; method: { name: string; sort_order: number | null } | { name: string; sort_order: number | null }[] | null };
  const rates = ((data ?? []) as unknown as Row[])
    .map((r) => {
      const m = Array.isArray(r.method) ? r.method[0] : r.method;
      return { name: m?.name || 'Versand', price_cents: Math.max(0, Math.round(Number(r.price_cents) || 0)), free_from_cents: r.free_from_cents == null ? null : Number(r.free_from_cents), sort: m?.sort_order ?? 0 };
    })
    .sort((a, b) => a.sort - b.sort);
  return rates.length ? rates : [{ ...FALLBACK_SHIPPING, sort: 0 }];
}

// Optional: link the order to a logged-in customer (never required – guest checkout).
async function customerIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  // Only user JWTs (three dot-separated parts) – not the anon/publishable key.
  if (!token || token.split('.').length !== 3) return null;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    const { data: profile } = await admin.from('cc_customer_profiles').select('id').eq('id', data.user.id).maybeSingle();
    return profile?.id ?? null;
  } catch {
    return null;
  }
}

// ========================================================================== //
//  ORDER INSERT – CHECK AGAINST THE REAL SCHEMA (see docs/STRIPE-SETUP.md).   //
//  Only columns known from the existing frontend + the columns added by       //
//  supabase/migrations/20261119000000_stripe_checkout.sql are written.        //
// ========================================================================== //
type OrderLine = { variant_id: string; product_name: string; variant_title: string | null; quantity: number; unit_price_cents: number };

async function insertOrder(o: {
  customer_id: string | null;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  shipping_address: Address;
  billing_address: Address;
  billing_same: boolean;
  customer_note: string | null;
  shipping_method: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  lines: OrderLine[];
}): Promise<{ id: string; order_number: string }> {
  const orderRow: Json = {
    status: ORDER_STATUS_PENDING,
    total_cents: o.total_cents,
    placed_at: new Date().toISOString(),
    customer_id: o.customer_id,
    // new columns (migration 20261119000000_stripe_checkout.sql)
    payment_status: PAYMENT_STATUS_UNPAID,
    customer_email: o.email,
    shipping_address: { ...o.shipping_address, phone: o.phone, shipping_method: o.shipping_method },
    billing_address: { ...o.billing_address, same_as_shipping: o.billing_same },
    customer_note: o.customer_note,
    shipping_cents: o.shipping_cents,
    subtotal_cents: o.subtotal_cents,
  };

  // order_number: the existing database may generate it (default/trigger).
  // If not, the migration's cc_stripe_order_number() hands out CC-YYYY-NNNNNN.
  let ins = await admin.from('cc_orders').insert(orderRow).select('id, order_number').single();
  if (ins.error && ins.error.code === '23502' && /order_number/.test(ins.error.message)) {
    const { data: no, error: noErr } = await admin.rpc('cc_stripe_order_number');
    if (noErr || !no) throw new Error(`order number: ${noErr?.message ?? 'empty'}`);
    ins = await admin.from('cc_orders').insert({ ...orderRow, order_number: no }).select('id, order_number').single();
  }
  if (ins.error || !ins.data) throw new Error(`order insert: ${ins.error?.message ?? 'no row'}`);
  const order = ins.data as { id: string; order_number: string | null };

  let orderNumber = order.order_number;
  if (!orderNumber) {
    const { data: no, error: noErr } = await admin.rpc('cc_stripe_order_number');
    if (noErr || !no) throw new Error(`order number: ${noErr?.message ?? 'empty'}`);
    const up = await admin.from('cc_orders').update({ order_number: no }).eq('id', order.id);
    if (up.error) throw new Error(`order number update: ${up.error.message}`);
    orderNumber = no as string;
  }

  const itemRows = o.lines.map((l) => ({
    order_id: order.id,
    product_name: l.product_name,
    variant_title: l.variant_title,
    quantity: l.quantity,
    // new columns (migration)
    variant_id: l.variant_id,
    unit_price_cents: l.unit_price_cents,
  }));
  const items = await admin.from('cc_order_items').insert(itemRows);
  if (items.error) {
    await deleteOrder(order.id);
    throw new Error(`order items insert: ${items.error.message}`);
  }
  return { id: order.id, order_number: orderNumber! };
}

async function deleteOrder(orderId: string) {
  await admin.from('cc_order_items').delete().eq('order_id', orderId);
  await admin.from('cc_orders').delete().eq('id', orderId);
}
// ========================================================================== //

// ---- handler ---------------------------------------------------------------------
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: origin && allowedOrigins.has(origin) ? 204 : 403, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin);
  // Browsers always send Origin on cross-origin POSTs: only our shop may call.
  // Requests without an Origin (scripts, bots) are rejected too – the shop
  // itself always sends one. (Not a hard guarantee, but it keeps casual
  // order spam out; no stock is reserved for unpaid orders anyway.)
  if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, origin);
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY || !SITE_URLS.length) {
    console.error('[create-checkout] missing secrets (STRIPE_SECRET_KEY / SITE_URL / SUPABASE_*)');
    return json({ error: 'not_configured', message: 'Die Bezahlung ist noch nicht eingerichtet.' }, 503, origin);
  }

  // ---- 1. validate -------------------------------------------------------------
  let input: Input;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) throw new InputError('Anfrage zu groß.');
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new InputError('Ungültige Anfrage.'); }
    input = parseInput(parsed);
  } catch (e) {
    if (e instanceof InputError) return json({ error: 'invalid_input', message: e.message, fields: e.fields }, 400, origin);
    console.error('[create-checkout] parse', e);
    return json({ error: 'invalid_input', message: 'Ungültige Anfrage.' }, 400, origin);
  }

  try {
    const returnBase = resolveReturnBase(input.return_base);

    // ---- 2. load variants + stock --------------------------------------------
    const variants = await loadVariants(input.items.map((i) => i.variant_id));
    const problems: Json[] = [];
    const lines: OrderLine[] = [];
    const now = Date.now();
    for (const it of input.items) {
      const v = variants.get(it.variant_id);
      const product = v?.product ?? null;
      const published = !!product?.published_at && Date.parse(product.published_at) <= now;
      const inv = Array.isArray(v?.inventory) ? v?.inventory[0] : v?.inventory;
      const available = Math.max(0, Math.floor(Number(inv?.available ?? 0)));
      const price = Number(v?.price_cents);
      if (!v || !product || !published || !Number.isInteger(price) || price < 0) {
        problems.push({ variant_id: it.variant_id, name: product?.name ?? null, variant_title: v?.title ?? null, requested: it.quantity, available: 0, reason: 'unavailable' });
        continue;
      }
      const limit = Number.isInteger(v.max_per_order) && (v.max_per_order as number) > 0 ? (v.max_per_order as number) : null;
      if (limit != null && it.quantity > limit) {
        problems.push({ variant_id: it.variant_id, name: product.name, variant_title: v.title, requested: it.quantity, available: Math.min(available, limit), limit, reason: 'fair_limit' });
        continue;
      }
      if (available < it.quantity) {
        problems.push({ variant_id: it.variant_id, name: product.name, variant_title: v.title, requested: it.quantity, available, reason: available === 0 ? 'sold_out' : 'insufficient' });
        continue;
      }
      lines.push({ variant_id: v.id, product_name: product.name, variant_title: v.title || null, quantity: it.quantity, unit_price_cents: price });
    }
    if (problems.length) {
      return json({
        error: 'out_of_stock',
        message: 'Einige Artikel sind nicht mehr in der gewünschten Menge verfügbar. Bitte passe deinen Warenkorb an.',
        items: problems,
      }, 409, origin);
    }

    // ---- 3. amounts (server-side only) ------------------------------------------
    const subtotal = lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0);
    const rates = await loadShippingRates();
    const rate = (input.shipping_method && rates.find((r) => r.name === input.shipping_method)) || rates[0];
    const shippingCents = rate.free_from_cents != null && subtotal >= rate.free_from_cents ? 0 : rate.price_cents;
    const total = subtotal + shippingCents;
    if (total < 50) throw new InputError('Der Mindestbestellwert beträgt 0,50 €.'); // Stripe minimum for EUR
    if (total > 99_999_999) throw new InputError('Bestellsumme zu hoch.');

    // ---- 4. order ---------------------------------------------------------------
    const customerId = await customerIdFromRequest(req);
    const order = await insertOrder({
      customer_id: customerId,
      email: input.customer.email,
      phone: input.customer.phone,
      first_name: input.customer.first_name,
      last_name: input.customer.last_name,
      shipping_address: input.shipping_address,
      billing_address: input.billing_address,
      billing_same: input.billing_same,
      customer_note: input.customer_note,
      shipping_method: rate.name,
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: total,
      lines,
    });

    // ---- 5. Stripe Checkout Session -----------------------------------------------
    const orderParam = encodeURIComponent(order.order_number);
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        currency: 'eur',
        locale: 'de',
        // no payment_method_types → all methods enabled in the Stripe Dashboard
        line_items: lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: 'eur',
            unit_amount: l.unit_price_cents,
            product_data: {
              name: (l.variant_title ? `${l.product_name} – ${l.variant_title}` : l.product_name).slice(0, 250),
              metadata: { variant_id: l.variant_id },
            },
          },
        })),
        shipping_options: [{
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: (shippingCents === 0 ? `${rate.name} (kostenlos)` : rate.name).slice(0, 100),
            fixed_amount: { amount: shippingCents, currency: 'eur' },
          },
        }],
        customer_email: input.customer.email,
        client_reference_id: order.id,
        metadata: { order_id: order.id, order_number: order.order_number },
        payment_intent_data: {
          description: `CardCompass Bestellung ${order.order_number}`,
          metadata: { order_id: order.id, order_number: order.order_number },
        },
        success_url: `${returnBase}/kasse/danke?session_id={CHECKOUT_SESSION_ID}&order=${orderParam}`,
        cancel_url: `${returnBase}/kasse/abgebrochen`,
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      }, { idempotencyKey: `cc-checkout-${order.id}` });
    } catch (e) {
      console.error('[create-checkout] stripe', e instanceof Error ? e.message : e);
      await deleteOrder(order.id).catch(() => {});
      return json({ error: 'payment_provider', message: 'Die Bezahlseite konnte nicht geöffnet werden. Bitte versuche es noch einmal.' }, 502, origin);
    }

    const saved = await admin.from('cc_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saved.error) console.error('[create-checkout] save session id', saved.error.message); // webhook still finds the order via metadata

    if (!session.url) throw new Error('Stripe returned no session URL');
    return json({ url: session.url, order_number: order.order_number }, 200, origin);
  } catch (e) {
    if (e instanceof InputError) return json({ error: 'invalid_input', message: e.message, fields: e.fields }, 400, origin);
    console.error('[create-checkout] failed', e instanceof Error ? e.message : e);
    return json({ error: 'server_error', message: 'Die Bestellung konnte gerade nicht angelegt werden. Bitte versuche es gleich noch einmal.' }, 500, origin);
  }
});
