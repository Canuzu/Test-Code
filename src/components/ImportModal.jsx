import { useMemo, useState, useRef, useEffect } from 'react';
import { useDialog } from '../lib/useDialog.js';
import { X, Upload, FileText, ScanLine, Download, Camera } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur } from '../lib/format.js';
import { parseCSV, detectMapping, TEMPLATE } from '../lib/csv.js';
import { CardImage } from './ui.jsx';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const parseNum = (s) => { const v = parseFloat(String(s || '').replace(/\./g, (m, o, str) => (str.indexOf(',') > -1 ? '' : '.')).replace(',', '.')); return Number.isNaN(v) ? null : v; };
const CONDS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'];
const normCond = (s) => { const u = (s || '').toUpperCase().trim(); return CONDS.includes(u) ? u : 'NM'; };

const FIELDS = [
  ['name', 'Name *'], ['set', 'Set'], ['number', 'Nummer'], ['quantity', 'Menge'],
  ['price', 'Preis (EK)'], ['condition', 'Zustand'], ['location', 'Lagerort'], ['id', 'Karten-ID'],
];

export default function ImportModal({ onClose }) {
  const dialogRef = useDialog(onClose);
  const { cards, addManyToPortfolio, showToast } = useStore();
  const [tab, setTab] = useState('csv');
  const [text, setText] = useState('');
  const [mapping, setMapping] = useState({});

  const parsed = useMemo(() => parseCSV(text), [text]);
  useEffect(() => { if (parsed.headers.length) setMapping(detectMapping(parsed.headers)); }, [parsed.headers.join('|')]); // eslint-disable-line

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const matchRow = useMemo(() => (cells) => {
    const get = (f) => (mapping[f] != null ? (cells[mapping[f]] || '').trim() : '');
    const id = get('id');
    if (id && byId.has(id)) return byId.get(id);
    const name = norm(get('name'));
    if (!name) return null;
    const number = get('number').replace(/^0+/, '');
    const set = norm(get('set'));
    let cands = cards.filter((c) => norm(c.name).includes(name) || (c.nameEn && norm(c.nameEn).includes(name)) || (c.baseName && name.includes(norm(c.baseName))));
    if (number) { const f = cands.filter((c) => String(c.number).replace(/^0+/, '') === number); if (f.length) cands = f; }
    if (set) { const f = cands.filter((c) => norm(c.set).includes(set)); if (f.length) cands = f; }
    return cands[0] || null;
  }, [cards, byId, mapping]);

  const preview = useMemo(() => parsed.rows.map((cells) => {
    const get = (f) => (mapping[f] != null ? (cells[mapping[f]] || '').trim() : '');
    const card = matchRow(cells);
    return {
      card,
      name: get('name') || card?.name || '—',
      quantity: Math.max(1, parseInt(get('quantity'), 10) || 1),
      price: parseNum(get('price')),
      condition: normCond(get('condition')),
      location: get('location'),
    };
  }), [parsed.rows, mapping, matchRow]);

  const matched = preview.filter((p) => p.card);
  const unmatched = preview.filter((p) => !p.card);

  const doImport = () => {
    if (!matched.length) { showToast('Keine Karten zugeordnet'); return; }
    addManyToPortfolio(matched.map((p) => ({
      cardId: p.card.id,
      card: p.card,
      actualBuyPrice: p.price ?? p.card.prices?.low ?? p.card.prices?.market ?? 0,
      quantity: p.quantity,
      condition: p.condition,
      location: p.location,
    })));
    onClose();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  };
  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'import_vorlage.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label="Sammlung importieren" onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 760, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: 20, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>📥 Massenimport</div>
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16 }}>Hunderte Karten auf einmal in die Sammlung übernehmen</div>

        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.lineStrong}`, marginBottom: 16 }}>
          {[['csv', 'CSV-Import', <FileText size={13} key="f" />], ['barcode', 'Barcode-Scan', <ScanLine size={13} key="s" />]].map(([id, lbl, ic]) => (
            <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', background: 'none', color: tab === id ? C.gold : C.textFaint, borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent', cursor: 'pointer', fontWeight: tab === id ? 700 : 500, fontSize: 13, marginBottom: -1 }}>{ic}{lbl}</button>
          ))}
        </div>

        {tab === 'csv' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <label className="control" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Upload size={13} /> Datei wählen
                <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ display: 'none' }} />
              </label>
              <button className="control" onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Vorlage</button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: C.textFaint, alignSelf: 'center' }}>Trennzeichen automatisch erkannt ( , ; oder Tab )</span>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'…oder CSV hier einfügen:\n' + TEMPLATE}
              style={{ width: '100%', minHeight: 110, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 10, color: C.text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical', outline: 'none' }} />

            {parsed.headers.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 700, textTransform: 'uppercase', margin: '14px 0 8px' }}>Spalten zuordnen</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
                  {FIELDS.map(([field, lbl]) => (
                    <label key={field} style={{ fontSize: 10, color: C.textFaint }}>{lbl}
                      <select value={mapping[field] ?? ''} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                        style={{ width: '100%', marginTop: 3, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 12, outline: 'none' }}>
                        <option value="">—</option>
                        {parsed.headers.map((h, i) => <option key={i} value={i}>{h || `Spalte ${i + 1}`}</option>)}
                      </select>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, margin: '14px 0 10px', fontSize: 12.5 }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>✓ {matched.length} zugeordnet</span>
                  {unmatched.length > 0 && <span style={{ color: C.red, fontWeight: 700 }}>✕ {unmatched.length} ohne Treffer</span>}
                </div>

                <div style={{ maxHeight: 240, overflow: 'auto', border: `1px solid ${C.line}`, borderRadius: 8 }}>
                  {preview.slice(0, 100).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderBottom: i < Math.min(preview.length, 100) - 1 ? `1px solid ${C.line}` : 'none', opacity: p.card ? 1 : 0.55 }}>
                      {p.card ? <CardImage card={p.card} height={32} radius={3} /> : <span style={{ width: 23, textAlign: 'center' }}>❓</span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.card?.name || p.name}</div>
                        <div style={{ fontSize: 10, color: C.textFaint }}>{p.card ? p.card.set : 'kein Treffer im Datensatz'} · ×{p.quantity} · {p.condition}{p.location ? ` · 📍${p.location}` : ''}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{p.price != null ? fmtEur(p.price) : (p.card ? fmtEur(p.card.prices?.low ?? p.card.m?.market) : '–')}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button onClick={onClose} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', fontSize: 13 }}>Abbrechen</button>
                  <button className="btn-primary" onClick={doImport} disabled={!matched.length}>{matched.length} Karten importieren</button>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'barcode' && <BarcodeScanner cards={cards} addManyToPortfolio={addManyToPortfolio} showToast={showToast} onClose={onClose} />}
      </div>
    </div>
  );
}

// Progressive barcode scanner: uses the native BarcodeDetector where available.
function BarcodeScanner({ cards, addManyToPortfolio, showToast, onClose }) {
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!scanning || !supported) return;
    let detector;
    let cancelled = false;
    (async () => {
      try {
        detector = new window.BarcodeDetector();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes[0]?.rawValue) { setCode(codes[0].rawValue); setScanning(false); return; }
          } catch { /* keep trying */ }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        showToast('Kamera nicht verfügbar'); setScanning(false);
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, supported, showToast]);

  const q = norm(code);
  const matches = code ? cards.filter((c) => norm(c.name).includes(q) || String(c.number) === code.replace(/^0+/, '')).slice(0, 8) : [];

  if (!supported) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 16px', color: C.textDim }}>
        <Camera size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Barcode-Scan hier nicht unterstützt</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>Dein Browser hat keine <code>BarcodeDetector</code>-API. Nutze die App auf einem aktuellen Android-Chrome oder importiere stattdessen per CSV.<br />Tipp: Produkt-Barcodes (EAN) passen oft nicht zu Einzelkarten — die Karten­nummer ist zuverlässiger.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {scanning
          ? <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: 20 }}><ScanLine size={36} style={{ opacity: 0.5 }} /><div style={{ marginTop: 8 }}>Kamera ist aus</div></div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn-primary" onClick={() => setScanning((s) => !s)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Camera size={15} /> {scanning ? 'Scan stoppen' : 'Scan starten'}
        </button>
      </div>
      {code && (
        <div style={{ background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 8 }}>Erkannt: <strong style={{ color: C.gold }}>{code}</strong> · {matches.length} mögliche Karte(n)</div>
          {matches.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <CardImage card={c} height={34} radius={3} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10.5, color: C.textFaint }}>{c.set} · {fmtEur(c.m.market)}</div></div>
              <button className="control" onClick={() => { addManyToPortfolio([{ cardId: c.id, card: c, actualBuyPrice: c.prices?.low ?? c.m?.market ?? 0, quantity: 1, condition: 'NM' }]); onClose(); }}>+ Sammlung</button>
            </div>
          ))}
          {matches.length === 0 && <div style={{ fontSize: 12, color: C.textFaint }}>Kein Treffer — Code passt evtl. nicht zu einer Einzelkarte. Per CSV importieren.</div>}
        </div>
      )}
    </div>
  );
}
