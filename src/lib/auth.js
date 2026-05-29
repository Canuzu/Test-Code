// Local user accounts (no backend).
//
// A static site has no server to authenticate against, so this is a LOCAL
// account system: credentials and per-account data live in this browser's
// localStorage only. It still provides real multi-profile login/logout (handy
// for a shared shop device) and namespaces each account's data. Passwords are
// hashed with PBKDF2-SHA256 via Web Crypto (never stored in plain text) — but
// because everything is client-side this is NOT a substitute for server auth.
// When a real backend is added, register()/login() just call it and keep the
// same `setSession` + namespace flow.

const ACCOUNTS_KEY = 'kwde_accounts';
const SESSION_KEY = 'kwde_session';

const read = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw == null ? fallback : JSON.parse(raw); } catch { return fallback; }
};
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };

// A stable, filesystem/key-safe id derived from the email.
export const accountId = (email) => 'acct_' + String(email || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const listAccounts = () => read(ACCOUNTS_KEY, {});
export const getSession = () => read(SESSION_KEY, null);
export const setSession = (id) => (id ? write(SESSION_KEY, id) : localStorage.removeItem(SESSION_KEY));

export const currentAccount = () => {
  const id = getSession();
  if (!id) return null;
  const acc = listAccounts()[id];
  return acc ? { id, email: acc.email, name: acc.name } : null;
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

async function hashPassword(password, saltHex) {
  // PBKDF2-SHA256, 120k iterations. Falls back to a plain SHA-256 if PBKDF2 is
  // unavailable (very old browsers) so login never hard-crashes.
  const enc = new TextEncoder();
  try {
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(saltHex), iterations: 120000, hash: 'SHA-256' },
      keyMaterial, 256,
    );
    return toHex(bits);
  } catch {
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(saltHex + ':' + password));
    return toHex(digest);
  }
}

const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// Registers a new local account and signs it in. Returns { ok } or { error }.
export async function register({ email, name, password }) {
  email = String(email || '').trim().toLowerCase();
  name = String(name || '').trim() || email.split('@')[0];
  if (!validEmail(email)) return { error: 'Bitte eine gültige E-Mail eingeben.' };
  if ((password || '').length < 6) return { error: 'Passwort muss mind. 6 Zeichen haben.' };
  const accounts = listAccounts();
  const id = accountId(email);
  if (accounts[id]) return { error: 'Für diese E-Mail existiert bereits ein Konto.' };
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  accounts[id] = { email, name, salt, hash, createdAt: Date.now() };
  write(ACCOUNTS_KEY, accounts);
  setSession(id);
  return { ok: true, account: { id, email, name } };
}

// Verifies credentials and signs in. Returns { ok } or { error }.
export async function login({ email, password }) {
  email = String(email || '').trim().toLowerCase();
  const accounts = listAccounts();
  const id = accountId(email);
  const acc = accounts[id];
  if (!acc) return { error: 'Kein Konto mit dieser E-Mail gefunden.' };
  const hash = await hashPassword(password, acc.salt);
  if (hash !== acc.hash) return { error: 'Falsches Passwort.' };
  setSession(id);
  return { ok: true, account: { id, email: acc.email, name: acc.name } };
}

export function logout() {
  setSession(null);
}
