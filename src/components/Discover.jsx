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

export default function Discover({ onOpen }) {
  const { cards, loading, error, source, lastUpdated, fetchCards, loadSample, tags } = useStore();
  const [cat, setCat] = useState('singles');
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
  const searching = search.trim().length > 0;
  const showCards = searching || !!selectedSet;

  // ---- 5 highlights (the start-page hero) -------------------------------
  const insights = useMemo(() => {
    if (cards.length === 0) return [];
    const byScore = [...cards].sort((a, b) => b.m.score - a.m.score);
    const byChange = [...cards].filter((c) => c.m.change30 != null).sort((a, b) => b.m.change30 - a.m.change30);
    const byMargin = [...cards].filter((c) => c.m.margin != null).sort((a, b) => b.m.margin - a.m.margin);
    const byPrice = [...cards].sort((a, b) => (b.m.market ?? 0) - (a.m.market ?? 0));
    const gem = byScore.find((c) => c.m.popularity <= 6 && c.m.score >= 60);
    return [
      { icon: '🏆', label: 'Top-Pick', card: byScore[0], color: C.gold, sub: (c) => `Score ${c.m.score}` },
      { icon: '🚀', label: 'Größter Steiger', card: byChange[0], color: C.green, sub: (c) => `30T ${fmtNum(c.m.change30, 1)} %` },
      { icon: '💰', label: 'Wertvollste', card: byPrice[0], color: C.orange, sub: (c) => fmtEur(c.m.market, 0) },
      { icon: '🎯', label: 'Beste Marge', card: byMargin[0], color: C.blue, sub: (c) => `${fmtNum(c.m.margin, 0)} % Spielraum` },
      { icon: '💎', label: 'Geheimtipp', card: gem, color: C.purple, sub: (c) => `Bel. ${fmtNum(c.m.popularity, 1)}/10` },
    ].filter((x) => x.card);
  }, [cards]);

  // ---- sets index (group cards by set) ----------------------------------
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

  // ---- cards to list (only when a set is open or searching) -------------
  const listed = useMemo(() => {
    if (!showCards) return [];
    let list = cards;
    if (searching) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q));
    } else {
      list = list.filter((c) => (c.setId || c.set) === selectedSet);
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
  }, [cards, showCards, searching, search, selectedSet, activePreset, filterRisk, filterTrend, filterTag, priceRange, sortBy, tags]);

  const openSet = sets.find((s) => s.id === selectedSet);

  return (
    <>
      {/* Hero: 5 highlights */}
      {insights.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
          {insights.map(({ icon, label, card, color, sub }) => (
            <div key={label} onClick={() => onOpen(card, 'overview')} className="card-hover"
              style={{ background: `linear-gradient(135deg, ${color}1f, ${color}08)`, border: `1px solid ${color}40`, borderRadius: 12, padding: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 5 }}>{icon} {label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{fmtEur(card.m.market)} · <span style={{ color, fontWeight: 700 }}>{sub(card)}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16, borderBottom: `1px solid ${C.lineStrong}` }}>
        {[{ id: 'singles', label: 'Singles', emoji: '🃏' }, ...SEALED_CATEGORIES].map((t) => (
          <button key={t.id} onClick={() => { setCat(t.id); setSelectedSet(null); setSearch(''); }}
            style={{ padding: '9px 16px', border: 'none', background: 'none', color: cat === t.id ? C.gold : C.textFaint, borderBottom: cat === t.id ? `2px solid ${C.gold}` : '2px solid transparent', cursor: 'pointer', fontWeight: cat === t.id ? 700 : 500, fontSize: 13.5, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {cat !== 'singles' && <SealedGrid type={cat} />}

      {cat === 'singles' && (
        <>
          {/* Search + refresh (always); when a card list is shown, full controls too */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
              <input className="control" placeholder="Karte suchen (über alle Sets)…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
            </div>
            {showCards && (
              <>
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
              </>
            )}
            <button className="btn-primary" onClick={() => fetchCards()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> {loading ? 'Lädt…' : 'Aktualisieren'}
            </button>
          </div>

          {/* Quick filters (only while listing cards) */}
          {showCards && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setActivePreset(activePreset === p.id ? null : p.id)}
                  style={{ padding: '4px 11px', borderRadius: 20, border: `1px solid ${activePreset === p.id ? C.gold : C.lineStrong}`, background: activePreset === p.id ? '#ffd70015' : 'transparent', color: activePreset === p.id ? C.gold : C.textSoft, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
              ))}
              {activePreset && <button onClick={() => setActivePreset(null)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', color: C.textFaint, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>zurücksetzen</button>}
            </div>
          )}

          {/* Source line */}
          <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 12 }}>
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

          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
            </div>
          )}

          {/* Set browser (default) */}
          {!loading && !showCards && (
            sets.length === 0
              ? <EmptyState icon="🃏" title="Keine Daten" hint="Klicke »Aktualisieren«, um aktuelle Karten zu laden." />
              : <SetTiles sets={sets} onSelect={setSelectedSet} />
          )}

          {/* Card list (a set is open, or searching) */}
          {!loading && showCards && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <button onClick={() => { setSelectedSet(null); setSearch(''); setActivePreset(null); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: C.surface, color: C.textSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <ChevronLeft size={14} /> Alle Sets
                </button>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {searching ? `Suche: „${search}"` : openSet?.name}
                  <span style={{ color: C.textFaint, fontWeight: 500, marginLeft: 8, fontSize: 12 }}>{listed.length} Karten</span>
                </div>
              </div>

              {listed.length === 0
                ? <EmptyState icon="🔍" title="Keine Karten gefunden" hint="Anderen Suchbegriff oder Filter probieren." />
                : viewMode === 'grid'
                  ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>{listed.map((card) => <CardTile key={card.id} card={card} onOpen={onOpen} />)}</div>
                  : <ListView cards={listed} onOpen={onOpen} />}
            </>
          )}
        </>
      )}
    </>
  );
}

function SetTiles({ sets, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
      {sets.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)} className="card-hover fade-in"
          style={{ display: 'flex', gap: 12, textAlign: 'left', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 12, cursor: 'pointer', color: C.text, alignItems: 'center' }}>
          <CardImage card={s.top} height={74} />
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
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
            <div style={{ fontSize: 10, color: C.textFaint }}>{c.set}{c.rarity ? ` · ${c.rarity}` : ''}</div>
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
