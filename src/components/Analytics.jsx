import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, rarityColor } from '../lib/theme.js';
import { fmtEur, fmtNum, fmtPct } from '../lib/format.js';
import { Stat, EmptyState, ChangeBadge } from './ui.jsx';

const panelTitle = { fontWeight: 700, fontSize: 13, marginBottom: 12 };

// Built per-render (not module scope) so theme changes are picked up.
const makePanel = () => ({ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 });
const makeTip = () => ({ background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8 });

export default function Analytics({ onOpen, pro, onUpgrade }) {
  const { cards } = useStore();
  const panel = makePanel();
  const tip = makeTip();

  if (cards.length === 0) {
    return <EmptyState icon={<BarChart3 size={56} style={{ opacity: 0.35 }} />} title="Noch keine Daten" hint="Lade zuerst Karten in der Entdecken-Ansicht." />;
  }

  const n = cards.length;
  const avgScore = fmtNum(cards.reduce((s, c) => s + c.m.score, 0) / n, 1);
  const change30Vals = cards.map((c) => c.m.change30).filter((v) => v != null);
  const avgChange30 = change30Vals.length ? change30Vals.reduce((s, v) => s + v, 0) / change30Vals.length : null;
  const risers = cards.filter((c) => c.m.trend === 'rising').length;
  const fallers = cards.filter((c) => c.m.trend === 'falling').length;
  const totalValue = cards.reduce((s, c) => s + (c.m.market || 0), 0);

  const tierData = ['S', 'A', 'B', 'C', 'D', 'F'].map((l) => ({
    name: l,
    count: cards.filter((c) => c.m.tier.l === l).length,
    fill: cards.find((c) => c.m.tier.l === l)?.m.tier.c || C.textFaint,
  })).filter((d) => d.count > 0);

  const rarityCounts = cards.reduce((acc, c) => {
    const key = c.rarity || 'Sonstige';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const rarityData = Object.entries(rarityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  const trendData = [
    { name: 'Steigend', value: risers, fill: C.green },
    { name: 'Stabil', value: cards.filter((c) => c.m.trend === 'stable').length, fill: C.gold },
    { name: 'Fallend', value: fallers, fill: C.red },
  ];

  const scatter = cards.map((c) => ({ price: c.m.market, change: c.m.change30 ?? 0, name: c.name, fill: c.m.tier.c }));

  const byChange = [...cards].filter((c) => c.m.change30 != null).sort((a, b) => b.m.change30 - a.m.change30);
  const topGainers = byChange.slice(0, 5);
  const topLosers = byChange.slice(-5).reverse();

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        <Stat label="Karten" value={n} color={C.textSoft} />
        <Stat label="Ø Investment-Score" value={avgScore} color={C.gold} />
        <Stat label="Ø Veränderung 30T" value={fmtPct(avgChange30)} color={avgChange30 >= 0 ? C.green : C.red} />
        <Stat label="Steiger / Faller" value={`${risers} / ${fallers}`} color={C.green2} />
        <Stat label="Gesamt-Marktwert" value={fmtEur(totalValue, 0)} color={C.blue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div style={panel}>
          <div style={panelTitle}>🏆 Tier-Verteilung</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tierData}>
              <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 11 }} />
              <YAxis tick={{ fill: C.textDim, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tip} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="count" name="Karten" radius={[6, 6, 0, 0]}>{tierData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={panel}>
          <div style={panelTitle}>🎨 Seltenheits-Mix</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={rarityData} cx="50%" cy="50%" outerRadius={72} dataKey="value" nameKey="name">
                {rarityData.map((d, i) => <Cell key={i} fill={rarityColor(d.name)} />)}
              </Pie>
              <Tooltip contentStyle={tip} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={panel}>
          <div style={panelTitle}>📊 Trend-Verteilung</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} layout="vertical">
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textDim, fontSize: 11 }} width={70} />
              <Tooltip contentStyle={tip} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="value" name="Karten" radius={[0, 6, 6, 0]}>{trendData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={panel}>
          <div style={panelTitle}>💎 Preis vs. 30-Tage-Veränderung</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 6, right: 12, left: -6, bottom: 0 }}>
              <CartesianGrid stroke={C.lineStrong} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="price" name="Preis" unit="€" tick={{ fill: C.textDim, fontSize: 11 }} />
              <YAxis type="number" dataKey="change" name="Δ30T" unit="%" tick={{ fill: C.textDim, fontSize: 11 }} width={42} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const d = payload[0].payload;
                  return <div style={{ ...tip, padding: 8, fontSize: 11 }}><div style={{ fontWeight: 700, color: C.gold }}>{d.name}</div><div style={{ color: C.textSoft }}>{fmtEur(d.price)} · {fmtPct(d.change)} (30T)</div></div>;
                }
                return null;
              }} />
              <Scatter data={scatter}>{scatter.map((d, i) => <Cell key={i} fill={d.fill} />)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <MoverList title="🚀 Größte Gewinner (30T)" cards={topGainers} onOpen={onOpen} />
        <MoverList title="📉 Größte Verlierer (30T)" cards={topLosers} onOpen={onOpen} />
      </div>

      {/* Pro-gated advanced analytics */}
      <div style={{ marginTop: 14 }}>
        {pro ? (
          <div style={panel}>
            <div style={panelTitle}>👑 Pro-Insight · Markt-Konzentration</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <Stat label="Top-5 Wertanteil" value={fmtPct((([...cards].sort((a, b) => (b.m.market || 0) - (a.m.market || 0)).slice(0, 5).reduce((s, c) => s + (c.m.market || 0), 0)) / (totalValue || 1)) * 100, 0, false)} color={C.gold} />
              <Stat label="Premium-Karten (≥100 €)" value={cards.filter((c) => (c.m.market || 0) >= 100).length} color={C.orange} />
              <Stat label="S/A-Tier-Anteil" value={fmtPct((cards.filter((c) => c.m.tier.l === 'S' || c.m.tier.l === 'A').length / n) * 100, 0, false)} color={C.pink} />
              <Stat label="Ø Marge (Low→Trend)" value={fmtPct(cards.map((c) => c.m.margin).filter((v) => v != null).reduce((s, v, _i, a) => s + v / a.length, 0))} color={C.blue} />
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, marginTop: 10 }}>Konzentration & Qualität des aktuell geladenen Marktausschnitts – nützlich zur Risikoeinschätzung beim Einkauf.</div>
          </div>
        ) : (
          <div style={{ ...panel, textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>👑 Erweiterte Analytics</div>
            <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 14 }}>Markt-Konzentration, Premium-Anteil, Qualitäts- und Margen-Kennzahlen – im Pro-Plan.</div>
            <button className="btn-primary" onClick={onUpgrade}>Pro freischalten</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MoverList({ title, cards, onOpen }) {
  const panel = makePanel();
  return (
    <div style={panel}>
      <div style={panelTitle}>{title}</div>
      {cards.map((c, i) => (
        <div key={c.id} onClick={() => onOpen(c, 'value')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderBottom: i < cards.length - 1 ? `1px solid ${C.line}` : 'none', cursor: 'pointer' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
            <div style={{ fontSize: 10.5, color: C.textFaint }}>{c.set} · {fmtEur(c.m.market)}</div>
          </div>
          <ChangeBadge value={c.m.change30} size={13} />
        </div>
      ))}
    </div>
  );
}
