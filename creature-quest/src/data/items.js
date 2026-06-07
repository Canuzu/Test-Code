// Items: Heilung, Statusheiler, Fangkugeln. Werden im Beutel (bag) als
// { itemId: anzahl } gehalten. `category` steuert die Verwendbarkeit,
// `price` den Verkauf im Shop.

export const ITEMS = {
  // ── Fangkugeln ──
  pokeball:  { name: 'Fangkugel',  icon: '◎', category: 'ball', ballBonus: 1.0, price: 200,
               desc: 'Eine einfache Kugel zum Fangen wilder Kreaturen.' },
  greatball: { name: 'Superkugel', icon: '◉', category: 'ball', ballBonus: 1.5, price: 600,
               desc: 'Bessere Fangrate als die Fangkugel.' },
  ultraball: { name: 'Hyperkugel', icon: '⊛', category: 'ball', ballBonus: 2.0, price: 1200,
               desc: 'Hohe Fangrate für seltene Kreaturen.' },

  // ── Heilung (HP) ──
  potion:      { name: 'Trank',      icon: '🧪', category: 'heal', heal: 30,  price: 300,
                 desc: 'Stellt 30 KP einer Kreatur wieder her.' },
  superpotion: { name: 'Supertrank', icon: '🧪', category: 'heal', heal: 70,  price: 700,
                 desc: 'Stellt 70 KP wieder her.' },
  hyperpotion: { name: 'Hypertrank', icon: '⚗️', category: 'heal', heal: 150, price: 1500,
                 desc: 'Stellt 150 KP wieder her.' },
  revive:      { name: 'Beleber',    icon: '✨', category: 'revive', reviveRatio: 0.5, price: 2000,
                 desc: 'Belebt eine besiegte Kreatur mit halben KP.' },

  // ── Statusheiler ──
  antidote:    { name: 'Gegengift',  icon: '💊', category: 'status', cures: 'poison',    price: 150,
                 desc: 'Heilt Vergiftung.' },
  burnheal:    { name: 'Brandsalbe', icon: '🧴', category: 'status', cures: 'burn',      price: 250,
                 desc: 'Heilt Verbrennung.' },
  paraheal:    { name: 'Para-Heiler',icon: '💉', category: 'status', cures: 'paralysis', price: 200,
                 desc: 'Heilt Lähmung.' },
  fullheal:    { name: 'Hyperheiler',icon: '🌟', category: 'status', cures: 'all',       price: 600,
                 desc: 'Heilt alle Statusprobleme.' },
};

export const BALL_IDS = ['pokeball', 'greatball', 'ultraball'];

// Was im Shop angeboten wird (Reihenfolge = Anzeige).
export const SHOP_STOCK = [
  'pokeball', 'greatball', 'ultraball',
  'potion', 'superpotion', 'hyperpotion', 'revive',
  'antidote', 'burnheal', 'paraheal', 'fullheal',
];

export function itemData(id) {
  return ITEMS[id];
}

// Leerer Standard-Beutel mit Startausstattung.
export function startingBag() {
  return { pokeball: 10, potion: 3 };
}

// Gesamtzahl der Fangkugeln (für Anzeigen).
export function totalBalls(bag) {
  return BALL_IDS.reduce((sum, id) => sum + (bag[id] || 0), 0);
}
