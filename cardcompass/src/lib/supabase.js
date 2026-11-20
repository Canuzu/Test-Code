// Supabase client, loaded on demand: the SDK is only downloaded when live
// credentials are configured and data is actually requested, so the design
// preview (and the first paint of the live shop) stay light.
import { SUPABASE_URL, SUPABASE_KEY, LIVE } from './config.js';

let pending = null;
export function getSupabase() {
  if (!LIVE) return Promise.resolve(null);
  if (!pending) {
    pending = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'cc_auth' },
      }))
      .catch((e) => { pending = null; throw e; });
  }
  return pending;
}
