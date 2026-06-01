import { useMemo, useState, useEffect, useDeferredValue } from 'react';
import { Search, RefreshCw, AlertCircle, ExternalLink, ChevronLeft, Sparkles, LayoutGrid, Package, Boxes, Gift, Layers } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, trendColor, trendIcon } from '../lib/theme.js';
import { fmtEur, fmtNum, fmtRelative } from '../lib/format.js';
import { cmUrl } from '../lib/marketLinks.js';
import CardTile from './CardTile.jsx';
import SealedGrid from './SealedGrid.jsx';
import { sealedCategoriesFor } from '../data/sealedProducts.js';
import { foilClass } from '../lib/variants.js';
import { ChangeBadge, ScoreBadge, EmptyState, CardImage } from './ui.jsx';

const PRESETS = [
  { id: 'risers', label: '🚀 Steiger', fn: (c) => c.m.trend === 'rising' && (c.m.change30 ?? 0) > 3 },
  { id: 'bargain', label: '💰 Unter €25', fn: (c) => (c.m.market ?? 0) < 25 },
  { id: 'margin', label: '🎯 Hohe Marge', fn: (c) => (c.m.margin ?? 0) >= 18 },
  { id: 'gem', label: '💎 Geheimtipps', fn: (c) => c.m.score >= 64 && c.m.popularity <= 6 },
  { id: 'premium', label: '👑 Premium €100+', fn: (c) => (c.m.market ?? 0) >= 100 && c.m.score >= 60 },
  { id: 'top', label: '🏆 Nur S/A', fn: (c) => c.m.score >= 76 },
];

// Cohesive line icons per category (matches the lucide nav in the header).
const CAT_ICON = { start: Sparkles, singles: LayoutGrid, booster: Package, display: Boxes, etb: Gift, starter: Layers };

// Honest one-line provenance per game for the snapshot source line.
function snapshotLabel(game, info) {
  if (game === 'pokemon') return 'Aktuelle Marktdaten (Cardmarket EU) · täglich aktualisiert';
  if (game === 'magic') return 'Live-Preise (Cardmarket EU via Scryfall) · alle Sets · offizielles Artwork';
  if (game === 'onepiece' && info?.cmEnriched) return `Alle Sets · offizielle Bilder · ${fmtNum(info.cmEnriched)} Live-Preise (Cardmarket)${info.pricesEstimated ? ', Rest geschätzt' : ''}`;
  // One Piece (no live yet) + Yu-Gi-Oh: full catalogue, estimated prices.
  return 'Alle Sets · offizielle Bilder · Preise geschätzt (Cardmarket-Link je Karte)';
}

