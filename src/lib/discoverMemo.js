// Remembers the Discover view's local UI state (search text, sort, filters, how
// many cards were expanded, grid/list mode) PER GAME, so leaving Discover for
// another tab and coming back — or a back/forward navigation that remounts it —
// restores exactly what you were looking at instead of snapping to the start.
//
// The primary navigation (category + open set) lives in the App's history state
// so the browser Back/Forward buttons step through it; this module only covers
// the lighter, high-frequency local state that should not spam history entries.
//
// Module-scoped (lives for the page session). Cleared when you explicitly go Home
// or pick a game from the landing page (a deliberate "start fresh").

const memo = new Map();

export const getDiscoverMemo = (game) => memo.get(game) || null;
export const setDiscoverMemo = (game, state) => { if (game) memo.set(game, state); };
export const clearDiscoverMemo = (game) => { if (game) memo.delete(game); };
