/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Objetivo: garantir menu superior SEMPRE completo e consistente em todas as páginas,
 * exatamente igual à primeira tela (TELA INICIAL, PROMOÇÃO, DICAS/DEPOIMENTOS, QUEM SOMOS, ENCOMENDAS).
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
    '/* TOPO CANÔNICO — 5 BOTÕES OFICIAIS IDÊNTICOS EM TODAS AS ABAS */',
    '.itap-header{background:linear-gradient(135deg,#E8000D,#C62828)!important;border-bottom:4px solid #FFD600!important;padding:0 12px!important;position:sticky!important;top:0!important;z-index:99999!important;box-shadow:0 4px 20px rgba(0,0,0,.25)!important;isolation:isolate!important;width:100%!important;box-sizing:border-box!important;}',
    '.itap-header-inner{max-width:960px!important;margin:0 auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:12px!important;width:100%!important;box-sizing:border-box!important;padding:12px 12px 16px!important;}',
    '.itap-header-top{display:flex!important;justify-content:center!important;align-items:center!important;padding:1px 0!important;width:100%!important;box-sizing:border-box!important;}',
    '.itap-header-nav{contain:layout!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:100%!important;box-sizing:border-box!important;grid-auto-rows:minmax(56px,auto)!important;}',
    '.itap-header-nav .itap-nav-btn{min-height:58px!important;padding:10px 6px!important;border-radius:16px!important;line-height:1.1!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-decoration:none!important;color:#fff!important;box-shadow:0 4px 12px rgba(0,0,0,.2)!important;border:2px solid rgba(255,255,255,.6)!important;box-sizing:border-box!important;}',
    '.itap-header-nav .itap-nav-icon{font-size:1.8em!important;line-height:1!important;margin-bottom:2px!important;}',
    '.itap-header-nav .itap-nav-label{font-size:clamp(12px,3.2vw,14px)!important;font-weight:900!important;line-height:1.1!important;letter-spacing:.5px!important;text-align:center!important;}',
    '@media (min-width:768px){.itap-header-inner{padding:10px 20px!important;}.itap-header-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important;}.itap-header-nav .itap-nav-btn{min-height:60px!important;padding:10px 8px!important;}.itap-header-nav .itap-nav-label{font-size:13px!important;}}',
    '.ita-bot-duvidas-btn{background:#FFD600!important;color:#C62828!important;font-weight:900!important;border:none!important;border-radius:50px!important;padding:6px 16px!important;font-size:12px!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(0,0,0,0.2)!important;}'
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

  function criarBotao(item, paginaAtual) {
    var a = document.createElement('a');
    a.href = item.href;
    a.className = 'itap-nav-btn';
    a.setAttribute('style', item.bg);

    var hrefPagina = (item.href || '').toLowerCase();
    if (hrefPagina === paginaAtual) {
      a.setAttribute('aria-current', 'page');
    }

    var iconHtml = (typeof window.ItapIcon === 'function')
      ? window.ItapIcon(item.icon, 'white')
      : '<span class="itap-nav-icon-legacy">🏠</span>';

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
              'onclick="if(window.abrirItaBot){window.abrirItaBot();}else{window.location.href=\'index.html\';}" ' +
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
    nav.innerHTML = '';
    MENU_ITEMS.forEach(function (item) {
      nav.appendChild(criarBotao(item, paginaAtual));
    });
  }

  function run() {
    montarCabecalhos();
    var navs = document.querySelectorAll('.itap-header-nav');
    if (!navs.length) return;
    injectCSS();
    navs.forEach(function (nav) {
      montarMenuCompleto(nav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}());
