/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Objetivo: garantir menu superior SEMPRE completo e consistente em todas as páginas.
 */
(function () {
  'use strict';

  var MENU_ITEMS = [
    {
      href: 'index.html',
      label: 'TELA INICIAL',
      icon: 'home',
      bg: 'background:linear-gradient(135deg,#B71C1C,#E53935,#FF5252);'
    },
    {
      href: 'promocao.html',
      label: 'PROMOÇÃO',
      icon: 'promo',
      bg: 'background:linear-gradient(135deg,#E8000D,#C62828);'
    },
    {
      href: 'dicas.html',
      label: 'DICAS/DEPOIMENTOS',
      icon: 'star',
      bg: 'background:linear-gradient(135deg,#00C853,#009624);'
    },
    {
      href: 'sobre.html',
      label: 'QUEM SOMOS',
      icon: 'info',
      bg: 'background:linear-gradient(135deg,#4A148C,#6A1B9A);'
    },
    {
      href: 'encomendas.html',
      label: 'ENCOMENDAS',
      icon: 'box',
      bg: 'background:linear-gradient(135deg,#0D47A1,#00288F);'
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
    var page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    return page || 'index.html';
  }

  function descobrirHashAtual() {
    return (window.location.hash || '').toLowerCase();
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
    if (btn) {
      btn.click();
      return;
    }
    console.warn('[itap-nav] Não foi possível abrir o botão DÚVIDAS nesta página.');
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

    var hashAtual = descobrirHashAtual();
    var href = item.href || '';
    var isExternal = /^https?:\/\//i.test(href);
    var hrefPartes = isExternal ? [''] : href.split('#');
    var hrefPagina = (hrefPartes[0] || '').toLowerCase();
    var hrefHash = hrefPartes.length > 1 ? '#' + hrefPartes[1].toLowerCase() : '';
    if (hrefPagina === paginaAtual && (!hrefHash || hrefHash === hashAtual)) {
      a.setAttribute('aria-current', 'page');
    }

    var iconHtml = (typeof window.ItapIcon === 'function')
      ? window.ItapIcon(item.icon, 'white')
      : '<span class="itap-nav-icon-legacy">' + item.icon + '</span>';

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
      header.setAttribute('data-itap-header', '');
      header.innerHTML =
        '<div class="itap-header-inner">' +
          '<div class="itap-header-top"><div class="itap-header-duvidas">' +
            '<button type="button" class="ita-bot-duvidas-btn" data-role="duvidas" id="ita-bot-duvidas" ' +
              'onclick="if(window.abrirItaBot){window.abrirItaBot();}else{window.location.href=\'index.html#conteudo-principal\';}" ' +
              'aria-label="Dúvidas — Ita Bot" aria-haspopup="dialog">DÚVIDAS</button>' +
          '</div></div>' +
          '<nav class="itap-header-nav" aria-label="Menu principal"></nav>' +
        '</div>';
      slot.replaceChildren(header);
      slot.dataset.itapHeaderMounted = 'true';
    });
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
    montarCabecalhos();
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
