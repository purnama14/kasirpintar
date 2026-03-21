const CACHE_NAME = 'kasir-pintar-v1';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/app.js',
  './js/pos.js',
  './js/admin.js',
  './js/printer.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
