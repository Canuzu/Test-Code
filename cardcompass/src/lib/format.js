const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

// Cents → "12,99 €"
export const money = (cents) => (Number.isFinite(cents) ? eur.format(cents / 100) : '–');

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const pct = (a, b) => (a && b && b > a ? Math.round((1 - a / b) * 100) : 0);

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const slugify = (s) => String(s || '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
