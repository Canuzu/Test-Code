import { useMemo } from 'react';
import { Star } from 'lucide-react';
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
        <Stat label="🃏 Karten" value={items.length} color={C.textSoft} />
        <Stat label="Wert beim Merken" value={fmtEur(addedValue, 0)} color={C.blue} />
        <Stat label="Aktueller Marktwert" value={fmtEur(currentValue, 0)} color={C.text} />
        <Stat label="Δ seit Merken" value={`${delta >= 0 ? '+' : ''}${fmtEur(delta, 0)}`} color={delta >= 0 ? C.green : C.red} sub={deltaPct != null ? fmtPct(deltaPct) : undefined} />
        <Stat label="Im Aufwärtstrend" value={`${risers}/${items.length}`} color={C.green2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {items.map((card) => <CardTile key={card.id} card={card} onOpen={onOpen} />)}
      </div>
    </div>
  );
}
