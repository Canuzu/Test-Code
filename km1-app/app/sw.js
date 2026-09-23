/* KM1 Training — Service Worker.
   Legt die App beim ersten Besuch ins Regal, damit sie danach auch ohne Netz
   startet. Bei einer neuen Fassung die Zahl in VERSION erhoehen: der alte
   Speicher wird dann geloescht und alles frisch geholt. */
const VERSION = 'km1-v10';
const SCHRANK = VERSION + '-schrank';

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
  './icons/apple-touch-icon-180.png',
  // Die Schriften liegen seit km1-v10 neben der App. Die Erweiterungen
  // fuer Namen wie „Çağlar" kommen erst mit, wenn sie gebraucht werden.
  './fonts/anton-latin.woff2',
  './fonts/chivo-latin.woff2',
  './fonts/jetbrains-mono-latin.woff2'
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
