// Cloud sync (Phase 1) — offline-first mirror of the local data buckets.
//
// The app already stores everything as namespaced JSON buckets in localStorage
// (see storage.js). For a signed-in user we mirror those buckets to the Supabase
// `user_state` table (one row per bucket, keyed by the part of the localStorage
// key after the account prefix). This needs NO change to the store's data model.
//
//   • pull(ns, userId)  — on login: cloud → localStorage (cloud is authoritative).
//   • start(ns, userId) — arm the write-through; note() then debounce-pushes
//                          changed buckets (registered as storage.js' write hook).
//   • stop()            — on logout.
//
// Only user-authored buckets sync; the big regenerable caches (card snapshot,
// price history) stay local. Conflict policy is last-write-wins by updated_at —
// fine for Phase 1; realtime live-merge is a later phase (docs/BACKEND.md).

import { getSupabase, isConfigured } from './supabase.js';

const PREFIX = 'kwde_'; // must match storage.js
// Bucket name suffixes we sync (KEYS values in storage.js). Excludes
// 'cards_cache' and 'price_history' (large, locally regenerable).
const SYNC = ['watchlist', 'portfolio', 'sold', 'notes', 'tags', 'alerts', 'alert_log', 'buylist', 'settings'];
const syncable = (k) => SYNC.some((n) => k === n || k.endsWith('_' + n));
const accPrefix = (ns) => PREFIX + ns + '_';

let ctx = null;        // { ns, userId } while signed in
let muteUntil = 0;     // ignore write-through during the post-pull settle window
const pending = new Map();
let timer = null;

// Cloud → local. Authoritative on login: writes each remote bucket straight into
// localStorage (bypassing the store, so it doesn't echo back as a push).
export async function pull(ns, userId) {
  if (!isConfigured || !userId) return;
  const sb = await getSupabase();
  if (!sb) return;
  try {
    const { data, error } = await sb.from('user_state').select('k,value').eq('user_id', userId);
    if (error || !data) return;
    const pre = accPrefix(ns);
    for (const row of data) {
      try { localStorage.setItem(pre + row.k, JSON.stringify(row.value)); } catch { /* quota */ }
    }
  } catch { /* offline → keep local */ }
}

export function start(ns, userId) {
  ctx = { ns, userId };
  muteUntil = Date.now() + 2500; // let the post-login state load settle without re-pushing
}

export function stop() {
  ctx = null;
  pending.clear();
  if (timer) { clearTimeout(timer); timer = null; }
}

// Registered as storage.js' write hook: called on every persisted write.
export function note(fullKey, value) {
  if (!isConfigured || !ctx || Date.now() < muteUntil) return;
  const pre = accPrefix(ctx.ns);
  if (!fullKey.startsWith(pre)) return;
  const k = fullKey.slice(pre.length);
  if (!syncable(k)) return;
  pending.set(k, value);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1500); // debounce bursts of edits
}

async function flush() {
  timer = null;
  if (!isConfigured || !ctx || pending.size === 0) return;
  const sb = await getSupabase();
  if (!sb) return;
  const now = new Date().toISOString();
  const rows = [...pending.entries()].map(([k, value]) => ({ user_id: ctx.userId, k, value, updated_at: now }));
  pending.clear();
  try { await sb.from('user_state').upsert(rows, { onConflict: 'user_id,k' }); } catch { /* retry on next edit */ }
}
