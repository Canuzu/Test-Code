import { useMemo, useState } from 'react';
import { Briefcase, Trash2, Info, Tag as TagIcon, Upload, Download, Search } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, conditionColor } from '../lib/theme.js';
import { fmtEur, fmtPct, fmtDate } from '../lib/format.js';
import { getTier } from '../lib/metrics.js';
import { marketLinks, cmUrl } from '../lib/marketLinks.js';
import { VARIANTS } from '../lib/variants.js';
import { CardImage, ScoreBadge, Pill, Stat, EmptyState } from './ui.jsx';

const CONDITIONS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'];

const exportInventoryCSV = (rows, freshPrice) => {
  if (!rows.length) return;
  const head = ['Name', 'Set', 'Nummer', 'Zustand', 'Lagerort', 'Menge', 'EK_pro_Stueck', 'Aktuell_pro_Stueck', 'Wert', 'GuV'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((e) => {
    const cur = freshPrice(e) || 0;
    const qty = e.quantity || 1;
    return [e.card?.name, e.card?.set, e.card?.number, e.condition || 'NM', e.location || '', qty, e.actualBuyPrice, cur, cur * qty, (cur - (e.actualBuyPrice || 0)) * qty]
      .map(esc).join(',');
  });
  const blob = new Blob(['﻿' + [head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventar_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function PortfolioView({ onImport }) {
  const { portfolio, sold, removeFromPortfolio, removeManyFromPortfolio, sellFromPortfolio, removeSold, freshPrice, updatePortfolioEntry } = useStore();
  const [sellingId, setSellingId] = useState(null);
  const [sellInput, setSellInput] = useState('');
  const [view, setView] = useState('cards');
  const [locFilter, setLocFilter] = useState('all');
  const [condFilter, setCondFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set()); // multi-select (entry ids)

  const locations = useMemo(() => [...new Set(portfolio.map((e) => e.location || '').filter(Boolean))].sort(), [portfolio]);
  const locFilterOptions = useMemo(() => [...new Set(portfolio.map((e) => e.location || '—'))].sort(), [portfolio]);

  if (portfolio.length === 0 && sold.length === 0) {
    return (
      <EmptyState icon={<Briefcase size={56} style={{ opacity: 0.35 }} />} title="Sammlung ist leer" hint="Klicke bei einer Karte auf »📦 Sammlung«, oder importiere deinen Bestand per CSV.">
        {onImport && <button className="btn-primary" onClick={onImport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Upload size={14} /> Massenimport (CSV)</button>}
      </EmptyState>
    );
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

  const q = search.trim().toLowerCase();
  const filtered = portfolio.filter((e) =>
    (locFilter === 'all' || (e.location || '—') === locFilter) &&
    (condFilter === 'all' || (e.condition || 'NM') === condFilter) &&
    (!q || (e.card?.name || '').toLowerCase().includes(q) || (e.card?.set || '').toLowerCase().includes(q) || String(e.card?.number || '').toLowerCase().includes(q)));

  // ---- multi-select helpers (#19) ----
  const toggleSel = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clearSel = () => setSelected(new Set());
  const filteredIds = filtered.map((e) => e.id);
  const allFilteredSelected = filtered.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggleSelectAll = () => setSelected(() => (allFilteredSelected ? new Set() : new Set(filteredIds)));
  const selCount = selected.size;
  const bulkRemove = () => {
    if (!selCount) return;
    if (window.confirm(`${selCount} ausgewählte Position(en) wirklich aus der Sammlung entfernen?`)) { removeManyFromPortfolio([...selected]); clearSel(); }
  };
  const bulkSetLocation = (loc) => { [...selected].forEach((id) => updatePortfolioEntry(id, { location: loc })); clearSel(); };
  const askExport = () => { if (window.confirm(`${filtered.length} Positionen als CSV-Datei herunterladen?`)) exportInventoryCSV(filtered, freshPrice); };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label="Karten" value={totalCards} color={C.textSoft} sub={portfolio.length !== totalCards ? `${portfolio.length} Positionen` : undefined} />
        <Stat label="Investiert" value={fmtEur(invested, 0)} color={C.blue} />
        <Stat label="Marktwert" value={fmtEur(marketValue, 0)} color={C.text} />
        <Stat label="Unrealisiert G/V" value={`${pnl >= 0 ? '+' : ''}${fmtEur(pnl, 0)}`} color={pnl >= 0 ? C.green : C.red} sub={pnlPct != null ? fmtPct(pnlPct) : undefined} />
        <Stat label="Realisiert (verkauft)" value={`${realized >= 0 ? '+' : ''}${fmtEur(realized, 0)}`} color={realized >= 0 ? C.green : C.red} sub={sold.length ? `${sold.length} verkauft` : undefined} />
      </div>

      {/* Toolbar: view toggle + search + filters + import/export */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 3 }}>
          {[['cards', '⊞ Karten'], ['table', '≡ Inventar']].map(([m, lbl]) => (
            <button key={m} onClick={() => setView(m)} style={{ padding: '6px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: view === m ? '#ffd70022' : 'transparent', color: view === m ? C.gold : C.textFaint }}>{lbl}</button>
          ))}
        </div>
        {portfolio.length > 0 && (
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
            <input className="control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="In der Sammlung suchen (Name, Set, Nummer)…" style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
          </div>
        )}
        {view === 'table' && portfolio.length > 0 && (
          <>
            <select className="control" value={locFilter} onChange={(e) => setLocFilter(e.target.value)}>
              <option value="all">Alle Lagerorte</option>
              {locFilterOptions.map((l) => <option key={l} value={l}>{l === '—' ? 'ohne Lagerort' : l}</option>)}
            </select>
            <select className="control" value={condFilter} onChange={(e) => setCondFilter(e.target.value)}>
              <option value="all">Alle Zustände</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="control" onClick={askExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> CSV</button>
          </>
        )}
        {onImport && <button className="control" onClick={onImport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={13} /> Import</button>}
      </div>

      {/* Multi-select bulk-action bar (#19) */}
      {portfolio.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, fontSize: 12 }}>
          <button onClick={toggleSelectAll} className="control" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${allFilteredSelected ? C.gold : C.lineStrong}`, background: allFilteredSelected ? C.gold : 'transparent', color: '#0c0c1a', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{allFilteredSelected ? '✓' : ''}</span>
            {allFilteredSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
          </button>
          {selCount > 0 && (
            <>
              <span style={{ color: C.textSoft, fontWeight: 700 }}>{selCount} ausgewählt</span>
              {locations.length > 0 && (
                <select className="control" defaultValue="" onChange={(e) => { if (e.target.value !== '') { bulkSetLocation(e.target.value === '__none' ? '' : e.target.value); e.target.value = ''; } }}>
                  <option value="">📍 Lagerort setzen…</option>
                  <option value="__none">— kein Lagerort —</option>
                  {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              <button onClick={bulkRemove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #ff525240', background: '#ff525212', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Trash2 size={13} /> Entfernen</button>
              <button onClick={clearSel} className="control">Abwählen</button>
            </>
          )}
        </div>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 16px', marginBottom: 16, fontSize: 11.5, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Info size={14} style={{ flexShrink: 0, color: C.blue }} />
        <span>Unrealisiert = aktueller Marktwert minus Kaufpreis (aktualisiert sich täglich). In der Inventar-Ansicht kannst du Menge, EK, Zustand und Lagerort direkt bearbeiten.</span>
      </div>

      {/* ---- Inventory table view ---- */}
      {view === 'table' && portfolio.length > 0 && (
        <InventoryTable rows={filtered} freshPrice={freshPrice} updatePortfolioEntry={updatePortfolioEntry} onRemove={removeFromPortfolio} onSell={startSell}
          sellingId={sellingId} sellInput={sellInput} setSellInput={setSellInput} confirmSell={confirmSell} cancelSell={() => setSellingId(null)}
          selected={selected} toggleSel={toggleSel} />
      )}

      {/* ---- Card grid view ---- */}
      {view === 'cards' && portfolio.length > 0 && (
        filtered.length === 0
          ? <div style={{ color: C.textFaint, fontSize: 13, padding: 24, textAlign: 'center' }}>Keine Karten für diese Suche/Filter.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12, marginBottom: sold.length ? 28 : 0 }}>
          {filtered.map((e) => {
            const card = e.card;
            const qty = qtyOf(e);
            const current = freshPrice(e);
            const unreal = ((current || 0) - (e.actualBuyPrice || 0)) * qty;
            const unrealPct = e.actualBuyPrice ? (((current || 0) - e.actualBuyPrice) / e.actualBuyPrice) * 100 : null;
            const tier = getTier(card.m?.score ?? 0);
            const links = marketLinks(card);
            const selling = sellingId === e.id;
            const isSel = selected.has(e.id);
            return (
              <div key={e.id} style={{ background: C.surface, border: `1px solid ${isSel ? C.gold : C.line}`, boxShadow: isSel ? `0 0 0 1px ${C.gold}55` : undefined, borderRadius: 14, padding: 14, position: 'relative' }}>
                <button onClick={() => toggleSel(e.id)} title={isSel ? 'Abwählen' : 'Auswählen'} style={{ position: 'absolute', top: -9, left: 12, width: 22, height: 22, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: isSel ? C.gold : C.surface2, color: isSel ? '#0c0c1a' : C.textFaint, border: `1px solid ${isSel ? C.gold : C.lineStrong}`, boxShadow: '0 2px 8px #00000040' }}>{isSel ? '✓' : ''}</button>
                <div style={{ position: 'absolute', top: -9, right: 12 }}><ScoreBadge tier={tier} score={card.m?.score ?? 0} /></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 10 }}>
                  <CardImage card={card} height={108} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, paddingRight: 40 }}>{card.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{card.set}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      <Pill color={C.blue}>×{qty}</Pill>
                      <Pill color={conditionColor(e.condition)}>{e.condition || 'NM'}</Pill>
                      {e.variant && e.variant !== 'normal' && <Pill color={VARIANTS[e.variant]?.color || C.purple}>{VARIANTS[e.variant]?.label || e.variant}</Pill>}
                    </div>
                    {/* Lagerort als Drop-Down direkt in der Karte (#14) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
                      <span style={{ fontSize: 11, color: C.textFaint }}>📍</span>
                      <select value={e.location || ''} onChange={(ev) => {
                        const v = ev.target.value;
                        if (v === '__new') { const nl = window.prompt('Neuer Lagerort:'); if (nl && nl.trim()) updatePortfolioEntry(e.id, { location: nl.trim() }); }
                        else updatePortfolioEntry(e.id, { location: v });
                      }}
                        style={{ flex: 1, minWidth: 0, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '4px 6px', color: e.location ? C.green2 : C.textFaint, fontSize: 11.5, fontWeight: 600, outline: 'none' }}>
                        <option value="">kein Lagerort</option>
                        {[...new Set([...locations, ...(e.location ? [e.location] : [])])].sort().map((l) => <option key={l} value={l}>{l}</option>)}
                        <option value="__new">+ neuer Lagerort…</option>
                      </select>
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
                    <div style={{ fontWeight: 700, color: conditionColor(e.condition), fontSize: 14 }} title={`Preisfarbe nach Zustand ${e.condition || 'NM'}`}>{fmtEur(current)}</div>
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
                      <a href={cmUrl(card)} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 11, fontWeight: 700, background: '#0066cc1f', color: C.blue, border: '1px solid #0066cc44' }}>🛒 Cardmarket</a>
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
        <div style={{ marginTop: 28 }}>
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

// Dense, editable inventory table with per-location subtotals.
function InventoryTable({ rows, freshPrice, updatePortfolioEntry, onRemove, onSell, sellingId, sellInput, setSellInput, confirmSell, cancelSell, selected, toggleSel }) {
  const cols = '30px 44px 2fr 0.8fr 1.1fr 0.7fr 0.9fr 0.9fr 1fr 88px';
  const cell = { background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 5, padding: '5px 6px', color: C.text, fontSize: 12, outline: 'none', width: '100%' };

  // Per-location subtotals
  const byLoc = useMemo(() => {
    const m = new Map();
    for (const e of rows) {
      const key = e.location || '—';
      const g = m.get(key) || { loc: key, qty: 0, invested: 0, value: 0 };
      const q = e.quantity || 1;
      g.qty += q;
      g.invested += (e.actualBuyPrice || 0) * q;
      g.value += (freshPrice(e) || 0) * q;
      m.set(key, g);
    }
    return [...m.values()].sort((a, b) => b.value - a.value);
  }, [rows, freshPrice]);

  if (rows.length === 0) return <div style={{ color: C.textFaint, fontSize: 13, padding: 24, textAlign: 'center' }}>Keine Positionen für diesen Filter.</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 10.5, color: C.textFaint, marginBottom: 8 }}>
        <span>Preisfarbe nach Zustand:</span>
        {CONDITIONS.map((c) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: conditionColor(c) }} />{c}</span>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 760 }}>
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '6px 10px', fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase' }}>
            <div></div><div></div><div>Karte</div><div>Zustand</div><div>Lagerort</div><div style={{ textAlign: 'right' }}>Menge</div><div style={{ textAlign: 'right' }}>EK/Stk</div><div style={{ textAlign: 'right' }}>Akt./Stk</div><div style={{ textAlign: 'right' }}>Wert / G/V</div><div></div>
          </div>
          {rows.map((e) => {
            const qty = e.quantity || 1;
            const cur = freshPrice(e) || 0;
            const value = cur * qty;
            const pnl = (cur - (e.actualBuyPrice || 0)) * qty;
            const selling = sellingId === e.id;
            const isSel = selected?.has(e.id);
            return (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '8px 10px', alignItems: 'center', background: C.surface, border: `1px solid ${isSel ? C.gold : C.line}`, boxShadow: isSel ? `0 0 0 1px ${C.gold}55` : undefined, borderRadius: 9, marginBottom: 5 }}>
                <button onClick={() => toggleSel?.(e.id)} title={isSel ? 'Abwählen' : 'Auswählen'} style={{ width: 20, height: 20, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: isSel ? C.gold : 'transparent', color: isSel ? '#0c0c1a' : C.textFaint, border: `1px solid ${isSel ? C.gold : C.lineStrong}` }}>{isSel ? '✓' : ''}</button>
                <CardImage card={e.card} height={40} radius={4} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.card?.name}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>{e.card?.set}{e.card?.number ? ` · ${e.card.number}` : ''}</div>
                </div>
                <select defaultValue={e.condition || 'NM'} onChange={(ev) => updatePortfolioEntry(e.id, { condition: ev.target.value })} style={{ ...cell, color: conditionColor(e.condition), fontWeight: 700 }}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input defaultValue={e.location || ''} placeholder="—" onBlur={(ev) => updatePortfolioEntry(e.id, { location: ev.target.value })} style={cell} />
                <input type="number" min="1" defaultValue={qty} onBlur={(ev) => updatePortfolioEntry(e.id, { quantity: ev.target.value })} style={{ ...cell, textAlign: 'right' }} />
                <input type="number" step="0.01" defaultValue={e.actualBuyPrice} onBlur={(ev) => updatePortfolioEntry(e.id, { actualBuyPrice: ev.target.value })} style={{ ...cell, textAlign: 'right' }} />
                <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: conditionColor(e.condition) }} title={`Preisfarbe nach Zustand ${e.condition || 'NM'}`}>{fmtEur(cur)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>{fmtEur(value)}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: pnl >= 0 ? C.green : C.red }}>{pnl >= 0 ? '+' : ''}{fmtEur(pnl)}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button onClick={() => onSell(e)} title="Verkaufen" style={{ padding: '5px 7px', borderRadius: 5, border: `1px solid ${C.green2}40`, background: `${C.green2}18`, color: C.green2, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>💰</button>
                  <button onClick={() => onRemove(e.id)} title="Entfernen" style={{ padding: '5px 7px', borderRadius: 5, border: '1px solid #ff525230', background: '#ff525210', color: C.red, cursor: 'pointer', display: 'flex' }}><Trash2 size={12} /></button>
                </div>
                {selling && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, alignItems: 'center', background: C.bg1, border: `1px solid ${C.green2}55`, borderRadius: 7, padding: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: C.green2, fontWeight: 700 }}>Verkauf ({qty} Stk.) · Stückpreis €</span>
                    <input type="number" step="0.01" autoFocus value={sellInput} onChange={(ev) => setSellInput(ev.target.value)} style={{ width: 110, background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '5px 8px', color: C.text, fontSize: 12, outline: 'none' }} />
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => confirmSell(e)}>Buchen</button>
                    <button onClick={cancelSell} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontSize: 12, cursor: 'pointer' }}>Abbrechen</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {byLoc.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', marginBottom: 8 }}>📍 Summen je Lagerort</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 8 }}>
            {byLoc.map((g) => (
              <div key={g.loc} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{g.loc}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{g.qty} Karten · EK {fmtEur(g.invested, 0)}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 2 }}>{fmtEur(g.value, 0)} <span style={{ fontSize: 11, fontWeight: 700, color: g.value - g.invested >= 0 ? C.green : C.red }}>({g.value - g.invested >= 0 ? '+' : ''}{fmtEur(g.value - g.invested, 0)})</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
