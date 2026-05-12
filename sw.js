const CACHE = 'linkwords-v113';
const ASSETS = ['/', '/index.html', '/style.css', '/data-core.js', '/i18n-strings.js', '/lw-graph.js', '/lw-scoring.js', '/lw-i18n.js', '/lw-audio.js', '/lw-collection.js', '/auth.js', '/game.js', '/manifest.json'];
const NETWORK_FIRST = ['/auth.js'];
const STALE_REVALIDATE = ['/data-core.js'];
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);

  if (NETWORK_FIRST.some(p => url.pathname === p)) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  if (STALE_REVALIDATE.some(p => url.pathname === p)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(response => {
          if (response.ok) {
            caches.open(CACHE).then(c => c.put(e.request, response.clone()));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      if (cached) {
        fetchPromise.catch(() => {});
        return cached;
      }
      return Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(reject, NETWORK_TIMEOUT))
      ]).catch(() => cached);
    })
  );
});

self.addEventListener('message', e => {
  if (!e.origin || e.origin !== self.location.origin) return;
  if (e.data === 'skipWaiting') self.skipWaiting();
});
