/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Design: Ultra Compacto, Glossy & World Class
 * Objetivo: Cabeçalho unificado, baixo (compacto) e responsivo para todas as abas.
 * Versão: 2.2 — 18/08/2026 — Unificação Total Final
 */
(function () {
  'use strict';

  var MENU_ITEMS = [
    {
      href: 'index.html',
      label: 'INÍCIO',
      icon: 'home',
      bg: 'background:linear-gradient(135deg,#D32F2F,#B71C1C);'
    },
    {
      href: 'promocao.html',
      label: 'PROMO',
      icon: 'promo',
      bg: 'background:linear-gradient(135deg,#FF6D00,#E65100);'
    },
    {
      href: 'dicas.html',
      label: 'FEEDBACK',
      icon: 'star',
      bg: 'background:linear-gradient(135deg,#2E7D32,#1B5E20);'
    },
    {
      href: 'sobre.html',
      label: 'HISTÓRIA',
      icon: 'info',
      bg: 'background:linear-gradient(135deg,#6A1B9A,#4A148C);'
    },
    {
      href: 'encomendas.html',
      label: 'COMPRAR',
      icon: 'box',
      bg: 'background:linear-gradient(135deg,#1565C0,#0D47A1);'
    }
  ];

  var CSS = [
    '/* HEADER COMPACTO & WORLD CLASS */',
    '.itap-header{background:linear-gradient(180deg,#E8000D 0%,#C62828 100%)!important;border-bottom:3px solid #FFD600!important;position:sticky!important;top:0!important;z-index:99999!important;box-shadow:0 4px 15px rgba(0,0,0,.3)!important;width:100%!important;box-sizing:border-box!important;}',
    '.itap-header-inner{max-width:960px!important;margin:0 auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;padding:6px 8px 8px!important;gap:6px!important;}',
    '.itap-header-top{width:100%!important;display:flex!important;justify-content:center!important;margin-bottom:2px!important;}',
    '.ita-bot-duvidas-btn{background:rgba(255,255,255,.15)!important;color:#fff!important;border:1px solid rgba(255,255,255,.4)!important;border-radius:50px!important;padding:2px 12px!important;font-size:10px!important;font-weight:900!important;letter-spacing:1px!important;text-transform:uppercase!important;backdrop-filter:blur(4px)!important;}',
    '.itap-header-nav{display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:4px!important;width:100%!important;box-sizing:border-box!important;}',
    '.itap-nav-btn{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:6px 2px!important;border-radius:12px!important;text-decoration:none!important;color:#fff!important;border:1px solid rgba(255,255,255,.3)!important;transition:transform .2s!important;min-height:52px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.2), 0 2px 6px rgba(0,0,0,.2)!important;}',
    '.itap-nav-btn[aria-current="page"]{border:2px solid #FFD600!important;box-shadow:0 0 10px rgba(255,214,0,.4)!important;transform:scale(1.05)!important;}',
    '.itap-nav-icon{font-size:1.4em!important;line-height:1!important;margin-bottom:1px!important;}',
    '.itap-nav-label{font-size:9px!important;font-weight:900!important;letter-spacing:.3px!important;text-transform:uppercase!important;text-shadow:0 1px 2px rgba(0,0,0,.5)!important;}',
    '@media (min-width:768px){.itap-header-inner{padding:8px 20px!important;gap:8px!important;}.itap-nav-btn{min-height:60px!important;padding:8px!important;}.itap-nav-label{font-size:11px!important;}.itap-nav-icon{font-size:1.6em!important;}}'
  ].join('');

  function injectCSS() {
    var id = 'nav-active-css-compact';
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = id;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function descobrirPaginaAtual() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    return page.toLowerCase();
  }

  function criarBotao(item, paginaAtual) {
    var a = document.createElement('a');
    a.href = item.href;
    a.className = 'itap-nav-btn';
    a.setAttribute('style', item.bg);

    var itemHref = item.href.toLowerCase();
    if (itemHref === paginaAtual || (paginaAtual === '' && itemHref === 'index.html')) {
      a.setAttribute('aria-current', 'page');
    }

    var iconHtml = (typeof window.ItapIcon === 'function')
      ? window.ItapIcon(item.icon, 'white')
      : '🍦';

    a.innerHTML =
      '<span class="itap-nav-icon">' + iconHtml + '</span>' +
      '<span class="itap-nav-label">' + item.label + '</span>';
    return a;
  }

  function montarCabecalhos() {
    document.querySelectorAll('[data-itap-header-slot]').forEach(function (slot) {
      if (slot.dataset.itapHeaderMounted === 'true') return;
      var header = document.createElement('header');
      header.className = 'itap-header';
      header.innerHTML =
        '<div class="itap-header-inner">' +
          '<div class="itap-header-top">' +
            '<button type="button" class="ita-bot-duvidas-btn" onclick="if(window.abrirItaBot)window.abrirItaBot()">Dúvidas</button>' +
          '</div>' +
          '<nav class="itap-header-nav"></nav>' +
        '</div>';
      slot.replaceChildren(header);
      slot.dataset.itapHeaderMounted = 'true';
    });
  }

  function run() {
    injectCSS();
    montarCabecalhos();
    var navs = document.querySelectorAll('.itap-header-nav');
    var paginaAtual = descobrirPaginaAtual();
    navs.forEach(function (nav) {
      nav.innerHTML = '';
      MENU_ITEMS.forEach(function (item) {
        nav.appendChild(criarBotao(item, paginaAtual));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
