import { Briefcase, Trash2, Info } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtPct, fmtDate } from '../lib/format.js';
import { getTier } from '../lib/metrics.js';
import { marketLinks } from '../lib/marketLinks.js';
import { CardImage, ScoreBadge, Stat, EmptyState } from './ui.jsx';

export default function PortfolioView() {
  const { portfolio, removeFromPortfolio, freshPrice, settings } = useStore();

  if (portfolio.length === 0) {
    return <EmptyState icon={<Briefcase size={56} style={{ opacity: 0.35 }} />} title="Portfolio ist leer" hint="Klicke bei einer Karte auf »💼 Kauf«, um sie hier zu verfolgen." />;
  }

  const invested = portfolio.reduce((s, e) => s + (e.actualBuyPrice || 0), 0);
  const marketValue = portfolio.reduce((s, e) => s + (freshPrice(e) || 0), 0);
  const pnl = marketValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : null;

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label="Karten" value={portfolio.length} color={C.textSoft} />
        <Stat label="Investiert" value={fmtEur(invested, 0)} color={C.blue} />
        <Stat label="Marktwert" value={fmtEur(marketValue, 0)} color={C.text} />
        <Stat label="Unrealisierter G/V" value={`${pnl >= 0 ? '+' : ''}${fmtEur(pnl, 0)}`} color={pnl >= 0 ? C.green : C.red} sub={pnlPct != null ? fmtPct(pnlPct) : undefined} />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 16px', marginBottom: 16, fontSize: 11.5, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Info size={14} style={{ flexShrink: 0, color: C.blue }} />
        <span>Unrealisierter Gewinn/Verlust = aktueller Marktwert minus dein Kaufpreis. Der Marktwert aktualisiert sich beim nächsten Live-Abruf.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {portfolio.map((e) => {
          const card = e.card;
          const current = freshPrice(e);
          const unreal = (current || 0) - (e.actualBuyPrice || 0);
          const unrealPct = e.actualBuyPrice ? (unreal / e.actualBuyPrice) * 100 : null;
          const tier = getTier(card.m?.score ?? 0);
          const links = marketLinks(card);
          return (
            <div key={e.id} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -9, right: 12 }}><ScoreBadge tier={tier} score={card.m?.score ?? 0} /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 10 }}>
                <CardImage card={card} height={108} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, paddingRight: 40 }}>{card.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{card.set}</div>
                  <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 4 }}>gekauft am {fmtDate(e.purchaseDate)}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                <div style={{ background: '#ffffff08', borderRadius: 7, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: C.textFaint }}>Eingekauft</div>
                  <div style={{ fontWeight: 700, color: C.blue, fontSize: 14 }}>{fmtEur(e.actualBuyPrice)}</div>
                </div>
                <div style={{ background: '#ffffff08', borderRadius: 7, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: C.textFaint }}>Aktuell</div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fmtEur(current)}</div>
                </div>
              </div>
              <div style={{ background: unreal >= 0 ? '#00e67615' : '#ff525215', border: `1px solid ${unreal >= 0 ? '#00e67630' : '#ff525230'}`, borderRadius: 7, padding: '8px 10px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: C.textSoft }}>Unrealisierter G/V</span>
                <span style={{ fontWeight: 800, color: unreal >= 0 ? C.green : C.red }}>{unreal >= 0 ? '+' : ''}{fmtEur(unreal)}{unrealPct != null ? ` (${fmtPct(unrealPct)})` : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
                <a href={card.cardmarketUrl || links.cardmarket} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 11, fontWeight: 700, background: '#0066cc1f', color: C.blue, border: '1px solid #0066cc44' }}>🛒 Cardmarket</a>
                <a href={links.ebay} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 11, fontWeight: 700, background: '#3a3a8c2f', color: '#8a8aff', border: '1px solid #3a3a8c66' }}>🛒 Verkaufen</a>
              </div>
              <button onClick={() => removeFromPortfolio(e.id)} style={{ width: '100%', padding: 7, borderRadius: 6, border: '1px solid #ff525230', background: '#ff525210', color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Trash2 size={11} /> Entfernen
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
