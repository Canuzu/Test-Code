// Central design tokens. `C` is a single mutable palette object: components
// read C.xxx at render time, and applyTheme() swaps the neutral tokens in place
// for light/dark. Accent colours stay the same in both themes (alpha-hex
// concatenation like `C.gold + '22'` keeps working because values stay hex).

const ACCENTS = {
  gold: '#ffd700',
  gold2: '#ff9500',
  orange: '#ff6b35',
  green: '#00e676',
  green2: '#34d399',
  red: '#ff5252',
  blue: '#448aff',
  purple: '#c084fc',
  pink: '#ff3d7f',
};

const DARK = {
  bg0: '#0a0a18',
  bg1: '#0e0e22',
  bg2: '#12122a',
  surface: '#1a1a2e',
  surface2: '#161630',
  line: '#2c2c4e',
  lineStrong: '#36365e',
  text: '#f0f0f8',
  textSoft: '#c2c2e4',
  textDim: '#9f9fc6',
  textFaint: '#8585aa',
  textGhost: '#5e5e84',
  overlay: 'rgba(255,255,255,0.05)',
  overlayStrong: 'rgba(255,255,255,0.09)',
  headerBg: 'rgba(14,14,32,0.6)',
  appGrad1: '#0a0a18',
  appGrad2: '#120820',
};

const LIGHT = {
  bg0: '#f3f4fb',
  bg1: '#ffffff',
  bg2: '#eceef7',
  surface: '#ffffff',
  surface2: '#f6f7fc',
  line: '#dde1ee',
  lineStrong: '#c8cee0',
  text: '#14162a',
  textSoft: '#3e4360',
  textDim: '#565b78',
  textFaint: '#787da0',
  textGhost: '#a2a7c4',
  overlay: 'rgba(20,22,45,0.04)',
  overlayStrong: 'rgba(20,22,45,0.07)',
  headerBg: 'rgba(255,255,255,0.78)',
  appGrad1: '#f3f4fb',
  appGrad2: '#e9ebf7',
};

export const C = { ...ACCENTS, ...DARK };

export const applyTheme = (name) => {
  Object.assign(C, name === 'light' ? LIGHT : DARK);
};


// Semantic helpers --------------------------------------------------------
export const trendColor = (t) => ({ rising: C.green, stable: C.gold, falling: C.red }[t] || C.textDim);
export const trendIcon = (t) => ({ rising: '↑', stable: '→', falling: '↓' }[t] || '→');
export const trendLabel = (t) => ({ rising: 'Steigend', stable: 'Stabil', falling: 'Fallend' }[t] || 'Stabil');

export const riskColor = (r) => ({ low: C.green, medium: C.gold, high: C.red }[r] || C.textDim);
export const riskLabel = (r) => ({ low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }[r] || 'Mittel');
// Grammatically correct full German phrase, e.g. "Hohes Risiko" (not "Hoches").
export const riskPhrase = (r) => ({ low: 'Niedriges Risiko', medium: 'Mittleres Risiko', high: 'Hohes Risiko' }[r] || 'Mittleres Risiko');
// Dative neuter adjective for sentences like "… bei hohem Risiko".
export const riskAdjDative = (r) => ({ low: 'niedrigem', medium: 'mittlerem', high: 'hohem' }[r] || 'mittlerem');

// Cardmarket-style rarity buckets -> accent colours.
export const rarityColor = (r) => {
  const x = (r || '').toLowerCase();
  if (x.includes('illustration') || x.includes('special') || x.includes('hyper') || x.includes('secret')) return C.pink;
  if (x.includes('ultra') || x.includes('vmax') || x.includes('vstar') || x.includes('ex') || x.includes('gx')) return C.gold;
  if (x.includes('holo') || x.includes('rare')) return C.blue;
  if (x.includes('uncommon')) return C.green2;
  return C.textDim;
};

// Diverging colour for a percentage change (green up / red down / grey flat).
export const changeColor = (v) => {
  if (v == null || Number.isNaN(v)) return C.textDim;
  if (v > 0.5) return C.green;
  if (v < -0.5) return C.red;
  return C.textDim;
};

// Condition quality scale: M (Mint, purple) → NM (green) → … → PO (red). Fixed
// hex so the gradient stays stable in both light and dark themes. Mint is the
// top grade and gets its own distinct purple so it stands out from Near Mint.
export const CONDITION_COLORS = {
  M: '#c084fc',  // Mint – purple (best, distinct highlight)
  NM: '#00e676', // green
  EX: '#9ccc65', // yellow-green
  GD: '#ffd700', // yellow
  LP: '#ffa726', // orange
  PL: '#ff7043', // deep orange
  PO: '#ff5252', // red
};
export const conditionColor = (c) => CONDITION_COLORS[(c || '').toUpperCase()] || C.textDim;
