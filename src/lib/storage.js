// Thin localStorage wrapper (replaces the artifact-only window.storage from the
// template). JSON in / JSON out, and safe if storage is unavailable.
//
// All app data is stored under PREFIX + <namespace> + key. The namespace lets a
// local user account keep its own data: guest = '' (the original, un-namespaced
// keys, so existing data is preserved), a logged-in account = `acct_<id>_`.
const PREFIX = 'kwde_';
let ns = '';

export const setNamespace = (n) => { ns = n ? `${n}_` : ''; };
export const getNamespace = () => ns;
const fullKey = (key) => `${PREFIX}${ns}${key}`;

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
      localStorage.setItem(fullKey(key), JSON.stringify(value));
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
