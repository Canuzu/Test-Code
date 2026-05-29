// Subscription tiers + feature gating.
//
// Real recurring billing needs a backend (Stripe/Paddle) — a static site can't
// hold a payment secret or verify a subscription. So this models the Free/Pro
// structure and gates the Pro features in the UI; the "unlock" is a local demo
// flag (settings.pro). When a billing backend is added, it only has to set that
// same flag after a verified checkout. The upgrade path is documented in README.

export const PRO_FEATURES = {
  buylist: 'Buylist + PDF-Druck',
  alerts: 'Preis-Alerts',
  import: 'Massenimport (CSV / Barcode)',
  analyticsPro: 'Erweiterte Analytics',
  team: 'Team-Zugang',
};

export const isPro = (settings) => !!settings?.pro;
export const requiresPro = (feature) => feature in PRO_FEATURES;

export const PLANS = [
  {
    id: 'free',
    name: 'Kostenlos',
    monthly: 0,
    annual: 0,
    tagline: 'Für Sammler & Einstieg',
    features: [
      'Live-Preise (Cardmarket EU)',
      'Interaktive Preis-Charts',
      'Watchlist & Sammlung',
      'Marktplatz-Vergleich & Grading-Schätzung',
      'CSV-Export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 19,
    annual: 15, // per month, billed yearly (€180)
    tagline: 'Für Händler & Läden',
    badge: 'Beliebt',
    features: [
      'Alles aus Kostenlos',
      '🧾 Buylist mit PDF-Druck & Regeln',
      '🔔 Preis-Alerts (in-app & Push)',
      '📥 Massenimport (CSV & Barcode)',
      '📊 Erweiterte Analytics',
      '👥 Team-Zugang (Vorbereitung)',
    ],
  },
];
