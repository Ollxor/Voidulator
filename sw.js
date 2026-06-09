// Voidulator Service Worker
// Strategy: network-first for everything, cache as offline fallback.
// The whole app is one HTML file — caching it aggressively means caching
// bugs aggressively, so the network copy always wins when reachable.
const CACHE_NAME = 'voidulator-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - pre-cache the app shell for offline use
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch - try network first, update the cache on success, fall back to cache offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate - clean old caches and take over open tabs immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});
