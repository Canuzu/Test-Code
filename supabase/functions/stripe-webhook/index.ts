// Edge Function: Stripe webhook → keeps profiles.plan in sync with the subscription.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// In the Stripe Dashboard add an endpoint → this function URL, sending at least:
//   checkout.session.completed, customer.subscription.created/updated/deleted.
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const isActive = (status: string) => status === 'active' || status === 'trialing';

async function applySubscription(customerId: string, sub: Stripe.Subscription | null) {
  await admin.from('profiles').update({
    plan: sub && isActive(sub.status) ? 'pro' : 'free',
    stripe_subscription_id: sub?.id ?? null,
    current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
  }).eq('stripe_customer_id', customerId);
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, whSecret);
  } catch (e) {
    return new Response(`Webhook Error: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const sub = s.subscription ? await stripe.subscriptions.retrieve(s.subscription as string) : null;
        await applySubscription(s.customer as string, sub);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub.customer as string, event.type === 'customer.subscription.deleted' ? null : sub);
        break;
      }
    }
  } catch (e) {
    return new Response(`Handler Error: ${(e as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
