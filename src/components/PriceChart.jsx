import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtPct } from '../lib/format.js';
import { buildSeries, RANGES } from '../lib/priceHistory.js';

// Interactive 1–12 month price-history chart. Combines the deterministic
// modelled curve (anchored to real Cardmarket aggregates) with any real
// observations the app has accumulated over time in localStorage.
export default function PriceChart({ card, defaultRange = '6M', height = 220 }) {
  const { getPriceHistory } = useStore();
  const [range, setRange] = useState(defaultRange);
  const months = RANGES.find((r) => r.id === range)?.months ?? 6;
  const real = getPriceHistory ? getPriceHistory(card.id) : [];

  const { points, summary } = useMemo(
    () => buildSeries(card, months, real),
    [card, months, real],
  );

  if (!summary) {
    return <div style={{ color: C.textFaint, fontSize: 12, padding: 24, textAlign: 'center' }}>Nicht genug Daten für einen Verlauf.</div>;
  }

  const up = (summary.changePct ?? 0) >= 0;
  const stroke = up ? C.green : C.red;
  const gid = `pc-${card.id}-${range}`;
  const tickEvery = Math.ceil(points.length / 6);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{fmtEur(summary.last)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: stroke }}>{up ? '▲' : '▼'} {fmtPct(summary.changePct)}</span>
          <span style={{ fontSize: 11, color: C.textFaint }}>im Zeitraum</span>
        </div>
        <div style={{ display: 'flex', gap: 3, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 3 }}>
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              style={{ padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: range === r.id ? '#ffd70022' : 'transparent', color: range === r.id ? C.gold : C.textFaint }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: C.bg1, borderRadius: 10, padding: '12px 6px 4px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={points} margin={{ top: 6, right: 12, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.lineStrong} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 10 }} interval={tickEvery} minTickGap={16} />
            <YAxis tick={{ fill: C.textDim, fontSize: 10 }} domain={['auto', 'auto']} width={46} tickFormatter={(v) => `€${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)}`} />
            <Tooltip
              contentStyle={{ background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.textFaint }}
              formatter={(v, _n, item) => [fmtEur(v) + (item?.payload?.real ? '  · gemessen' : ''), 'Preis']}
            />
            <ReferenceLine y={summary.max} stroke={C.textGhost} strokeDasharray="2 4" />
            <ReferenceLine y={summary.min} stroke={C.textGhost} strokeDasharray="2 4" />
            <Area type="monotone" dataKey="price" stroke={stroke} strokeWidth={2.4} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4, fill: stroke }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 11, color: C.textFaint }}>
        <span>Hoch <strong style={{ color: C.textSoft }}>{fmtEur(summary.max)}</strong> · Tief <strong style={{ color: C.textSoft }}>{fmtEur(summary.min)}</strong></span>
        <span>
          {summary.realCount >= 2
            ? `${summary.realCount} gemessene Punkte`
            : 'Verlauf modelliert (an echten Ø-Werten verankert) — gemessene Punkte kommen täglich hinzu'}
        </span>
      </div>
    </div>
  );
}
