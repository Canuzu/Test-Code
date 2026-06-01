// Stripe billing (Phase 2) — client side.
//
// Opt-in: active only when VITE_STRIPE_PRICE_ID is set at build time (billingEnabled)
// AND Supabase is configured (the Edge Functions live there). All calls go through
// Supabase Edge Functions so the Stripe secret key never touches the browser.

import { getSupabase, isConfigured } from './supabase.js';
import { billingEnabled } from './pro.js';

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID;
// Optional human label for the price (Stripe holds the real amount), e.g. "9 € / Monat".
export const priceLabel = import.meta.env.VITE_STRIPE_PRICE_LABEL || '';
export { billingEnabled };

// Current plan for the signed-in user (server-authoritative). 'free' otherwise.
export async function fetchPlan() {
  if (!isConfigured) return 'free';
  try {
    const sb = await getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return 'free';
    const { data } = await sb.from('profiles').select('plan').eq('id', user.id).single();
    return data?.plan === 'pro' ? 'pro' : 'free';
  } catch { return 'free'; }
}

const returnUrl = () => window.location.origin + window.location.pathname;

// Redirects to Stripe Checkout for the configured subscription price.
export async function startCheckout() {
  const sb = await getSupabase();
  const { data, error } = await sb.functions.invoke('create-checkout', {
    body: { priceId: PRICE_ID, returnUrl: returnUrl() },
  });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
}

// Redirects to the Stripe Customer Portal (manage / cancel the subscription).
export async function openPortal() {
  const sb = await getSupabase();
  const { data, error } = await sb.functions.invoke('customer-portal', {
    body: { returnUrl: returnUrl() },
  });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
}
