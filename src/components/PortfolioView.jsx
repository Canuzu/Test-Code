import { useState } from 'react';
import { Briefcase, Trash2, Info, Tag as TagIcon } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtPct, fmtDate } from '../lib/format.js';
import { getTier } from '../lib/metrics.js';
import { marketLinks } from '../lib/marketLinks.js';
import { CardImage, ScoreBadge, Pill, Stat, EmptyState } from './ui.jsx';

export default function PortfolioView() {
  const { portfolio, sold, removeFromPortfolio, sellFromPortfolio, removeSold, freshPrice } = useStore();
  const [sellingId, setSellingId] = useState(null);
  const [sellInput, setSellInput] = useState('');

  if (portfolio.length === 0 && sold.length === 0) {
    return <EmptyState icon={<Briefcase size={56} style={{ opacity: 0.35 }} />} title="Sammlung ist leer" hint="Klicke bei einer Karte auf »📦 Kauf«, um sie in deine Sammlung aufzunehmen." />;
  }

  const qtyOf = (e) => e.quantity || 1;
  const invested = portfolio.reduce((s, e) => s + (e.actualBuyPrice || 0) * qtyOf(e), 0);
  const marketValue = portfolio.reduce((s, e) => s + (freshPrice(e) || 0) * qtyOf(e), 0);
  const pnl = marketValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : null;
  const realized = sold.reduce((s, e) => s + (e.realized || 0), 0);
  const totalCards = portfolio.reduce((s, e) => s + qtyOf(e), 0);

  const startSell = (e) => { setSellingId(e.id); setSellInput(String((freshPrice(e) ?? e.actualBuyPrice ?? 0).toFixed(2))); };
  const confirmSell = (e) => { sellFromPortfolio(e.id, sellInput); setSellingId(null); };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label="Karten" value={totalCards} color={C.textSoft} sub={portfolio.length !== totalCards ? `${portfolio.length} Positionen` : undefined} />
        <Stat label="Investiert" value={fmtEur(invested, 0)} color={C.blue} />
        <Stat label="Marktwert" value={fmtEur(marketValue, 0)} color={C.text} />
        <Stat label="Unrealisiert G/V" value={`${pnl >= 0 ? '+' : ''}${fmtEur(pnl, 0)}`} color={pnl >= 0 ? C.green : C.red} sub={pnlPct != null ? fmtPct(pnlPct) : undefined} />
        <Stat label="Realisiert (verkauft)" value={`${realized >= 0 ? '+' : ''}${fmtEur(realized, 0)}`} color={realized >= 0 ? C.green : C.red} sub={sold.length ? `${sold.length} verkauft` : undefined} />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 16px', marginBottom: 16, fontSize: 11.5, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Info size={14} style={{ flexShrink: 0, color: C.blue }} />
        <span>Unrealisiert = aktueller Marktwert minus Kaufpreis (aktualisiert sich täglich). „Verkaufen" erfasst den Verkauf und verbucht den realisierten Gewinn.</span>
      </div>

      {portfolio.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: sold.length ? 28 : 0 }}>
          {portfolio.map((e) => {
            const card = e.card;
            const qty = qtyOf(e);
            const current = freshPrice(e);
            const unreal = ((current || 0) - (e.actualBuyPrice || 0)) * qty;
            const unrealPct = e.actualBuyPrice ? (((current || 0) - e.actualBuyPrice) / e.actualBuyPrice) * 100 : null;
            const tier = getTier(card.m?.score ?? 0);
            const links = marketLinks(card);
            const selling = sellingId === e.id;
            return (
              <div key={e.id} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -9, right: 12 }}><ScoreBadge tier={tier} score={card.m?.score ?? 0} /></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 10 }}>
                  <CardImage card={card} height={108} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, paddingRight: 40 }}>{card.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{card.set}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      <Pill color={C.blue}>×{qty}</Pill>
                      <Pill color={C.purple}>{e.condition || 'NM'}</Pill>
                      {e.location && <Pill color={C.textDim}>📍 {e.location}</Pill>}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 6 }}>gekauft {fmtDate(e.purchaseDate)}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                  <div style={{ background: C.overlay, borderRadius: 7, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: C.textFaint }}>Eingekauft (Stk.)</div>
                    <div style={{ fontWeight: 700, color: C.blue, fontSize: 14 }}>{fmtEur(e.actualBuyPrice)}</div>
                  </div>
                  <div style={{ background: C.overlay, borderRadius: 7, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: C.textFaint }}>Aktuell (Stk.)</div>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fmtEur(current)}</div>
                  </div>
                </div>
                <div style={{ background: unreal >= 0 ? '#00e67615' : '#ff525215', border: `1px solid ${unreal >= 0 ? '#00e67630' : '#ff525230'}`, borderRadius: 7, padding: '8px 10px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.textSoft }}>Unrealisiert {qty > 1 ? `(${qty} Stk.)` : ''}</span>
                  <span style={{ fontWeight: 800, color: unreal >= 0 ? C.green : C.red }}>{unreal >= 0 ? '+' : ''}{fmtEur(unreal)}{unrealPct != null ? ` (${fmtPct(unrealPct)})` : ''}</span>
                </div>

                {selling ? (
                  <div style={{ background: C.bg1, border: `1px solid ${C.green2}55`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: C.green2, fontWeight: 700, marginBottom: 6 }}>Verkauf erfassen ({qty} Stk.)</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.textSoft }}>Stückpreis €</span>
                      <input type="number" step="0.01" autoFocus value={sellInput} onChange={(ev) => setSellInput(ev.target.value)}
                        style={{ flex: 1, background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: C.textFaint, margin: '6px 0 8px' }}>
                      Realisiert: <strong style={{ color: ((Number(sellInput) || 0) - (e.actualBuyPrice || 0)) >= 0 ? C.green : C.red }}>
                        {(((Number(sellInput) || 0) - (e.actualBuyPrice || 0)) * qty >= 0 ? '+' : '')}{fmtEur(((Number(sellInput) || 0) - (e.actualBuyPrice || 0)) * qty)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-primary" style={{ flex: 1, padding: 7, fontSize: 12 }} onClick={() => confirmSell(e)}>Verkauf buchen</button>
                      <button onClick={() => setSellingId(null)} style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontSize: 12, cursor: 'pointer' }}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
                      <a href={card.cardmarketUrl || links.cardmarket} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 11, fontWeight: 700, background: '#0066cc1f', color: C.blue, border: '1px solid #0066cc44' }}>🛒 Cardmarket</a>
                      <a href={links.ebay} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 11, fontWeight: 700, background: '#3a3a8c2f', color: '#8a8aff', border: '1px solid #3a3a8c66' }}>🛒 eBay</a>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <button onClick={() => startSell(e)} style={{ padding: 7, borderRadius: 6, border: `1px solid ${C.green2}40`, background: `${C.green2}18`, color: C.green2, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>💰 Verkaufen</button>
                      <button onClick={() => removeFromPortfolio(e.id)} style={{ padding: 7, borderRadius: 6, border: '1px solid #ff525230', background: '#ff525210', color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <Trash2 size={11} /> Entfernen
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sold.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TagIcon size={14} style={{ color: C.textFaint }} /> Verkaufshistorie
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {[...sold].sort((a, b) => b.soldDate - a.soldDate).map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < sold.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.card?.name} <span style={{ color: C.textFaint, fontWeight: 500 }}>×{e.quantity || 1}</span></div>
                  <div style={{ fontSize: 10.5, color: C.textFaint }}>{fmtEur(e.actualBuyPrice)} → {fmtEur(e.sellPrice)} · verkauft {fmtDate(e.soldDate)}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: (e.realized || 0) >= 0 ? C.green : C.red, whiteSpace: 'nowrap' }}>{(e.realized || 0) >= 0 ? '+' : ''}{fmtEur(e.realized)}</div>
                <button onClick={() => removeSold(e.id)} title="Aus Historie löschen" style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', padding: 4, display: 'flex' }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
