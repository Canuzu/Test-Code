// Builds a price-history time series for a card (the "Pricecharting" centrepiece).
//
// Our data source (pokemontcg.io → Cardmarket) only exposes point-in-time
// aggregates per card: avg30, avg7, avg1 and the current trend. There is no
// real multi-month series available from a static, no-backend site. So we:
//
//   1. SYNTHESIZE a deterministic series (seeded by the card id, so it never
//      jumps between renders) for the months we have no data for. The most
//      recent ~30 days are ANCHORED to the REAL aggregates
//      (avg30 → avg7 → avg1 → trend), so the right edge of the chart always
//      matches the genuine recent movement shown elsewhere in the app.
//   2. ACCUMULATE real observations going forward: every time a fresh daily
//      snapshot loads, the store appends {d, p} to localStorage. Those measured
//      points OVERRIDE the modelled curve, so the chart becomes more real every
//      day the app is used.
//
// The chart UI clearly labels which part is measured vs. modelled.

const DAY = 86400000;

// Deterministic PRNG so a given card always renders the same modelled history.
const hashId = (id) => {
  let h = 2166136261;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const ymd = (ts) => new Date(ts).toISOString().slice(0, 10);

const RANGES = [
  { id: '1M', label: '1M', months: 1 },
  { id: '3M', label: '3M', months: 3 },
  { id: '6M', label: '6M', months: 6 },
  { id: '12M', label: '1J', months: 12 },
];
export { RANGES };

// Linear interpolation of the anchored recent window (last ~30 days), where we
// know real values at day -30 (avg30), -7 (avg7), -1 (avg1) and 0 (trend).
const interpRecent = (anchors, daysAgo) => {
  // anchors: sorted DESC by daysAgo, e.g. [{d:30,v},{d:7,v},{d:1,v},{d:0,v}]
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (daysAgo <= a.d && daysAgo >= b.d) {
      const span = a.d - b.d || 1;
      const f = (a.d - daysAgo) / span;
      return a.v + (b.v - a.v) * f;
    }
  }
  return anchors[anchors.length - 1].v;
};

// Produces the full series for a card over `months`, merging real observations.
export const buildSeries = (card, months = 6, realHistory = []) => {
  const p = card?.prices || {};
  const trend = num(p.trend) ?? num(p.market) ?? num(card?.m?.market);
  const avg30 = num(p.avg30) ?? trend;
  const avg7 = num(p.avg7) ?? trend;
  const avg1 = num(p.avg1) ?? trend;
  if (trend == null) return { points: [], summary: null };

  const anchors = [
    { d: 30, v: avg30 },
    { d: 7, v: avg7 },
    { d: 1, v: avg1 },
    { d: 0, v: trend },
  ];

  const rnd = mulberry32(hashId(card.id));
  const totalDays = Math.round(months * 30.4);
  const step = months <= 1 ? 1 : months <= 3 ? 3 : 7;

  // ---- modelled tail older than 30 days: a seeded mean-reverting walk that we
  // rescale so it connects continuously to avg30 at day -30. -------------------
  const change30 = num(card?.m?.change30) ?? 0;
  const driftPerStep = (Math.max(-18, Math.min(18, change30)) / 100) * 0.5 * (step / 30);
  const vol = 0.018 * (step / 7); // volatility proxy, scaled by cadence

  const olderDaysAgo = [];
  for (let d = totalDays; d > 30; d -= step) olderDaysAgo.push(d);
  // walk from oldest → newest (towards day 30)
  const raw = [];
  let v = avg30;
  for (let i = 0; i < olderDaysAgo.length; i++) {
    const shock = (rnd() - 0.5) * 2 * vol;
    v = v * (1 + driftPerStep + shock);
    raw.push(v);
  }
  // rescale so the last modelled point (closest to day 30) equals avg30
  if (raw.length) {
    const scale = avg30 / raw[raw.length - 1];
    for (let i = 0; i < raw.length; i++) raw[i] *= scale;
  }

  const now = Date.now();
  const byDate = new Map();
  const put = (daysAgo, price, real = false) => {
    const t = now - daysAgo * DAY;
    const key = ymd(t);
    const val = Math.max(0.01, Math.round(price * 100) / 100);
    byDate.set(key, { t, price: val, real });
  };

  olderDaysAgo.forEach((d, i) => put(d, raw[i]));
  // anchored recent window
  for (let d = Math.min(30, totalDays); d >= 0; d -= step) put(d, interpRecent(anchors, d));
  put(1, interpRecent(anchors, 1));
  put(0, trend);

  // ---- overlay real measured observations (authoritative) --------------------
  const cutoff = now - totalDays * DAY;
  for (const obs of realHistory) {
    const t = new Date(obs.d).getTime();
    if (Number.isNaN(t) || t < cutoff - DAY) continue;
    byDate.set(obs.d, { t, price: Math.round(obs.p * 100) / 100, real: true });
  }

  const points = [...byDate.values()]
    .sort((a, b) => a.t - b.t)
    .map((pt) => ({ ...pt, label: new Date(pt.t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) }));

  if (points.length < 2) return { points, summary: null };

  const prices = points.map((x) => x.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const first = points[0].price;
  const last = points[points.length - 1].price;
  const changePct = first ? ((last - first) / first) * 100 : null;
  const realCount = points.filter((x) => x.real).length;
  const minPt = points.find((x) => x.price === min);
  const maxPt = points.find((x) => x.price === max);

  return {
    points,
    summary: { min, max, first, last, changePct, realCount, total: points.length, minDate: minPt?.label, maxDate: maxPt?.label },
  };
};
