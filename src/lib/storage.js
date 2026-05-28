// Thin localStorage wrapper (replaces the artifact-only window.storage from the
// template). JSON in / JSON out, namespaced, and safe if storage is unavailable.
const PREFIX = 'kwde_';

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
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
};
