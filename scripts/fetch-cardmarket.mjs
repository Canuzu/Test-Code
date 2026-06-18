// Build-time fetcher for the OFFICIAL Cardmarket (MKM) API.
//
// Runs only on the CI server (never in the browser): the MKM API is OAuth 1.0a
// signed, not CORS-enabled, and the app secret must stay server-side. It is
// fully OPT-IN — if the four credentials are not present it returns [] and the
// build silently falls back to the pokemontcg.io snapshot.
//
// Required GitHub secrets (Repo → Settings → Secrets and variables → Actions):
//   CM_APP_TOKEN, CM_APP_SECRET, CM_ACCESS_TOKEN, CM_ACCESS_SECRET
// Optional env (per game, all independent):
//   Pokémon   : CM_GAME_ID (default 6),  CM_SEARCH
//   One Piece : CM_GAME_ID_ONEPIECE (auto-resolved from /games if unset),
//               CM_SEARCH_ONEPIECE
//
// Get credentials: cardmarket.com → Account → API → register a dedicated app
// (a "widget"/dedicated app token grants the access token + secret).

import crypto from 'node:crypto';
import { MKM_BASE, DEFAULT_GAME_ID, normalizeProduct } from '../src/data/providers/cardmarket.js';

// RFC-3986 percent-encoding (stricter than encodeURIComponent).
const enc = (s) => encodeURIComponent(String(s)).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

const creds = () => ({
  appToken: process.env.CM_APP_TOKEN,
  appSecret: process.env.CM_APP_SECRET,
  accessToken: process.env.CM_ACCESS_TOKEN,
  accessSecret: process.env.CM_ACCESS_SECRET,
});

export const isConfigured = () => {
  const c = creds();
  return !!(c.appToken && c.appSecret && c.accessToken && c.accessSecret);
};

// Builds the OAuth 1.0a Authorization header for one MKM request. MKM requires
// the realm to be the exact request URL (path only, query handled separately).
function oauthHeader(method, fullUrl) {
  const c = creds();
  const u = new URL(fullUrl);
  const realm = `${u.protocol}//${u.host}${u.pathname}`;
  const oauth = {
    oauth_consumer_key: c.appToken,
    oauth_token: c.accessToken,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };
  const params = {};
  for (const [k, v] of u.searchParams) params[k] = v;
  const all = { ...params, ...oauth };
  const paramStr = Object.keys(all).sort().map((k) => `${enc(k)}=${enc(all[k])}`).join('&');
  const base = `${method.toUpperCase()}&${enc(realm)}&${enc(paramStr)}`;
  const key = `${enc(c.appSecret)}&${enc(c.accessSecret)}`;
  const signature = crypto.createHmac('sha1', key).update(base).digest('base64');
  const header = { ...oauth, oauth_signature: signature };
  return `OAuth realm="${realm}", ` + Object.entries(header).map(([k, v]) => `${k}="${enc(v)}"`).join(', ');
}

// MKM caps requests per day (≈5k for non-commercial apps, far more for
// professional ones) and reports usage on every response. We mirror those
// counters so the full crawl can stop *before* hitting the wall, regardless of
// the account tier. `rateExceeded` is thrown on a real 429 so callers abort.
const rate = { max: null, count: null };
class RateLimitError extends Error {}

