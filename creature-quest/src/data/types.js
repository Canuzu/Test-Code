// Die 6 Elementtypen der Naturwelt + Stärke-/Schwäche-Matrix.
// Multiplikatoren: 2 = sehr effektiv, 0.5 = nicht sehr effektiv, 1 = normal.

export const TYPES = {
  feuer:   { name: 'Feuer',   color: '#ff7043', dark: '#bf360c', icon: '🔥' },
  wasser:  { name: 'Wasser',  color: '#42a5f5', dark: '#0d47a1', icon: '💧' },
  pflanze: { name: 'Pflanze', color: '#66bb6a', dark: '#1b5e20', icon: '🌿' },
  elektro: { name: 'Elektro', color: '#ffca28', dark: '#f57f17', icon: '⚡' },
  erde:    { name: 'Erde',    color: '#a1887f', dark: '#4e342e', icon: '⛰️' },
  luft:    { name: 'Luft',    color: '#90caf9', dark: '#1976d2', icon: '🌪️' },
};

// chart[angriff][verteidiger] = Multiplikator (nur Abweichungen von 1 gelistet).
const chart = {
  feuer:   { pflanze: 2, luft: 2, wasser: 0.5, erde: 0.5, feuer: 0.5 },
  wasser:  { feuer: 2, erde: 2, pflanze: 0.5, elektro: 0.5, wasser: 0.5 },
  pflanze: { wasser: 2, erde: 2, feuer: 0.5, luft: 0.5, pflanze: 0.5 },
  elektro: { wasser: 2, luft: 2, erde: 0.5, pflanze: 0.5 },
  erde:    { feuer: 2, elektro: 2, pflanze: 0.5, luft: 0.5 },
  luft:    { pflanze: 2, erde: 2, elektro: 0.5 },
};

export function typeMultiplier(atkType, defType) {
  const row = chart[atkType];
  if (!row) return 1;
  return row[defType] ?? 1;
}

// Liefert die Typen einer Spezies als Array (1 oder 2 Einträge, für Doppeltypen).
export function speciesTypes(sp) {
  return sp.type2 ? [sp.type, sp.type2] : [sp.type];
}

// Gesamteffektivität einer Attacke gegen eine (ggf. doppeltypige) Spezies:
// Multiplikatoren beider Verteidigertypen werden multipliziert.
export function combinedMultiplier(atkType, defTypes) {
  return defTypes.reduce((acc, t) => acc * typeMultiplier(atkType, t), 1);
}

// Liefert eine kurze Beschreibung der Effektivität (für Kampf-Log).
export function effectivenessLabel(mult) {
  if (mult >= 2) return 'Sehr effektiv!';
  if (mult > 1) return 'Effektiv!';
  if (mult === 0) return 'Wirkungslos…';
  if (mult < 1) return 'Nicht sehr effektiv…';
  return '';
}

export const TYPE_KEYS = Object.keys(TYPES);
