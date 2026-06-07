// Attacken. Jede Attacke hat Typ, Stärke (power) und Genauigkeit (acc, 0-100).
// power 0 = Status-Attacke.

export const MOVES = {
  // ── Normal ───────────────────────────────────────────────────────────────
  rempler:      { name: 'Rempler',       type: 'normal',  power: 35,  acc: 100, pp: 35 },
  kratzer:      { name: 'Kratzer',       type: 'normal',  power: 40,  acc: 100, pp: 35 },
  biss:         { name: 'Biss',          type: 'normal',  power: 55,  acc: 100, pp: 25 },
  normalklinge: { name: 'Normalklinge',  type: 'normal',  power: 50,  acc: 100, pp: 25 },
  zornhieb:     { name: 'Zornhieb',      type: 'normal',  power: 75,  acc: 100, pp: 15 },
  stampede:     { name: 'Stampede',      type: 'normal',  power: 90,  acc: 85,  pp: 10 },

  // ── Feuer ────────────────────────────────────────────────────────────────
  funkenflug:   { name: 'Funkenflug',    type: 'feuer',   power: 40,  acc: 100, pp: 25 },
  flammenstoss: { name: 'Flammenstoß',   type: 'feuer',   power: 65,  acc: 95,  pp: 15, sideEffect: { status: 'burn', chance: 0.10 } },
  feuersturm:   { name: 'Feuersturm',    type: 'feuer',   power: 95,  acc: 85,  pp: 10, sideEffect: { status: 'burn', chance: 0.10 } },

  // ── Wasser ───────────────────────────────────────────────────────────────
  spritzer:     { name: 'Spritzer',      type: 'wasser',  power: 40,  acc: 100, pp: 25 },
  aquastoss:    { name: 'Aquastoß',      type: 'wasser',  power: 65,  acc: 95,  pp: 15 },
  flutwelle:    { name: 'Flutwelle',     type: 'wasser',  power: 95,  acc: 85,  pp: 10 },

  // ── Pflanze ──────────────────────────────────────────────────────────────
  rankenhieb:   { name: 'Rankenhieb',    type: 'pflanze', power: 40,  acc: 100, pp: 25 },
  blattklinge:  { name: 'Blattklinge',   type: 'pflanze', power: 65,  acc: 95,  pp: 15 },
  solarschlag:  { name: 'Solarschlag',   type: 'pflanze', power: 95,  acc: 85,  pp: 10 },
  schlafpuder:  { name: 'Schlafpuder',   type: 'pflanze', power: 0,   acc: 75,  pp: 15, effect: 'sleep' },
  giftspore:    { name: 'Giftspore',     type: 'pflanze', power: 0,   acc: 85,  pp: 15, effect: 'poison' },

  // ── Elektro ──────────────────────────────────────────────────────────────
  schock:       { name: 'Schock',        type: 'elektro', power: 40,  acc: 100, pp: 30, sideEffect: { status: 'paralysis', chance: 0.10 } },
  stromstoss:   { name: 'Stromstoß',     type: 'elektro', power: 65,  acc: 95,  pp: 15, sideEffect: { status: 'paralysis', chance: 0.10 } },
  donnerschlag: { name: 'Donnerschlag',  type: 'elektro', power: 95,  acc: 80,  pp: 10, sideEffect: { status: 'paralysis', chance: 0.30 } },

  // ── Erde ─────────────────────────────────────────────────────────────────
  steinwurf:    { name: 'Steinwurf',     type: 'erde',    power: 40,  acc: 100, pp: 25 },
  erdbrocken:   { name: 'Erdbrocken',    type: 'erde',    power: 65,  acc: 95,  pp: 15 },
  bebenstoss:   { name: 'Bebenstoß',     type: 'erde',    power: 95,  acc: 85,  pp: 10 },

  // ── Luft ─────────────────────────────────────────────────────────────────
  windstoss:    { name: 'Windstoß',      type: 'luft',    power: 40,  acc: 100, pp: 35 },
  sturmboee:    { name: 'Sturmböe',      type: 'luft',    power: 65,  acc: 95,  pp: 15 },
  orkan:        { name: 'Orkan',         type: 'luft',    power: 95,  acc: 80,  pp: 10 },

  // ── Geist ────────────────────────────────────────────────────────────────
  schattenhieb:  { name: 'Schattenhieb', type: 'geist',   power: 40,  acc: 100, pp: 30 },
  geisterpuls:   { name: 'Geisterpuls',  type: 'geist',   power: 65,  acc: 90,  pp: 15 },
  schattensturm: { name: 'Schattensturm',type: 'geist',   power: 90,  acc: 80,  pp: 10 },
  lebensentzug:  { name: 'Lebensentzug', type: 'geist',   power: 60,  acc: 90,  pp: 10, effect: 'drain' },

  // ── Psycho ───────────────────────────────────────────────────────────────
  gedankendruck: { name: 'Gedankendruck',type: 'psycho',  power: 40,  acc: 100, pp: 30 },
  psistrahl:     { name: 'Psistrahl',    type: 'psycho',  power: 65,  acc: 90,  pp: 15 },
  psychokanone:  { name: 'Psychokanone', type: 'psycho',  power: 90,  acc: 85,  pp: 10 },

  // ── Eis ──────────────────────────────────────────────────────────────────
  frosthauch:   { name: 'Frosthauch',    type: 'eis',     power: 40,  acc: 100, pp: 30 },
  eisklinge:    { name: 'Eisklinge',     type: 'eis',     power: 65,  acc: 90,  pp: 15 },
  blizzard:     { name: 'Blizzard',      type: 'eis',     power: 90,  acc: 80,  pp: 10 },

  // ── Drache ───────────────────────────────────────────────────────────────
  drachenzahn:    { name: 'Drachenzahn',   type: 'drache',  power: 40,  acc: 100, pp: 30 },
  drachenschwanz: { name: 'Drachenschwanz',type: 'drache',  power: 65,  acc: 90,  pp: 15 },
  drachenwetter:  { name: 'Drachenwetter', type: 'drache',  power: 90,  acc: 85,  pp: 10 },

  // ── Status ───────────────────────────────────────────────────────────────
  staerken:     { name: 'Stärken',       type: 'normal',  power: 0,   acc: 100, pp: 30, effect: 'raise_atk' },
  panzern:      { name: 'Panzern',       type: 'normal',  power: 0,   acc: 100, pp: 30, effect: 'raise_def' },
};

// Standard-Attacken-Sets je Typ und Entwicklungsstufe (1-3).
export const TYPE_MOVE_TIERS = {
  feuer:   ['funkenflug',   'flammenstoss',  'feuersturm'],
  wasser:  ['spritzer',     'aquastoss',     'flutwelle'],
  pflanze: ['rankenhieb',   'blattklinge',   'solarschlag'],
  elektro: ['schock',       'stromstoss',    'donnerschlag'],
  erde:    ['steinwurf',    'erdbrocken',    'bebenstoss'],
  luft:    ['windstoss',    'sturmboee',     'orkan'],
  normal:  ['normalklinge', 'zornhieb',      'stampede'],
  geist:   ['schattenhieb', 'geisterpuls',   'schattensturm'],
  psycho:  ['gedankendruck','psistrahl',     'psychokanone'],
  eis:     ['frosthauch',   'eisklinge',     'blizzard'],
  drache:  ['drachenzahn',  'drachenschwanz','drachenwetter'],
};
