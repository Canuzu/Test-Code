// Feature tiers + billing gate.
//
// Billing is OPT-IN (Stripe, Phase 2). With no Stripe price configured
// (VITE_STRIPE_PRICE_ID unset) the app stays free for everyone: planIsPro() is
// always true, so nothing is gated. Configure Stripe (docs/BACKEND.md) and the
// gate switches to the user's real, server-side plan ('free' | 'pro').

export const PRO_FEATURES = {
  buylist: 'Buylist + PDF-Druck',
  alerts: 'Preis-Alerts',
  import: 'Massenimport (CSV / Barcode)',
  analyticsPro: 'Erweiterte Analytics',
  team: 'Team-Zugang',
};

export const requiresPro = (feature) => feature in PRO_FEATURES;

// True once a Stripe price is configured at build time.
export const billingEnabled = !!import.meta.env.VITE_STRIPE_PRICE_ID;
// The gate: free-for-all until billing is enabled, then plan-based.
export const planIsPro = (plan) => (billingEnabled ? plan === 'pro' : true);

// Everything the app offers — shown on the (free) info screen.
export const ALL_FEATURES = [
  'Live-/Marktpreise & interaktive Preis-Charts',
  'Watchlist, Sammlung & Inventar-Verwaltung',
  'Marktplatz-Vergleich & Grading-Schätzung',
  '🧾 Buylist mit PDF-Druck & Regeln',
  '🔔 Preis-Alerts (in-app & Push)',
  '📥 Massenimport (CSV & Barcode)',
  '📊 Erweiterte Analytics',
  'CSV-Export',
];