export default function Discover({ onOpen }) {
  const { cards, loading, error, source, snapshotInfo, lastUpdated, fetchCards, loadSample, tags, activeGame } = useStore();
  const [cat, setCat] = useState('start');
  const [selectedSet, setSelectedSet] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [priceRange, setPriceRange] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterTrend, setFilterTrend] = useState('all');
  const [filterFoil, setFilterFoil] = useState('all'); // all | holo | reverse | normal
  const [filterTag, setFilterTag] = useState('all');
  const [activePreset, setActivePreset] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [visible, setVisible] = useState(60); // how many result cards to render (perf)

  // Keep typing snappy: the heavy filter/sort over ~19k cards runs against a
  // deferred copy of the query, so each keystroke updates the input instantly
  // and React filters in the background instead of blocking every character.
  const deferredSearch = useDeferredValue(search);

  const allTags = useMemo(() => [...new Set(Object.values(tags).flat())].sort(), [tags]);

  // Category tabs are per-game (Pokémon: Booster/Display/ETB · One Piece:
  // Booster/Display/Starter Decks).
  const TABS = useMemo(() => [
    { id: 'start', label: 'Start' },
    { id: 'singles', label: 'Singles' },
    ...sealedCategoriesFor(activeGame),
  ], [activeGame]);

  // Mode:
  //  • 'home'      → Start tab: welcome animation + Top-Karten (no big card list)
  //  • 'setlist'   → Singles tab: pick a set first (avoids dumping all cards)
  //  • 'setdetail' → a set is open: its individual cards
  //  • 'sealed'    → sealed-product categories
  const mode = cat === 'start' ? 'home'
    : cat === 'singles' ? (selectedSet ? 'setdetail' : 'setlist')
      : 'sealed';
  // The search box stays SCOPED to where you are:
  //  • inside an open set (setdetail) → searches only that set
  //  • Singles set-list / Start       → searches all singles (whole catalogue)
  // It no longer always jumps to the global singles list from a sealed tab etc.
  // `searching` reflects what's typed (UI), `searchingDeferred` what's filtered.
  const searching = search.trim().length > 0;
  const searchQuery = deferredSearch.trim().toLowerCase();
  const searchingDeferred = searchQuery.length > 0;
  const inSet = mode === 'setdetail';
  // Show the card listing when a set is open, or when searching in a card scope
  // (Start / Singles). Sealed tabs keep their own product grid + search.
  const listing = inSet || (searchingDeferred && (cat === 'start' || cat === 'singles'));

  // ---- 5 highlights (shown as full cards on the Sets home) --------------
  const highlights = useMemo(() => {
    if (cards.length === 0) return [];
    const byScore = [...cards].sort((a, b) => b.m.score - a.m.score);
    const byChange = [...cards].filter((c) => c.m.change30 != null).sort((a, b) => b.m.change30 - a.m.change30);
    const byMargin = [...cards].filter((c) => c.m.margin != null).sort((a, b) => b.m.margin - a.m.margin);
    const byPrice = [...cards].sort((a, b) => (b.m.market ?? 0) - (a.m.market ?? 0));
    const gem = byScore.find((c) => c.m.popularity <= 6 && c.m.score >= 60);
    const picks = [
      { label: '🏆 Top-Pick', card: byScore[0], color: C.gold },
      { label: '🚀 Größter Steiger', card: byChange[0], color: C.green },
      { label: '💰 Wertvollste', card: byPrice[0], color: C.orange },
      { label: '🎯 Beste Marge', card: byMargin[0], color: C.blue },
      { label: '💎 Geheimtipp', card: gem, color: C.purple },
    ].filter((x) => x.card);
    // de-dupe by card id (a card can win multiple categories)
    const seen = new Set();
    return picks.filter((p) => (seen.has(p.card.id) ? false : seen.add(p.card.id)));
  }, [cards]);

  // ---- sets index -------------------------------------------------------
  const sets = useMemo(() => {
    const m = new Map();
    for (const c of cards) {
      const key = c.setId || c.set || 'unknown';
      let g = m.get(key);
      if (!g) { g = { id: key, name: c.set || '—', releaseDate: c.setReleaseDate || '', year: c.year || 0, count: 0, top: null }; m.set(key, g); }
      g.count += 1;
      if (!g.top || (c.m.market ?? 0) > (g.top.m.market ?? 0)) g.top = c;
      if (c.setReleaseDate && c.setReleaseDate > g.releaseDate) g.releaseDate = c.setReleaseDate;
      if (c.year && c.year > g.year) g.year = c.year;
    }
    return [...m.values()].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '') || b.year - a.year);
  }, [cards]);

  // ---- cards to list (set detail or singles) ----------------------------
  const listed = useMemo(() => {
    if (!listing) return [];
    let list = cards;
    // Keep the set scope even while searching inside an open set (#1): a query
    // then filters within that set instead of jumping to the global list.
    if (inSet) list = list.filter((c) => (c.setId || c.set) === selectedSet);
    if (searchQuery) {
      const q = searchQuery;
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q));
    }
    if (activePreset) {
      const p = PRESETS.find((x) => x.id === activePreset);
      if (p) list = list.filter(p.fn);
    }
    list = list
      .filter((c) => filterRisk === 'all' || c.m.risk === filterRisk)
      .filter((c) => filterTrend === 'all' || c.m.trend === filterTrend)
      .filter((c) => filterFoil === 'all' || foilClass(c.rarity) === filterFoil)
      .filter((c) => filterTag === 'all' || (tags[c.id] || []).includes(filterTag))
      .filter((c) => {
        const mk = c.m.market ?? 0;
        if (priceRange === '<25') return mk < 25;
        if (priceRange === '25-100') return mk >= 25 && mk < 100;
        if (priceRange === '100-500') return mk >= 100 && mk < 500;
        if (priceRange === '500+') return mk >= 500;
        return true;
      });
    const dir = {
      score: (a, b) => b.m.score - a.m.score,
      change30: (a, b) => (b.m.change30 ?? -999) - (a.m.change30 ?? -999),
      change7: (a, b) => (b.m.change7 ?? -999) - (a.m.change7 ?? -999),
      popularity: (a, b) => b.m.popularity - a.m.popularity,
      margin: (a, b) => (b.m.margin ?? -999) - (a.m.margin ?? -999),
      price_desc: (a, b) => (b.m.market ?? 0) - (a.m.market ?? 0),
      price_asc: (a, b) => (a.m.market ?? 0) - (b.m.market ?? 0),
    }[sortBy];
    return dir ? [...list].sort(dir) : list;
  }, [cards, listing, inSet, selectedSet, searchQuery, activePreset, filterRisk, filterTrend, filterFoil, filterTag, priceRange, sortBy, tags]);

  // Cap how many result cards mount at once — rendering thousands of heavy
  // CardTiles is what makes a broad query lag. Reset the cap whenever the
  // result set could change.
  useEffect(() => { setVisible(60); }, [searchQuery, mode, selectedSet, activePreset, filterRisk, filterTrend, filterFoil, filterTag, priceRange, sortBy, viewMode]);
  const shown = useMemo(() => listed.slice(0, visible), [listed, visible]);

  // Jump to the top when moving between sub-views (category, opening/closing a
  // set, or starting a search) so the new list starts at its beginning.
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, [cat, selectedSet, searchingDeferred]);

  const openSet = sets.find((s) => s.id === selectedSet);

  const switchCat = (id) => { setCat(id); setSelectedSet(null); setSearch(''); setActivePreset(null); };

  // Scope of the search box, so the placeholder/behaviour match where you are.
  const scope = inSet ? 'set' : mode === 'sealed' ? 'sealed' : 'singles';
  const singlesHint = activeGame === 'onepiece'
    ? 'z. B. Luffy, Zoro, Shanks'
    : 'z. B. Glurak, Pikachu, Nachtara';
  const searchPlaceholder = scope === 'set'
    ? `In „${openSet?.name || 'diesem Set'}" suchen…`
    : scope === 'sealed'
      ? `${TABS.find((t) => t.id === cat)?.label || 'Produkte'} durchsuchen…`
      : `Karte suchen – über alle Sets (${singlesHint})…`;

  return (
    <>
      {/* Search bar — scoped to the current view (set / sealed category / all singles) */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
        <input
          className="control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ width: '100%', padding: '13px 42px 13px 42px', fontSize: 15, borderRadius: 12 }}
        />
        {searching && (
          <button onClick={() => setSearch('')} title="Suche zurücksetzen"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#ffffff12', border: 'none', color: C.textSoft, width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        )}
      </div>

      {/* Category tabs: Start · Singles · Booster · Displays · Top-Trainer-Box.
          Hidden only while searching inside an open set (that view has its own
          back button); otherwise they stay so the search scope is always clear. */}
      <div style={{ display: inSet ? 'none' : 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16, borderBottom: `1px solid ${C.lineStrong}` }}>
        {TABS.map((t) => {
          const Ic = CAT_ICON[t.id] || LayoutGrid;
          return (
            <button key={t.id} onClick={() => switchCat(t.id)}
              style={{ padding: '9px 16px', border: 'none', background: 'none', color: cat === t.id ? C.gold : C.textFaint, borderBottom: cat === t.id ? `2px solid ${C.gold}` : '2px solid transparent', cursor: 'pointer', fontWeight: cat === t.id ? 700 : 500, fontSize: 13.5, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
              <Ic size={16} strokeWidth={cat === t.id ? 2.5 : 2} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Source line */}
      {!searching && !inSet && (
        <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 14 }}>
          {source === 'snapshot' && <>🟢 {snapshotLabel(activeGame, snapshotInfo)} · Stand {fmtRelative(lastUpdated)} · </>}
          {source === 'cache' && <>💾 Zuletzt geladen · {fmtRelative(lastUpdated)} · </>}
          {source === 'sample' && <>🃏 Beispieldaten (Live-Daten gerade nicht erreichbar) · </>}
          {cards.length} Karten in {sets.length} Sets
        </div>
      )}

      {error && (
        <div style={{ background: '#ff525215', border: '1px solid #ff525240', borderRadius: 10, padding: 14, marginBottom: 16, color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} /> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={loadSample} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ff525240', background: '#ff525215', color: C.red, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Beispieldaten laden</button>
        </div>
      )}

      {mode === 'sealed' && <SealedGrid type={cat} query={searchQuery} game={activeGame} cards={cards} />}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
      )}

      {/* Start: a cool Pokémon animation (replaces the big set list) + Top-Karten */}
      {!loading && mode === 'home' && !searchingDeferred && (
        <>
          <WelcomeHero game={activeGame} onBrowse={() => switchCat('singles')} />
          {highlights.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                🌟 Top-Karten
                <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>die 5 stärksten Karten gerade</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 16 }}>
                {highlights.map((h) => (
                  <HighlightCard key={h.card.id} h={h} onOpen={onOpen} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Singles: choose a set first — its individual cards load only on click,
          so the page never has to render hundreds of cards at once. */}
      {!loading && mode === 'setlist' && !searchingDeferred && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            🗂️ Sets
            <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>wähle ein Set – dann erscheinen die Einzelkarten</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 14 }}>{cards.length} Karten in {sets.length} Sets · oder oben gezielt nach einer Karte suchen</div>
          {sets.length === 0
            ? <EmptyState icon="🃏" title="Keine Daten" hint="Klicke »Aktualisieren«, um aktuelle Karten zu laden." />
            : <SetTiles sets={sets} onSelect={setSelectedSet} />}
        </>
      )}

      {/* Card listing: a set is open, or searching within Start/Singles */}
      {!loading && listing && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            {inSet && (
              <button onClick={() => { setSelectedSet(null); setSearch(''); setActivePreset(null); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: C.surface, color: C.textSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <ChevronLeft size={14} /> Sets
              </button>
            )}
            <select className="control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">↕ Score</option>
              <option value="change30">↕ Veränderung 30T</option>
              <option value="change7">↕ Veränderung 7T</option>
              <option value="margin">↕ Marge</option>
              <option value="price_desc">↕ Preis ↓</option>
              <option value="price_asc">↕ Preis ↑</option>
            </select>
            <select className="control" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
              <option value="all">Alle Preise</option>
              <option value="<25">Unter €25</option>
              <option value="25-100">€25–100</option>
              <option value="100-500">€100–500</option>
              <option value="500+">€500+</option>
            </select>
            <select className="control" value={filterTrend} onChange={(e) => setFilterTrend(e.target.value)}>
              <option value="all">Alle Trends</option>
              <option value="rising">↑ Steigend</option>
              <option value="stable">→ Stabil</option>
              <option value="falling">↓ Fallend</option>
            </select>
            <select className="control" value={filterFoil} onChange={(e) => setFilterFoil(e.target.value)} title="Holo / Reverse Holo">
              <option value="all">Alle Varianten</option>
              <option value="holo">✨ Holo</option>
              <option value="reverse">🔄 Reverse Holo</option>
              <option value="normal">▫️ Normal</option>
            </select>
            {allTags.length > 0 && (
              <select className="control" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="all">Alle Tags</option>
                {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 3 }}>
              {[['grid', '⊞'], ['list', '≡']].map(([m, icon]) => (
                <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', background: viewMode === m ? '#ffd70022' : 'transparent', color: viewMode === m ? C.gold : C.textFaint, fontSize: 14, fontWeight: 700 }}>{icon}</button>
              ))}
            </div>
            <button className="btn-primary" onClick={() => fetchCards()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Aktualisieren
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => setActivePreset(activePreset === p.id ? null : p.id)}
                style={{ padding: '4px 11px', borderRadius: 20, border: `1px solid ${activePreset === p.id ? C.gold : C.lineStrong}`, background: activePreset === p.id ? '#ffd70015' : 'transparent', color: activePreset === p.id ? C.gold : C.textSoft, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            {inSet
              ? <>{openSet?.name}{searchingDeferred ? <> · „{deferredSearch.trim()}"</> : null}</>
              : searchingDeferred ? <>Suchergebnisse für „{deferredSearch.trim()}"</> : 'Alle Singles'}
            <span style={{ color: C.textFaint, fontWeight: 500, marginLeft: 8, fontSize: 12 }}>
              {listed.length} Karten{shown.length < listed.length ? ` · ${shown.length} angezeigt` : ''}
            </span>
            {search !== deferredSearch && <span style={{ color: C.textFaint, fontWeight: 500, marginLeft: 8, fontSize: 12 }}>· sucht…</span>}
          </div>

          {listed.length === 0
            ? <EmptyState icon="🔍" title="Keine Karten gefunden" hint="Anderen Suchbegriff oder Filter probieren." />
            : (
              <>
                {viewMode === 'grid'
                  ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))', gap: 14 }}>{shown.map((card) => <CardTile key={card.id} card={card} onOpen={onOpen} />)}</div>
                  : <ListView cards={shown} onOpen={onOpen} />}
                {shown.length < listed.length && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                    <button className="btn-primary" onClick={() => setVisible((v) => v + 60)}>
                      Mehr laden ({listed.length - shown.length} weitere)
                    </button>
                  </div>
                )}
              </>
            )}
        </>
      )}
    </>
  );
}

// Self-contained welcome animation for a game's start page. Pokémon gets its
// classic bouncing, wiggling Poké Ball; other games get a tasteful animated
// card fan so the hero fits the game without per-game art assets.
function WelcomeHero({ game, onBrowse }) {
  const sparks = [
    { left: '12%', top: '24%', d: '0s', s: 9 },
    { left: '84%', top: '30%', d: '.5s', s: 7 },
    { left: '74%', top: '66%', d: '1.1s', s: 10 },
    { left: '18%', top: '64%', d: '1.6s', s: 6 },
    { left: '50%', top: '12%', d: '.8s', s: 6 },
  ];
  const isPoke = game === 'pokemon';
  const isOP = game === 'onepiece';
  const HERO = {
    pokemon: { grad: 'linear-gradient(90deg,#ffd700,#ff6b35)', title: 'Schnapp sie dir alle!', btn: '🃏 Sets durchstöbern' },
    onepiece: { grad: 'linear-gradient(90deg,#ffb300,#e23b3b)', title: 'Setze die Segel! ⚓', btn: '🏴‍☠️ Sets entern' },
    magic: { grad: 'linear-gradient(90deg,#8b5cf6,#3b82f6)', title: 'Tappe ins Mana! 🔮', btn: '🔮 Sets erkunden' },
    yugioh: { grad: 'linear-gradient(90deg,#f59e0b,#b45309)', title: "It's time to D-D-Duel! 🐉", btn: '🐉 Sets erkunden' },
  };
  const hero = HERO[game] || HERO.pokemon;
  return (
    <div className="poke-hero">
      {sparks.map((sp, i) => (
        <span key={i} className="poke-spark" style={{ left: sp.left, top: sp.top, width: sp.s, height: sp.s, animationDelay: sp.d }} />
      ))}
      {isOP ? (
        <ThousandSunny />
      ) : (
      <div className="poke-bounce">
        <div className="poke-wiggle">
          {isPoke ? (
            <svg width="148" height="148" viewBox="0 0 100 100" className="poke-ball" role="img" aria-label="Pokéball">
              <defs>
                <linearGradient id="pbTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b6b" /><stop offset="100%" stopColor="#e01f1f" />
                </linearGradient>
                <linearGradient id="pbBot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#dde2ef" />
                </linearGradient>
                <radialGradient id="pbBtn" cx="50%" cy="45%" r="60%">
                  <stop offset="0%" stopColor="#ffffff" /><stop offset="65%" stopColor="#ffe9a6" /><stop offset="100%" stopColor="#d9a521" />
                </radialGradient>
                <clipPath id="pbClip"><circle cx="50" cy="50" r="46" /></clipPath>
              </defs>
              <g clipPath="url(#pbClip)">
                <rect x="0" y="0" width="100" height="50" fill="url(#pbTop)" />
                <rect x="0" y="50" width="100" height="50" fill="url(#pbBot)" />
                <rect x="0" y="44" width="100" height="12" fill="#16161d" />
                <ellipse cx="34" cy="28" rx="13" ry="9" fill="#ffffff" opacity="0.22" />
              </g>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#16161d" strokeWidth="4" />
              <circle cx="50" cy="50" r="15" fill="#16161d" />
              <circle cx="50" cy="50" r="11" fill="#ffffff" />
              <circle cx="50" cy="50" r="7" fill="url(#pbBtn)" className="poke-btn" />
            </svg>
          ) : (
            <svg width="150" height="150" viewBox="0 0 120 120" role="img" aria-label="Karten">
              <defs>
                <linearGradient id="cf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd700" /><stop offset="1" stopColor="#ff6b35" /></linearGradient>
              </defs>
              {/* fanned cards */}
              <g transform="translate(60 64)">
                <g transform="rotate(-22)"><rect x="-26" y="-38" width="52" height="74" rx="8" fill="#171733" stroke="url(#cf1)" strokeWidth="3" opacity="0.7" /></g>
                <g transform="rotate(0)"><rect x="-26" y="-40" width="52" height="78" rx="8" fill="#1b1b3a" stroke="url(#cf1)" strokeWidth="3.5" /></g>
                <g transform="rotate(22)"><rect x="-26" y="-38" width="52" height="74" rx="8" fill="#171733" stroke="url(#cf1)" strokeWidth="3" opacity="0.7" /></g>
                {/* curve on the centre card */}
                <path d="M-16 24 L-6 14 L2 18 L12 -2 L20 -12 M11 -10 L20 -12 L17.5 -3.5" fill="none" stroke="url(#cf1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          )}
        </div>
        <div className="poke-shadow" />
      </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, background: hero.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{hero.title}</div>
        <div style={{ fontSize: 13, color: C.textDim, marginTop: 6, maxWidth: 440 }}>
          Suche oben gezielt nach einer Karte – oder stöbere unter <strong style={{ color: C.textSoft }}>Singles</strong> Set für Set durch alle Karten.
        </div>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={onBrowse}>{hero.btn}</button>
      </div>
    </div>
  );
}

// Thousand Sunny gently bobbing on rolling waves — the One Piece hero art.
// Pure SVG/CSS (no image asset), so it matches the Pokéball animation's spirit.
function ThousandSunny() {
  return (
    <div className="op-scene" role="img" aria-label="Thousand Sunny auf dem Meer">
      <div className="op-sea">
        <svg className="op-wave op-wave-back" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 24 C30 12 60 36 90 24 C120 12 150 36 180 24 C210 12 240 36 240 24 L240 60 L0 60 Z" fill="#1c6aa8" />
        </svg>
        <svg className="op-wave op-wave-front" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 33 C28 23 56 43 92 33 C128 23 160 45 200 33 C222 27 240 38 240 35 L240 60 L0 60 Z" fill="#2f97dd" />
          <path d="M0 33 C28 23 56 43 92 33 C128 23 160 45 200 33 C222 27 240 38 240 35" fill="none" stroke="#bfe4ff" strokeWidth="1.6" opacity="0.6" />
        </svg>
      </div>
      <div className="op-shadow" />
      <div className="op-ship">
        <svg width="138" height="122" viewBox="0 0 140 124" aria-hidden="true">
          {/* mast + pennant */}
          <rect x="66" y="18" width="5" height="78" rx="2.5" fill="#7a4a1e" />
          <path d="M71 19 L86 23 L71 27 Z" fill="#e23b3b" />
          {/* main sail */}
          <path d="M66 28 C40 32 30 46 30 55 C30 64 40 78 66 82 Z" fill="#fdfdf6" stroke="#d9d8c4" strokeWidth="1.5" />
          {/* Jolly Roger: crossbones → skull → straw hat */}
          <g stroke="#1b1b24" strokeWidth="3" strokeLinecap="round">
            <line x1="40" y1="60" x2="53" y2="50" />
            <line x1="40" y1="50" x2="53" y2="60" />
          </g>
          <circle cx="46.5" cy="55" r="6.6" fill="#1b1b24" />
          <circle cx="44.2" cy="54.2" r="1.7" fill="#fff" />
          <circle cx="48.8" cy="54.2" r="1.7" fill="#fff" />
          <path d="M46.5 56 l-1.2 2.2 h2.4 z" fill="#fff" />
          <ellipse cx="46.5" cy="47.5" rx="12.5" ry="3.2" fill="#f3c33b" stroke="#c8951f" strokeWidth="0.8" />
          <path d="M39 47 Q41 39.5 46.5 39.5 Q52 39.5 54 47 Z" fill="#f3c33b" stroke="#c8951f" strokeWidth="0.8" />
          <rect x="39.5" y="45" width="14" height="2.4" rx="1.2" fill="#d23b3b" />
          {/* hull */}
          <path d="M24 86 L116 86 L109 103 Q105 109 92 109 L48 109 Q35 109 31 103 Z" fill="#f4b733" stroke="#b5791f" strokeWidth="2" />
          <rect x="22" y="83" width="96" height="5" rx="2.5" fill="#8a5a22" />
          <circle cx="52" cy="95" r="2.6" fill="#23232e" />
          <circle cx="70" cy="96" r="2.6" fill="#23232e" />
          <circle cx="88" cy="95" r="2.6" fill="#23232e" />
          {/* lion figurehead at the bow */}
          <circle cx="111" cy="80" r="10" fill="#e86a14" />
          <circle cx="112" cy="80" r="7.4" fill="#f59b3c" />
          <ellipse cx="113.5" cy="82" rx="5" ry="4.2" fill="#ffe2b4" />
          <circle cx="110.8" cy="79.4" r="1.2" fill="#1b1b24" />
          <circle cx="114.8" cy="79.4" r="1.2" fill="#1b1b24" />
          <path d="M111 83 Q113.5 86 116 83" stroke="#1b1b24" strokeWidth="1" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function HighlightCard({ h, onOpen }) {
  return (
    <div
      onClick={() => onOpen(h.card, 'overview')}
      className="card-hover fade-in"
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 14,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ alignSelf: 'flex-start', background: h.color, color: '#0c0c1a', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, boxShadow: `0 2px 8px ${h.color}66` }}>
        {h.label}
      </div>
      <CardImage card={h.card} height={230} radius={12} />
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{h.card.name}</div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{h.card.set}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, marginTop: 8, lineHeight: 1 }}>{fmtEur(h.card.m.market)}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
          <ChangeBadge value={h.card.m.change7} label="7T" />
          <ChangeBadge value={h.card.m.change30} label="30T" />
        </div>
      </div>
    </div>
  );
}

function SetTiles({ sets, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: 12 }}>
      {sets.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)} className="card-hover fade-in"
          style={{ display: 'flex', gap: 12, textAlign: 'left', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 12, cursor: 'pointer', color: C.text, alignItems: 'center' }}>
          <CardImage card={s.top} height={92} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{s.year || '—'}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{s.count}</span>
              <span style={{ fontSize: 10, color: C.textFaint }}>Karten</span>
            </div>
            {s.top && <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>Top: {fmtEur(s.top.m.market, 0)}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

function ListView({ cards, onOpen }) {
  const { inWatchlist, toggleWatchlist } = useStore();
  const cols = '52px 2.2fr 0.9fr 0.7fr 0.7fr 0.7fr 70px';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase' }}>
        <div>Score</div><div>Karte</div><div style={{ textAlign: 'right' }}>Markt</div><div style={{ textAlign: 'right' }}>7T</div><div style={{ textAlign: 'right' }}>30T</div><div style={{ textAlign: 'right' }}>Marge</div><div></div>
      </div>
      {cards.map((c) => (
        <div key={c.id} onClick={() => onOpen(c, 'overview')} className="card-hover"
          style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '10px 12px', alignItems: 'center', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 5, cursor: 'pointer' }}>
          <ScoreBadge tier={c.m.tier} score={c.m.score} />
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CardImage card={c} height={48} radius={4} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: C.textFaint }}>{c.set}{c.rarity ? ` · ${c.rarity}` : ''}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 13 }}>{fmtEur(c.m.market)}</div>
          <div style={{ textAlign: 'right' }}><ChangeBadge value={c.m.change7} size={11} /></div>
          <div style={{ textAlign: 'right' }}><ChangeBadge value={c.m.change30} size={11} /></div>
          <div style={{ textAlign: 'right', fontSize: 12, color: C.blue, fontWeight: 700 }}>{fmtNum(c.m.margin, 0)} %</div>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            <button onClick={() => toggleWatchlist(c)} title="Merken" style={{ padding: '4px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: inWatchlist(c.id) ? '#ff525215' : '#ffd70015', color: inWatchlist(c.id) ? C.red : C.gold }}>{inWatchlist(c.id) ? '✕' : '⭐'}</button>
            <a href={cmUrl(c)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Cardmarket" style={{ padding: '4px 7px', borderRadius: 5, background: '#0066cc22', color: C.blue, display: 'inline-flex', alignItems: 'center' }}><ExternalLink size={11} /></a>
          </div>
        </div>
      ))}
    </div>
  );
}
