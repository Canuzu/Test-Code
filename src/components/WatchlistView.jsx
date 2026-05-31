import { useMemo, useState } from 'react';
import { Star, Search } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtPct } from '../lib/format.js';
import { enrich } from '../lib/metrics.js';
import CardTile from './CardTile.jsx';
import { Stat, EmptyState } from './ui.jsx';

export default function WatchlistView({ onOpen }) {
  const { watchlist, cards } = useStore();
  const currentById = useMemo(() => new Map(cards.map((c) => [c.id, c.m.market])), [cards]);
  const items = useMemo(() => watchlist.map(enrich), [watchlist]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('added');
  const [filterTrend, setFilterTrend] = useState('all');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q))
      .filter((c) => filterTrend === 'all' || c.m.trend === filterTrend);
    const dir = {
      added: null, // keep insertion order (most recently added last)
      score: (a, b) => b.m.score - a.m.score,
      change30: (a, b) => (b.m.change30 ?? -999) - (a.m.change30 ?? -999),
      price_desc: (a, b) => (b.m.market ?? 0) - (a.m.market ?? 0),
      price_asc: (a, b) => (a.m.market ?? 0) - (b.m.market ?? 0),
      name: (a, b) => a.name.localeCompare(b.name),
    }[sortBy];
    return dir ? [...list].sort(dir) : list;
  }, [items, search, sortBy, filterTrend]);

  if (items.length === 0) {
    return <EmptyState icon={<Star size={56} style={{ opacity: 0.35 }} />} title="Watchlist ist leer" hint="Füge Karten über »⭐ Merken« in der Entdecken-Ansicht hinzu." />;
  }

  const addedValue = watchlist.reduce((s, w) => s + (w.addedPrice || 0), 0);
  const currentValue = items.reduce((s, w) => s + (currentById.get(w.id) ?? w.m.market ?? 0), 0);
  const delta = currentValue - addedValue;
  const deltaPct = addedValue > 0 ? (delta / addedValue) * 100 : null;
  const risers = items.filter((c) => c.m.trend === 'rising').length;

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginBottom: 18 }}>
        <Stat label="🃏 Karten" value={items.length} color={C.textSoft} />
        <Stat label="Wert beim Merken" value={fmtEur(addedValue, 0)} color={C.blue} />
        <Stat label="Aktueller Marktwert" value={fmtEur(currentValue, 0)} color={C.text} />
        <Stat label="Δ seit Merken" value={`${delta >= 0 ? '+' : ''}${fmtEur(delta, 0)}`} color={delta >= 0 ? C.green : C.red} sub={deltaPct != null ? fmtPct(deltaPct) : undefined} />
        <Stat label="Im Aufwärtstrend" value={`${risers}/${items.length}`} color={C.green2} />
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
          <input className="control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="In der Watchlist suchen…" style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
        </div>
        <select className="control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="added">↕ Zuletzt gemerkt</option>
          <option value="score">↕ Score</option>
          <option value="change30">↕ Veränderung 30T</option>
          <option value="price_desc">↕ Preis ↓</option>
          <option value="price_asc">↕ Preis ↑</option>
          <option value="name">↕ Name A–Z</option>
        </select>
        <select className="control" value={filterTrend} onChange={(e) => setFilterTrend(e.target.value)}>
          <option value="all">Alle Trends</option>
          <option value="rising">↑ Steigend</option>
          <option value="stable">→ Stabil</option>
          <option value="falling">↓ Fallend</option>
        </select>
      </div>

      <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 12 }}>{shown.length} von {items.length} Karten</div>

      {shown.length === 0
        ? <EmptyState icon="🔍" title="Keine Karten gefunden" hint="Anderen Suchbegriff oder Filter probieren." />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))', gap: 14 }}>
            {shown.map((card) => <CardTile key={card.id} card={card} onOpen={onOpen} />)}
          </div>}
    </div>
  );
}
