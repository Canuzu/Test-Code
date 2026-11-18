// Price sanity filter: drops obviously broken values from a card's price block
// before anything is computed or shown.
//
// The upstream Cardmarket figures occasionally contain absurd outliers, e.g. a
// troll listing as the "cheapest offer" (Nachtara: low 50.000 € while every
// average sits around 5.000 €), a 1-day average from a single mistyped sale
// (Aerodactyl: avg1 2.200 € vs. ~190 €) or a stale trend of 0,02 € on a card
// that sells for 20 €. Those values poison the headline price, the % changes,
// the margin and every "Top-Karten"/mover list.
//
// Method: take the MEDIAN of the independent price signals (trend, 1/7/30-day
// average, average sell price) as a robust reference — a single bad value can't
// move a median — and drop any field that is wildly off it. Needs at least three
// signals; with fewer there is no reliable reference and nothing is touched.
// Dropped fields simply become "unknown" (shown as "–"), the UI then falls back
// to the remaining signals (marketPrice() already chains trend → avg7 → …).

const AVG_FIELDS = ['trend', 'market', 'avg1', 'avg7', 'avg30', 'averageSell'];
// Averages/trend: more than 4× above or below the reference is not a market move
// we can trust from these aggregates.
export const AVG_FACTOR = 4;
// Cheapest offer: may legitimately be well below the averages (played copies,
// other languages) but not 25× below, and never more than 2× ABOVE them.
export const LOW_ABOVE = 2;
export const LOW_BELOW = 25;

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

function median(values) {
  const a = [...values].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

// Mutates `prices` in place (removing outlier fields) and returns the list of
// dropped field names (empty when everything looked plausible).
export function sanitizePrices(prices) {
  if (!prices || typeof prices !== 'object') return [];
  // trend and market are the same number for most sources — count it once.
  const signals = [pos(prices.trend) ?? pos(prices.market), pos(prices.avg1), pos(prices.avg7), pos(prices.avg30), pos(prices.averageSell)]
    .filter((v) => v != null);
  if (signals.length < 3) return [];
  const ref = median(signals);
  const dropped = [];
  for (const k of AVG_FIELDS) {
    const v = pos(prices[k]);
    if (v != null && (v > ref * AVG_FACTOR || v < ref / AVG_FACTOR)) { delete prices[k]; dropped.push(k); }
  }
  const low = pos(prices.low);
  if (low != null && (low > ref * LOW_ABOVE || low < ref / LOW_BELOW)) { delete prices.low; dropped.push('low'); }
  return dropped;
}
