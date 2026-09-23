/* Zeit und Zahlen in Worten, so wie der Prototyp sie zeigt. */
export const TAG_MS = 864e5;

export const TAGE = [['mo', 'Mo'], ['di', 'Di'], ['mi', 'Mi'], ['do', 'Do'], ['fr', 'Fr'], ['sa', 'Sa'], ['so', 'So']] as const;
export type Tag = typeof TAGE[number][0];
export const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ZAHLWORT = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

/* getDay()-Nummer eines Kürzels: so = 0, mo = 1 … sa = 6. */
export const tagNummer = (k: Tag) => (TAGE.findIndex((t) => t[0] === k) + 1) % 7;
export const tagName = (k: Tag) => TAGE.find((t) => t[0] === k)?.[1] ?? k;

/* Montag, null Uhr, der Woche, in der t liegt. */
export function wochenStart(t: number = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export const datumText = (t: number) => { const d = new Date(t); return d.getDate() + '. ' + MONATE[d.getMonth()]; };
export const monatText = (t: number) => { const d = new Date(t); return MONATE[d.getMonth()] + ' ' + d.getFullYear(); };

export function fmtZeit(s: number) {
  const g = Math.max(0, Math.floor(s)), m = Math.floor(g / 60), r = g % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

export function minutenText(sek: number) {
  const m = Math.max(1, Math.round(sek / 60));
  return (ZAHLWORT[m] ?? String(m)) + (m === 1 ? ' Minute' : ' Minuten');
}

export const WIE_OFT = ['Kein Tag gewählt', 'Einmal die Woche', 'Zweimal die Woche', 'Dreimal die Woche',
  'Viermal die Woche', 'Fünfmal die Woche', 'Sechsmal die Woche', 'Jeden Tag'];

/* Die Zeile über der Begrüßung: Wochentag und nächster Trainingstag. */
export function heuteZeile(tage: Tag[], an: boolean) {
  const heute = new Date().getDay(), tag = WOCHENTAGE[heute];
  if (!an || !tage.length) return tag;
  const plan = tage.map(tagNummer);
  if (plan.includes(heute)) return tag + ', Trainingstag';
  for (let i = 1; i < 7; i++) {
    const d = (heute + i) % 7;
    if (plan.includes(d)) return tag + (i === 1 ? ', morgen Training' : ', Training am ' + WOCHENTAGE[d]);
  }
  return tag;
}

export const ohneTrennung = (t: string) => t.replace(/­/g, '');

export function erinnerungText(e: { an: boolean; tage: Tag[]; zeit: string }) {
  if (!e.an || !e.tage.length) return 'Aus';
  return e.tage.map(tagName).join(' + ') + ', ' + e.zeit;
}
