import { useMemo, useState } from 'react';
import { Search, RefreshCw, AlertCircle, ExternalLink, ChevronLeft } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, trendColor, trendIcon } from '../lib/theme.js';
import { fmtEur, fmtNum, fmtRelative } from '../lib/format.js';
import { marketLinks } from '../lib/marketLinks.js';
import CardTile from './CardTile.jsx';
import SealedGrid from './SealedGrid.jsx';
import { SEALED_CATEGORIES } from '../data/sealedProducts.js';
import { ChangeBadge, ScoreBadge, EmptyState, CardImage } from './ui.jsx';

const PRESETS = [
  { id: 'risers', label: '🚀 Steiger', fn: (c) => c.m.trend === 'rising' && (c.m.change30 ?? 0) > 3 },
  { id: 'bargain', label: '💰 Unter €25', fn: (c) => (c.m.market ?? 0) < 25 },
  { id: 'margin', label: '🎯 Hohe Marge', fn: (c) => (c.m.margin ?? 0) >= 18 },
  { id: 'gem', label: '💎 Geheimtipps', fn: (c) => c.m.score >= 64 && c.m.popularity <= 6 },
  { id: 'premium', label: '👑 Premium €100+', fn: (c) => (c.m.market ?? 0) >= 100 && c.m.score >= 60 },
  { id: 'top', label: '🏆 Nur S/A', fn: (c) => c.m.score >= 76 },
];

const TABS = [
  { id: 'sets', label: 'Sets', emoji: '🗂️' },
  { id: 'singles', label: 'Singles', emoji: '🃏' },
  ...SEALED_CATEGORIES,
];

