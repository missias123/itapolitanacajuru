
const CACHE_NAME = 'itapolitana-v2';
const ASSETS_CACHE = 'assets-v2';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/css/design-system.min.css',
  '/css/estilo-encomendas.min.css',
  '/images/banner-cardapio.webp',
  '/images/logo.webp',
  '/offline.html'
];

// Install — cache crítico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== ASSETS_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — estratégia Cache First para assets, Network First para HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — Network Only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => 
        new Response(JSON.stringify({ erro: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Assets estáticos — Cache First
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => 
        cached || fetch(request).then(response => {
          const clone = response.clone();
          caches.open(ASSETS_CACHE)
            .then(cache => cache.put(request, clone));
          return response;
        })
      )
    );
    return;
  }

  // HTML — Network First com fallback offline
  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() => 
        caches.match(request) || caches.match('/offline.html')
      )
  );
});
