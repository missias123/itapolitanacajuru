/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Objetivo: garantir menu superior SEMPRE completo e consistente em todas as páginas.
 */
(function () {
  'use strict';

  var MENU_ITEMS = [
    {
      href: '#duvidas',
      label: 'DÚVIDAS',
      icon: '💬',
      bg: 'background:linear-gradient(135deg,#1565C0,#0D47A1);',
      action: 'duvidas'
    },
    {
      href: 'index.html',
      label: 'TELA INICIAL',
      icon: '🏠',
      bg: 'background:linear-gradient(135deg,#B71C1C,#E53935,#FF5252);'
    },
    {
      href: 'promocao.html',
      label: 'PROMOÇÃO',
      icon: '🎉',
      bg: 'background:linear-gradient(135deg,#E8000D,#C62828);'
    },
    {
      href: 'dicas.html',
      label: 'DICAS/DEPOIMENTOS',
      icon: '⭐',
      bg: 'background:linear-gradient(135deg,#00C853,#009624);'
    },
    {
      href: 'fidelidade.html',
      label: 'FIDELIDADE',
      icon: '🎟️',
      bg: 'background:linear-gradient(135deg,#E65100,#FF6D00);'
    },
    {
      href: 'sobre.html',
      label: 'QUEM SOMOS',
      icon: '🏪',
      bg: 'background:linear-gradient(135deg,#4A148C,#6A1B9A);'
    },
    {
      href: 'index.html#cardapio',
      label: 'CARDÁPIO',
      icon: '🍦',
      bg: 'background:linear-gradient(135deg,#8E24AA,#6A1B9A);'
    },
    {
      href: 'encomendas.html',
      label: 'ENCOMENDAS',
      icon: '📦',
      bg: 'background:linear-gradient(135deg,#0D47A1,#00288F);'
    },
    {
      href: 'https://wa.me/5516996062046',
      label: 'CONTATO',
      icon: '💬',
      bg: 'background:linear-gradient(135deg,#25D366,#128C7E);',
      target: '_blank',
      rel: 'noopener'
    }
  ];

  var CSS = [
    '@keyframes nav-home-pulse{',
    '0%,100%{transform:scale(1);box-shadow:0 4px 12px rgba(0,0,0,.2),0 0 0 0 rgba(255,255,255,.5);}',
    '50%{transform:scale(1.04);box-shadow:0 6px 20px rgba(0,0,0,.3),0 0 0 7px rgba(255,255,255,0);}',
    '}',
    '.itap-header-nav.itap-header-nav--full{',
    'grid-template-columns:repeat(2,minmax(0,1fr));',
    'gap:7px;',
    'max-height:min(62vh,430px);',
    'overflow-y:auto;',
    'padding-right:2px;',
    '}',
    '.itap-header-nav.itap-header-nav--full .itap-nav-btn{min-height:58px;}',
    '.itap-header-nav.itap-header-nav--full .itap-nav-btn--home{animation:nav-home-pulse 1.8s ease-in-out infinite;}',
    '.itap-header-nav.itap-header-nav--full .itap-nav-btn--home:hover,.itap-header-nav.itap-header-nav--full .itap-nav-btn--home:focus{animation-play-state:paused;}',
    '@media (min-width:768px){.itap-header-nav.itap-header-nav--full{grid-template-columns:repeat(3,minmax(0,1fr));max-height:none;overflow:visible;padding-right:0;}}',
    '@media (min-width:1100px){.itap-header-nav.itap-header-nav--full{grid-template-columns:repeat(5,minmax(0,1fr));}}'
  ].join('');

  function injectCSS() {
    if (document.getElementById('nav-active-css')) return;
    var style = document.createElement('style');
    style.id = 'nav-active-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function descobrirPaginaAtual() {
    var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return page || 'index.html';
  }

  function abrirDuvidas() {
    if (typeof window._itabotAbrirItaBot === 'function') {
      window._itabotAbrirItaBot();
      return;
    }
    if (typeof window.abrirItaBot === 'function') {
      window.abrirItaBot();
      return;
    }
    var btn = document.querySelector('.ita-bot-duvidas-btn');
    if (btn) btn.click();
  }

  function criarBotao(item, paginaAtual) {
    var a = document.createElement('a');
    a.href = item.href;
    a.className = 'itap-nav-btn';
    a.setAttribute('style', item.bg + 'border-color:rgba(255,255,255,.6);');
    if (item.label === 'TELA INICIAL') a.classList.add('itap-nav-btn--home');
    if (item.action) a.dataset.navAction = item.action;
    if (item.target) a.target = item.target;
    if (item.rel) a.rel = item.rel;

    var hrefPagina = (item.href || '').split('#')[0].toLowerCase();
    if (hrefPagina === paginaAtual && hrefPagina !== '') {
      a.setAttribute('aria-current', 'page');
    }

    a.innerHTML =
      '<span class="itap-nav-icon">' + item.icon + '</span>' +
      '<span class="itap-nav-label">' + item.label + '</span>';
    return a;
  }

  function montarMenuCompleto(nav) {
    var paginaAtual = descobrirPaginaAtual();
    nav.classList.add('itap-header-nav--full');
    nav.innerHTML = '';
    MENU_ITEMS.forEach(function (item) {
      nav.appendChild(criarBotao(item, paginaAtual));
    });
  }

  function bindEventos(nav) {
    if (!nav || nav.dataset.navFullBound === '1') return;
    nav.dataset.navFullBound = '1';
    nav.addEventListener('click', function (event) {
      var trigger = event.target.closest('a[data-nav-action="duvidas"]');
      if (!trigger || !nav.contains(trigger)) return;
      event.preventDefault();
      abrirDuvidas();
    });
  }

  function run() {
    var navs = document.querySelectorAll('.itap-header-nav');
    if (!navs.length) return;
    injectCSS();
    navs.forEach(function (nav) {
      montarMenuCompleto(nav);
      bindEventos(nav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}());
