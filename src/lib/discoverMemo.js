// Remembers the Discover view's local UI state (search text, sort, filters, how
// many cards were expanded, grid/list mode) PER GAME, so leaving Discover for
// another tab and coming back — or a back/forward navigation, or a full page
// refresh — restores exactly what you were looking at instead of snapping to
// the start.
//
// The primary navigation (category + open set) lives in the App's history state
// so the browser Back/Forward buttons step through it; this module only covers
// the lighter, high-frequency local state that should not spam history entries.
//
// Backed by sessionStorage so it survives a reload (and is scoped to the tab);
// cleared when you explicitly go Home or pick a game from the landing page.

const KEY = 'kwde_discover_memo';

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
};
let memo = read();
const persist = () => { try { sessionStorage.setItem(KEY, JSON.stringify(memo)); } catch { /* ignore */ } };

export const getDiscoverMemo = (game) => memo[game] || null;
export const setDiscoverMemo = (game, state) => { if (!game) return; memo[game] = state; persist(); };
export const clearDiscoverMemo = (game) => { if (!game) return; delete memo[game]; persist(); };
