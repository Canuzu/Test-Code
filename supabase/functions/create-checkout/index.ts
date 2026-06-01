// Edge Function: create a Stripe Checkout Session for the signed-in user.
// Deploy: supabase functions deploy create-checkout
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (fallback), SUPABASE_URL,
//          SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (auto-injected).
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cors, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { priceId, returnUrl } = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization') ?? '';

    // Identify the caller from their JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    // Service client to read/write the Stripe customer id (bypasses RLS).
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

    let customer = profile?.stripe_customer_id ?? undefined;
    if (!customer) {
      const c = await stripe.customers.create({ email: user.email, metadata: { supabase_uid: user.id } });
      customer = c.id;
      await admin.from('profiles').update({ stripe_customer_id: customer }).eq('id', user.id);
    }

    const base = returnUrl || Deno.env.get('APP_URL') || '';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: priceId ?? Deno.env.get('STRIPE_PRICE_ID'), quantity: 1 }],
      success_url: `${base}?billing=success`,
      cancel_url: `${base}?billing=cancelled`,
      allow_promotion_codes: true,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 400);
  }
});
