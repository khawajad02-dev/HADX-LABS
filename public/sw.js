const CACHE_NAME = 'hadx-labs-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/catalog',
  '/checkout',
  '/manifest.webmanifest',
  '/videos/network-error.mp4',
  '/videos/hadx_labs_intro.mp4',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          fetch(url, { cache: 'no-cache' }).then(response => {
            if (!response.ok) throw new Error(`Offline cache failed for ${url}`);
            return cache.put(url, response);
          }).catch(err => console.warn(err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For navigation requests, try network first, then cache, then root
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return caches.match(event.request).then(response => response || caches.match('/'));
      })
    );
    return;
  }

  // API and data responses must always come from the network so live inventory cannot become stale.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // For other static assets, use Cache-First strategy.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});
