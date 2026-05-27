// Derives all investor-facing metrics from REAL Cardmarket price data.
//
// pokemontcg.io exposes Cardmarket (EU / German market, in EUR) prices per card:
//   trendPrice, averageSellPrice, lowPrice, avg1, avg7, avg30
// From those we compute genuine value change (Wertsteigerung/-senkung), a deal
// margin, a transparent popularity index and a composite investment score.

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);

// "Recent" reference price: yesterday's average, else current trend/market.
export const recentPrice = (p = {}) => num(p.avg1) ?? num(p.trend) ?? num(p.market) ?? num(p.avg7) ?? num(p.avg30);

// Headline market price shown everywhere.
export const marketPrice = (p = {}) => num(p.trend) ?? num(p.market) ?? num(p.avg7) ?? recentPrice(p);

// Percentage change of the recent price vs the N-day average.
export const change = (p = {}, window = 7) => {
  const base = window === 30 ? num(p.avg30) : num(p.avg7);
  const recent = recentPrice(p);
  if (base == null || recent == null || base === 0) return null;
  return ((recent - base) / base) * 100;
};

// Trend bucket from short-term momentum (falls back to 30-day).
export const deriveTrend = (p = {}) => {
  const c = change(p, 7) ?? change(p, 30);
  if (c == null) return 'stable';
  if (c > 2) return 'rising';
  if (c < -2) return 'falling';
  return 'stable';
};

// Spread between cheapest copy and trend = "buy low / sell at trend" potential.
export const marginPct = (p = {}) => {
  const low = num(p.low);
  const trend = num(p.trend) ?? num(p.market);
  if (low == null || trend == null || low === 0) return null;
  return ((trend - low) / low) * 100;
};

// Volatility proxy: magnitude of the 30-day swing.
const volatility = (p = {}) => Math.abs(change(p, 30) ?? change(p, 7) ?? 0);

// Risk: expensive and/or swingy cards are riskier to hold.
export const deriveRisk = (card) => {
  const p = card.prices || {};
  const m = marketPrice(p) ?? 0;
  const vol = volatility(p);
  if (m > 150 || vol > 30) return 'high';
  if (m < 15 && vol < 15) return 'low';
  return 'medium';
};

const rarityWeight = (rarity) => {
  const x = (rarity || '').toLowerCase();
  if (x.includes('illustration') || x.includes('special') || x.includes('hyper') || x.includes('secret') || x.includes('crown')) return 4;
  if (x.includes('ultra') || x.includes('vmax') || x.includes('vstar') || x.includes('full art') || x.includes('alt')) return 3.2;
  if (x.includes(' ex') || x.endsWith('ex') || x.includes(' gx') || x.includes('amazing')) return 2.6;
  if (x.includes('holo') || x.includes('double rare')) return 2;
  if (x.includes('rare')) return 1.5;
  if (x.includes('uncommon')) return 0.8;
  return 0.4;
};

// Transparent 0-10 popularity index. pokemontcg.io has no sales-volume data, so
// this is a HEURISTIC from rarity, price level and momentum -- labelled as such
// in the UI. It is a demand proxy, not measured demand.
export const popularityIndex = (card) => {
  const p = card.prices || {};
  const m = marketPrice(p) ?? 0;
  const rar = rarityWeight(card.rarity); // 0-4
  const price = clamp(Math.log10(m + 1) * 1.6, 0, 3.5); // pricier -> more sought-after, capped
  const mom = clamp(((change(p, 30) ?? 0) / 30) * 2, -1, 2); // positive momentum boosts
  const base = 1;
  return Math.round(clamp(rar + price + mom + base, 0, 10) * 10) / 10;
};

// Composite 0-100 investment score (adapted from the template, real-data driven).
export const investmentScore = (card) => {
  const p = card.prices || {};
  const m = marketPrice(p) ?? 0;
  const c30 = change(p, 30) ?? 0;
  const pop = popularityIndex(card);
  const vol = volatility(p);

  const momentumScore = clamp(((c30 + 20) / 50) * 35, 0, 35); // -20%..+30% -> 0..35
  const popScore = (pop / 10) * 25;
  const accessScore = clamp(15 - Math.log10(m + 1) * 5, 0, 15); // cheap -> accessible
  const stabilityScore = 15 - (clamp(vol, 0, 30) / 30) * 15;
  const dataScore = (num(p.avg30) != null && num(p.low) != null && num(p.trend) != null) ? 10 : 5;

  return clamp(Math.round(momentumScore + popScore + accessScore + stabilityScore + dataScore), 0, 100);
};

export const getTier = (s) => {
  if (s >= 88) return { l: 'S', c: '#ff3d7f', n: 'Elite' };
  if (s >= 76) return { l: 'A', c: '#ffd700', n: 'Sehr stark' };
  if (s >= 64) return { l: 'B', c: '#00e676', n: 'Stark' };
  if (s >= 50) return { l: 'C', c: '#448aff', n: 'Solide' };
  if (s >= 35) return { l: 'D', c: '#aaaacc', n: 'Durchschnitt' };
  return { l: 'F', c: '#666688', n: 'Schwach' };
};

// Attaches every derived metric to a card so the UI never recomputes.
export const enrich = (card) => {
  const p = card.prices || {};
  const market = marketPrice(p);
  const change7 = change(p, 7);
  const change30 = change(p, 30);
  const trend = deriveTrend(p);
  const popularity = popularityIndex(card);
  const risk = deriveRisk(card);
  const margin = marginPct(p);
  const score = investmentScore(card);
  return { ...card, m: { market, change7, change30, trend, popularity, risk, margin, score, tier: getTier(score) } };
};

// Rough 4-point series (30d avg -> 7d avg -> yesterday -> trend) for sparklines.
export const sparkSeries = (p = {}) => {
  const pts = [num(p.avg30), num(p.avg7), num(p.avg1), num(p.trend) ?? num(p.market)]
    .filter((v) => v != null)
    .map((v, i) => ({ i, v }));
  return pts.length >= 2 ? pts : [];
};
