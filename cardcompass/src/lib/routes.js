// Route paths in one place (same URLs as the current cardcompass.de).
export const R = {
  home: '/',
  shop: '/shop',
  cart: '/warenkorb',
  checkout: '/kasse',
  checkoutSuccess: '/kasse/danke',
  checkoutCancel: '/kasse/abgebrochen',
  account: '/konto',
  login: '/konto/anmelden',
  register: '/konto/registrieren',
  forgot: '/konto/passwort-vergessen',
  resetPassword: '/konto/neues-passwort',
  contact: '/kontakt',
  agb: '/agb',
  widerrufsbelehrung: '/widerrufsbelehrung',
  widerruf: '/widerruf',
  impressum: '/impressum',
  datenschutz: '/datenschutz',
  cookies: '/cookies',
};

export const productPath = (slug) => `/produkt/${slug}`;

// /shop?franchise=pokemon&kategorie=booster&q=…&verfuegbar=1&sort=price-asc
export const shopPath = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.franchise) qs.set('franchise', params.franchise);
  if (params.category) qs.set('kategorie', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.available) qs.set('verfuegbar', '1');
  if (params.sort && params.sort !== 'new') qs.set('sort', params.sort);
  const s = qs.toString();
  return s ? `${R.shop}?${s}` : R.shop;
};