async function mkmGet(url) {
  const res = await fetch(url, { headers: { Authorization: oauthHeader('GET', url) } });
  const max = Number(res.headers.get('X-Request-Limit-Max'));
  const cnt = Number(res.headers.get('X-Request-Limit-Count'));
  if (Number.isFinite(max) && max > 0) rate.max = max;
  if (Number.isFinite(cnt) && cnt >= 0) rate.count = cnt;
  if (res.status === 429) throw new RateLimitError('HTTP 429 (request limit)');
  if (res.status === 204) return null; // MKM returns 204 for empty results
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// True once we are within `margin` requests of the reported daily cap, so we
// can leave the remaining budget for the next scheduled run.
const nearRateLimit = (margin = 50) =>
  rate.max != null && rate.count != null && rate.count >= rate.max - margin;

// Per-game default search terms (used when the CM_SEARCH* env is unset).
const DEFAULT_TERMS = {
  pokemon: 'Charizard,Umbreon,Pikachu,Mew,Rayquaza,Lugia,Blastoise,Venusaur',
  onepiece: 'Luffy,Zoro,Nami,Sanji,Ace,Shanks,Law,Yamato,Sabo,Kid,Nico Robin,Boa Hancock,Roger,Nika',
};

// Resolves an MKM idGame by name via the /games endpoint (One Piece has no
// publicly documented id). Returns the id as a string, or null.
export async function resolveGameId(nameRe) {
  try {
    const data = await mkmGet(`${MKM_BASE}/games`);
    const games = Array.isArray(data?.game) ? data.game : [];
    const hit = games.find((g) => nameRe.test(g.name || ''));
    if (hit) console.log(`[cardmarket] resolved idGame ${hit.idGame} for "${hit.name}"`);
    return hit ? String(hit.idGame) : null;
  } catch (e) {
    console.error(`[cardmarket] /games lookup failed: ${e.message}`);
    return null;
  }
}

// Resolves the idGame to query for a given game: explicit arg → per-game env →
// /games name lookup → Pokémon default.
async function gameIdFor(game, explicit) {
  if (explicit) return String(explicit);
  if (game === 'onepiece') return process.env.CM_GAME_ID_ONEPIECE || await resolveGameId(/one\s*piece/i);
  return process.env.CM_GAME_ID || DEFAULT_GAME_ID;
}

// Fetches a bounded set of priced products via the official API. Defensive: any
// failure logs and is skipped so the deploy never breaks. `game` selects the TCG
// ('pokemon' | 'onepiece'); the returned cards are tagged with that game.
export async function fetchCardmarket({ game = 'pokemon', gameId, terms, limit = 120, perTerm = 6 } = {}) {
  if (!isConfigured()) {
    console.log('[cardmarket] credentials not set — skipping official API (snapshot prices are used).');
    return [];
  }
  const gid = await gameIdFor(game, gameId);
  if (!gid) {
    console.error(`[cardmarket] could not resolve idGame for "${game}" — set CM_GAME_ID_ONEPIECE. Skipping.`);
    return [];
  }
  const termList = (terms || process.env[game === 'onepiece' ? 'CM_SEARCH_ONEPIECE' : 'CM_SEARCH'] || DEFAULT_TERMS[game] || '')
    .split(',').map((s) => s.trim()).filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const term of termList) {
    if (out.length >= limit) break;
    try {
      const findUrl = `${MKM_BASE}/products/find?search=${enc(term)}&idGame=${gid}&exact=false`;
      const found = await mkmGet(findUrl);
      const products = Array.isArray(found?.product) ? found.product : [];
      for (const p of products.slice(0, perTerm)) {
        if (out.length >= limit) break;
        if (seen.has(p.idProduct)) continue;
        seen.add(p.idProduct);
        try {
          const detail = await mkmGet(`${MKM_BASE}/products/${p.idProduct}`);
          const card = normalizeProduct(detail?.product, { game });
          if (card?.prices?.market != null) out.push(card);
        } catch (e) {
          console.error(`[cardmarket] product ${p.idProduct} failed: ${e.message}`);
        }
      }
      console.log(`[cardmarket] (${game}) "${term}" -> ${products.length} products`);
    } catch (e) {
      console.error(`[cardmarket] find "${term}" failed: ${e.message}`);
    }
  }
  console.log(`[cardmarket] ✓ ${out.length} priced ${game} products via official API`);
  return out;
}

// Limited-concurrency map (keeps us well under MKM's burst limits).
async function mapPool(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
}

