// Jake's R&D Plant Journal — service worker
// NETWORK-FIRST for everything. Always fetches the latest from the network
// when online; only falls back to cache when truly offline. This avoids
// the classic "PWA is stuck on old code" problem during active development.

const CACHE = 'jakes-rd-v13';
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
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
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

  // Don't intercept the Apps Script API at all.
  if (url.hostname.endsWith('script.google.com') ||
      url.hostname.endsWith('googleusercontent.com')) return;

  // Skip non-GET (POST to API etc.) — let the browser handle.
  if (e.request.method !== 'GET') return;

  // Network-first: try fresh, update cache, fall back to cache only when
  // the network errors out (typically offline).
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
