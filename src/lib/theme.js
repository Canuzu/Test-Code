// Central design tokens so colours stay consistent across components.
export const C = {
  bg0: '#0a0a18',
  bg1: '#0e0e22',
  bg2: '#12122a',
  surface: '#1a1a2e',
  surface2: '#161630',
  line: '#252540',
  lineStrong: '#2a2a4a',
  text: '#e8e8f0',
  textSoft: '#aaaacc',
  textDim: '#8888aa',
  textFaint: '#666688',
  textGhost: '#444466',
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

// Semantic helpers --------------------------------------------------------
export const trendColor = (t) => ({ rising: C.green, stable: C.gold, falling: C.red }[t] || C.textDim);
export const trendIcon = (t) => ({ rising: '↑', stable: '→', falling: '↓' }[t] || '→');
export const trendLabel = (t) => ({ rising: 'Steigend', stable: 'Stabil', falling: 'Fallend' }[t] || 'Stabil');

export const riskColor = (r) => ({ low: C.green, medium: C.gold, high: C.red }[r] || C.textDim);
export const riskLabel = (r) => ({ low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }[r] || 'Mittel');

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
