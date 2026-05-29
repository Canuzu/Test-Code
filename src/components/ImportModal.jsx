import { useState, useRef } from 'react';
import { X, Upload, Scan, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';

const CONDITIONS = ['NM', 'EX', 'GD', 'LP', 'PL'];
const TEMPLATE_CSV = `Name,Zustand,Kaufpreis,Anzahl,Standort
"Pikachu V",NM,12.50,2,Laden
"Charizard ex",EX,45.00,1,Zuhause
`;

export default function ImportModal({ onClose }) {
  const { cards, addToPortfolio, showToast } = useStore();
  const [mode, setMode] = useState('csv'); // 'csv' | 'barcode'
  const [csvText, setCsvText] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [parsed, setParsed] = useState(null); // { rows, errors }
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const cardIndex = new Map(cards.map((c) => [c.name.toLowerCase(), c]));

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { rows: [], errors: ['Keine Daten gefunden'] };
    const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());
    const nameIdx = header.findIndex((h) => h === 'name');
    const condIdx = header.findIndex((h) => ['zustand', 'condition', 'cond'].includes(h));
    const priceIdx = header.findIndex((h) => ['kaufpreis', 'price', 'preis'].includes(h));
    const qtyIdx = header.findIndex((h) => ['anzahl', 'qty', 'quantity'].includes(h));
    const locIdx = header.findIndex((h) => ['standort', 'location', 'ort'].includes(h));

    if (nameIdx === -1) return { rows: [], errors: ['Spalte "Name" fehlt in der CSV-Datei'] };

    const rows = [];
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const name = cols[nameIdx] || '';
      if (!name) continue;
      const cond = condIdx >= 0 ? (CONDITIONS.includes(cols[condIdx]?.toUpperCase()) ? cols[condIdx].toUpperCase() : 'NM') : 'NM';
      const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]?.replace(',', '.')) || null : null;
      const qty = qtyIdx >= 0 ? Math.max(1, parseInt(cols[qtyIdx]) || 1) : 1;
      const location = locIdx >= 0 ? cols[locIdx] || '' : '';
      const match = cardIndex.get(name.toLowerCase());
      rows.push({ name, cond, price, qty, location, match: match || null, line: i + 1 });
      if (!match) errors.push(`Zeile ${i + 1}: "${name}" nicht gefunden`);
    }
    return { rows, errors };
  };

  const handleFileLoad = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => { setCsvText(e.target.result); };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileLoad(file);
  };

  const handleParse = () => setParsed(parseCSV(csvText));

  const handleImport = () => {
    if (!parsed) return;
    setImporting(true);
    const matched = parsed.rows.filter((r) => r.match);
    matched.forEach((r) => {
      addToPortfolio(r.match, {
        price: r.price ?? r.match.prices?.low ?? r.match.prices?.market ?? 0,
        quantity: r.qty,
        condition: r.cond,
        location: r.location,
      });
    });
    showToast(`✅ ${matched.length} Karten importiert!`);
    setImporting(false);
    onClose();
  };

  const handleBarcode = () => {
    const names = barcodeInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const found = names.map((n) => ({ name: n, match: cardIndex.get(n.toLowerCase()) }));
    setParsed({ rows: found.map((f) => ({ ...f, cond: 'NM', price: null, qty: 1, location: '' })), errors: found.filter((f) => !f.match).map((f) => `"${f.name}" nicht gefunden`) });
  };

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' }));
    a.download = 'kartenwert_import_vorlage.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const matchedCount = parsed?.rows.filter((r) => r.match).length ?? 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>📤 Massenimport</div>
          <button onClick={onClose} style={{ background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Mode switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['csv', <Upload key="u" size={13} />, 'CSV-Import'], ['barcode', <Scan key="s" size={13} />, 'Barcode / Namen']].map(([m, icon, label]) => (
              <button key={m} onClick={() => { setMode(m); setParsed(null); }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${mode === m ? '#448aff' : C.lineStrong}`, background: mode === m ? '#448aff20' : 'transparent', color: mode === m ? '#448aff' : C.textDim, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {mode === 'csv' && (
            <>
              <button onClick={downloadTemplate}
                style={{ width: '100%', marginBottom: 12, padding: '7px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textDim, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={12} /> CSV-Vorlage herunterladen
              </button>

              <div
                onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current.click()}
                style={{ border: `2px dashed ${C.lineStrong}`, borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: C.bg1 }}>
                <Upload size={24} style={{ color: C.textFaint, marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: C.textDim }}>CSV hierher ziehen oder klicken</div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>Format: Name, Zustand, Kaufpreis, Anzahl, Standort</div>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0])} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Oder CSV-Inhalt einfügen:</div>
                <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
                  placeholder={TEMPLATE_CSV}
                  style={{ width: '100%', height: 120, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 11, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleParse} disabled={!csvText.trim()}
                style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: csvText.trim() ? 'linear-gradient(135deg,#448aff,#6366f1)' : C.bg1, color: csvText.trim() ? '#fff' : C.textFaint, fontSize: 13, fontWeight: 700, cursor: csvText.trim() ? 'pointer' : 'default', marginBottom: 12 }}>
                Datei analysieren
              </button>
            </>
          )}

          {mode === 'barcode' && (
            <>
              <div style={{ background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 11.5, color: C.textSoft }}>
                Scanne Barcodes mit einem USB/Bluetooth-Scanner in das Feld unten – oder gib Kartennamen (einen pro Zeile) manuell ein.
              </div>
              <textarea value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={'Pikachu V\nCharizard ex\nMewtwo V-UNION'}
                autoFocus
                style={{ width: '100%', height: 150, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
              <button onClick={handleBarcode} disabled={!barcodeInput.trim()}
                style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: barcodeInput.trim() ? 'linear-gradient(135deg,#448aff,#6366f1)' : C.bg1, color: barcodeInput.trim() ? '#fff' : C.textFaint, fontSize: 13, fontWeight: 700, cursor: barcodeInput.trim() ? 'pointer' : 'default', marginBottom: 12 }}>
                Karten suchen
              </button>
            </>
          )}

          {/* Preview */}
          {parsed && (
            <div className="fade-in">
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, background: '#00e67615', border: '1px solid #00e67630', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.green2 }}>{matchedCount}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>Gefunden</div>
                </div>
                <div style={{ flex: 1, background: parsed.errors.length ? '#ff525215' : '#00e67615', border: `1px solid ${parsed.errors.length ? '#ff525230' : '#00e67630'}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: parsed.errors.length ? C.red : C.green2 }}>{parsed.errors.length}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>Nicht gefunden</div>
                </div>
              </div>

              {parsed.errors.length > 0 && (
                <div style={{ background: '#ff525210', border: '1px solid #ff525230', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> Nicht gefunden:</div>
                  {parsed.errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: 11, color: C.textFaint }}>{e}</div>)}
                  {parsed.errors.length > 5 && <div style={{ fontSize: 11, color: C.textFaint }}>... und {parsed.errors.length - 5} weitere</div>}
                </div>
              )}

              <div style={{ background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                {parsed.rows.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: i < Math.min(parsed.rows.length, 8) - 1 ? `1px solid ${C.line}` : 'none' }}>
                    {r.match ? <CheckCircle size={13} style={{ color: C.green2, flexShrink: 0 }} /> : <AlertTriangle size={13} style={{ color: C.red, flexShrink: 0 }} />}
                    <div style={{ flex: 1, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: r.match ? C.text : C.textFaint }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: C.textFaint }}>{r.cond} ×{r.qty}{r.location ? ` · ${r.location}` : ''}</div>
                  </div>
                ))}
                {parsed.rows.length > 8 && <div style={{ padding: '6px 12px', fontSize: 11, color: C.textFaint, textAlign: 'center' }}>... und {parsed.rows.length - 8} weitere</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.lineStrong}`, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontSize: 13, cursor: 'pointer' }}>
            Abbrechen
          </button>
          <button onClick={handleImport} disabled={!parsed || matchedCount === 0 || importing}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: parsed && matchedCount > 0 ? 'linear-gradient(135deg,#34d399,#059669)' : C.bg1, color: parsed && matchedCount > 0 ? '#fff' : C.textFaint, fontSize: 13, fontWeight: 700, cursor: parsed && matchedCount > 0 ? 'pointer' : 'default' }}>
            {matchedCount > 0 ? `${matchedCount} Karten zur Sammlung hinzufügen` : 'Karten importieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
