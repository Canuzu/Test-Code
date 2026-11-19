// Central runtime configuration (all values are build-time Vite env vars).
//
//   VITE_SUPABASE_URL              – https://<project>.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY  – the public "publishable"/anon key (RLS-protected)
//   VITE_STRIPE_ENABLED            – "1" once the Stripe Edge Functions are deployed
//   VITE_PREVIEW                   – "1" for the design preview (demo data, no orders)
//   VITE_ROUTER                    – "hash" for static hosts without SPA fallback
//
// Without Supabase credentials the shop runs on the built-in demo catalogue, so
// the design can be previewed anywhere. Secret keys (Stripe secret, webhook
// secret, service role) NEVER go here – they live only in Supabase secrets.
const env = import.meta.env || {};

export const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
export const PREVIEW = env.VITE_PREVIEW === '1';
// Live data only when configured AND not in preview mode.
export const LIVE = !!(SUPABASE_URL && SUPABASE_KEY) && !PREVIEW;
export const STRIPE_ENABLED = LIVE && env.VITE_STRIPE_ENABLED === '1';
export const HASH_ROUTER = env.VITE_ROUTER === 'hash';

export const SHOP = {
  name: 'CardCompass',
  claim: 'Trading Cards, versiegelte Produkte und Zubehör für deine Sammlung.',
  // Kleinunternehmer nach § 19 UStG (as on the current site). Overridden by the
  // `tax_small_business` setting in Supabase when live.
  smallBusiness: true,
  currency: 'EUR',
  // Fallback shipping (live: cc_shipping_rates). Cents.
  shipping: [{ name: 'Standardversand (Deutschland)', price_cents: 549, free_from_cents: 10000 }],
};
