// Unified auth backend. Presents the SAME interface the store already used for
// local accounts ({ ok, account:{id,email,name} } | { error }), but routes to
// Supabase when configured. When not configured it simply re-exports the local
// (PBKDF2, this-browser-only) implementation, so behaviour is unchanged.
//
// `account.id` is always the storage namespace; `account.uid` is the Supabase
// user id (used as the cloud-sync row key). For local accounts uid is undefined.

import { isConfigured, getSupabase, nsFromUser } from './supabase.js';
import * as local from './auth.js';

export const cloudEnabled = isConfigured;

const acctFromUser = (u) => ({
  id: nsFromUser(u),
  uid: u.id,
  email: u.email,
  name: u.user_metadata?.name || u.email?.split('@')[0] || 'Konto',
});

// Map common Supabase auth errors to the app's German copy.
const translate = (msg = '') => {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-Mail oder Passwort ist falsch.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Für diese E-Mail existiert bereits ein Konto.';
  if (m.includes('password')) return 'Passwort muss mind. 6 Zeichen haben.';
  if (m.includes('email')) return 'Bitte eine gültige E-Mail eingeben.';
  return msg || 'Anmeldung fehlgeschlagen.';
};

export async function login({ email, password }) {
  if (!isConfigured) return local.login({ email, password });
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email: String(email || '').trim(), password });
    if (error) return { error: translate(error.message) };
    return { ok: true, account: acctFromUser(data.user) };
  } catch { return { error: 'Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.' }; }
}

export async function register({ email, name, password }) {
  if (!isConfigured) return local.register({ email, name, password });
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signUp({
      email: String(email || '').trim(),
      password,
      options: { data: { name: String(name || '').trim() || undefined } },
    });
    if (error) return { error: translate(error.message) };
    // If the project requires email confirmation there is no session yet.
    if (!data.session) return { ok: true, pending: true };
    return { ok: true, account: acctFromUser(data.user) };
  } catch { return { error: 'Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.' }; }
}

export async function logout() {
  if (!isConfigured) { local.logout(); return; }
  const sb = await getSupabase();
  try { await sb.auth.signOut(); } catch { /* ignore */ }
}

// Restore an existing session on startup. Returns an account or null.
export async function restore() {
  if (!isConfigured) return local.currentAccount();
  try {
    const sb = await getSupabase();
    const { data } = await sb.auth.getSession();
    return data?.session?.user ? acctFromUser(data.session.user) : null;
  } catch {
    return null;
  }
}
