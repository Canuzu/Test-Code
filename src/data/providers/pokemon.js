// Pokémon price provider backed by the free pokemontcg.io API (v2).
// It returns Cardmarket prices, which ARE the EU / German market in EUR.
//
// Works without an API key (lower rate limit). An optional key can be supplied
// from Settings and is sent as the X-Api-Key header.

const BASE = 'https://api.pokemontcg.io/v2';

export const meta = {
  id: 'pokemon',
  label: 'Pokémon',
  emoji: '⚡',
  attribution: 'Preisdaten: Cardmarket (EU) via pokemontcg.io',
  priceSource: 'Cardmarket EU',
};

const yearOf = (releaseDate) => {
  if (!releaseDate) return null;
  const y = parseInt(String(releaseDate).slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
};

const VARIANTS = ['VMAX', 'VSTAR', 'V-UNION', 'V', 'ex', 'GX', 'EX'];

const displayName = (raw) => {
  const variant = (raw.subtypes || []).find((s) => VARIANTS.includes(s));
  if (variant && !new RegExp(`\\b${variant}\\b`, 'i').test(raw.name)) {
    return `${raw.name} ${variant}`;
  }
  return raw.name;
};

// Constructs the standard pokemontcg.io CDN URL as a fallback when the API
// response omits the images field (e.g. older cards or partial responses).
const cdnUrl = (setId, number, hires = false) =>
  setId && number
    ? `https://images.pokemontcg.io/${setId}/${number}${hires ? '_hires' : ''}.png`
    : null;

// Normalises a raw pokemontcg.io card into our common Card shape.
export const normalize = (raw) => {
  const cm = raw.cardmarket || {};
  const p = cm.prices || {};
  const sId = raw.set?.id || '';
  const num = raw.number || '';
  return {
    id: raw.id,
    game: 'pokemon',
    name: displayName(raw),
    baseName: raw.name,
    set: raw.set?.name || '',
    setId: sId,
    setReleaseDate: raw.set?.releaseDate || '',
    series: raw.set?.series || '',
    number: num,
    rarity: raw.rarity || '',
    cardType: [raw.supertype, ...(raw.subtypes || [])].filter(Boolean).join(' · '),
    year: yearOf(raw.set?.releaseDate),
    image: {
      small: raw.images?.small || cdnUrl(sId, num),
      large: raw.images?.large || cdnUrl(sId, num, true),
    },
    prices: {
      currency: 'EUR',
      market: p.trendPrice ?? p.averageSellPrice ?? null,
      low: p.lowPrice ?? null,
      trend: p.trendPrice ?? null,
      avg1: p.avg1 ?? null,
      avg7: p.avg7 ?? null,
      avg30: p.avg30 ?? null,
      averageSell: p.averageSellPrice ?? null,
      updatedAt: cm.updatedAt || null,
    },
    cardmarketUrl: cm.url || null,
  };
};

const buildQuery = (term) => {
  const words = (term || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  // AND the words on the card name, e.g. "charizard vmax" -> name:*charizard* name:*vmax*
  return words.map((w) => `name:*${w.replace(/[":]/g, '')}*`).join(' ');
};

const headers = (apiKey) => (apiKey ? { 'X-Api-Key': apiKey } : {});

// Searches cards. Returns only cards that actually carry a Cardmarket price so
// the tracker always has something to display.
export const search = async ({ query = '', page = 1, pageSize = 48, apiKey, signal } = {}) => {
  const params = new URLSearchParams();
  const q = buildQuery(query);
  if (q) params.set('q', q);
  else params.set('orderBy', '-set.releaseDate'); // default browse = newest sets
  params.set('page', String(page));
  params.set('pageSize', String(Math.min(pageSize * 2, 120))); // over-fetch, we filter pricel­ess cards
  params.set(
    'select',
    'id,name,number,rarity,supertype,subtypes,images,set,cardmarket',
  );

  const res = await fetch(`${BASE}/cards?${params.toString()}`, { headers: headers(apiKey), signal });
  if (!res.ok) {
    throw new Error(`pokemontcg.io antwortete mit HTTP ${res.status}`);
  }
  const json = await res.json();
  const cards = (json.data || [])
    .map(normalize)
    .filter((c) => c.prices.market != null)
    .slice(0, pageSize);
  return { cards, totalCount: json.totalCount ?? cards.length, page: json.page ?? page };
};
