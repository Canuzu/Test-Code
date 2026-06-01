// Live prices (Phase 3) — on-demand refresh via a Supabase Edge Function proxy.
//
// Opt-in: active only when VITE_LIVE_PRICES === 'true' AND Supabase is configured.
// Progressive enhancement over the daily snapshots: returns a fresh market price
// for a single card when the user asks for it. Magic (Scryfall) and Pokémon
// (pokemontcg.io) have real sources; One Piece / Yu-Gi-Oh! are estimates → null.

import { getSupabase, isConfigured } from './supabase.js';

export const livePricesEnabled = isConfigured && import.meta.env.VITE_LIVE_PRICES === 'true';

// Returns { market, currency, at } or null if unavailable.
export async function refreshCard(card) {
  if (!livePricesEnabled || !card) return null;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.functions.invoke('prices', {
      body: { game: card.game, id: card.id, setId: card.setId, number: card.number },
    });
    if (error || data?.market == null) return null;
    return { market: data.market, currency: data.currency || 'EUR', at: data.updatedAt || new Date().toISOString() };
  } catch { return null; }
}
