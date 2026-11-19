// Lazily created Supabase client (only when live credentials are configured).
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, LIVE } from './config.js';

let client = null;
export function getSupabase() {
  if (!LIVE) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'cc_auth' },
    });
  }
  return client;
}
