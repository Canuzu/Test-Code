// Buylist engine: "what do I offer a customer who wants to sell me cards?"
//
// Computes a store buy price as a percentage of the market price, configurable
// by price tier (cheap bulk pays a lower %, chase cards a higher %), card
// condition, and payout type (store credit usually pays more than cash). Result
// is rounded to a clean increment. Pure functions — the view persists the rules.

export const CONDITIONS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'];

export const DEFAULT_RULES = {
  shopName: 'Mein TCG-Laden',
  mode: 'tier', // 'tier' | 'flat'
  flatPct: 50,
  // tiers are ascending by market price; `max: null` = the open-ended top tier.
  tiers: [
    { max: 5, pct: 35 },
    { max: 20, pct: 45 },
    { max: 100, pct: 55 },
    { max: 500, pct: 65 },
    { max: null, pct: 70 },
  ],
  conditionPct: { M: 100, NM: 96, EX: 90, GD: 80, LP: 70, PL: 55, PO: 40 },
  payout: 'cash', // 'cash' | 'credit'
  creditBonusPct: 15, // store credit pays this much more than cash
  roundTo: 0.5,
};

export const withDefaults = (rules) => {
  if (!rules || typeof rules !== 'object') return { ...DEFAULT_RULES };
  return {
    ...DEFAULT_RULES,
    ...rules,
    tiers: Array.isArray(rules.tiers) && rules.tiers.length ? rules.tiers : DEFAULT_RULES.tiers,
    conditionPct: { ...DEFAULT_RULES.conditionPct, ...(rules.conditionPct || {}) },
  };
};

const roundTo = (v, step) => {
  if (!step || step <= 0) return Math.round(v * 100) / 100;
  return Math.round(v / step) * step;
};

const basePctFor = (market, rules) => {
  if (rules.mode === 'flat') return rules.flatPct;
  const tiers = [...rules.tiers].sort((a, b) => (a.max ?? Infinity) - (b.max ?? Infinity));
  for (const t of tiers) {
    if (t.max == null || market <= t.max) return t.pct;
  }
  return tiers[tiers.length - 1]?.pct ?? rules.flatPct;
};

// Computes the offer for one card. Returns the breakdown so the UI can explain it.
export const offerFor = (market, rules, { condition = 'NM', qty = 1 } = {}) => {
  const r = withDefaults(rules);
  const mk = Number(market) || 0;
  const basePct = basePctFor(mk, r);
  const condPct = r.conditionPct[condition] ?? 100;
  const payoutFactor = r.payout === 'credit' ? 1 + (r.creditBonusPct || 0) / 100 : 1;
  const unit = roundTo((mk * basePct / 100) * (condPct / 100) * payoutFactor, r.roundTo);
  return {
    market: mk,
    basePct,
    condPct,
    payoutFactor,
    unit: Math.max(0, unit),
    total: Math.max(0, unit) * (Number(qty) || 1),
  };
};
