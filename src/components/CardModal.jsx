import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { X, Info, TrendingUp, Calculator, Tag as TagIcon } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, riskColor, riskLabel, rarityColor, trendColor, trendIcon, trendLabel } from '../lib/theme.js';
import { fmtEur, fmtNum, fmtPct, fmtDate } from '../lib/format.js';
import { calcNet, PLATFORM_FEES } from '../lib/fees.js';
import { marketLinks } from '../lib/marketLinks.js';
import { CardImage, Pill, ChangeBadge, ScoreBadge, Spark } from './ui.jsx';

const mpBtn = (color) => ({
  padding: '10px', borderRadius: 8, textAlign: 'center', textDecoration: 'none',
  fontSize: 12, fontWeight: 700, background: color + '1f', color, border: `1px solid ${color}44`,
  cursor: 'pointer', display: 'block',
});

const sectionLabel = { fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

export default function CardModal({ card, initialTab = 'overview', onClose }) {
  const { notes, tags, settings, addToPortfolio, saveNote, addTag, removeTag } = useStore();
  const addMode = initialTab === 'buy';
  const [tab, setTab] = useState(addMode ? 'overview' : initialTab);
  const [noteText, setNoteText] = useState(notes[card.id] || '');
  const [newTag, setNewTag] = useState('');
  const [buyPrice, setBuyPrice] = useState(String(card.prices.low ?? card.prices.market ?? ''));

  const m = card.m;
  const p = card.prices;
  const links = marketLinks(card);
  const cardTags = tags[card.id] || [];

  const labeled = [
    { k: 'Ø 30T', v: p.avg30 },
    { k: 'Ø 7T', v: p.avg7 },
    { k: 'Gestern', v: p.avg1 },
    { k: 'Trend', v: p.trend ?? p.market },
  ].filter((x) => x.v != null);

  const TabBtn = ({ id, label, icon }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '9px 14px', border: 'none', background: tab === id ? '#ffd70015' : 'transparent',
      color: tab === id ? C.gold : C.textFaint, borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
      cursor: 'pointer', fontWeight: tab === id ? 700 : 500, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5,
    }}>{icon}{label}</button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 660, width: '100%', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><X size={15} /></button>

        {/* Header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', gap: 14 }}>
          <CardImage card={card} height={120} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ScoreBadge tier={m.tier} score={m.score} size="lg" />
              <span style={{ fontSize: 11, color: C.textFaint }}>{m.tier.n}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.25, paddingRight: 32 }}>{card.name}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>{card.set}{card.cardType ? ` · ${card.cardType}` : ''}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {card.rarity && <Pill color={rarityColor(card.rarity)}>{card.rarity}</Pill>}
              <Pill color={riskColor(m.risk)}>{riskLabel(m.risk)}es Risiko</Pill>
              <Pill color={trendColor(m.trend)}>{trendIcon(m.trend)} {trendLabel(m.trend)}</Pill>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.lineStrong}`, padding: '6px 12px 0', marginTop: 14, overflowX: 'auto' }}>
          <TabBtn id="overview" label="Übersicht" icon={<Info size={12} />} />
          <TabBtn id="value" label="Wertentwicklung" icon={<TrendingUp size={12} />} />
          <TabBtn id="fees" label="Gebühren" icon={<Calculator size={12} />} />
          <TabBtn id="notes" label="Notizen" icon={<TagIcon size={12} />} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {tab === 'overview' && (
            <>
              {addMode && (
                <div style={{ background: '#34d39912', border: '1px solid #34d39930', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: C.green2, fontWeight: 700, marginBottom: 8 }}>💼 Ins Portfolio aufnehmen</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: C.textSoft }}>Tatsächlich gezahlt: €</span>
                    <input type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                      style={{ flex: 1, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 10px', color: C.text, fontSize: 13, outline: 'none' }} />
                    <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => { addToPortfolio(card, buyPrice); onClose(); }}>Hinzufügen</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                {[
                  ['Marktpreis', fmtEur(m.market), C.text],
                  ['Günstigste', fmtEur(p.low), C.blue],
                  ['Ø Verkauf', fmtEur(p.averageSell), C.textSoft],
                  ['Beliebtheit', `${fmtNum(m.popularity, 1)}/10`, C.gold],
                ].map(([l, v, col]) => (
                  <div key={l} style={{ textAlign: 'center', padding: '9px 4px', background: '#ffffff08', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontWeight: 800, color: col, fontSize: 14 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', background: C.bg1, borderRadius: 10, padding: 12 }}>
                <Spark series={labeled.map((x, i) => ({ i, v: x.v }))} width={120} height={44} />
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><div style={{ fontSize: 10, color: C.textFaint }}>7 Tage</div><ChangeBadge value={m.change7} size={14} /></div>
                  <div><div style={{ fontSize: 10, color: C.textFaint }}>30 Tage</div><ChangeBadge value={m.change30} size={14} /></div>
                </div>
              </div>

              <div style={{ background: C.bg1, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <div style={sectionLabel}>📊 Einschätzung</div>
                <div style={{ fontSize: 13, color: '#dcdcec', lineHeight: 1.6 }}>{thesis(card)}</div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8 }}>
                  Beliebtheit ist ein berechneter Index (Seltenheit, Preisniveau, Momentum) – kein gemessenes Verkaufsvolumen.
                </div>
              </div>

              <div>
                <div style={sectionLabel}>🛒 Direkt zum Marktplatz</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <a href={card.cardmarketUrl || links.cardmarket} target="_blank" rel="noopener noreferrer" style={mpBtn('#0066cc')}>🛒 Cardmarket →</a>
                  <a href={links.ebay} target="_blank" rel="noopener noreferrer" style={mpBtn('#3a3a8c')}>🛒 eBay Deutschland →</a>
                  <a href={links.priceCharting} target="_blank" rel="noopener noreferrer" style={mpBtn('#7c3aed')}>📊 PriceCharting →</a>
                  <a href={links.psa} target="_blank" rel="noopener noreferrer" style={mpBtn('#ec4899')}>🏆 PSA Population →</a>
                </div>
              </div>
            </>
          )}

          {tab === 'value' && (
            <>
              <div style={sectionLabel}>📈 Preisverlauf (Cardmarket-Durchschnitte → Trend)</div>
              <div style={{ background: C.bg1, borderRadius: 10, padding: '14px 8px 6px', marginBottom: 14 }}>
                {labeled.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={labeled} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke={C.lineStrong} strokeDasharray="3 3" />
                      <XAxis dataKey="k" tick={{ fill: C.textDim, fontSize: 11 }} />
                      <YAxis tick={{ fill: C.textDim, fontSize: 11 }} domain={['auto', 'auto']} width={48} tickFormatter={(v) => `€${v}`} />
                      <Tooltip contentStyle={{ background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8 }} formatter={(v) => [fmtEur(v), 'Preis']} />
                      <Line type="monotone" dataKey="v" stroke={C.gold} strokeWidth={2.5} dot={{ r: 4, fill: C.gold }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: C.textFaint, fontSize: 12, padding: 20, textAlign: 'center' }}>Nicht genug Verlaufsdaten.</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: C.bg1, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Veränderung 7 Tage</div>
                  <ChangeBadge value={m.change7} size={18} />
                </div>
                <div style={{ background: C.bg1, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Veränderung 30 Tage</div>
                  <ChangeBadge value={m.change30} size={18} />
                </div>
              </div>

              <div style={sectionLabel}>Alle Preispunkte</div>
              <div style={{ background: C.bg1, borderRadius: 10, padding: 4 }}>
                {[
                  ['Trend-Preis (aktuell)', p.trend],
                  ['Ø Verkaufspreis', p.averageSell],
                  ['Ø 1 Tag', p.avg1],
                  ['Ø 7 Tage', p.avg7],
                  ['Ø 30 Tage', p.avg30],
                  ['Günstigstes Angebot', p.low],
                ].map(([l, v], i) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: i < 5 ? `1px solid ${C.line}` : 'none', fontSize: 12.5 }}>
                    <span style={{ color: C.textDim }}>{l}</span>
                    <span style={{ fontWeight: 700 }}>{fmtEur(v)}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 10 }}>
                Marge günstigstes Angebot → Trend: <strong style={{ color: m.margin >= 0 ? C.green : C.red }}>{fmtPct(m.margin)}</strong>
                {p.updatedAt ? ` · Datenstand ${p.updatedAt}` : ''}
              </div>
            </>
          )}

          {tab === 'fees' && (
            <>
              <div style={sectionLabel}>💸 Echter Gewinn nach Gebühren (Kauf günstigstes Angebot → Verkauf zum Trend)</div>
              {Object.entries(PLATFORM_FEES).map(([key, plat]) => {
                const net = calcNet(p.trend ?? m.market, p.low ?? m.market, key, settings.includeShipping);
                return (
                  <div key={key} style={{ background: C.bg1, border: `1px solid ${plat.color}30`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: plat.color }}>{plat.label}</span>
                      <span style={{ fontSize: 11, color: C.textFaint }}>{(plat.commission * 100).toFixed(2)} % Gebühr · {fmtEur(net.shipping)} Versand</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: net.netProfit >= 0 ? '#00e67615' : '#ff525215', borderRadius: 7, border: `1px solid ${net.netProfit >= 0 ? '#00e67630' : '#ff525230'}` }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Netto-Gewinn pro Karte</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: net.netProfit >= 0 ? C.green : C.red }}>{net.netProfit >= 0 ? '+' : ''}{fmtEur(net.netProfit)} ({fmtPct(net.netRoi)})</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>
                Annahme: Du kaufst zum günstigsten Angebot ({fmtEur(p.low)}) und verkaufst zum Trend-Preis ({fmtEur(p.trend ?? m.market)}).
              </div>
            </>
          )}

          {tab === 'notes' && (
            <>
              <div style={sectionLabel}>🏷 Tags</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                {cardTags.map((t) => (
                  <span key={t} style={{ padding: '4px 10px', borderRadius: 20, background: '#c084fc20', color: C.purple, border: '1px solid #c084fc40', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    #{t}<button onClick={() => removeTag(card.id, t)} style={{ background: 'none', border: 'none', color: C.purple, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
                {cardTags.length === 0 && <span style={{ fontSize: 11, color: C.textFaint, fontStyle: 'italic' }}>Noch keine Tags</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addTag(card.id, newTag); setNewTag(''); } }}
                  placeholder="z.B. weihnachten, psa-grading, langzeit…"
                  style={{ flex: 1, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 12, outline: 'none' }} />
                <button onClick={() => { addTag(card.id, newTag); setNewTag(''); }} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#c084fc20', color: C.purple, fontWeight: 700, fontSize: 12 }}>+ Tag</button>
              </div>
              <div style={sectionLabel}>📝 Persönliche Notiz</div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} onBlur={() => saveNote(card.id, noteText)}
                placeholder="Eigene Beobachtungen, Kaufdetails, Strategien…"
                style={{ width: '100%', minHeight: 120, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
              <div style={{ fontSize: 10, color: C.textGhost, marginTop: 4, textAlign: 'right' }}>Wird beim Klick außerhalb gespeichert</div>
            </>
          )}
        </div>

        <div style={{ padding: '8px 20px', borderTop: `1px solid ${C.lineStrong}`, fontSize: 10, color: C.textGhost, textAlign: 'center' }}>
          ⚠️ Keine Anlageberatung · Preise stichprobenhaft, vor dem Kauf auf Cardmarket prüfen{p.updatedAt ? ` · Stand ${fmtDate(card.prices.updatedAt?.replace(/\//g, '-'))}` : ''}
        </div>
      </div>
    </div>
  );
}

// Short, data-driven natural-language summary (no external AI needed).
function thesis(card) {
  const m = card.m;
  const dir = m.change30 == null ? null : m.change30 > 2 ? 'gestiegen' : m.change30 < -2 ? 'gefallen' : 'stabil geblieben';
  const parts = [];
  if (dir) parts.push(`Der Preis ist über 30 Tage ${dir}${m.change30 != null ? ` (${fmtPct(m.change30)})` : ''}.`);
  parts.push(`Beliebtheits-Index ${fmtNum(m.popularity, 1)}/10 bei ${riskLabel(m.risk).toLowerCase()}em Risiko.`);
  if (m.margin != null) parts.push(`Zwischen günstigstem Angebot und Trend liegen ${fmtPct(m.margin)} Spielraum.`);
  parts.push(`Investment-Score ${m.score}/100 (Tier ${m.tier.l}).`);
  return parts.join(' ');
}
