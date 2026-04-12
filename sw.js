
// PHASE 4: ENHANCED SERVICE WORKER WITH INTELLIGENT CACHING
// Sorveteria Itapolitana Cajuru - PWA Benchmark

const CACHE_NAME = 'itapolitana-v2';
const RUNTIME_CACHE = 'itapolitana-runtime-v2';
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/css/design-system.min.css',
    '/css/estilo-encomendas.min.css',
    '/mascote.min.js',
    '/images/logo.webp',
    '/images/banner-cardapio.webp'
];

// 1. INSTALL EVENT: Cache critical assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching critical assets...');
            return cache.addAll(CRITICAL_ASSETS);
        }).then(() => {
            console.log('[SW] Service Worker installed successfully!');
            return self.skipWaiting();
        })
    );
});

// 2. ACTIVATE EVENT: Clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH EVENT: Intelligent caching strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Strategy: Cache First for static assets, Network First for dynamic content
    if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
        // Cache First Strategy
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(response => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                });
            }).catch(() => {
                // Fallback for offline
                if (request.destination === 'image') {
                    return caches.match('/images/logo.webp');
                }
            })
        );
    } else {
        // Network First Strategy for HTML and API calls
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then(response => {
                        return response || caches.match('/offline.html');
                    });
                })
        );
    }
});

// 4. MESSAGE EVENT: Handle messages from clients
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker loaded successfully!');
