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
    '.itap-header-nav:has(> :nth-child(5)){grid-template-columns:repeat(2,1fr);}',
    '.itap-header-nav > :nth-child(5):last-child{grid-column:1/-1;max-width:50%;margin:0 auto;width:100%;}'
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
  }

  /* Executa assim que o DOM estiver pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

}());
