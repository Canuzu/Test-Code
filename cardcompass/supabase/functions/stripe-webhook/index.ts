// Supabase Edge Function: stripe-webhook
// ---------------------------------------------------------------------------
// Receives events from Stripe (Dashboard → Entwickler → Webhooks) and updates
// the order created by create-checkout.
//
//   checkout.session.completed            payment_status 'paid' → paid + stock
//                                         otherwise (e.g. SEPA)  → 'processing'
//   checkout.session.async_payment_succeeded                     → paid + stock
//   checkout.session.async_payment_failed                        → 'payment_failed'
//   checkout.session.expired                                     → 'cancelled'
//
// "Paid" is applied by the SQL function cc_apply_paid_order (security definer,
// one transaction, idempotent): Stripe may deliver an event more than once.
//
// Deploy WITHOUT JWT verification (Stripe cannot send a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
// Every request is instead verified with the webhook signing secret.
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_…);
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Keep in sync with create-checkout/index.ts and cc_apply_paid_order.
const ORDER_STATUS_PENDING = 'pending_payment';
const ORDER_STATUS_FAILED = 'payment_failed';
const ORDER_STATUS_CANCELLED = 'cancelled';

const stripe = new Stripe(STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Order id from the session (metadata → client_reference_id → stored session id).
async function findOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const fromMeta = session.metadata?.order_id || session.client_reference_id || '';
  if (UUID_RE.test(fromMeta)) return fromMeta;
  const { data } = await admin.from('cc_orders').select('id').eq('stripe_session_id', session.id).maybeSingle();
  return data?.id ?? null;
}

const intentId = (s: Stripe.Checkout.Session): string | null =>
  typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? null;

async function markPaid(session: Stripe.Checkout.Session) {
  const orderId = await findOrderId(session);
  if (!orderId) {
    console.error('[stripe-webhook] paid session without order', session.id);
    return;
  }
  // Sanity check: the amount Stripe charged must match the stored order total.
  const { data: order } = await admin.from('cc_orders').select('total_cents, stripe_session_id').eq('id', orderId).maybeSingle();
  if (order && session.amount_total != null && order.total_cents !== session.amount_total) {
    console.warn('[stripe-webhook] amount mismatch', { orderId, order: order.total_cents, stripe: session.amount_total });
  }
  if (order && !order.stripe_session_id) {
    await admin.from('cc_orders').update({ stripe_session_id: session.id }).eq('id', orderId);
  }

  const { data, error } = await admin.rpc('cc_apply_paid_order', { p_order_id: orderId, p_payment_intent: intentId(session) });
  if (error) throw new Error(`cc_apply_paid_order: ${error.message}`);
  const result = data as { result?: string; shortfall?: unknown[] } | null;
  if (result?.shortfall && Array.isArray(result.shortfall) && result.shortfall.length) {
    // Paid, but stock was lower than ordered (sold twice at the same time) – needs manual attention.
    console.warn('[stripe-webhook] STOCK SHORTFALL – please check order', orderId, JSON.stringify(result.shortfall));
  }
  console.log('[stripe-webhook] paid', orderId, result?.result);
}

// Status change for an order that is still waiting for its payment. Never
// touches orders that are already paid or were moved on by the shop.
async function markUnpaid(session: Stripe.Checkout.Session, status: string, paymentStatus: string) {
  const orderId = await findOrderId(session);
  if (!orderId) return;
  const update: Record<string, unknown> = { payment_status: paymentStatus };
  if (status) update.status = status;
  const pi = intentId(session);
  if (pi) update.stripe_payment_intent_id = pi;
  const { error } = await admin
    .from('cc_orders')
    .update(update)
    .eq('id', orderId)
    .eq('status', ORDER_STATUS_PENDING)
    .or('payment_status.is.null,payment_status.neq.paid');
  if (error) throw new Error(`order update: ${error.message}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] missing secrets (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)');
    return reply({ error: 'not_configured' }, 500);
  }

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return reply({ error: 'missing_signature' }, 400);

  // The signature is computed over the raw body: read it as text, untouched.
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider);
  } catch (e) {
    console.warn('[stripe-webhook] bad signature', e instanceof Error ? e.message : e);
    return reply({ error: 'invalid_signature' }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
          await markPaid(session);
        } else {
          // Delayed methods (e.g. SEPA): order placed, money not there yet.
          await markUnpaid(session, '', 'processing');
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded':
        await markPaid(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.async_payment_failed':
        await markUnpaid(event.data.object as Stripe.Checkout.Session, ORDER_STATUS_FAILED, 'failed');
        break;
      case 'checkout.session.expired':
        await markUnpaid(event.data.object as Stripe.Checkout.Session, ORDER_STATUS_CANCELLED, 'expired');
        break;
      default:
        // Not relevant for the shop – acknowledge so Stripe does not retry.
        return reply({ received: true, ignored: event.type });
    }
  } catch (e) {
    // 500 → Stripe retries the event later (handlers are idempotent).
    console.error('[stripe-webhook] handler failed', event.type, event.id, e instanceof Error ? e.message : e);
    return reply({ error: 'handler_failed' }, 500);
  }

  return reply({ received: true });
});
