/**
 * SW.JS — Sorveteria Itapolitana Cajuru
 * Versão: 4.0 — Cache inteligente para GitHub Pages
 * Estratégia: Cache First (assets), Network First (HTML/API)
 */

const CACHE_NAME   = 'itapolitana-v4';
const ASSETS_CACHE = 'assets-v4';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mascote.css',
  '/css/design-system.min.css',
  '/images/logo.webp',
  '/images/icon-192.webp',
  '/offline.html'
];

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.allSettled(
          CRITICAL_ASSETS.map(url => cache.add(url).catch(() => {}))
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — limpar caches antigos ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME && k !== ASSETS_CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH — estratégia por tipo de recurso ──────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // GitHub API e raw — Network Only (nunca cachear dados dinâmicos)
  if (url.hostname.includes('raw.githubusercontent.com') ||
      url.hostname.includes('api.github.com') ||
      url.pathname.startsWith('/dados/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ erro: 'Offline', cached: false }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Assets estáticos — Cache First
  if (request.destination === 'image' ||
      request.destination === 'style'  ||
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            caches.open(ASSETS_CACHE)
              .then(cache => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  // HTML e navegação — Network First com fallback offline
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() =>
        caches.match(request)
          .then(cached => cached || caches.match('/offline.html'))
      )
  );
});

// ── MESSAGE — forçar atualização ────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
