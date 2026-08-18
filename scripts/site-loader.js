/**
 * SITE-LOADER.JS — Sorveteria Itapolitana Cajuru
 * ═══════════════════════════════════════════════
 * REGRA: Single Source of Truth
 * Tudo que existe no site existe no Admin e vice-versa.
 * Este módulo carrega config.json e injeta em TODAS as páginas.
 *
 * Desenvolvedor: SgtMissiascacarato
 * Versão: 2.1 — 18/08/2026
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════
  // CONFIGURAÇÃO
  // ═══════════════════════════════════════════════
  const CONFIG_PATH = 'dados/config.json';
  const CACHE_KEY   = 'itap_site_config';
  const CACHE_TTL   = 5 * 60 * 1000; // 5 minutos
  const LOCAL_FETCH_TIMEOUT_MS = 5000;

  // ═══════════════════════════════════════════════
  // ESTADO GLOBAL
  // ═══════════════════════════════════════════════
  window.SITE_CONFIG = null;
  window.SITE_CONFIG_LOADED = false;

  // ═══════════════════════════════════════════════
  // CARREGAR CONFIG DO GITHUB
  // ═══════════════════════════════════════════════
  async function carregarConfig() {
    // Tentar cache primeiro
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          window.SITE_CONFIG = data;
          window.SITE_CONFIG_LOADED = true;
          aplicarConfig(data);
          // Atualizar em background
          buscarConfigRemoto().then(d => { if (d) { aplicarConfig(d); } });
          return data;
        }
      }
    } catch(e) {}

    const data = await buscarConfigRemoto();
    if (data) {
      window.SITE_CONFIG = data;
      window.SITE_CONFIG_LOADED = true;
      aplicarConfig(data);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch(e) {}
      return data;
    }

    // Fallback: usar cache expirado se existir
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: fallback } = JSON.parse(cached);
        window.SITE_CONFIG = fallback;
        window.SITE_CONFIG_LOADED = true;
        aplicarConfig(fallback);
        return fallback;
      }
    } catch(e) {}

    return null;
  }

  async function fetchJsonComTimeout(url, timeoutMs) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) {
      return null;
    }
  }

  async function buscarConfigRemoto() {
    const stamp = Date.now();

    // 1) Preferir o arquivo local publicado no próprio domínio
    const local = await fetchJsonComTimeout('/' + CONFIG_PATH + '?t=' + stamp, LOCAL_FETCH_TIMEOUT_MS);
    if (local) return local;

    console.warn('[site-loader] Falha ao carregar /' + CONFIG_PATH + ' no domínio atual.');
    return null;
  }

  // ═══════════════════════════════════════════════
  // APLICAR CONFIGURAÇÃO NA UI
  // ═══════════════════════════════════════════════
  function aplicarConfig(cfg) {
    if (!cfg) return;

    // ── Textos Dinâmicos (data-config) ──────────
    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.getAttribute('data-config');
      const val = extrairValor(cfg, key);
      if (val !== undefined && val !== null) {
        if (el.tagName === 'META') {
          el.setAttribute('content', val);
        } else if (el.tagName === 'TITLE') {
          document.title = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // ── SEO e Meta Tags ───────────────────────
    if (cfg.seo) {
      if (cfg.seo.title) document.title = cfg.seo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && cfg.seo.description) metaDesc.setAttribute('content', cfg.seo.description);
    }

    // ── Coleções dinâmicas ─────────────────────
    if (typeof window.renderCollections === 'function') {
      window.renderCollections(cfg);
    }

    // REMOVIDO: Lógica de renomeação de labels que causava inconsistência.
    // Agora o nav-active.js é a única fonte de verdade para o menu superior.

    // ── WhatsApp ──────────────────────────────
    if (cfg.whatsapp) {
      const wpp = cfg.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        try {
          const url = new URL(el.href);
          url.pathname = '/' + wpp;
          el.href = url.toString();
        } catch(e) {}
      });
    }

    // Disparar evento de conclusão
    document.dispatchEvent(new CustomEvent('itapConfigApplied', { detail: cfg }));
  }

  function extrairValor(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarConfig);
  } else {
    carregarConfig();
  }

})();
