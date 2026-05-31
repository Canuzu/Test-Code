// Service worker for offline support (PWA).
// Strategy:
//   - navigations  → network-first, fall back to the cached app shell (offline);
//   - data/cards.json → network-first (always try fresh prices), cache fallback;
//   - other same-origin assets → cache-first, then network (hashed, immutable);
//   - cross-origin (card images on images.pokemontcg.io) → left untouched.

const CACHE = 'kwde-v3';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const putInCache = async (req, res) => {
  try { const c = await caches.open(CACHE); await c.put(req, res); } catch { /* ignore */ }
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // don't intercept cross-origin

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => { putInCache(req, res.clone()); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  if (url.pathname.endsWith('/data/cards.json')) {
    event.respondWith(
      fetch(req).then((res) => { putInCache(req, res.clone()); return res; })
        .catch(() => caches.match(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok) putInCache(req, res.clone());
      return res;
    })),
  );
});
