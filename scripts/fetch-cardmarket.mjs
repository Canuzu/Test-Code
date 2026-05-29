// Build-time fetcher for the OFFICIAL Cardmarket (MKM) API.
//
// Runs only on the CI server (never in the browser): the MKM API is OAuth 1.0a
// signed, not CORS-enabled, and the app secret must stay server-side. It is
// fully OPT-IN — if the four credentials are not present it returns [] and the
// build silently falls back to the pokemontcg.io snapshot.
//
// Required GitHub secrets (Repo → Settings → Secrets and variables → Actions):
//   CM_APP_TOKEN, CM_APP_SECRET, CM_ACCESS_TOKEN, CM_ACCESS_SECRET
// Optional env:
//   CM_GAME_ID (default 6 = Pokémon), CM_SEARCH (comma list of search terms)
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

async function mkmGet(url) {
  const res = await fetch(url, { headers: { Authorization: oauthHeader('GET', url) } });
  if (res.status === 204) return null; // MKM returns 204 for empty results
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Fetches a bounded set of priced products via the official API. Defensive: any
// failure logs and is skipped so the deploy never breaks.
export async function fetchCardmarket({ limit = 120, perTerm = 6 } = {}) {
  if (!isConfigured()) {
    console.log('[cardmarket] credentials not set — skipping official API (pokemontcg.io snapshot is used).');
    return [];
  }
  const gameId = process.env.CM_GAME_ID || DEFAULT_GAME_ID;
  const terms = (process.env.CM_SEARCH || 'Charizard,Umbreon,Pikachu,Mew,Rayquaza,Lugia,Blastoise,Venusaur')
    .split(',').map((s) => s.trim()).filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const term of terms) {
    if (out.length >= limit) break;
    try {
      const findUrl = `${MKM_BASE}/products/find?search=${enc(term)}&idGame=${gameId}&exact=false`;
      const found = await mkmGet(findUrl);
      const products = Array.isArray(found?.product) ? found.product : [];
      for (const p of products.slice(0, perTerm)) {
        if (out.length >= limit) break;
        if (seen.has(p.idProduct)) continue;
        seen.add(p.idProduct);
        try {
          const detail = await mkmGet(`${MKM_BASE}/products/${p.idProduct}`);
          const card = normalizeProduct(detail?.product);
          if (card?.prices?.market != null) out.push(card);
        } catch (e) {
          console.error(`[cardmarket] product ${p.idProduct} failed: ${e.message}`);
        }
      }
      console.log(`[cardmarket] "${term}" -> ${products.length} products`);
    } catch (e) {
      console.error(`[cardmarket] find "${term}" failed: ${e.message}`);
    }
  }
  console.log(`[cardmarket] ✓ ${out.length} priced products via official API`);
  return out;
}

// Allow running standalone for a quick credential/signature check:
//   node scripts/fetch-cardmarket.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchCardmarket({ limit: 20 }).then((cards) => {
    console.log(JSON.stringify({ count: cards.length, sample: cards.slice(0, 2) }, null, 2));
  });
}