// FULL expansion crawl (opt-in): instead of a handful of name searches, walk
// EVERY expansion of the game → every single in it → its priceGuide, so all of
// the catalogue's cards can get real Cardmarket prices (the roadmap's "full
// coverage" item). Heavy on requests, so it is:
//   • opt-in (callers pass it only when CM_*_FULL is set),
//   • bounded by `maxProducts` (a per-run product budget), and
//   • rate-limit-safe — it stops as soon as MKM reports we are near the daily
//     cap or returns a 429, returning whatever it gathered so far.
// `skipIds` is a Set of MKM idProduct values already priced in a previous run,
// so repeated daily runs converge to full coverage without re-spending budget.
export async function fetchCardmarketFull({
  game = 'onepiece', gameId, maxProducts = Number(process.env.CM_MAX_PRODUCTS) || 4500,
  concurrency = Number(process.env.CM_CONCURRENCY) || 4, skipIds = new Set(),
} = {}) {
  if (!isConfigured()) {
    console.log('[cardmarket] credentials not set — skipping full crawl (snapshot prices are used).');
    return { cards: [], done: false };
  }
  const gid = await gameIdFor(game, gameId);
  if (!gid) {
    console.error(`[cardmarket] could not resolve idGame for "${game}" — set CM_GAME_ID_ONEPIECE. Skipping.`);
    return { cards: [], done: false };
  }

  // 1) All expansions of the game.
  let expansions = [];
  try {
    const data = await mkmGet(`${MKM_BASE}/games/${gid}/expansions`);
    expansions = Array.isArray(data?.expansion) ? data.expansion : [];
  } catch (e) {
    console.error(`[cardmarket] expansions lookup failed: ${e.message}`);
    return { cards: [], done: false };
  }
  console.log(`[cardmarket] (${game}) full crawl: ${expansions.length} expansions`);

  // 2) Every single (= product) in each expansion → unique idProduct list.
  const ids = [];
  const seen = new Set();
  let aborted = false;
  await mapPool(expansions, Math.min(concurrency, 6), async (exp) => {
    if (aborted || nearRateLimit()) { aborted = true; return; }
    try {
      const data = await mkmGet(`${MKM_BASE}/expansions/${exp.idExpansion}/singles`);
      for (const s of (Array.isArray(data?.single) ? data.single : [])) {
        const id = s.idProduct;
        if (id == null || seen.has(id) || skipIds.has(id) || skipIds.has(String(id))) continue;
        seen.add(id);
        ids.push(id);
      }
    } catch (e) {
      if (e instanceof RateLimitError) { aborted = true; return; }
      console.error(`[cardmarket] singles for expansion ${exp.idExpansion} failed: ${e.message}`);
    }
  });
  console.log(`[cardmarket] (${game}) ${ids.length} new products to price${skipIds.size ? ` (skipping ${skipIds.size} already priced)` : ''}`);

  // 3) priceGuide per product, budget- and rate-limit-bounded.
  const budget = ids.slice(0, Math.max(0, maxProducts));
  const out = [];
  await mapPool(budget, concurrency, async (idProduct) => {
    if (aborted || nearRateLimit()) { aborted = true; return; }
    try {
      const detail = await mkmGet(`${MKM_BASE}/products/${idProduct}`);
      const card = normalizeProduct(detail?.product, { game });
      if (card?.prices?.market != null) out.push(card);
    } catch (e) {
      if (e instanceof RateLimitError) { aborted = true; return; }
      console.error(`[cardmarket] product ${idProduct} failed: ${e.message}`);
    }
  });

  // "done" = we priced every outstanding product this run (no budget/rate cut-off
  // and nothing left over), i.e. the catalogue's coverage is now complete.
  const done = !aborted && budget.length === ids.length;
  console.log(`[cardmarket] ✓ full crawl: ${out.length} priced ${game} products` +
    `${aborted ? ' (stopped early — near daily limit; next run resumes)' : ''}` +
    `${!aborted && !done ? ` (budget ${maxProducts} reached; next run resumes)` : ''}`);
  return { cards: out, done };
}

// Allow running standalone for a quick credential/signature check:
//   node scripts/fetch-cardmarket.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchCardmarket({ limit: 20 }).then((cards) => {
    console.log(JSON.stringify({ count: cards.length, sample: cards.slice(0, 2) }, null, 2));
  });
}
