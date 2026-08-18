/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Design: Ultra Compacto, Glossy & World Class
 * Objetivo: Cabeçalho unificado com 5 botões oficiais (Tela Inicial, Promoção, Dicas, Quem Somos, Encomendas).
 * Versão: 2.3 — 18/08/2026 — Unificação Total Oficial 5 Botões
 */
(function () {
  'use strict';

  var MENU_ITEMS = [
    {
      label: 'TELA INICIAL',
      href: 'index.html',
      icon: 'home',
      bg: 'background: linear-gradient(135deg, #FF5252, #D32F2F);'
    },
    {
      label: 'PROMOÇÃO',
      href: 'promocao.html',
      icon: 'promo',
      bg: 'background: linear-gradient(135deg, #FF5252, #D32F2F);'
    },
    {
      label: 'DICAS/DEPOIMENTOS',
      href: 'dicas.html',
      icon: 'star',
      bg: 'background: linear-gradient(135deg, #4CAF50, #2E7D32);'
    },
    {
      label: 'QUEM SOMOS',
      href: 'sobre.html',
      icon: 'info',
      bg: 'background: linear-gradient(135deg, #9C27B0, #6A1B9A);'
    },
    {
      label: 'ENCOMENDAS',
      href: 'encomendas.html',
      icon: 'box',
      bg: 'background: linear-gradient(135deg, #2196F3, #1565C0);'
    }
  ];

  var CSS = `
    .itap-header {
      position: sticky;
      top: 0;
      z-index: 2000;
      width: 100%;
      background: rgba(211, 47, 47, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 6px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .itap-nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      gap: 6px;
      padding: 0 8px;
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .itap-nav-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 70px;
      padding: 4px 6px;
      border-radius: 8px;
      text-decoration: none;
      color: white !important;
      transition: all 0.2s ease;
      border: 1px solid rgba(255,255,255,0.2);
      flex: 1;
      max-width: 120px;
    }
    .itap-nav-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      filter: brightness(1.1);
    }
    .itap-nav-btn[aria-current="page"] {
      border: 2px solid white;
      box-shadow: 0 0 10px rgba(255,255,255,0.5);
      filter: brightness(1.2);
    }
    .itap-nav-icon {
      font-size: 16px;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .itap-nav-label {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: center;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }
    @media (max-width: 480px) {
      .itap-nav-container { gap: 4px; padding: 0 4px; }
      .itap-nav-btn { min-width: 60px; padding: 3px 2px; }
      .itap-nav-label { font-size: 7px; }
      .itap-nav-icon { font-size: 14px; }
    }
  `;

  function addStyle(id, CSS) {
    if (document.getElementById(id)) return;
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

  function run() {
    var slot = document.querySelector('[data-itap-header-slot]');
    if (!slot) return;

    addStyle('itap-header-styles', CSS);

    var header = document.createElement('header');
    header.className = 'itap-header';
    
    var nav = document.createElement('nav');
    nav.className = 'itap-nav-container';
    nav.setAttribute('aria-label', 'Menu principal');

    var paginaAtual = descobrirPaginaAtual();

    MENU_ITEMS.forEach(function (item) {
      nav.appendChild(criarBotao(item, paginaAtual));
    });

    header.appendChild(nav);
    slot.innerHTML = '';
    slot.appendChild(header);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
