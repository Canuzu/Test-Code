// Demo catalogue for the design preview and for local development without a
// Supabase connection. Mirrors the live shop's taxonomy (franchises +
// categories as on cardcompass.de) and the shape returned by catalog.js.
// Products are clearly generic demo items – no real stock, no real orders.

export const FRANCHISES = [
  { id: 'f-pokemon', slug: 'pokemon', name: 'Pokémon TCG', short: 'Pokémon', c1: '#ffcb05', c2: '#2a75bb' },
  { id: 'f-onepiece', slug: 'one-piece', name: 'One Piece Card Game', short: 'One Piece', c1: '#ff4d4d', c2: '#1d2b53' },
  { id: 'f-yugioh', slug: 'yu-gi-oh', name: 'Yu-Gi-Oh!', short: 'Yu-Gi-Oh!', c1: '#f5b638', c2: '#3b2370' },
  { id: 'f-magic', slug: 'magic', name: 'Magic: The Gathering', short: 'Magic', c1: '#ff8a3d', c2: '#22140b' },
  { id: 'f-digimon', slug: 'digimon', name: 'Digimon Card Game', short: 'Digimon', c1: '#38bdf8', c2: '#0c3a63' },
  { id: 'f-riftbound', slug: 'riftbound', name: 'Riftbound', short: 'Riftbound', c1: '#2dd4bf', c2: '#2a1b5e' },
  { id: 'f-cyberpunk', slug: 'cyberpunk', name: 'Cyberpunk TCG', short: 'Cyberpunk', c1: '#fde047', c2: '#111827' },
];

export const CATEGORIES = [
  { id: 'c-tc', slug: 'trading-cards', name: 'Trading Cards', parent_id: null },
  { id: 'c-disp', slug: 'booster-displays', name: 'Booster Displays', parent_id: 'c-tc' },
  { id: 'c-boost', slug: 'booster', name: 'Booster', parent_id: 'c-tc' },
  { id: 'c-start', slug: 'starter-decks', name: 'Starter Decks', parent_id: 'c-tc' },
  { id: 'c-box', slug: 'boxen-und-kollektionen', name: 'Boxen und Kollektionen', parent_id: 'c-tc' },
  { id: 'c-acc', slug: 'tcg-zubehoer', name: 'TCG-Zubehör', parent_id: null },
  { id: 'c-manga', slug: 'manga', name: 'Manga', parent_id: null },
  { id: 'c-merch', slug: 'anime-merchandise', name: 'Anime-Merchandise', parent_id: null },
  { id: 'c-fig', slug: 'figuren-und-sammlerartikel', name: 'Figuren und Sammlerartikel', parent_id: null },
  { id: 'c-digi', slug: 'digivice-und-virtual-pets', name: 'Digivice und Virtual Pets', parent_id: null },
  { id: 'c-gunpla', slug: 'gunpla-und-modellbausaetze', name: 'Gunpla und Modellbausätze', parent_id: null },
];

const F = Object.fromEntries(FRANCHISES.map((f) => [f.slug, f]));
const day = (n) => new Date(Date.UTC(2026, 10, 18) - n * 86400000).toISOString();

let seq = 0;
// p(franchise, category, kind, name, price €, opts)
function p(fr, cat, kind, name, price, o = {}) {
  seq += 1;
  const f = F[fr] || null;
  const id = `demo-${seq}`;
  const slug = `${(fr || 'zubehoer')}-${name}`.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const langs = o.langs || ['Deutsch'];
  return {
    id,
    slug,
    name,
    short_description: o.short || '',
    description: o.desc || '',
    is_featured: !!o.featured,
    published_at: day((o.age ?? seq) * 5), // spread over ~4 months; only the newest few get "Neu"
    franchise: f ? { slug: f.slug, name: f.name } : null,
    product_type: { name: o.type || kindLabel(kind) },
    category_slugs: [cat],
    variants: langs.map((lang, i) => ({
      id: `${id}-v${i}`,
      sku: `CC-${String(seq).padStart(4, '0')}-${lang.slice(0, 2).toUpperCase()}`,
      title: lang,
      language: lang,
      condition: 'Neu & versiegelt',
      price_cents: Math.round((price + (o.langDelta?.[i] || 0)) * 100),
      compare_at_price_cents: o.was ? Math.round(o.was * 100) : null,
      is_default: i === 0,
      position: i,
      available: o.stock?.[i] ?? o.stock ?? 12,
    })),
    images: [],
    attributes: o.attrs || [],
    visual: { kind, c1: o.c1 || f?.c1 || '#a855f7', c2: o.c2 || f?.c2 || '#3b0764', label: o.label || f?.short || 'CardCompass', sub: o.sub || kindLabel(kind) },
  };
}

