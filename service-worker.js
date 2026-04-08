/**
 * SERVICE-WORKER.JS — Sorveteria Itapolitana Cajuru
 * ═══════════════════════════════════════════════════
 * Versão: 3.0 — 08/04/2026
 * Padrão: Cache First para assets, Network First para HTML
 * Substitui versão antiga que tentava importar dynamic-content.js
 */

const CACHE_NAME    = 'itapolitana-v3';
const ASSETS_CACHE  = 'assets-v3';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.webp',
  '/offline.html'
];

// ── INSTALL — pré-cache dos assets críticos ──────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          CRITICAL_ASSETS.map(url =>
            cache.add(url).catch(() => {}) // falha silenciosa por asset
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — limpar caches antigos ────────────────────────────
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

// ── FETCH — estratégia inteligente por tipo de recurso ──────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-HTTP
  if (!url.protocol.startsWith('http')) return;

  // API calls (GitHub raw, etc.) — Network Only
  if (url.hostname.includes('raw.githubusercontent.com') ||
      url.hostname.includes('api.github.com') ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ erro: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Assets estáticos (imagens, CSS, JS, fontes) — Cache First
  if (request.destination === 'image' ||
      request.destination === 'style'  ||
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(ASSETS_CACHE)
              .then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML e navegação — Network First com fallback offline
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request)
          .then(cached => cached || caches.match('/offline.html'))
      )
  );
});
