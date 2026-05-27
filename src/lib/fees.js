// Marketplace fee models for "real profit after fees" calculations.
export const PLATFORM_FEES = {
  cardmarket: { commission: 0.05, label: 'Cardmarket', shipping: 4, color: '#0066cc' },
  ebay: { commission: 0.1325, label: 'eBay DE', shipping: 5, color: '#3a3a8c' },
  tcgplayer: { commission: 0.1025, label: 'TCGPlayer', shipping: 5, color: '#ff5722' },
};

// Net result of buying at `buy` and selling at `sell` on a given platform.
export const calcNet = (sell, buy, platform = 'cardmarket', includeShipping = true) => {
  const fees = PLATFORM_FEES[platform] || PLATFORM_FEES.cardmarket;
  const s = Number(sell) || 0;
  const b = Number(buy) || 0;
  const ship = includeShipping ? fees.shipping : 0;
  const commission = s * fees.commission;
  const netSell = s - commission - ship;
  const netProfit = netSell - b;
  const netRoi = b > 0 ? (netProfit / b) * 100 : 0;
  return { netProfit, netRoi, commission, shipping: ship, netSell, grossProfit: s - b };
};
