import { X } from 'lucide-react';
import { useDialog } from '../lib/useDialog.js';
import { useStore } from '../store.jsx';
import { C, riskLabel, trendIcon, trendLabel } from '../lib/theme.js';
import { fmtEur, fmtPct } from '../lib/format.js';
import { ScoreBadge } from './ui.jsx';
import { cmUrl } from '../lib/marketLinks.js';

const ROWS = [
  { label: 'Investment-Score', get: (c) => c.m.score, fmt: (v) => v, best: 'max' },
  { label: 'Tier', get: (c) => c.m.tier.l, fmt: (v) => v, best: null },
  { label: 'Marktpreis', get: (c) => c.m.market, fmt: fmtEur, best: 'min' },
  { label: 'Günstigstes Angebot', get: (c) => c.prices.low, fmt: fmtEur, best: 'min' },
  { label: 'Veränderung 7T', get: (c) => c.m.change7, fmt: (v) => fmtPct(v), best: 'max' },
  { label: 'Veränderung 30T', get: (c) => c.m.change30, fmt: (v) => fmtPct(v), best: 'max' },
  { label: 'Marge Low→Trend', get: (c) => c.m.margin, fmt: (v) => fmtPct(v), best: 'max' },
  { label: 'Trend', get: (c) => c.m.trend, fmt: (v) => `${trendIcon(v)} ${trendLabel(v)}`, best: null },
  { label: 'Risiko', get: (c) => c.m.risk, fmt: (v) => riskLabel(v), best: null },
  { label: 'Seltenheit', get: (c) => c.rarity, fmt: (v) => v || '–', best: null },
  { label: 'Jahr', get: (c) => c.year, fmt: (v) => v || '–', best: null },
];

export default function CompareModal({ onClose }) {
  const dialogRef = useDialog(onClose);
  const { compareList, toggleCompare, clearCompare } = useStore();
  if (compareList.length === 0) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label="Karten vergleichen" onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 920, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 20, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>⚖️ Karten-Vergleich</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 16 }}>Beste Werte sind grün hervorgehoben</div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${C.lineStrong}`, color: C.textFaint, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', minWidth: 150 }}>Metrik</th>
                {compareList.map((c) => (
                  <th key={c.id} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${C.lineStrong}`, minWidth: 170 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <ScoreBadge tier={c.m.tier} score={c.m.score} />
                      <button onClick={() => toggleCompare(c)} style={{ background: '#ff525215', border: '1px solid #ff525230', color: C.red, borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#dcdcec' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>{c.set}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const vals = compareList.map(row.get);
                const nums = vals.filter((v) => typeof v === 'number');
                const best = row.best === 'max' ? Math.max(...nums) : row.best === 'min' ? Math.min(...nums) : null;
                return (
                  <tr key={row.label} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: '10px 8px', color: C.textDim, fontWeight: 600 }}>{row.label}</td>
                    {compareList.map((c, i) => {
                      const v = vals[i];
                      const isBest = best != null && typeof v === 'number' && v === best && compareList.length > 1;
                      return (
                        <td key={c.id} style={{ padding: '10px 8px', fontWeight: isBest ? 800 : 600, color: isBest ? C.green : '#dcdcec', background: isBest ? '#00e67610' : 'transparent' }}>
                          {row.fmt(v)} {isBest && <span style={{ fontSize: 10 }}>👑</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <td style={{ padding: '12px 8px', color: C.textDim, fontWeight: 700 }}>Cardmarket</td>
                {compareList.map((c) => (
                  <td key={c.id} style={{ padding: '12px 8px' }}>
                    <a href={cmUrl(c)} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>🛒 Öffnen →</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={clearCompare} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ff525230', background: '#ff525210', color: C.red, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Alle entfernen</button>
          <button className="btn-primary" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
