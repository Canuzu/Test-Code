// Die 11 Elementtypen der Naturwelt + Stärke-/Schwäche-Matrix.
// Multiplikatoren: 2 = sehr effektiv, 0.5 = nicht sehr effektiv, 0 = immun, 1 = normal.

export const TYPES = {
  feuer:   { name: 'Feuer',   color: '#ff7043', dark: '#bf360c', icon: '🔥' },
  wasser:  { name: 'Wasser',  color: '#42a5f5', dark: '#0d47a1', icon: '💧' },
  pflanze: { name: 'Pflanze', color: '#66bb6a', dark: '#1b5e20', icon: '🌿' },
  elektro: { name: 'Elektro', color: '#ffca28', dark: '#f57f17', icon: '⚡' },
  erde:    { name: 'Erde',    color: '#a1887f', dark: '#4e342e', icon: '⛰️' },
  luft:    { name: 'Luft',    color: '#90caf9', dark: '#1976d2', icon: '🌪️' },
  normal:  { name: 'Normal',  color: '#a8a890', dark: '#6d6d4e', icon: '⭐' },
  geist:   { name: 'Geist',   color: '#7a5fc0', dark: '#4a2b6e', icon: '👻' },
  psycho:  { name: 'Psycho',  color: '#f85888', dark: '#c41e3a', icon: '🔮' },
  eis:     { name: 'Eis',     color: '#98d8d8', dark: '#3d6d6d', icon: '❄️' },
  drache:  { name: 'Drache',  color: '#6c30f0', dark: '#4a148c', icon: '🐉' },
};

// chart[angriff][verteidiger] = Multiplikator (nur Abweichungen von 1 gelistet).
const chart = {
  feuer:   { pflanze: 2, eis: 2,                  wasser: 0.5, erde: 0.5, feuer: 0.5, drache: 0.5 },
  wasser:  { feuer: 2, erde: 2,                   pflanze: 0.5, elektro: 0.5, wasser: 0.5 },
  pflanze: { wasser: 2, erde: 2,                  feuer: 0.5, luft: 0.5, pflanze: 0.5 },
  elektro: { wasser: 2, luft: 2,                  erde: 0.5, pflanze: 0.5 },
  erde:    { feuer: 2, elektro: 2,                pflanze: 0.5, luft: 0.5 },
  luft:    { pflanze: 2, erde: 2,                 elektro: 0.5 },
  normal:  { geist: 0 },
  geist:   { geist: 2, psycho: 2,                 normal: 0, drache: 0.5 },
  psycho:  { normal: 2, erde: 2,                  geist: 0.5, drache: 0.5, psycho: 0.5 },
  eis:     { drache: 2, luft: 2, pflanze: 2,      feuer: 0.5, erde: 0.5, eis: 0.5 },
  drache:  { drache: 2,                           eis: 0.5 },
};

export function typeMultiplier(atkType, defType) {
  const row = chart[atkType];
  if (!row) return 1;
  return row[defType] ?? 1;
}

export function speciesTypes(sp) {
  return sp.type2 ? [sp.type, sp.type2] : [sp.type];
}

export function combinedMultiplier(atkType, defTypes) {
  return defTypes.reduce((acc, t) => acc * typeMultiplier(atkType, t), 1);
}

export function effectivenessLabel(mult) {
  if (mult >= 2) return 'Sehr effektiv!';
  if (mult > 1) return 'Effektiv!';
  if (mult === 0) return 'Wirkungslos…';
  if (mult < 1) return 'Nicht sehr effektiv…';
  return '';
}

export const TYPE_KEYS = Object.keys(TYPES);
