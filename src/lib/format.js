// German-locale formatting helpers. All money is EUR (Cardmarket market).

const eur0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtEur = (v, decimals = 2) => {
  if (v == null || Number.isNaN(v)) return '–';
  return (decimals === 0 ? eur0 : eur2).format(v);
};

export const fmtUsd = (v) => {
  if (v == null || Number.isNaN(v)) return '–';
  return usd2.format(v);
};

// Format a value in EUR or USD depending on the venue currency.
export const fmtMoney = (v, currency = 'EUR') => (currency === 'USD' ? fmtUsd(v) : fmtEur(v));

export const fmtNum = (v, decimals = 0) => {
  if (v == null || Number.isNaN(v)) return '–';
  return (decimals === 0 ? num0 : num1).format(v);
};

// Signed percentage, e.g. "+4,2 %" / "-1,8 %"
export const fmtPct = (v, decimals = 1, signed = true) => {
  if (v == null || Number.isNaN(v)) return '–';
  const sign = signed && v > 0 ? '+' : '';
  return `${sign}${(decimals === 0 ? num0 : num1).format(v)} %`;
};

export const fmtDate = (ts) => {
  if (!ts) return '–';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtDateTime = (ts) => {
  if (!ts) return '–';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return '–';
  return `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
};

// "vor 3 Tagen", "vor 2 Std." – compact relative time in German.
export const fmtRelative = (ts) => {
  if (!ts) return '–';
  const diff = Date.now() - (ts instanceof Date ? ts.getTime() : ts);
  const min = Math.round(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  return fmtDate(ts);
};
