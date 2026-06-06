// Gegenstände für den Beutel und den Laden.
// kind: 'ball' (fangen), 'heal' (HP heilen), 'revive' (besiegte beleben).

export const ITEMS = {
  trank:        { name: 'Trank',        kind: 'heal',   amount: 30,  price: 50,  icon: '🧪', desc: 'Heilt 30 HP.' },
  supertrank:   { name: 'Supertrank',   kind: 'heal',   amount: 80,  price: 150, icon: '🧴', desc: 'Heilt 80 HP.' },
  hypertrank:   { name: 'Hypertrank',   kind: 'heal',   amount: 200, price: 400, icon: '⚗️', desc: 'Heilt 200 HP.' },
  beleber:      { name: 'Beleber',      kind: 'revive', ratio: 0.5,  price: 300, icon: '✨', desc: 'Belebt eine besiegte Kreatur (50% HP).' },

  fangkugel:    { name: 'Fangkugel',    kind: 'ball', ballBonus: 1.0, price: 30,  icon: '🟡', desc: 'Einfache Kugel zum Fangen.' },
  superkugel:   { name: 'Superkugel',   kind: 'ball', ballBonus: 1.6, price: 120, icon: '🔵', desc: 'Bessere Fangchance.' },
  hyperkugel:   { name: 'Hyperkugel',   kind: 'ball', ballBonus: 2.4, price: 400, icon: '🟣', desc: 'Höchste Fangchance.' },
};

// Reihenfolge im Laden.
export const SHOP_ITEMS = ['fangkugel', 'superkugel', 'hyperkugel', 'trank', 'supertrank', 'hypertrank', 'beleber'];

export const STARTER_BAG = { fangkugel: 10, trank: 3 };
export const STARTER_MONEY = 250;
