/**
 * SITE-LOADER.JS — Sorveteria Itapolitana Cajuru
 * ═══════════════════════════════════════════════
 * REGRA: Single Source of Truth
 * Tudo que existe no site existe no Admin e vice-versa.
 * Este módulo carrega config.json e injeta em TODAS as páginas.
 *
 * Desenvolvedor: SgtMissiascacarato
 * Versão: 2.0 — 04/04/2026
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════
  // CONFIGURAÇÃO
  // ═══════════════════════════════════════════════
  const GH_OWNER  = 'missias123';
  const GH_REPO   = 'itapolitanacajuru';
  const GH_BRANCH = 'main';
  const GH_RAW    = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/`;
  const CONFIG_PATH = 'dados/config.json';
  const CACHE_KEY   = 'itap_site_config';
  const CACHE_TTL   = 5 * 60 * 1000; // 5 minutos

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

  async function buscarConfigRemoto() {
    try {
      const resp = await fetch(GH_RAW + CONFIG_PATH + '?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) return null;
      return await resp.json();
    } catch(e) {
      return null;
    }
  }

  // ═══════════════════════════════════════════════
  // APLICAR CONFIG NO SITE — INJEÇÃO AUTOMÁTICA
  // ═══════════════════════════════════════════════
  function aplicarConfig(cfg) {
    if (!cfg) return;

    // ── Atributos data-config ──────────────────
    // Qualquer elemento com data-config="campo" recebe o valor automaticamente
    document.querySelectorAll('[data-config]').forEach(el => {
      const campo = el.getAttribute('data-config');
      const valor = getValor(cfg, campo);
      if (valor !== undefined && valor !== null) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = valor;
        } else if (el.tagName === 'A') {
          if (campo.toLowerCase().includes('link') || campo.toLowerCase().includes('url')) {
            el.href = valor;
          } else {
            el.textContent = valor;
          }
        } else {
          el.textContent = valor;
        }
      }
    });

    // ── Atributos data-config-href ─────────────
    document.querySelectorAll('[data-config-href]').forEach(el => {
      const campo = el.getAttribute('data-config-href');
      const valor = getValor(cfg, campo);
      if (valor) el.href = valor;
    });

    // ── WhatsApp: todos os links wa.me ─────────
    if (cfg.whatsapp) {
      const wpp = cfg.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        const url = new URL(el.href);
        const texto = url.searchParams.get('text') || '';
        el.href = `https://wa.me/${wpp}?text=${encodeURIComponent(texto)}`;
      });
      // Links sem texto
      document.querySelectorAll('[data-whatsapp]').forEach(el => {
        const msg = el.getAttribute('data-whatsapp') || '';
        el.href = `https://wa.me/${wpp}?text=${encodeURIComponent(msg)}`;
      });
    }

    // ── Frases rotativas ───────────────────────
    if (cfg.heroFrases && Array.isArray(cfg.heroFrases)) {
      window._FRASES_SENSORIAIS = cfg.heroFrases;
    }

    // ── Strip sensorial ────────────────────────
    if (cfg.stripSensorial && Array.isArray(cfg.stripSensorial)) {
      window._STRIPS = cfg.stripSensorial;
      const strip = document.getElementById('strip-sensorial');
      if (strip) strip.textContent = cfg.stripSensorial[0];
    }

    // ── Horário dinâmico ───────────────────────
    if (cfg.horarioAbre !== undefined && cfg.horarioFecha !== undefined) {
      window._HORARIO_ABRE  = cfg.horarioAbre;
      window._HORARIO_FECHA = cfg.horarioFecha;
    }

    // ── Hero ───────────────────────────────────
    const heroTitulo = document.getElementById('hero-titulo');
    if (heroTitulo && cfg.heroTitulo) heroTitulo.innerHTML = cfg.heroTitulo;

    const heroSub = document.getElementById('hero-subtitulo');
    if (heroSub && cfg.heroSubtitulo) heroSub.textContent = cfg.heroSubtitulo;

    const heroBadge = document.getElementById('hero-badge');
    if (heroBadge && cfg.heroBadge) heroBadge.textContent = cfg.heroBadge;

    const heroDesc = document.getElementById('hero-descricao');
    if (heroDesc && cfg.heroDescricao) heroDesc.textContent = cfg.heroDescricao;

    const heroCta = document.getElementById('hero-cta');
    if (heroCta && cfg.heroCta) heroCta.textContent = cfg.heroCta;

    const heroCtaWhats = document.getElementById('hero-cta-whats');
    if (heroCtaWhats && cfg.heroCtaWhats) heroCtaWhats.textContent = cfg.heroCtaWhats;

    // ── Cardápio ───────────────────────────────
    const cardapioTitulo = document.getElementById('cardapio-titulo');
    if (cardapioTitulo && cfg.cardapioTitulo) cardapioTitulo.textContent = cfg.cardapioTitulo;

    const cardapioSub = document.getElementById('cardapio-subtitulo');
    if (cardapioSub && cfg.cardapioSubtitulo) cardapioSub.textContent = cfg.cardapioSubtitulo;

    const cardapioBadge = document.getElementById('cardapio-badge');
    if (cardapioBadge && cfg.cardapioBadge) cardapioBadge.textContent = cfg.cardapioBadge;

    // ── Footer ─────────────────────────────────
    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy && cfg.footerCopy) footerCopy.textContent = cfg.footerCopy;

    const footerDev = document.getElementById('footer-dev');
    if (footerDev && cfg.footerDev) footerDev.textContent = cfg.footerDev;

    const footerHorario = document.getElementById('footer-horario');
    if (footerHorario && cfg.footerHorario) footerHorario.innerHTML = cfg.footerHorario.replace(/\n/g, '<br>');

    // ── Fidelidade: pontos e prêmios ───────────
    if (cfg.pontosMilkshake !== undefined) {
      window._META_MILK  = cfg.pontosMilkshake;
      window._META_CAIXA = cfg.pontosCaixa || 30;
      window._PREMIO_MILK  = cfg.premioMilkshake  || 'Milkshake 300ml';
      window._PREMIO_CAIXA = cfg.premioCaixa || 'Caixa 7 Bolas';
      // Atualizar elementos de fidelidade se existirem
      document.querySelectorAll('[data-pontos-milk]').forEach(el => {
        el.textContent = cfg.pontosMilkshake + ' pontos';
      });
      document.querySelectorAll('[data-pontos-caixa]').forEach(el => {
        el.textContent = cfg.pontosCaixa + ' pontos';
      });
      document.querySelectorAll('[data-premio-milk]').forEach(el => {
        el.textContent = cfg.premioMilkshake || 'Milkshake 300ml';
      });
      document.querySelectorAll('[data-premio-caixa]').forEach(el => {
        el.textContent = cfg.premioCaixa || 'Caixa 7 Bolas';
      });
    }

    // ── Encomenda: aviso e mínimo picolés ──────
    if (cfg.encomendaAviso) {
      window._ENCOMENDA_AVISO = cfg.encomendaAviso;
      document.querySelectorAll('[data-encomenda-aviso]').forEach(el => {
        el.textContent = cfg.encomendaAviso;
      });
    }
    if (cfg.encomendaMinPicoles !== undefined) {
      window._MIN_PICOLES = cfg.encomendaMinPicoles;
    }

    // ── Disparar evento para outros scripts ────
    window.dispatchEvent(new CustomEvent('siteConfigLoaded', { detail: cfg }));
  }

  // ═══════════════════════════════════════════════
  // HELPER: acessar campo aninhado por string
  // Ex: "acai.copos.300ml" → cfg.acai.copos["300ml"]
  // ═══════════════════════════════════════════════
  function getValor(obj, caminho) {
    return caminho.split('.').reduce((acc, k) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[k];
    }, obj);
  }

  // ═══════════════════════════════════════════════
  // INVALIDAR CACHE (chamado pelo Admin após salvar)
  // ═══════════════════════════════════════════════
  window.siteLoaderInvalidarCache = function() {
    try { localStorage.removeItem(CACHE_KEY); } catch(e) {}
  };

  // ═══════════════════════════════════════════════
  // RECARREGAR CONFIG (chamado pelo Admin)
  // ═══════════════════════════════════════════════
  window.siteLoaderRecarregar = async function() {
    window.siteLoaderInvalidarCache();
    return await carregarConfig();
  };

  // ═══════════════════════════════════════════════
  // INICIALIZAÇÃO AUTOMÁTICA
  // ═══════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarConfig);
  } else {
    carregarConfig();
  }

  // Expor função para uso externo
  window.siteLoaderCarregar = carregarConfig;

})();
