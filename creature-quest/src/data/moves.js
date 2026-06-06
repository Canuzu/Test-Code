// Attacken. Jede Attacke hat Typ, Stärke (power) und Genauigkeit (acc, 0-100).
// power 0 = Status-Attacke. effect optional ('heal', 'lower_def' ...).

export const MOVES = {
  // Normale Attacken (jeder lernt eine davon)
  rempler:    { name: 'Rempler',     type: 'normal',  power: 35, acc: 100 },
  kratzer:    { name: 'Kratzer',     type: 'normal',  power: 40, acc: 100 },
  biss:       { name: 'Biss',        type: 'normal',  power: 55, acc: 100 },

  // Feuer
  funkenflug:   { name: 'Funkenflug',   type: 'feuer',   power: 40, acc: 100 },
  flammenstoss: { name: 'Flammenstoß',  type: 'feuer',   power: 65, acc: 95 },
  feuersturm:   { name: 'Feuersturm',   type: 'feuer',   power: 95, acc: 85 },

  // Wasser
  spritzer:   { name: 'Spritzer',    type: 'wasser',  power: 40, acc: 100 },
  aquastoss:  { name: 'Aquastoß',    type: 'wasser',  power: 65, acc: 95 },
  flutwelle:  { name: 'Flutwelle',   type: 'wasser',  power: 95, acc: 85 },

  // Pflanze
  rankenhieb: { name: 'Rankenhieb',  type: 'pflanze', power: 40, acc: 100 },
  blattklinge:{ name: 'Blattklinge', type: 'pflanze', power: 65, acc: 95 },
  solarschlag:{ name: 'Solarschlag', type: 'pflanze', power: 95, acc: 85 },

  // Elektro
  schock:     { name: 'Schock',      type: 'elektro', power: 40, acc: 100 },
  stromstoss: { name: 'Stromstoß',   type: 'elektro', power: 65, acc: 95 },
  donnerschlag:{ name: 'Donnerschlag',type: 'elektro', power: 95, acc: 80 },

  // Erde
  steinwurf:  { name: 'Steinwurf',   type: 'erde',    power: 40, acc: 100 },
  erdbrocken: { name: 'Erdbrocken',  type: 'erde',    power: 65, acc: 95 },
  bebenstoss: { name: 'Bebenstoß',   type: 'erde',    power: 95, acc: 85 },

  // Luft
  windstoss:  { name: 'Windstoß',    type: 'luft',    power: 40, acc: 100 },
  sturmboee:  { name: 'Sturmböe',    type: 'luft',    power: 65, acc: 95 },
  orkan:      { name: 'Orkan',       type: 'luft',    power: 95, acc: 80 },

  // Status
  staerken:   { name: 'Stärken',     type: 'normal',  power: 0,  acc: 100, effect: 'raise_atk' },
  panzern:    { name: 'Panzern',     type: 'normal',  power: 0,  acc: 100, effect: 'raise_def' },
};

// Standard-Attacken-Sets je Typ und Entwicklungsstufe (1-3).
// Wird in creatures.js zum Befüllen der Lernsätze genutzt.
export const TYPE_MOVE_TIERS = {
  feuer:   ['funkenflug', 'flammenstoss', 'feuersturm'],
  wasser:  ['spritzer', 'aquastoss', 'flutwelle'],
  pflanze: ['rankenhieb', 'blattklinge', 'solarschlag'],
  elektro: ['schock', 'stromstoss', 'donnerschlag'],
  erde:    ['steinwurf', 'erdbrocken', 'bebenstoss'],
  luft:    ['windstoss', 'sturmboee', 'orkan'],
};
