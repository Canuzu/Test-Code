import { useState, useEffect } from 'react';
import { X, Info, TrendingUp, Calculator, Tag as TagIcon, Globe, Award, Receipt, Maximize2, Package } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, riskColor, riskPhrase, riskAdjDative, rarityColor, trendColor, trendIcon, trendLabel } from '../lib/theme.js';
import { fmtEur, fmtNum, fmtPct, fmtDate, fmtMoney, fmtUsd } from '../lib/format.js';
import { calcNet, PLATFORM_FEES } from '../lib/fees.js';
import { marketLinks, cmUrl } from '../lib/marketLinks.js';
import { marketEstimates, arbitrage } from '../lib/markets.js';
import { gradeEstimates, gradingProfit } from '../lib/grading.js';
import { newRule } from '../lib/alerts.js';
import { CardImage, Pill, ChangeBadge, ScoreBadge, Spark } from './ui.jsx';
import PriceChart from './PriceChart.jsx';

const mpBtn = (color) => ({
  padding: '10px', borderRadius: 8, textAlign: 'center', textDecoration: 'none',
  fontSize: 12, fontWeight: 700, background: color + '1f', color, border: `1px solid ${color}44`,
  cursor: 'pointer', display: 'block',
});

export default function CardModal({ card, initialTab = 'overview', onClose }) {
  const { notes, tags, settings, addToPortfolio, saveNote, addTag, removeTag, addAlert, inBuylist, addToBuylist, inPortfolio } = useStore();
  const sectionLabel = { fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const [tab, setTab] = useState(initialTab === 'buy' ? 'overview' : initialTab);
  const [showAdd, setShowAdd] = useState(initialTab === 'buy'); // inline "add to collection" form
  const [zoom, setZoom] = useState(false); // fullscreen image lightbox
  const [heroIdx, setHeroIdx] = useState(0); // which hero candidate is in use
  const [heroLoaded, setHeroLoaded] = useState(false); // show spinner until ready
  const openZoom = () => { setHeroIdx(0); setHeroLoaded(false); setZoom(true); };
  const [noteText, setNoteText] = useState(notes[card.id] || '');
  const [newTag, setNewTag] = useState('');
  const [buyPrice, setBuyPrice] = useState(String(card.prices.low ?? card.prices.market ?? ''));
  const [buyQty, setBuyQty] = useState('1');
  const [buyCond, setBuyCond] = useState('NM');
  const [buyLoc, setBuyLoc] = useState('');
  const owned = inPortfolio(card.id);
  const [gradeFee, setGradeFee] = useState('20');
  const [gradeTarget, setGradeTarget] = useState('psa10');
  const [alertDir, setAlertDir] = useState('above');
  const [alertTarget, setAlertTarget] = useState('');

  // While the fullscreen image is open, lock background scroll and allow Esc to
  // close it. Cleaning up on unmount guarantees scroll is always restored, which
  // prevents the "page frozen" feeling after zooming (#5).
  useEffect(() => {
    if (!zoom) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setZoom(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [zoom]);

  const m = card.m;
  const p = card.prices;
  const links = marketLinks(card);
  // Ordered candidates for the fullscreen image. Vintage cards often lack a
  // `_hires` asset, so we fall back: large → constructed hires → small →
  // constructed small. The lightbox steps through these on each load error so a
  // missing hi-res file never leaves a blank zoom (e.g. Dark Typhlosion).
  const heroCandidates = [
    card.image?.large,
    card.setId && card.number ? `https://images.pokemontcg.io/${card.setId}/${card.number}_hires.png` : null,
    card.image?.small,
    card.setId && card.number ? `https://images.pokemontcg.io/${card.setId}/${card.number}.png` : null,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const cardTags = tags[card.id] || [];
  const markets = marketEstimates(card, settings);
  const arb = arbitrage(card, settings);
  const grades = gradeEstimates(card);
  const gProfit = gradingProfit(card, { gradeFee: Number(gradeFee) || 0, targetId: gradeTarget, commission: 0.05 });
  const fieldStyle = { width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' };

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
    <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 660, width: '100%', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><X size={15} /></button>

        {/* Header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', gap: 14 }}>
          {/* Zoomable artwork: click the image or the ⤢ arrows for fullscreen */}
          <button onClick={openZoom} title="Bild vergrößern" className="zoomable-img"
            style={{ position: 'relative', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', flexShrink: 0, lineHeight: 0 }}>
            <CardImage card={card} height={120} />
            <span style={{ position: 'absolute', bottom: 6, right: 6, background: '#000000aa', color: '#fff', borderRadius: 6, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px #00000080' }}>
              <Maximize2 size={13} />
            </span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ScoreBadge tier={m.tier} score={m.score} size="lg" />
              <span style={{ fontSize: 11, color: C.textFaint }}>{m.tier.n}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.25, paddingRight: 32 }}>{card.name}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>{card.set}{card.cardType ? ` · ${card.cardType}` : ''}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {card.rarity && <Pill color={rarityColor(card.rarity)}>{card.rarity}</Pill>}
              <Pill color={riskColor(m.risk)}>{riskPhrase(m.risk)}</Pill>
              <Pill color={trendColor(m.trend)}>{trendIcon(m.trend)} {trendLabel(m.trend)}</Pill>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.lineStrong}`, padding: '6px 12px 0', marginTop: 14, overflowX: 'auto' }}>
          <TabBtn id="overview" label="Übersicht" icon={<Info size={12} />} />
          <TabBtn id="value" label="Preisentwicklung" icon={<TrendingUp size={12} />} />
          <TabBtn id="markets" label="Märkte" icon={<Globe size={12} />} />
          <TabBtn id="grading" label="Grading" icon={<Award size={12} />} />
          <TabBtn id="fees" label="Gebühren" icon={<Calculator size={12} />} />
          <TabBtn id="notes" label="Notizen" icon={<TagIcon size={12} />} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {tab === 'overview' && (
            <>
              {!showAdd && (
                <button onClick={() => setShowAdd(true)} title="Diese Karte der Sammlung hinzufügen"
                  style={{ width: '100%', marginBottom: 14, padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: owned ? `${C.green2}18` : `${C.green2}12`, color: C.green2, border: `1px solid ${C.green2}${owned ? '66' : '44'}` }}>
                  <Package size={15} /> {owned ? 'Weitere zur Sammlung hinzufügen' : 'Zur Sammlung hinzufügen'}
                </button>
              )}
              {showAdd && (
                <div style={{ background: '#34d39912', border: '1px solid #34d39930', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: C.green2, fontWeight: 700 }}>📦 Zur Sammlung hinzufügen</div>
                    <button onClick={() => setShowAdd(false)} title="Abbrechen" style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: C.textFaint }}>Gezahlt (€)
                      <input type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                        style={{ width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' }} />
                    </label>
                    <label style={{ fontSize: 10, color: C.textFaint }}>Anzahl
                      <input type="number" min="1" step="1" value={buyQty} onChange={(e) => setBuyQty(e.target.value)}
                        style={{ width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' }} />
                    </label>
                    <label style={{ fontSize: 10, color: C.textFaint }}>Zustand
                      <select value={buyCond} onChange={(e) => setBuyCond(e.target.value)}
                        style={{ width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' }}>
                        {['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'].map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </label>
                  </div>
                  <label style={{ fontSize: 10, color: C.textFaint, display: 'block', marginBottom: 8 }}>Lagerort (optional)
                    <input value={buyLoc} onChange={(e) => setBuyLoc(e.target.value)} placeholder="z. B. Vitrine A · Ordner 3 · Lager"
                      style={{ width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 13, outline: 'none' }} />
                  </label>
                  <button className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: 12 }}
                    onClick={() => { addToPortfolio(card, { price: buyPrice, quantity: buyQty, condition: buyCond, location: buyLoc }); setShowAdd(false); }}>
                    Hinzufügen
                  </button>
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
                  <a href={cmUrl(card)} target="_blank" rel="noopener noreferrer" style={mpBtn('#0066cc')}>🛒 Cardmarket →</a>
                  <a href={links.ebay} target="_blank" rel="noopener noreferrer" style={mpBtn('#3a3a8c')}>🛒 eBay Deutschland →</a>
                  <a href={links.psa} target="_blank" rel="noopener noreferrer" style={mpBtn('#ec4899')}>🏆 PSA Population →</a>
                </div>
                <button onClick={() => addToBuylist(card)} title="Zur Einkaufsliste hinzufügen"
                  style={{ marginTop: 6, width: '100%', padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: inBuylist(card.id) ? C.gold + '22' : '#ffd70012', color: C.gold, border: `1px solid ${C.gold}${inBuylist(card.id) ? '66' : '33'}` }}>
                  <Receipt size={14} /> {inBuylist(card.id) ? 'In der Buylist ✓' : 'Zur Buylist hinzufügen'}
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={sectionLabel}>🔔 Preis-Alarm</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>Benachrichtige mich, wenn der Preis</span>
                  <select value={alertDir} onChange={(e) => setAlertDir(e.target.value)} style={{ ...fieldStyle, width: 'auto', marginTop: 0 }}>
                    <option value="above">über</option>
                    <option value="below">unter</option>
                  </select>
                  <input type="number" step="0.01" value={alertTarget} onChange={(e) => setAlertTarget(e.target.value)} placeholder={String(Math.round((m.market || 0) * 1.2))} style={{ ...fieldStyle, width: 90, marginTop: 0 }} />
                  <span style={{ fontSize: 12, color: C.textSoft }}>€ erreicht</span>
                  <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }}
                    onClick={() => { const t = Number(alertTarget) || Math.round((m.market || 0) * 1.2); addAlert(newRule({ cardId: card.id, name: card.name, direction: alertDir, target: t })); }}>
                    Alarm anlegen
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'value' && (
            <>
              <div style={sectionLabel}>📈 Preisverlauf · interaktiv (Cardmarket EU)</div>
              <div style={{ marginBottom: 14 }}>
                <PriceChart card={card} defaultRange="6M" />
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

          {tab === 'markets' && (
            <>
              <div style={sectionLabel}>🌍 Preise nach Marktplatz</div>
              <div style={{ background: C.bg1, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                {markets.map((mk, i) => (
                  <div key={mk.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: i < markets.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: mk.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{mk.label} <span style={{ fontSize: 10, color: C.textFaint, fontWeight: 600 }}>· {mk.region}</span></div>
                      <div style={{ fontSize: 10.5, color: C.textFaint }}>{mk.real ? '🟢 Live (Cardmarket EU)' : `geschätzt${mk.vsCardmarket != null ? ` · ${fmtPct(mk.vsCardmarket)} vs. CM` : ''}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtMoney(mk.price, mk.currency)}</div>
                      {mk.currency === 'USD' && <div style={{ fontSize: 10, color: C.textFaint }}>≈ {fmtEur(mk.eur)}</div>}
                    </div>
                    <a href={mk.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: mk.color, textDecoration: 'none', whiteSpace: 'nowrap' }}>prüfen →</a>
                  </div>
                ))}
              </div>
              {arb && (
                <div style={{ background: arb.worthwhile ? '#00e67612' : '#ffffff06', border: `1px solid ${arb.worthwhile ? '#00e67630' : C.lineStrong}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🔄 Import/Export EU → US</div>
                  <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.55 }}>
                    Günstigste EU-Kopie {fmtEur(arb.buyEur)} → US-Verkauf ca. {fmtUsd(arb.sellUsd)} ({fmtEur(arb.sellEur)}).
                    Spanne nach groben Grenzkosten: <strong style={{ color: arb.netPct >= 0 ? C.green : C.red }}>{fmtPct(arb.netPct)}</strong>{arb.worthwhile ? ' — potenziell lohnend.' : '.'}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: C.textFaint }}>
                Nur Cardmarket ist ein Live-Preis. eBay/TCGplayer sind transparente Schätzungen (Cardmarket-Preis × Venue-Aufschlag × Wechselkurs, in den Einstellungen anpassbar) mit „prüfen"-Direktlink zur Verifikation. Echte Live-Werte kommen automatisch, sobald die Cardmarket-API-Secrets gesetzt sind (Anleitung in der README).
              </div>
            </>
          )}

          {tab === 'grading' && (
            <>
              <div style={sectionLabel}>🏆 Geschätzte Slab-Werte</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
                {grades.map((g) => (
                  <div key={g.id} style={{ background: C.bg1, border: `1px solid ${g.color}30`, borderRadius: 9, padding: '9px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: g.color }}>{g.label}</div>
                    <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 4 }}>{g.sub}</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtEur(g.value)}</div>
                    {g.id !== 'raw' && <div style={{ fontSize: 9.5, color: C.textFaint }}>×{fmtNum(g.mult, 1)}</div>}
                  </div>
                ))}
              </div>

              <div style={sectionLabel}>🧮 Grading-Rechner</div>
              <div style={{ background: C.bg1, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <label style={{ fontSize: 10, color: C.textFaint }}>Grading-Kosten/Stk. (€)
                    <input type="number" step="1" value={gradeFee} onChange={(e) => setGradeFee(e.target.value)} style={fieldStyle} />
                  </label>
                  <label style={{ fontSize: 10, color: C.textFaint }}>Zielnote
                    <select value={gradeTarget} onChange={(e) => setGradeTarget(e.target.value)} style={fieldStyle}>
                      {grades.filter((g) => g.id !== 'raw').map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                  </label>
                </div>
                {gProfit && (
                  <>
                    <Row label="Roh-Einkauf (günstigstes Angebot)" v={fmtEur(gProfit.buy)} />
                    <Row label="+ Grading-Gebühr" v={fmtEur(gProfit.gradeFee)} />
                    <Row label={`Verkauf ${gProfit.target.label} (≈, netto Provision)`} v={fmtEur(gProfit.sellNet)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 10px', marginTop: 6, borderRadius: 8, background: gProfit.profit >= 0 ? '#00e67615' : '#ff525215', border: `1px solid ${gProfit.profit >= 0 ? '#00e67630' : '#ff525230'}` }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Erwarteter Gewinn</span>
                      <span style={{ fontWeight: 800, color: gProfit.profit >= 0 ? C.green : C.red }}>{gProfit.profit >= 0 ? '+' : ''}{fmtEur(gProfit.profit)} {gProfit.roi != null ? `(${fmtPct(gProfit.roi)})` : ''}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                <a href={links.psa} target="_blank" rel="noopener noreferrer" style={mpBtn('#ec4899')}>🏆 PSA Population →</a>
                <a href={links.ebay} target="_blank" rel="noopener noreferrer" style={mpBtn('#3a3a8c')}>🔎 eBay „sold" (Slabs) →</a>
              </div>
              <div style={{ fontSize: 11, color: C.textFaint }}>
                Schätzwerte: Roh-Marktpreis × Note/Alter-Faktor (Vintage deutlich höher, Top-Rarität mit Aufschlag). Keine garantierten Slab-Preise — vor Kauf/Verkauf echte „sold"-Daten prüfen. Die Grading-Trefferquote (z. B. PSA 10) hängt vom Zustand der Roh-Karte ab.
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

    {/* Fullscreen image lightbox — opened from the ⤢ arrows on the card. Robust
        against missing hi-res files (#4): on each load error it advances to the
        next candidate; a spinner shows until one loads. No entry animation and a
        plain overlay keep it light so repeated open/close can't jank (#5). */}
    {zoom && (
      <div onClick={() => setZoom(false)}
        style={{ position: 'fixed', inset: 0, background: '#000000f2', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
        <button onClick={() => setZoom(false)} title="Schließen" style={{ position: 'absolute', top: 16, right: 16, background: '#ffffff1f', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><X size={18} /></button>
        {!heroLoaded && heroIdx < heroCandidates.length && (
          <div style={{ position: 'absolute', width: 34, height: 34, border: '3px solid #ffffff22', borderTopColor: C.gold, borderRadius: '50%' }} className="spin" />
        )}
        {heroIdx < heroCandidates.length ? (
          <img
            key={heroCandidates[heroIdx]}
            src={heroCandidates[heroIdx]}
            alt={card.name}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setHeroLoaded(true)}
            onError={() => { setHeroLoaded(false); setHeroIdx((i) => i + 1); }}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 14, boxShadow: '0 12px 50px #000000aa', cursor: 'default', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.15s' }}
          />
        ) : (
          <div style={{ color: '#fff', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🃏</div>
            Für diese Karte ist gerade kein Bild verfügbar.
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', color: '#ffffffcc', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>{card.name} · {card.set}</div>
      </div>
    )}
    </>
  );
}

// Short, data-driven natural-language summary (no external AI needed).
function thesis(card) {
  const m = card.m;
  const dir = m.change30 == null ? null : m.change30 > 2 ? 'gestiegen' : m.change30 < -2 ? 'gefallen' : 'stabil geblieben';
  const parts = [];
  if (dir) parts.push(`Der Preis ist über 30 Tage ${dir}${m.change30 != null ? ` (${fmtPct(m.change30)})` : ''}.`);
  parts.push(`Beliebtheits-Index ${fmtNum(m.popularity, 1)}/10 bei ${riskAdjDative(m.risk)} Risiko.`);
  if (m.margin != null) parts.push(`Zwischen günstigstem Angebot und Trend liegen ${fmtPct(m.margin)} Spielraum.`);
  parts.push(`Investment-Score ${m.score}/100 (Tier ${m.tier.l}).`);
  return parts.join(' ');
}

// Compact label/value row used in the grading calculator.
function Row({ label, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 2px', fontSize: 12 }}>
      <span style={{ color: C.textDim }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
}
