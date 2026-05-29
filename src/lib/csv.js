// Tiny dependency-free CSV parser + column auto-mapping for the mass importer.
// Handles quoted fields, escaped quotes, and auto-detects the , ; or tab
// delimiter (German exports often use ;).

export const parseCSV = (text) => {
  const clean = String(text || '').replace(/\r\n?/g, '\n').replace(/^﻿/, '').trim();
  if (!clean) return { headers: [], rows: [], delim: ',' };

  const firstLine = clean.slice(0, clean.indexOf('\n') >= 0 ? clean.indexOf('\n') : clean.length);
  const counts = { ';': (firstLine.match(/;/g) || []).length, '\t': (firstLine.match(/\t/g) || []).length, ',': (firstLine.match(/,/g) || []).length };
  const delim = counts[';'] > counts[','] ? ';' : counts['\t'] > counts[','] ? '\t' : ',';

  const rows = [];
  let field = '';
  let row = [];
  let inQ = false;
  let i = 0;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };

  while (i < clean.length) {
    const ch = clean[i];
    if (inQ) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === delim) { pushField(); i++; continue; }
    if (ch === '\n') { pushField(); pushRow(); i++; continue; }
    field += ch; i++;
  }
  pushField();
  if (row.length > 1 || (row[0] || '').trim() !== '') pushRow();

  const headers = (rows.shift() || []).map((h) => h.trim());
  return { headers, rows: rows.filter((r) => r.some((c) => (c || '').trim() !== '')), delim };
};

const FIELD_ALIASES = {
  id: ['id', 'cardid', 'card id'],
  name: ['name', 'karte', 'card', 'kartenname', 'card name'],
  set: ['set', 'edition', 'expansion', 'serie'],
  number: ['number', 'nummer', 'nr', 'no', 'card number', 'kartennummer', 'collector number', 'cardnumber'],
  quantity: ['quantity', 'menge', 'anzahl', 'qty', 'count', 'stück', 'stueck'],
  price: ['price', 'preis', 'ek', 'einkauf', 'buy', 'buyprice', 'cost', 'kaufpreis', 'ek_pro_stueck', 'einkaufspreis'],
  condition: ['condition', 'zustand', 'cond', 'grade'],
  location: ['location', 'lagerort', 'ort', 'storage', 'platz', 'fach'],
};

// Maps each known field to a header index by alias match.
export const detectMapping = (headers) => {
  const map = {};
  headers.forEach((h, i) => {
    const key = (h || '').toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (map[field] == null && aliases.includes(key)) map[field] = i;
    }
  });
  return map;
};

export const TEMPLATE = 'Name,Set,Nummer,Menge,Preis,Zustand,Lagerort\nGlurak ex,Pokémon 151,199,1,159.00,NM,Vitrine A\nNachtara VMAX,Himmelsscheibe,215,2,540.00,NM,Tresor\n';
