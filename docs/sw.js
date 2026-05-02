// Jake's R&D Plant Journal — service worker
// Caches the app shell so it installs as a PWA and loads instantly.
// Network-first for the API, cache-first for static assets.

const CACHE = 'jakes-rd-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/config.js',
  './assets/js/icons.js',
  './assets/js/mock.js',
  './assets/js/api.js',
  './assets/js/app.js',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Don't try to cache the Apps Script API — always go to network.
  if (url.hostname.endsWith('script.google.com')) return;
  // Skip non-GET (POST to API etc.)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cache same-origin successful responses for next time.
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
