/* KM1 Training — Service Worker.
   Legt die App beim ersten Besuch ins Regal, damit sie danach auch ohne Netz
   startet. Bei einer neuen Fassung die Zahl in VERSION erhoehen: der alte
   Speicher wird dann geloescht und alles frisch geholt. */
const VERSION = 'km1-v9';
const SCHRANK = VERSION + '-schrank';
const SCHRIFT = VERSION + '-schrift';

const GRUNDAUSSTATTUNG = [
  './',
  './index.html',
  './manifest.webmanifest',
  './img/logo.png',
  './img/pitch.jpg',
  './img/goal.jpg',
  './img/ladder.jpg',
  './img/coach.jpg',
  './img/app-symbol.png',
  './img/app-symbol-pro.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SCHRANK)
      .then((c) => c.addAll(GRUNDAUSSTATTUNG))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(
        namen.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Schriften von Google: einmal holen, danach aus dem Regal.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(
      caches.open(SCHRIFT).then((c) =>
        c.match(e.request).then((treffer) =>
          treffer || fetch(e.request).then((antwort) => {
            c.put(e.request, antwort.clone());
            return antwort;
          }).catch(() => treffer)
        )
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Seitenaufrufe: erst das Netz, sonst die gespeicherte Seite.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((treffer) =>
      treffer || fetch(e.request).then((antwort) => {
        const kopie = antwort.clone();
        caches.open(SCHRANK).then((c) => c.put(e.request, kopie));
        return antwort;
      })
    )
  );
});
