import { useMemo, useState } from 'react';
import { Printer, Download, Search, Settings2, Trash2, Star } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, conditionColor } from '../lib/theme.js';
import { fmtEur, fmtDate } from '../lib/format.js';
import { CONDITIONS, withDefaults, offerFor } from '../lib/buylist.js';
import { fold } from '../lib/localize.js';
import { CardImage, EmptyState } from './ui.jsx';

const exportCSV = (resolved, rules) => {
  if (!resolved.length) return;
  const head = ['Name', 'Set', 'Nummer', 'Zustand', 'Menge', 'Marktpreis', 'Ankauf_proStueck', 'Ankauf_gesamt'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = resolved.map((r) => [r.card.name, r.card.set, r.card.number, r.condition, r.qty, r.card.m.market, r.offer.unit, r.offer.total].map(esc).join(','));
  const blob = new Blob(['﻿' + [head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `buylist_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function BuylistView({ locked, onUpgrade }) {
  const { cards, watchlist, showToast, buylist, setBuylistItems: setItems, setBuylistRules: setRules } = useStore();
  const rules = useMemo(() => withDefaults(buylist.rules), [buylist.rules]);
  const items = buylist.items;
  const [showRules, setShowRules] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set()); // multi-select (card ids)

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const resolved = useMemo(() => items
    .map((it) => {
      const card = cardById.get(it.id);
      if (!card) return null;
      return { ...it, card, offer: offerFor(card.m.market, rules, { condition: it.condition, qty: it.qty }) };
    })
    .filter(Boolean), [items, cardById, rules]);

  const totalOffer = resolved.reduce((s, r) => s + r.offer.total, 0);
  const totalMarket = resolved.reduce((s, r) => s + (r.card.m.market || 0) * r.qty, 0);
  const totalCards = resolved.reduce((s, r) => s + r.qty, 0);

  const suggestions = useMemo(() => {
    const q = fold(search);
    if (!q) return [];
    const have = new Set(items.map((i) => i.id));
    return cards.filter((c) => !have.has(c.id) && (c.searchText || fold(`${c.name} ${c.nameEn || ''} ${c.baseName || ''} ${c.set || ''}`)).includes(q)).slice(0, 8);
  }, [search, cards, items]);

  const addCard = (card) => { setItems((p) => p.some((i) => i.id === card.id) ? p : [...p, { id: card.id, condition: 'NM', qty: 1 }]); setSearch(''); };
  const setItem = (id, patch) => setItems((p) => p.map((i) => i.id === id ? { ...i, ...patch } : i));
  const removeItem = (id) => setItems((p) => p.filter((i) => i.id !== id));
  const importWatchlist = () => {
    const have = new Set(items.map((i) => i.id));
    const add = watchlist.filter((w) => !have.has(w.id)).map((w) => ({ id: w.id, condition: 'NM', qty: 1 }));
    if (!add.length) { showToast('Watchlist ist leer oder schon enthalten'); return; }
    setItems((p) => [...p, ...add]); showToast(`${add.length} aus Watchlist übernommen`);
  };
  // ---- multi-select (#19) ----
  const toggleSel = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allSel = resolved.length > 0 && resolved.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(resolved.map((r) => r.id)));
  const bulkRemove = () => {
    if (selected.size && window.confirm(`${selected.size} Position(en) aus der Buylist entfernen?`)) { setItems((p) => p.filter((i) => !selected.has(i.id))); setSelected(new Set()); }
  };
  const askExport = () => { if (resolved.length && window.confirm(`Buylist mit ${resolved.length} Positionen als CSV herunterladen?`)) exportCSV(resolved, rules); };

  if (locked) {
    return <EmptyState icon="🔒" title="Buylist ist ein Pro-Feature" hint="Erstelle Ankaufslisten mit konfigurierbaren Prozentsätzen und drucke sie als PDF.">
      <button className="btn-primary" onClick={onUpgrade}>Pro freischalten</button>
    </EmptyState>;
  }

  const today = fmtDate(Date.now());

  return (
    <div className="fade-in">
      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input value={rules.shopName} onChange={(e) => setRules({ ...rules, shopName: e.target.value })} placeholder="Laden-Name"
          className="control" style={{ fontWeight: 700, minWidth: 160 }} />
        <div style={{ display: 'flex', gap: 4, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 3 }}>
          {[['cash', '💶 Bar'], ['credit', '🎟 Guthaben']].map(([m, lbl]) => (
            <button key={m} onClick={() => setRules({ ...rules, payout: m })} style={{ padding: '6px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: rules.payout === m ? '#ffd70022' : 'transparent', color: rules.payout === m ? C.gold : C.textFaint }}>{lbl}</button>
          ))}
        </div>
        <button className="control" onClick={() => setShowRules((s) => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Settings2 size={14} /> Regeln</button>
        <div style={{ flex: 1 }} />
        <button className="control" onClick={askExport} disabled={!resolved.length} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: resolved.length ? 1 : 0.5 }}><Download size={14} /> CSV</button>
        <button className="btn-primary" onClick={() => window.print()} disabled={!resolved.length} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Drucken / PDF</button>
      </div>

      {/* Rules editor */}
      {showRules && (
        <div className="no-print" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={lbl}>Ankauf-% nach Marktpreis-Stufe</div>
              {rules.tiers.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.textDim, width: 92 }}>{i === 0 ? `bis ${fmtEur(t.max, 0)}` : t.max == null ? `> ${fmtEur(rules.tiers[i - 1].max, 0)}` : `${fmtEur(rules.tiers[i - 1].max, 0)}–${fmtEur(t.max, 0)}`}</span>
                  <input type="number" value={t.pct} onChange={(e) => setRules({ ...rules, tiers: rules.tiers.map((x, j) => j === i ? { ...x, pct: Number(e.target.value) || 0 } : x) })} style={miniInput} /> %
                </div>
              ))}
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>Guthaben-Bonus: <input type="number" value={rules.creditBonusPct} onChange={(e) => setRules({ ...rules, creditBonusPct: Number(e.target.value) || 0 })} style={miniInput} /> %</div>
            </div>
            <div>
              <div style={lbl}>Zustands-Faktor (%)</div>
              {CONDITIONS.map((c) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.textDim, width: 34 }}>{c}</span>
                  <input type="number" value={rules.conditionPct[c]} onChange={(e) => setRules({ ...rules, conditionPct: { ...rules.conditionPct, [c]: Number(e.target.value) || 0 } })} style={miniInput} /> %
                </div>
              ))}
            </div>
            <div>
              <div style={lbl}>Rundung</div>
              <select value={rules.roundTo} onChange={(e) => setRules({ ...rules, roundTo: Number(e.target.value) })} className="control">
                <option value={0.01}>auf 0,01 €</option>
                <option value={0.5}>auf 0,50 €</option>
                <option value={1}>auf 1 €</option>
              </select>
              <button onClick={() => setRules(withDefaults(null))} style={{ display: 'block', marginTop: 12, padding: '7px 12px', borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontSize: 12, cursor: 'pointer' }}>Auf Standard zurücksetzen</button>
            </div>
          </div>
        </div>
      )}

      {/* Add cards */}
      <div className="no-print" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
            <input className="control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Karte zur Buylist hinzufügen…" style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4, background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px #00000050' }}>
                {suggestions.map((c) => (
                  <button key={c.id} onClick={() => addCard(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', color: C.text, cursor: 'pointer' }}>
                    <CardImage card={c} height={36} radius={3} />
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div><div style={{ fontSize: 10.5, color: C.textFaint }}>{c.set}</div></div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{fmtEur(c.m.market)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="control" onClick={importWatchlist} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={13} /> Watchlist</button>
          {items.length > 0 && <button className="control" onClick={() => setItems([])}>Leeren</button>}
        </div>
      </div>

      {/* On-screen table */}
      {resolved.length === 0 ? (
        <EmptyState icon="🧾" title="Buylist ist leer" hint="Füge Karten über die Suche oder deine Watchlist hinzu. Der Ankaufspreis berechnet sich automatisch." />
      ) : (
        <div className="no-print">
          {/* Multi-select bulk bar (#19) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
            <button onClick={toggleAll} className="control" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${allSel ? C.gold : C.lineStrong}`, background: allSel ? C.gold : 'transparent', color: '#0c0c1a', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{allSel ? '✓' : ''}</span>
              {allSel ? 'Auswahl aufheben' : 'Alle auswählen'}
            </button>
            {selected.size > 0 && (
              <>
                <span style={{ color: C.textSoft, fontWeight: 700 }}>{selected.size} ausgewählt</span>
                <button onClick={bulkRemove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #ff525240', background: '#ff525212', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Trash2 size={13} /> Entfernen</button>
              </>
            )}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {resolved.map((r, i) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '28px 40px 2fr 0.8fr 0.6fr 0.8fr 0.9fr 30px', gap: 8, alignItems: 'center', padding: '9px 12px', borderBottom: i < resolved.length - 1 ? `1px solid ${C.line}` : 'none', background: selected.has(r.id) ? `${C.gold}0f` : 'transparent' }}>
                <button onClick={() => toggleSel(r.id)} title={selected.has(r.id) ? 'Abwählen' : 'Auswählen'} style={{ width: 18, height: 18, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: selected.has(r.id) ? C.gold : 'transparent', color: selected.has(r.id) ? '#0c0c1a' : C.textFaint, border: `1px solid ${selected.has(r.id) ? C.gold : C.lineStrong}` }}>{selected.has(r.id) ? '✓' : ''}</button>
                <CardImage card={r.card} height={38} radius={3} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.card.name}</div>
                  <div style={{ fontSize: 10.5, color: C.textFaint }}>{r.card.set} · Markt {fmtEur(r.card.m.market)} · {r.offer.basePct}%×{r.offer.condPct}%</div>
                </div>
                <select value={r.condition} onChange={(e) => setItem(r.id, { condition: e.target.value })} style={{ ...miniSelect, color: conditionColor(r.condition), borderColor: conditionColor(r.condition) + '66', fontWeight: 700 }}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" min="1" value={r.qty} onChange={(e) => setItem(r.id, { qty: Math.max(1, Number(e.target.value) || 1) })} style={{ ...miniSelect, textAlign: 'right' }} />
                <div style={{ textAlign: 'right', fontSize: 12, color: conditionColor(r.condition) }}>{fmtEur(r.offer.unit)}/Stk</div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: conditionColor(r.condition) }}>{fmtEur(r.offer.total)}</div>
                <button onClick={() => removeItem(r.id)} style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 14, padding: '0 12px' }}>
            <Sum label="Karten" v={totalCards} />
            <Sum label="Marktwert gesamt" v={fmtEur(totalMarket, 0)} color={C.textSoft} />
            <Sum label={`Ankauf (${rules.payout === 'credit' ? 'Guthaben' : 'Bar'})`} v={fmtEur(totalOffer)} color={C.green} big />
          </div>
        </div>
      )}

      {/* Print sheet (hidden on screen, shown only when printing) */}
      <div className="buylist-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{rules.shopName}</div>
            <div style={{ fontSize: 13 }}>Ankaufsliste (Buylist) · Auszahlung: {rules.payout === 'credit' ? `Guthaben (+${rules.creditBonusPct}%)` : 'Bar'}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>Datum: {today}<br />Positionen: {resolved.length} · {totalCards} Karten</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Karte', 'Set', 'Zustand', 'Menge', 'Markt', 'Ankauf/Stk', 'Ankauf gesamt'].map((h, i) => (
                <th key={h} style={{ textAlign: i > 2 ? 'right' : 'left', borderBottom: '1px solid #000', padding: '5px 6px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolved.map((r) => (
              <tr key={r.id}>
                <td style={tdL}>{r.card.name}</td>
                <td style={tdL}>{r.card.set}</td>
                <td style={tdL}>{r.condition}</td>
                <td style={tdR}>{r.qty}</td>
                <td style={tdR}>{fmtEur(r.card.m.market)}</td>
                <td style={tdR}>{fmtEur(r.offer.unit)}</td>
                <td style={{ ...tdR, fontWeight: 700 }}>{fmtEur(r.offer.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ ...tdR, borderTop: '2px solid #000', fontWeight: 800 }}>Summe Ankauf</td>
              <td style={{ ...tdR, borderTop: '2px solid #000', fontWeight: 800 }}>{fmtEur(totalOffer)}</td>
            </tr>
          </tfoot>
        </table>
        <div style={{ fontSize: 10, marginTop: 16, color: '#444' }}>
          Preise basieren auf Cardmarket-Marktpreisen (EU) zzgl. konfigurierter Ankaufs-Prozentsätze. Unverbindlich, gültig am Erstellungstag. Endgültiges Angebot nach Sichtprüfung der Karten.
        </div>
      </div>
    </div>
  );
}

const lbl = { fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' };
const miniInput = { width: 54, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 5, padding: '4px 6px', color: C.text, fontSize: 12, outline: 'none' };
const miniSelect = { background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 5, padding: '5px 6px', color: C.text, fontSize: 12, outline: 'none', width: '100%' };
const tdL = { textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #ddd' };
const tdR = { textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid #ddd' };

function Sum({ label, v, color = C.text, big }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: C.textFaint }}>{label}</div>
      <div style={{ fontSize: big ? 22 : 16, fontWeight: 800, color }}>{v}</div>
    </div>
  );
}
