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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // timeout 3s
      const resp = await fetch(GH_RAW + CONFIG_PATH + '?t=' + Date.now(), {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!resp.ok) return null;
      return await resp.json();
    } catch(e) {
      return null; // timeout ou erro — usa cache local imediatamente
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
            definirHrefSeguro(el, valor);
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
      definirHrefSeguro(el, valor);
    });

    // ── Coleções dinâmicas ─────────────────────
    renderCollections(cfg);

    // ── Menu principal (.itap-nav-label) ─────────
    document.querySelectorAll('.itap-header-nav a[href], .itap-nav-btn[href]').forEach(a => {
      const label = a.querySelector('.itap-nav-label');
      if (!label) return;
      const page = extrairNomePagina(a.getAttribute('href') || '');
      if (page === 'encomendas.html' && cfg.navEncomendas) label.textContent = cfg.navEncomendas;
      else if (page === 'promocao.html' && cfg.navPromocao) label.textContent = cfg.navPromocao;
      else if (page === 'dicas.html' && cfg.navDicas) label.textContent = cfg.navDicas;
      else if (page === 'fidelidade.html' && cfg.navFidelidade) label.textContent = cfg.navFidelidade;
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
    const heroTítulo = document.getElementById('hero-título');
    if (heroTítulo && cfg.heroTitulo) heroTítulo.textContent = cfg.heroTitulo;

    const heroSub = document.getElementById('hero-subtítulo');
    if (heroSub && cfg.heroSubtitulo) heroSub.textContent = cfg.heroSubtitulo;

    const heroBadge = document.getElementById('hero-badge');
    if (heroBadge && cfg.heroBadge) heroBadge.textContent = cfg.heroBadge;

    const heroDesc = document.getElementById('hero-descrição');
    if (heroDesc && cfg.heroDescricao) heroDesc.textContent = cfg.heroDescricao;

    const heroCta = document.getElementById('hero-cta');
    if (heroCta && cfg.heroCta) heroCta.textContent = cfg.heroCta;

    const heroCtaWhats = document.getElementById('hero-cta-whats');
    if (heroCtaWhats && cfg.heroCtaWhats) heroCtaWhats.textContent = cfg.heroCtaWhats;

    // ── Fidelidade Hero ─────────────────────────
    const fidHeroTitulo = document.getElementById('fid-hero-titulo');
    if (fidHeroTitulo && cfg.fidHeroTitulo) fidHeroTitulo.textContent = cfg.fidHeroTitulo;

    const fidHeroDesc = document.getElementById('fid-hero-desc');
    if (fidHeroDesc && cfg.fidHeroDesc) fidHeroDesc.textContent = cfg.fidHeroDesc;

    // ── Cardápio ───────────────────────────────
    const cardápioTítulo = document.getElementById('cardápio-título');
    if (cardápioTítulo && cfg.cardapioTitulo) cardápioTítulo.textContent = cfg.cardapioTitulo;

    const cardápioSub = document.getElementById('cardápio-subtítulo');
    if (cardápioSub && cfg.cardapioSubtitulo) cardápioSub.textContent = cfg.cardapioSubtitulo;

    const cardápioBadge = document.getElementById('cardápio-badge');
    if (cardápioBadge && cfg.cardapioBadge) cardápioBadge.textContent = cfg.cardapioBadge;

    // ── Footer ─────────────────────────────────
    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy && cfg.footerCopy) footerCopy.textContent = cfg.footerCopy;

    const footerDev = document.getElementById('footer-dev');
    if (footerDev && cfg.footerDev) footerDev.textContent = cfg.footerDev;

    const footerHorário = document.getElementById('footer-horário');
    if (footerHorário && cfg.footerHorario) {
      footerHorário.style.whiteSpace = 'pre-line';
      footerHorário.textContent = cfg.footerHorario;
    }

    // ── Fidelidade: pontos e prêmios ───────────
    if (cfg.pontosMilkshake !== undefined || cfg.pontosCaixa !== undefined || cfg.premioMilkshake || cfg.prêmioMilkshake || cfg.premioCaixa || cfg.prêmioCaixa) {
      const pontosMilk = parseNumero(cfg.pontosMilkshake);
      const pontosCaixa = parseNumero(cfg.pontosCaixa);
      if (pontosMilk !== null) window._META_MILK = pontosMilk;
      if (pontosCaixa !== null) window._META_CAIXA = pontosCaixa;
      if (cfg.premioMilkshake || cfg.prêmioMilkshake) window._PREMIO_MILK = cfg.premioMilkshake || cfg.prêmioMilkshake;
      if (cfg.premioCaixa || cfg.prêmioCaixa) window._PREMIO_CAIXA = cfg.premioCaixa || cfg.prêmioCaixa;
      // Atualizar elementos de fidelidade se existirem
      const pontosMilkTxt = pontosMilk !== null ? `${pontosMilk} pontos` : null;
      const pontosCaixaTxt = pontosCaixa !== null ? `${pontosCaixa} pontos` : null;
      const premioMilkTxt = cfg.premioMilkshake || cfg.prêmioMilkshake || null;
      const premioCaixaTxt = cfg.premioCaixa || cfg.prêmioCaixa || null;
      document.querySelectorAll('[data-pontos-milk]').forEach(el => {
        if (pontosMilkTxt) el.textContent = pontosMilkTxt;
      });
      document.querySelectorAll('[data-pontos-caixa]').forEach(el => {
        if (pontosCaixaTxt) el.textContent = pontosCaixaTxt;
      });
      document.querySelectorAll('[data-prêmio-milk]').forEach(el => {
        if (premioMilkTxt) el.textContent = premioMilkTxt;
      });
      document.querySelectorAll('[data-prêmio-caixa]').forEach(el => {
        if (premioCaixaTxt) el.textContent = premioCaixaTxt;
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
      const minPicoles = Number(cfg.encomendaMinPicoles);
      if (!Number.isNaN(minPicoles)) {
        window.encomendaMinPicoles = minPicoles;
        window._MIN_PICOLES = minPicoles; // compatibilidade retroativa
      }
    }

    // ── SEO: title + meta description + meta keywords ─────────────
    const pageKey = obterPaginaAtual();
    const seoPagina = (cfg.seoPaginas && cfg.seoPaginas[pageKey]) || {};
    const seoTitulo = seoPagina.titulo || cfg.seoTitulo;
    const seoDescricao = seoPagina.descricao || cfg.seoDescricao;
    const seoPalavras = seoPagina.palavrasChave || cfg.seoPalavrasChave;
    if (seoTitulo) {
      document.title = seoTitulo;
    }
    if (seoDescricao) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', seoDescricao);
    }
    if (seoPalavras) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (!metaKw) {
        metaKw = document.createElement('meta');
        metaKw.setAttribute('name', 'keywords');
        document.head.appendChild(metaKw);
      }
      metaKw.setAttribute('content', seoPalavras);
    }

    // ── Disparar evento para outros scripts ────
    window.dispatchEvent(new CustomEvent('siteConfigLoaded', { detail: cfg }));
  }

  // ═══════════════════════════════════════════════
  // HELPER: acessar campo aninhado por string
  // Ex: "açaí.copos.300ml" → cfg.açaí.copos["300ml"]
  // ═══════════════════════════════════════════════
  function getValor(obj, caminho) {
    return caminho.split('.').reduce((acc, k) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[k];
    }, obj);
  }

  function parseNumero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }

  function extrairNomePagina(href) {
    if (!href) return '';
    try {
      const url = new URL(href, window.location.origin);
      const clean = (url.pathname || '').replace(/\/+$/, '');
      const parts = clean.split('/');
      return (parts[parts.length - 1] || 'index.html').toLowerCase();
    } catch(e) {
      return '';
    }
  }

  function obterPaginaAtual() {
    const nome = extrairNomePagina(window.location.pathname || '');
    if (!nome || nome === 'index.html') return 'home';
    if (nome === 'encomendas.html') return 'encomendas';
    if (nome === 'fidelidade.html') return 'fidelidade';
    if (nome === 'promocao.html') return 'promocao';
    if (nome === 'dicas.html') return 'dicas';
    if (nome === 'sobre.html') return 'sobre';
    if (nome === 'galeria.html') return 'galeria';
    if (nome === 'carrossel.html') return 'carrossel';
    return nome.replace('.html', '');
  }

  function renderCollections(cfg) {
    document.querySelectorAll('[data-config-collection]').forEach(el => {
      const campo = el.getAttribute('data-config-collection');
      const dados = getValor(cfg, campo);
      if (!Array.isArray(dados)) return;

      const tagRaw = (el.getAttribute('data-item-tag') || 'div').toLowerCase();
      const allowedTags = new Set(['div', 'span', 'li', 'p', 'small', 'strong']);
      const tag = allowedTags.has(tagRaw) ? tagRaw : 'div';
      const className = el.getAttribute('data-item-class') || '';
      const layout = (el.getAttribute('data-item-layout') || '').toLowerCase();
      el.innerHTML = '';
      dados.forEach((item, idx) => {
        if (layout === 'flow-step') {
          const wrapper = document.createElement('div');
          wrapper.className = className || 'itap-flow-step';
          const stepNum = document.createElement('span');
          stepNum.className = 'itap-flow-step__num';
          stepNum.textContent = String(idx + 1);
          const stepText = document.createElement('p');
          stepText.textContent = item && typeof item === 'object'
            ? String(item.text || item.label || item.titulo || item.descricao || '')
            : String(item ?? '');
          wrapper.appendChild(stepNum);
          wrapper.appendChild(stepText);
          el.appendChild(wrapper);
          return;
        }
        if (layout === 'tip-card') {
          const card = document.createElement('article');
          card.className = className || 'itap-tip-card';
          if (item && typeof item === 'object') {
            const titulo = String(item.titulo || item.title || item.label || '');
            const descricao = String(item.descricao || item.text || '');
            const imagem = String(item.imagem || item.image || '');
            const link = String(item.link || item.url || '');
            if (imagem && urlSegura(imagem)) {
              const img = document.createElement('img');
              img.src = imagem;
              img.alt = titulo ? `Imagem da dica: ${titulo}` : 'Dica da Sorveteria Itapolitana';
              card.appendChild(img);
            }
            if (titulo) {
              const h = document.createElement('h3');
              h.textContent = titulo;
              card.appendChild(h);
            }
            if (descricao) {
              const p = document.createElement('p');
              p.textContent = descricao;
              card.appendChild(p);
            }
            if (link && urlSegura(link)) {
              const a = document.createElement('a');
              a.href = link;
              a.target = '_blank';
              a.rel = 'noopener';
              a.textContent = 'Saiba mais';
              card.appendChild(a);
            }
          } else {
            card.textContent = String(item ?? '');
          }
          el.appendChild(card);
          return;
        }
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (item && typeof item === 'object') {
          node.textContent = item.text || item.label || item.titulo || item.descricao || '';
        } else {
          node.textContent = String(item ?? '');
        }
        el.appendChild(node);
      });
    });
  }

  function urlSegura(url) {
    if (!url) return false;
    try {
      const alvo = new URL(url, window.location.origin);
      return alvo.protocol === 'http:' || alvo.protocol === 'https:';
    } catch(e) {
      return false;
    }
  }

  function definirHrefSeguro(el, valor) {
    if (!el || !valor) return;
    if (urlSegura(valor)) el.setAttribute('href', valor);
  }

  // ═══════════════════════════════════════════════
  // INVALIDAR CACHE (chamado pelo Admin após salvar)
  // ═══════════════════════════════════════════════
  window.siteLoaderInválidarCache = function() {
    try { localStorage.removeItem(CACHE_KEY); } catch(e) {}
  };

  // ═══════════════════════════════════════════════
  // RECARREGAR CONFIG (chamado pelo Admin)
  // ═══════════════════════════════════════════════
  window.siteLoaderRecarregar = async function() {
    window.siteLoaderInválidarCache();
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
