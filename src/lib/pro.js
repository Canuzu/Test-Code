// Feature tiers.
//
// The app currently has NO payment backend, so advertising a paid plan would be
// misleading. Until real billing exists, EVERY feature is free for everyone:
// `isPro` returns true, so nothing is gated. The Free/"all-access" structure and
// feature list are kept for the info screen, and for the day a billing backend
// is wired (it would then gate on settings.pro again — see README).

export const PRO_FEATURES = {
  buylist: 'Buylist + PDF-Druck',
  alerts: 'Preis-Alerts',
  import: 'Massenimport (CSV / Barcode)',
  analyticsPro: 'Erweiterte Analytics',
  team: 'Team-Zugang',
};

// All features are free while there is no billing backend. (Was: !!settings?.pro)
export const isPro = () => true;
export const requiresPro = (feature) => feature in PRO_FEATURES;

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

