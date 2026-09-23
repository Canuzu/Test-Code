// Für die Tests: der SQLite-Speicher hinter localStorage ist nativ und
// fehlt in Jest. Ein Speicher im Arbeitsspeicher tut es hier genauso.
jest.mock('expo-sqlite/localStorage/install', () => ({}));
const speicher = new Map();
globalThis.localStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => { speicher.set(k, String(v)); },
  removeItem: (k) => { speicher.delete(k); },
  clear: () => speicher.clear(),
};
