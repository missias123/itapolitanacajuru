/**
 * SW.JS — Sorveteria Itapolitana Cajuru
 * Versão: 7.0 (itapolitana-v7) — PWA Versão 2
 * Estratégia: Cache First (assets), Network First (HTML/API)
 *
 * Para atualizar o cache no futuro, incremente CACHE_NAME e ASSETS_CACHE
 * (ex.: itapolitana-v8 / assets-v8). O evento 'activate' apaga versões antigas.
 */

const CACHE_NAME   = 'itapolitana-v7';
const ASSETS_CACHE = 'assets-v7';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/fidelidade.html',
  '/encomendas.html',
  '/promocao.html',
  '/manifest.json',
  '/css/design-system.min.css',
  '/scripts/quality-guard.js',
  '/images/logo.webp',
  '/images/icon-192.png',
  '/images/icon-192.webp',
  '/apple-touch-icon.png',
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

  // GitHub API, raw e painel admin — Network Only (nunca cachear)
  // Observação: consultas em raw.githubusercontent.com não ficam disponíveis offline no SW.
  // Para fidelidade offline parcial, o fallback de último saldo é feito via localStorage na própria página.
  if (url.hostname === 'raw.githubusercontent.com' ||
      url.hostname === 'api.github.com' ||
      url.pathname.startsWith('/dados/') ||
      url.pathname === '/admin-painel.html') {
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

  // HTML e navegação — Network First com fallback offline útil
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
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
              .then(home => home || caches.match('/offline.html'));
          }
          return caches.match('/offline.html');
        })
      )
  );
});

// ── MESSAGE — forçar atualização ────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
