// Official Cardmarket (MKM) API provider — PURE normalization only.
//
// The real Cardmarket API requires OAuth 1.0a-signed requests with approved app
// credentials and must run server-side (it is not CORS-enabled and the secret
// must never ship to the browser). So the network + signing lives in the
// build-time fetcher `scripts/fetch-cardmarket.mjs`; this module only holds the
// pure response→Card mapping (no Node deps), so it stays portable and testable.
//
// Why bother when pokemontcg.io already returns Cardmarket prices? The official
// API has far more: full price guide (incl. foil + AVG1/7/30 + sell), real sales
// history, stock/offer counts and shop-sync — i.e. the data the roadmap asks for.
// When credentials are provided the build merges these in automatically.

export const meta = {
  id: 'cardmarket',
  label: 'Cardmarket API',
  attribution: 'Preisdaten: Cardmarket (offizielle MKM-API)',
  priceSource: 'Cardmarket EU (offiziell)',
};

export const MKM_BASE = 'https://api.cardmarket.com/ws/v2.0/output.json';

// MKM game ids: 1 = Magic, 3 = Yu-Gi-Oh!, 6 = Pokémon (override via CM_GAME_ID).
export const DEFAULT_GAME_ID = '6';

const n = (v) => {
  const x = typeof v === 'string' ? parseFloat(v) : v;
  return typeof x === 'number' && !Number.isNaN(x) ? x : null;
};

const img = (raw) => {
  if (!raw) return null;
  return raw.startsWith('//') ? `https:${raw}` : raw;
};

// Maps an MKM product (with priceGuide) to our common Card shape.
export const normalizeProduct = (product) => {
  if (!product) return null;
  const pg = product.priceGuide || {};
  const loc = Array.isArray(product.localization) ? product.localization : [];
  const deName = loc.find((l) => l.languageId === 3 || /german|deutsch/i.test(l.languageName || ''))?.name;
  const name = deName || product.enName || product.name || 'Unbekannt';
  const image = img(product.image);
  const trend = n(pg.TREND) ?? n(pg.SELL) ?? n(pg.AVG);
  return {
    id: `cm-${product.idProduct}`,
    game: 'pokemon',
    name,
    baseName: product.enName || name,
    nameEn: product.enName || name,
    set: product.expansionName || product.expansion?.enName || '',
    setId: product.expansion?.idExpansion ? `mkm-${product.expansion.idExpansion}` : '',
    series: '',
    number: product.number || '',
    rarity: product.rarity || '',
    cardType: 'Pokémon',
    year: null,
    image: { small: image, large: image },
    prices: {
      currency: 'EUR',
      market: trend,
      low: n(pg.LOW) ?? n(pg.LOWEX),
      trend: n(pg.TREND),
      avg1: n(pg.AVG1),
      avg7: n(pg.AVG7),
      avg30: n(pg.AVG30),
      averageSell: n(pg.SELL) ?? n(pg.AVG),
      updatedAt: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    },
    cardmarketUrl: product.website ? `https://www.cardmarket.com${product.website}` : null,
    source: 'cardmarket',
  };
};
