const CACHE_NAME = 'hadx-labs-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/videos/network-error.mp4',
  '/videos/hadx_labs_intro.mp4',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // If both fail (offline and not in cache), return the cached root
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
