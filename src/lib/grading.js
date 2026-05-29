// Graded-card value estimates (PSA / BGS / CGC) + a grading-ROI calculator.
//
// pokemontcg.io / Cardmarket only price RAW singles, not slabs. Without a graded
// price feed we cannot show real PSA-10 numbers, so these are TRANSPARENT
// HEURISTICS: the raw (near-mint) market price multiplied by grade- and era-based
// factors. Vintage holos command far larger PSA-10 multiples than modern bulk,
// and top chase rarities carry an extra premium. Everything is clearly labelled
// as an estimate, with direct links to the PSA population report and eBay "sold"
// listings so a dealer can verify the real slab price before buying/selling.

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const NOW_YEAR = new Date().getFullYear();

export const GRADERS = [
  { id: 'psa10', label: 'PSA 10', sub: 'Gem Mint', color: '#ffd700' },
  { id: 'bgs95', label: 'BGS 9.5', sub: 'Gem Mint', color: '#34d399' },
  { id: 'cgc10', label: 'CGC 10', sub: 'Pristine/Gem', color: '#c084fc' },
  { id: 'psa9', label: 'PSA 9', sub: 'Mint', color: '#448aff' },
  { id: 'psa8', label: 'PSA 8', sub: 'NM-Mint', color: '#8888aa' },
  { id: 'raw', label: 'Roh (NM)', sub: 'ungeslabbt', color: '#aaaacc' },
];

// Era buckets keyed by card age. Multipliers are vs. the raw NM market price.
const eraFactors = (age) => {
  if (age >= 20) return { psa10: 12, bgs95: 16, cgc10: 10, psa9: 4, psa8: 2, raw: 1 }; // vintage / WOTC
  if (age >= 8) return { psa10: 5, bgs95: 6, cgc10: 4.5, psa9: 1.9, psa8: 1.1, raw: 1 }; // mid
  return { psa10: 3, bgs95: 3.4, cgc10: 2.6, psa9: 1.35, psa8: 0.9, raw: 1 }; // modern
};

// High chase rarities grade at a further premium (demand for clean copies).
const rarityBump = (rarity) => {
  const x = (rarity || '').toLowerCase();
  if (x.includes('illustration') || x.includes('special') || x.includes('hyper') || x.includes('secret') || x.includes('crown')) return 1.25;
  if (x.includes('ultra') || x.includes('alt') || x.includes('vmax') || x.includes('vstar')) return 1.12;
  return 1;
};

export const gradeEstimates = (card) => {
  const raw = num(card?.m?.market) ?? num(card?.prices?.trend) ?? num(card?.prices?.market);
  if (raw == null) return [];
  const age = card?.year ? Math.max(0, NOW_YEAR - card.year) : 4;
  const f = eraFactors(age);
  const bump = rarityBump(card?.rarity);
  return GRADERS.map((g) => {
    const mult = g.id === 'raw' ? 1 : f[g.id] * (g.id === 'psa8' ? 1 : bump);
    return { ...g, mult, value: Math.round(raw * mult * 100) / 100 };
  });
};

// Grading ROI: buy a raw copy (cheapest offer), pay grading + shipping, sell the
// slab net of marketplace commission. Returns a scenario per target grade.
export const gradingProfit = (card, { gradeFee = 20, commission = 0.05, targetId = 'psa10' } = {}) => {
  const ests = gradeEstimates(card);
  const target = ests.find((e) => e.id === targetId);
  const buy = num(card?.prices?.low) ?? num(card?.m?.market);
  if (!target || buy == null) return null;
  const sellNet = target.value * (1 - commission);
  const cost = buy + gradeFee;
  const profit = sellNet - cost;
  return {
    target,
    buy,
    gradeFee,
    sellGross: target.value,
    sellNet,
    cost,
    profit,
    roi: cost > 0 ? (profit / cost) * 100 : null,
  };
};