function kindLabel(k) {
  return {
    display: 'Booster Display', booster: 'Booster', deck: 'Starter Deck', box: 'Kollektion', tin: 'Tin-Box',
    sleeves: 'Sleeves', binder: 'Sammelalbum', deckbox: 'Deckbox', playmat: 'Spielmatte', toploader: 'Toploader',
    manga: 'Manga', figure: 'Figur', gunpla: 'Modellbausatz', digivice: 'Virtual Pet', plush: 'Plüsch',
  }[k] || 'Produkt';
}

const SEALED = (n, per) => [
  { key: 'Inhalt', value: n }, { key: 'Karten pro Booster', value: per }, { key: 'Zustand', value: 'Neu & original versiegelt' },
];

export const PRODUCTS = [
  p('pokemon', 'booster-displays', 'display', 'Pokémon TCG Booster Display', 159.9, {
    featured: true, age: 1, was: 179.9, langs: ['Deutsch', 'Englisch'], langDelta: [0, -5], stock: [6, 3],
    short: '36 Booster im Original-Display – perfekt für den großen Pull.',
    desc: 'Das komplette Booster Display mit 36 Boostern. Ideal zum Sammeln, Öffnen mit Freunden oder als versiegeltes Sammlerstück. Lieferung sicher verpackt im Versandkarton.',
    attrs: SEALED('36 Booster', '10 Karten'), sub: '36 Booster',
  }),
  p('one-piece', 'booster-displays', 'display', 'One Piece Card Game Booster Display', 119.9, {
    featured: true, age: 2, langs: ['Englisch', 'Japanisch'], langDelta: [0, -25], stock: [4, 2],
    short: '24 Booster – für Strohhut-Fans und Turnierspieler.', desc: 'Versiegeltes Display mit 24 Boostern à 12 Karten.',
    attrs: SEALED('24 Booster', '12 Karten'), sub: '24 Booster',
  }),
  p('yu-gi-oh', 'booster-displays', 'display', 'Yu-Gi-Oh! Booster Display', 84.9, {
    featured: true, age: 3, stock: 8, short: '24 Booster mit Chance auf Secret Rares.', desc: 'Original versiegeltes Display mit 24 Boostern.',
    attrs: SEALED('24 Booster', '9 Karten'), sub: '24 Booster',
  }),
  p('magic', 'booster-displays', 'display', 'Magic: The Gathering Play Booster Display', 154.9, {
    featured: true, age: 4, langs: ['Deutsch', 'Englisch'], stock: [3, 5], short: '36 Play Booster – Draft-ready.', desc: 'Display mit 36 Play Boostern, ideal für Draft-Abende.',
    attrs: SEALED('36 Play Booster', '14 Karten'), sub: '36 Booster',
  }),
  p('pokemon', 'booster', 'booster', 'Pokémon TCG Booster', 4.99, {
    featured: true, age: 1, langs: ['Deutsch', 'Englisch'], stock: [48, 30], short: 'Einzelner Booster mit 10 Karten.', desc: 'Ein versiegelter Booster – der schnellste Weg zum nächsten Hit.',
    attrs: SEALED('1 Booster', '10 Karten'), sub: '10 Karten',
  }),
  p('one-piece', 'booster', 'booster', 'One Piece Card Game Booster', 5.49, { age: 5, langs: ['Englisch', 'Japanisch'], stock: [36, 24], attrs: SEALED('1 Booster', '12 Karten'), sub: '12 Karten' }),
  p('digimon', 'booster', 'booster', 'Digimon Card Game Booster', 4.49, { age: 9, langs: ['Englisch'], stock: 40, attrs: SEALED('1 Booster', '12 Karten'), sub: '12 Karten' }),
  p('riftbound', 'booster', 'booster', 'Riftbound Booster', 5.99, { featured: true, age: 0, langs: ['Englisch'], stock: 60, short: 'Das neue TCG – jetzt einsteigen.', attrs: SEALED('1 Booster', '14 Karten'), sub: 'Neu' }),
  p('cyberpunk', 'booster', 'booster', 'Cyberpunk TCG Booster', 5.49, { age: 6, langs: ['Englisch'], stock: 0, attrs: SEALED('1 Booster', '12 Karten'), sub: '12 Karten' }),
  p('pokemon', 'starter-decks', 'deck', 'Pokémon TCG Kampfdeck', 14.99, { age: 7, stock: 15, short: 'Spielbereites 60-Karten-Deck.', attrs: [{ key: 'Inhalt', value: '60-Karten-Deck, Münze, Schadensmarker' }], sub: '60 Karten' }),
  p('one-piece', 'starter-decks', 'deck', 'One Piece Card Game Starter Deck', 12.99, { age: 8, langs: ['Englisch'], stock: 10, attrs: [{ key: 'Inhalt', value: '51 Karten inkl. Leader' }], sub: '51 Karten' }),
  p('yu-gi-oh', 'starter-decks', 'deck', 'Yu-Gi-Oh! Structure Deck', 11.99, { age: 10, stock: 9, attrs: [{ key: 'Inhalt', value: '48 Karten + Spielfeld' }], sub: 'Structure Deck' }),
  p('magic', 'starter-decks', 'deck', 'Magic: The Gathering Commander Deck', 44.9, { age: 11, langs: ['Deutsch', 'Englisch'], stock: [2, 4], attrs: [{ key: 'Inhalt', value: '100-Karten-Commander-Deck' }], sub: 'Commander' }),
  p('pokemon', 'boxen-und-kollektionen', 'box', 'Pokémon TCG Top-Trainer-Box', 54.9, { featured: true, age: 2, was: 59.9, stock: 7, short: '9 Booster, Promo-Karte, Sleeves & Zubehör.', attrs: [{ key: 'Inhalt', value: '9 Booster, 1 Promo, 65 Sleeves, Würfel, Marker' }], sub: 'Top-Trainer-Box' }),
  p('pokemon', 'boxen-und-kollektionen', 'tin', 'Pokémon TCG Tin-Box', 24.9, { age: 12, stock: 11, attrs: [{ key: 'Inhalt', value: '4 Booster, 1 Promo-Karte' }], sub: 'Tin-Box' }),
  p('one-piece', 'boxen-und-kollektionen', 'box', 'One Piece Card Game Premium Collection', 39.9, { age: 13, langs: ['Englisch'], stock: 3, attrs: [{ key: 'Inhalt', value: '6 Booster, Promo-Karten, Spielmatte' }], sub: 'Premium Collection' }),
  p(null, 'tcg-zubehoer', 'sleeves', 'Matte Sleeves – Royal Purple (100 Stück)', 8.99, { featured: true, age: 3, label: 'CardCompass', c1: '#b26bff', c2: '#4c0099', stock: 80, short: 'Kartenhüllen in Standardgröße, matt.', attrs: [{ key: 'Größe', value: '66 × 91 mm (Standard)' }, { key: 'Stück', value: '100' }], sub: '100 Sleeves' }),
  p(null, 'tcg-zubehoer', 'binder', '9-Pocket Sammelalbum – Zip', 29.9, { age: 14, label: 'CardCompass', c1: '#8b00ff', c2: '#1b0838', stock: 25, attrs: [{ key: 'Kapazität', value: '360 Karten (side-loading)' }], sub: '360 Karten' }),
  p(null, 'tcg-zubehoer', 'deckbox', 'Deckbox für 100+ Karten', 12.9, { age: 15, label: 'CardCompass', c1: '#e9d5ff', c2: '#7000cc', stock: 30, attrs: [{ key: 'Kapazität', value: '100 Karten mit Sleeves' }], sub: 'Deckbox' }),
  p(null, 'tcg-zubehoer', 'toploader', 'Toploader 35pt (25 Stück)', 4.49, { age: 16, label: 'CardCompass', c1: '#c4b5fd', c2: '#312e81', stock: 120, attrs: [{ key: 'Stück', value: '25' }], sub: '25 Stück' }),
  p(null, 'tcg-zubehoer', 'playmat', 'Spielmatte „Compass Nebula"', 24.9, { age: 17, label: 'CardCompass', c1: '#a855f7', c2: '#0f0524', stock: 9, attrs: [{ key: 'Maße', value: '61 × 35 cm, Gummiunterseite' }], sub: 'Playmat' }),
  p('one-piece', 'manga', 'manga', 'One Piece Manga – Band 1', 7.0, { age: 18, label: 'One Piece', stock: 20, attrs: [{ key: 'Sprache', value: 'Deutsch' }], sub: 'Band 1' }),
  p('digimon', 'digivice-und-virtual-pets', 'digivice', 'Digimon Virtual Pet', 39.9, { age: 19, stock: 2, attrs: [{ key: 'Batterien', value: 'enthalten' }], sub: 'Virtual Pet' }),
  p(null, 'gunpla-und-modellbausaetze', 'gunpla', 'Modellbausatz High Grade 1:144', 24.9, { age: 20, label: 'Modellbau', c1: '#60a5fa', c2: '#1e293b', stock: 6, attrs: [{ key: 'Maßstab', value: '1:144' }], sub: 'HG 1:144' }),
  p('pokemon', 'figuren-und-sammlerartikel', 'figure', 'Sammelfigur – Deluxe Edition', 34.9, { age: 21, stock: 4, attrs: [{ key: 'Höhe', value: 'ca. 12 cm' }], sub: 'Figur' }),
];

export const SHIPPING = [{ name: 'DHL Paket (Deutschland)', price_cents: 549, free_from_cents: 10000 }];
