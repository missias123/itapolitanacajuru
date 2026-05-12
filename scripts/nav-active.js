/**
 * NAV ACTIVE — Sorveteria Itapolitana
 * Lógica: na página atual, remove o botão desta página do nav e insere
 * "🏠 TELA INICIAL" pulsante como PRIMEIRO botão.
 * Na tela inicial (index.html): nenhuma alteração.
 */
(function () {
  'use strict';

  /* CSS do botão TELA INICIAL pulsante — injetado uma única vez */
  var CSS = [
    '@keyframes nav-home-pulse{',
      '0%,100%{transform:scale(1);box-shadow:0 4px 12px rgba(0,0,0,.2),0 0 0 0 rgba(255,255,255,.6);}',
      '50%{transform:scale(1.06);box-shadow:0 6px 20px rgba(0,0,0,.35),0 0 0 8px rgba(255,255,255,0);}',
    '}',
    '.nav-home-btn{animation:nav-home-pulse 1.6s ease-in-out infinite !important;}',
    '.nav-home-btn:hover,.nav-home-btn:focus{animation-play-state:paused !important;transform:translateY(-2px) scale(1.04) !important;}',
    /* When nav has 5 children (secondary pages), last item stretches full width */
    '.itap-header-nav:not(.itap-header-nav--show-all):has(> :nth-child(5)){grid-template-columns:repeat(2,1fr);}',
    '.itap-header-nav:not(.itap-header-nav--show-all) > :nth-child(5):last-child{grid-column:1/-1;max-width:50%;margin:0 auto;width:100%;}',
    '.itap-nav-btn--quem-somos-extra{display:none;}',
    '.itap-header-nav.itap-header-nav--show-all{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}',
    '.itap-header-nav.itap-header-nav--show-all .itap-nav-btn--quem-somos-extra{display:flex;}',
    '.itap-header-nav.itap-header-nav--show-all > :nth-child(5):last-child{grid-column:auto;max-width:none;margin:0;width:auto;}',
    '.itap-header-nav.itap-header-nav--show-all .itap-nav-btn{min-height:58px;}',
    '@media (min-width:768px){.itap-header-nav.itap-header-nav--show-all{grid-template-columns:repeat(3,minmax(0,1fr));}}'
  ].join('');

  function injectCSS() {
    if (document.getElementById('nav-active-css')) return;
    var s = document.createElement('style');
    s.id = 'nav-active-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function run() {
    /* Só actua em páginas com o header padrão (.itap-header-nav) */
    var nav = document.querySelector('.itap-header-nav');
    if (!nav) return;

    /* Descobre o nome do ficheiro atual */
    var path  = window.location.pathname;
    var page  = path.split('/').pop() || 'index.html';
    if (!page) page = 'index.html';

    /* Tela inicial: sem alterações */
    if (page === 'index.html' || page === '') return;

    injectCSS();

    /* Remove o botão da página atual (não pode clicar onde já está) */
    var btns = nav.querySelectorAll('a.itap-nav-btn');
    btns.forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === page) {
        a.parentNode.removeChild(a);
      }
    });

    /* Cria botão 🏠 TELA INICIAL pulsante */
    var homeBtn = document.createElement('a');
    homeBtn.href = 'index.html';
    homeBtn.className = 'itap-nav-btn nav-home-btn';
    homeBtn.setAttribute('style',
      'background:linear-gradient(135deg,#B71C1C,#E53935,#FF5252);' +
      'border-color:rgba(255,255,255,.6);'
    );
    homeBtn.setAttribute('aria-label', 'Voltar à Tela Inicial');
    homeBtn.innerHTML =
      '<span class="itap-nav-icon">🏠</span>' +
      '<span class="itap-nav-label">TELA INICIAL</span>';

    /* Insere como PRIMEIRO botão */
    nav.insertBefore(homeBtn, nav.firstChild);

    habilitarExpansaoQuemSomos(nav);
  }

  function normalizarHref(href) {
    var valor = String(href || '');
    if (!valor) return '';
    if (valor.indexOf('http') === 0) return valor;
    return valor.split('/').pop();
  }

  function criarBtnNavExtra(item) {
    var a = document.createElement('a');
    a.href = item.href;
    a.className = 'itap-nav-btn itap-nav-btn--quem-somos-extra';
    a.setAttribute('style', item.bg + 'border-color:rgba(255,255,255,.6);');
    a.innerHTML =
      '<span class="itap-nav-icon">' + item.icon + '</span>' +
      '<span class="itap-nav-label">' + item.label + '</span>';
    return a;
  }

  function habilitarExpansaoQuemSomos(nav) {
    if (!nav) return;
    if (nav.dataset.quemSomosExpandBound === '1') return;
    nav.dataset.quemSomosExpandBound = '1';
    /* "Quem Somos" aponta para sobre.html no site */
    var trigger = nav.querySelector('a.itap-nav-btn[href$="sobre.html"]');
    if (!trigger) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    var itens = [
      { href: 'index.html', label: 'INÍCIO', icon: '🏠', bg: 'background:linear-gradient(135deg,#B71C1C,#E53935,#FF5252);' },
      { href: 'index.html#cardapio', label: 'CARDÁPIO', icon: '🍦', bg: 'background:linear-gradient(135deg,#6A1B9A,#8E24AA);' },
      { href: 'encomendas.html', label: 'ENCOMENDAS', icon: '🛒', bg: 'background:linear-gradient(135deg,#0D47A1,#00288F);' },
      { href: 'promocao.html', label: 'PROMOÇÕES', icon: '🎉', bg: 'background:linear-gradient(135deg,#E8000D,#C62828);' },
      { href: 'fidelidade.html', label: 'FIDELIDADE', icon: '🎟️', bg: 'background:linear-gradient(135deg,#E65100,#FF6D00);' },
      { href: 'https://wa.me/5516996062046', label: 'CONTATO', icon: '💬', bg: 'background:linear-gradient(135deg,#25D366,#128C7E);' }
    ];

    var existentes = {};
    nav.querySelectorAll('a.itap-nav-btn').forEach(function (a) {
      existentes[normalizarHref(a.getAttribute('href'))] = true;
    });

    itens.forEach(function (item) {
      if (!existentes[normalizarHref(item.href)]) {
        nav.appendChild(criarBtnNavExtra(item));
      }
    });

    function abrirMenuCompleto() {
      nav.classList.add('itap-header-nav--show-all');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function fecharMenuCompleto() {
      nav.classList.remove('itap-header-nav--show-all');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('mouseenter', abrirMenuCompleto);
    trigger.addEventListener('focus', abrirMenuCompleto);
    trigger.addEventListener('click', function (event) {
      if (nav.classList.contains('itap-header-nav--show-all')) {
        return;
      } else {
        event.preventDefault();
        abrirMenuCompleto();
      }
    });

    nav.addEventListener('mouseleave', fecharMenuCompleto);
  }

  /* Executa assim que o DOM estiver pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

}());
