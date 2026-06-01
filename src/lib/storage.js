// Thin localStorage wrapper (replaces the artifact-only window.storage from the
// template). JSON in / JSON out, and safe if storage is unavailable.
//
// All app data is stored under PREFIX + <namespace> + key. The namespace has two
// parts: the signed-in account, and the active game (TCG). A logged-in account
// keeps its own data; each game keeps its own watchlist/collection/etc.
//   guest + Pokémon  → ''            (the original, un-namespaced keys — so all
//                                     existing Pokémon data is preserved as-is)
//   guest + One Piece → 'onepiece_'
//   account + game    → 'acct_<id>_<game>_'
// Pokémon intentionally uses the bare namespace for backwards compatibility.
const PREFIX = 'kwde_';
let acct = '';
let game = '';

const compose = () => {
  // Pokémon = the historical default → no game segment (keeps old keys valid).
  const g = game && game !== 'pokemon' ? `${game}_` : '';
  return `${acct}${g}`;
};
let ns = compose();

// Account part of the namespace (kept across game switches).
export const setNamespace = (n) => { acct = n ? `${n}_` : ''; ns = compose(); };
// Game part of the namespace.
export const setGameNamespace = (g) => { game = g || ''; ns = compose(); };
export const getNamespace = () => ns;
const fullKey = (key) => `${PREFIX}${ns}${key}`;

// Optional write-through hook (used by cloud sync). Called with the full
// localStorage key + raw value after every successful set(). No-op by default,
// so the storage layer stays dependency-free and unchanged when sync is off.
let writeHook = null;
export const setWriteHook = (fn) => { writeHook = fn || null; };

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(fullKey(key));
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      const fk = fullKey(key);
      localStorage.setItem(fk, JSON.stringify(value));
      if (writeHook) { try { writeHook(fk, value); } catch { /* sync must never break a local write */ } }
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(fullKey(key));
    } catch {
      /* ignore */
    }
  },
};

export const KEYS = {
  cards: 'cards_cache',
  watchlist: 'watchlist',
  portfolio: 'portfolio',
  sold: 'sold',
  notes: 'notes',
  tags: 'tags',
  settings: 'settings',
  priceHistory: 'price_history',
  alerts: 'alerts',
  alertLog: 'alert_log',
  buylist: 'buylist',
};
