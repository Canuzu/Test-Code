// Edge Function: on-demand live price for a single card (Phase 3).
// Deploy: supabase functions deploy prices --no-verify-jwt
// Secret (optional): POKEMONTCG_API_KEY for higher Pokémon rate limits.
//
// Magic → Scryfall (real Cardmarket EUR). Pokémon → pokemontcg.io (Cardmarket
// trend). One Piece / Yu-Gi-Oh! are estimates with no live feed → null.
import { cors, json } from '../_shared/cors.ts';

const UA = { 'User-Agent': 'CartographTCG/1.0 (+https://canuzu.github.io/Test-Code)' };
const num = (v: unknown) => {
  const x = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof x === 'number' && !Number.isNaN(x) ? x : null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { game, id, setId, number } = await req.json().catch(() => ({}));
    let market: number | null = null;

    if (game === 'magic' && id) {
      const r = await fetch(`https://api.scryfall.com/cards/${id}`, { headers: UA });
      if (r.ok) { const c = await r.json(); market = num(c.prices?.eur) ?? num(c.prices?.eur_foil); }
    } else if (game === 'pokemon' && setId && number) {
      const key = Deno.env.get('POKEMONTCG_API_KEY') ?? '';
      const r = await fetch(`https://api.pokemontcg.io/v2/cards/${setId}-${number}`, {
        headers: { ...UA, ...(key ? { 'X-Api-Key': key } : {}) },
      });
      if (r.ok) {
        const { data } = await r.json();
        const cm = data?.cardmarket?.prices;
        market = num(cm?.trendPrice) ?? num(cm?.averageSellPrice) ?? num(cm?.avg7);
      }
    }

    return json({ market, currency: 'EUR', updatedAt: new Date().toISOString() });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 400);
  }
});
