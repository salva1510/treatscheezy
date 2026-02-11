const CACHE_NAME = 'treats-cheezy-v2'; // Change version kapag may update
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/products.json',
  '/manifest.json'
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting(); // activate agad
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // take control agad
});

// FETCH (Network first for JSON, Cache first for static)
self.addEventListener('fetch', event => {
  if (event.request.url.includes('products.json')) {
    // ALWAYS GET LATEST PRODUCTS
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
