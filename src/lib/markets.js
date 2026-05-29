// Multi-marketplace price comparison.
//
// pokemontcg.io only exposes Cardmarket (EU / EUR) prices. eBay and TCGplayer
// have no free, browser-callable price feed, so without a backend we cannot pull
// their live numbers. Instead we derive TRANSPARENT ESTIMATES from the real
// Cardmarket price using:
//   - a configurable EUR→USD FX rate (Settings), and
//   - a per-venue premium factor (how that venue typically prices vs. Cardmarket
//     EU for graded-raw singles).
// Every estimate is clearly labelled and paired with a direct search link so the
// user can verify the real, current price on that marketplace in one click.
// When the official Cardmarket API (or an eBay/TCGplayer feed) is wired up via a
// build-time fetcher, these estimates are automatically replaced by real numbers.

import { marketLinks } from './marketLinks.js';

export const DEFAULT_FX = 1.08; // EUR -> USD

export const VENUES = {
  cardmarket: { label: 'Cardmarket', region: 'EU', currency: 'EUR', premium: 1.0, real: true, color: '#0066cc' },
  ebay: { label: 'eBay DE', region: 'DE', currency: 'EUR', premium: 1.12, real: false, color: '#3a3a8c' },
  tcgplayer: { label: 'TCGplayer', region: 'US', currency: 'USD', premium: 1.04, real: false, color: '#ff5722' },
};

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);

// Returns one row per venue: native-currency price, EUR equivalent, premium and
// a verify link. `real` flags Cardmarket (the only genuinely live number).
export const marketEstimates = (card, { fxEurUsd = DEFAULT_FX } = {}) => {
  const eur = num(card?.m?.market) ?? num(card?.prices?.trend) ?? num(card?.prices?.market);
  const links = marketLinks(card);
  const url = {
    cardmarket: card?.cardmarketUrl || links.cardmarket,
    ebay: links.ebay,
    tcgplayer: links.tcgplayer,
  };
  return Object.entries(VENUES).map(([id, v]) => {
    const eurEquiv = eur == null ? null : eur * v.premium;
    const price = eurEquiv == null ? null : v.currency === 'USD' ? eurEquiv * fxEurUsd : eurEquiv;
    const vsCardmarket = eur && eurEquiv != null ? ((eurEquiv - eur) / eur) * 100 : null;
    return { id, ...v, eur: eurEquiv, price, vsCardmarket, url };
  });
};

// Import/export arbitrage: buy the cheapest EU copy (Cardmarket low), sell into
// the US market (TCGplayer estimate), expressed net of a rough cross-border cost.
export const arbitrage = (card, { fxEurUsd = DEFAULT_FX, crossBorderCost = 0.18 } = {}) => {
  const buyEur = num(card?.prices?.low) ?? num(card?.m?.market);
  const usEur = (num(card?.m?.market) ?? 0) * VENUES.tcgplayer.premium;
  if (!buyEur || !usEur) return null;
  const grossPct = ((usEur - buyEur) / buyEur) * 100;
  const netPct = grossPct - crossBorderCost * 100;
  return {
    buyEur,
    sellUsd: usEur * fxEurUsd,
    sellEur: usEur,
    grossPct,
    netPct,
    worthwhile: netPct > 12,
  };
};
