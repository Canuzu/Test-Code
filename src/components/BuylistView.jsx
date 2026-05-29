import { useState, useMemo, useRef } from 'react';
import { Printer, Download, Search, Sliders } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur } from '../lib/format.js';
import { CardImage } from './ui.jsx';

const CONDITIONS = ['NM', 'EX', 'GD', 'LP', 'PL'];
const COND_FACTOR = { NM: 1.0, EX: 0.85, GD: 0.70, LP: 0.55, PL: 0.40 };

export default function BuylistView() {
  const { cards } = useStore();
  const [buyPct, setBuyPct] = useState(40);
  const [minPrice, setMinPrice] = useState(5);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('NM');
  const [sortBy, setSortBy] = useState('price_desc');
  const printRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cards
      .filter((c) => (c.m.market ?? 0) >= minPrice)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q))
      .sort((a, b) => sortBy === 'price_desc'
        ? (b.m.market ?? 0) - (a.m.market ?? 0)
        : a.name.localeCompare(b.name))
      .map((c) => ({
        ...c,
        buyPrice: (c.m.market ?? 0) * (buyPct / 100) * COND_FACTOR[condition],
      }));
  }, [cards, buyPct, minPrice, search, condition, sortBy]);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #buylist-print { display: block !important; position: fixed; inset: 0; background: #fff; color: #000; padding: 20px; }
        #buylist-print table { width: 100%; border-collapse: collapse; font-size: 11px; }
        #buylist-print th, #buylist-print td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
        #buylist-print th { background: #f5f5f5; }
        #buylist-print .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleCSV = () => {
    const head = ['Name', 'Set', 'Seltenheit', 'Marktpreis', `Ankauf ${condition} (${buyPct}%)`];
    const rows = filtered.map((c) => [
      `"${c.name}"`, `"${c.set}"`, `"${c.rarity}"`,
      c.m.market?.toFixed(2) ?? '', c.buyPrice.toFixed(2),
    ].join(','));
    const csv = [head.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `ankauf_${condition}_${buyPct}pct_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fade-in">
      {/* Controls */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>
              Ankaufskurs: <strong style={{ color: C.gold }}>{buyPct}%</strong> vom Marktpreis
            </div>
            <input type="range" min={10} max={80} step={5} value={buyPct} onChange={(e) => setBuyPct(+e.target.value)}
              style={{ width: '100%', accentColor: C.gold }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textFaint }}>
              <span>10%</span><span>80%</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Zustand</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {CONDITIONS.map((c) => (
                <button key={c} onClick={() => setCondition(c)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${condition === c ? C.gold : C.lineStrong}`, background: condition === c ? '#ffd70020' : 'transparent', color: condition === c ? C.gold : C.textDim, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Min. Marktpreis</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: C.textDim }}>€</span>
              <input type="number" min={0} step={1} value={minPrice} onChange={(e) => setMinPrice(+e.target.value)}
                className="control" style={{ width: 70 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button onClick={handlePrint} style={actionBtn('#448aff')}><Printer size={14} /> Drucken</button>
            <button onClick={handleCSV}   style={actionBtn(C.green2)}><Download size={14} /> CSV</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
            <input className="control" placeholder="Karte suchen…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 30 }} />
          </div>
          <select className="control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price_desc">Preis ↓</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 12 }}>
        <strong style={{ color: C.text }}>{filtered.length}</strong> Karten ·
        Ø Ankauf: <strong style={{ color: C.gold }}>{fmtEur(filtered.reduce((s, c) => s + c.buyPrice, 0) / (filtered.length || 1))}</strong> ·
        Kondition: <strong style={{ color: C.text }}>{condition}</strong> ({Math.round(COND_FACTOR[condition] * 100)}% Abzug) ·
        {buyPct}% vom Trend
      </div>

      {/* Printable table */}
      <div id="buylist-print" ref={printRef}>
        <div className="no-print" style={{ display: 'none' }} />
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>KartenwertDE – Ankaufspreisliste</strong>
          <span style={{ fontSize: 11, color: C.textFaint }}>{new Date().toLocaleDateString('de-DE')} · Zustand: {condition} · {buyPct}% des Marktpreises</span>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '48px 2.5fr 1fr 1fr 1fr', gap: 8, padding: '8px 14px', background: C.bg2, fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase' }}>
            <div></div><div>Karte</div><div style={{ textAlign: 'right' }}>Marktpreis</div><div style={{ textAlign: 'right' }}>Ankauf ({condition})</div><div style={{ textAlign: 'right' }}>Ankauf NM</div>
          </div>
          {filtered.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: C.textFaint }}>Keine Karten gefunden.</div>
            : filtered.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '48px 2.5fr 1fr 1fr 1fr', gap: 8, padding: '9px 14px', alignItems: 'center', borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                <CardImage card={c} height={42} radius={4} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{c.set}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{fmtEur(c.m.market)}</div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: C.gold, fontSize: 14 }}>{fmtEur(c.buyPrice)}</div>
                <div style={{ textAlign: 'right', fontSize: 11, color: C.textFaint }}>{fmtEur((c.m.market ?? 0) * (buyPct / 100))}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

const actionBtn = (color) => ({
  padding: '8px 14px', borderRadius: 8, border: `1px solid ${color}40`,
  background: `${color}15`, color, cursor: 'pointer', fontSize: 12, fontWeight: 700,
  display: 'flex', alignItems: 'center', gap: 6,
});
