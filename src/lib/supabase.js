// Supabase client — lazily loaded.
//
// Phase 1 backend (accounts + cloud sync). Everything here is OPT-IN: if the two
// env vars below are not set at build time, `isConfigured` is false and the app
// stays 100 % local (the SDK is never even fetched at runtime — the dynamic
// import lives behind the isConfigured guard, so its chunk is built but not
// downloaded for visitors). Set the vars to switch the same UI to real,
// cross-device accounts. See docs/BACKEND.md.

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = !!(url && anon);

let _client = null;
// Returns the singleton client, importing the SDK on first use. null when unconfigured.
export async function getSupabase() {
  if (!isConfigured) return null;
  if (_client) return _client;
  const { createClient } = await import('@supabase/supabase-js');
  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

// Stable, dash-free storage namespace for a Supabase user. Uses the immutable
// user id (not the email, which can change) so the same account maps to the same
// localStorage namespace — and therefore the same synced keys — on every device.
export const nsFromUser = (u) => 'acct_' + String(u?.id || '').replace(/[^a-zA-Z0-9]+/g, '');