export default function Discover({ onOpen }) {
  const { cards, loading, error, source, lastUpdated, fetchCards, loadSample, tags } = useStore();
  const [cat, setCat] = useState('sets');
  const [selectedSet, setSelectedSet] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [priceRange, setPriceRange] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterTrend, setFilterTrend] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [activePreset, setActivePreset] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const allTags = useMemo(() => [...new Set(Object.values(tags).flat())].sort(), [tags]);

  // Mode: what the Singles/Sets area shows.
  const mode = cat === 'sets' ? (selectedSet ? 'setdetail' : 'home')
    : cat === 'singles' ? 'singles'
      : 'sealed';
  const listing = mode === 'setdetail' || mode === 'singles';

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
    if (mode === 'setdetail') list = list.filter((c) => (c.setId || c.set) === selectedSet);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q));
    }
    if (activePreset) {
      const p = PRESETS.find((x) => x.id === activePreset);
      if (p) list = list.filter(p.fn);
    }
    list = list
      .filter((c) => filterRisk === 'all' || c.m.risk === filterRisk)
      .filter((c) => filterTrend === 'all' || c.m.trend === filterTrend)
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
  }, [cards, listing, mode, selectedSet, search, activePreset, filterRisk, filterTrend, filterTag, priceRange, sortBy, tags]);

  const openSet = sets.find((s) => s.id === selectedSet);

  const switchCat = (id) => { setCat(id); setSelectedSet(null); setSearch(''); setActivePreset(null); };

  return (
    <>
      {/* Category tabs: Sets · Singles · Booster · Displays · Top-Trainer-Box */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16, borderBottom: `1px solid ${C.lineStrong}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => switchCat(t.id)}
            style={{ padding: '9px 16px', border: 'none', background: 'none', color: cat === t.id ? C.gold : C.textFaint, borderBottom: cat === t.id ? `2px solid ${C.gold}` : '2px solid transparent', cursor: 'pointer', fontWeight: cat === t.id ? 700 : 500, fontSize: 13.5, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Source line */}
      <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 14 }}>
        {source === 'snapshot' && <>🟢 Aktuelle Marktdaten (Cardmarket EU) · Stand {fmtRelative(lastUpdated)} · täglich aktualisiert · </>}
        {source === 'cache' && <>💾 Zuletzt geladen · {fmtRelative(lastUpdated)} · </>}
        {source === 'sample' && <>🃏 Beispieldaten (Live-Daten gerade nicht erreichbar) · </>}
        {cards.length} Karten in {sets.length} Sets
      </div>

      {error && (
        <div style={{ background: '#ff525215', border: '1px solid #ff525240', borderRadius: 10, padding: 14, marginBottom: 16, color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} /> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={loadSample} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ff525240', background: '#ff525215', color: C.red, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Beispieldaten laden</button>
        </div>
      )}

      {mode === 'sealed' && <SealedGrid type={cat} />}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
      )}

      {/* Sets home: big highlight cards + set tiles */}
      {!loading && mode === 'home' && (
        <>
          {highlights.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                🌟 Top-Karten
                <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>die 5 stärksten Karten gerade</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
                {highlights.map((h) => (
                  <HighlightCard key={h.card.id} h={h} onOpen={onOpen} />
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🗂️ Alle Sets
            <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>klick ein Set für seine Karten</span>
          </div>
          {sets.length === 0
            ? <EmptyState icon="🃏" title="Keine Daten" hint="Klicke »Aktualisieren«, um aktuelle Karten zu laden." />
            : <SetTiles sets={sets} onSelect={setSelectedSet} />}
        </>
      )}

      {/* Card listing: a set is open, or the Singles tab */}
      {!loading && listing && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            {mode === 'setdetail' && (
              <button onClick={() => { setSelectedSet(null); setSearch(''); setActivePreset(null); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: C.surface, color: C.textSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <ChevronLeft size={14} /> Sets
              </button>
            )}
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
              <input className="control" placeholder={mode === 'setdetail' ? 'In diesem Set suchen…' : 'Karte suchen (über alle Sets)…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
            </div>
            <select className="control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">↕ Score</option>
              <option value="change30">↕ Veränderung 30T</option>
              <option value="change7">↕ Veränderung 7T</option>
              <option value="popularity">↕ Beliebtheit</option>
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
            {allTags.length > 0 && (
              <select className="control" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="all">Alle Tags</option>
                {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
            )}
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
            {mode === 'setdetail' ? openSet?.name : 'Alle Singles'}
            <span style={{ color: C.textFaint, fontWeight: 500, marginLeft: 8, fontSize: 12 }}>{listed.length} Karten</span>
          </div>

          {listed.length === 0
            ? <EmptyState icon="🔍" title="Keine Karten gefunden" hint="Anderen Suchbegriff oder Filter probieren." />
            : viewMode === 'grid'
              ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>{listed.map((card) => <CardTile key={card.id} card={card} onOpen={onOpen} />)}</div>
              : <ListView cards={listed} onOpen={onOpen} />}
        </>
      )}
    </>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
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
  const cols = '52px 2.2fr 0.9fr 0.7fr 0.7fr 0.7fr 0.6fr 70px';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase' }}>
        <div>Score</div><div>Karte</div><div style={{ textAlign: 'right' }}>Markt</div><div style={{ textAlign: 'right' }}>7T</div><div style={{ textAlign: 'right' }}>30T</div><div style={{ textAlign: 'right' }}>Marge</div><div style={{ textAlign: 'center' }}>Bel.</div><div></div>
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
          <div style={{ textAlign: 'center', fontSize: 11, color: C.gold }}>{fmtNum(c.m.popularity, 1)}</div>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            <button onClick={() => toggleWatchlist(c)} title="Merken" style={{ padding: '4px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: inWatchlist(c.id) ? '#ff525215' : '#ffd70015', color: inWatchlist(c.id) ? C.red : C.gold }}>{inWatchlist(c.id) ? '✕' : '⭐'}</button>
            <a href={c.cardmarketUrl || marketLinks(c).cardmarket} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Cardmarket" style={{ padding: '4px 7px', borderRadius: 5, background: '#0066cc22', color: C.blue, display: 'inline-flex', alignItems: 'center' }}><ExternalLink size={11} /></a>
          </div>
        </div>
      ))}
    </div>
  );
}
