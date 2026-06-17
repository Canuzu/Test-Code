// Shareable deep links via the URL hash. GitHub Pages serves a single SPA, so a
// path like /pokemon/set/sv3 would 404 on a hard load — the hash always loads
// index.html and is parsed client-side, which is robust and bookmark/share-able.
//
// Grammar:
//   #/                              → landing (no game)
//   #/<game>/<tab>                  → a game + tab
//   #/<game>/<tab>/set/<setId>      → a set open in Discover
//   #/<game>/<tab>/card/<cardId>    → a card modal open
// (set + card can combine: .../set/<id>/card/<id>)

const GAMES = new Set(['pokemon', 'magic', 'onepiece', 'yugioh']);
const TABS = new Set(['discover', 'watchlist', 'portfolio', 'analytics', 'buylist', 'alerts']);

export function viewToHash({ game, tab, discSet, modalId } = {}) {
  if (!game) return '#/';
  const parts = [game, tab || 'discover'];
  if (discSet) parts.push('set', encodeURIComponent(discSet));
  if (modalId) parts.push('card', encodeURIComponent(modalId));
  return `#/${parts.join('/')}`;
}

export function hashToView(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  if (!raw) return { game: '', tab: 'discover', discSet: null, modalId: null };
  const seg = raw.split('/').filter(Boolean);
  const game = GAMES.has(seg[0]) ? seg[0] : '';
  const tab = TABS.has(seg[1]) ? seg[1] : 'discover';
  let discSet = null;
  let modalId = null;
  for (let i = 2; i < seg.length - 1; i += 2) {
    if (seg[i] === 'set') discSet = decodeURIComponent(seg[i + 1]);
    else if (seg[i] === 'card') modalId = decodeURIComponent(seg[i + 1]);
  }
  return { game, tab, discSet, modalId };
}
