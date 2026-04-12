/* =====================================================
   ITAMANDUÁ — Mascote Sorveteria Itapolitana
   Versão 5 — DEFINITIVA ENGRAÇADA
   Inspirado em: Duolingo, Mailchimp, Disney
   ===================================================== */
(function () {
  'use strict';

  var FRASES_NORMAL = [
    'Oi! Sou o Itamanduá! 🍦',
    'Que sorvete gostoso! 😋',
    '17 anos de sabor! 🎉',
    'Temos 35 sabores! 🍨',
    'O melhor de Cajuru! 🏆',
    'Chocolate é vida! 🍫',
    'Nota 4.9 no Google! ⭐',
    'Peça pelo WhatsApp! 📱',
    'Venha nos visitar! 📍',
    'Feito com amor! ❤️',
    'Clique em mim! 😜',
    'Minha língua é enorme! 👅'
  ];

  var FRASES_VOLTA = [
    'Ufa! Quase perdi meu sorvete! 😅',
    'Voltei! Não me assuste mais! 😤',
    'Meu sorvete tá salvo! 🍦✅',
    'Corri tanto que derreti! 😅'
  ];

  // 3 bolas de sorvete
  var BOLAS = [
    { cor: '#e75480', sombra: '#c0395f', emoji: '🍓', nome: 'morango' },
    { cor: '#6B3A2A', sombra: '#4a2518', emoji: '🍫', nome: 'chocolate' },
    { cor: '#FFB300', sombra: '#e09000', emoji: '🥭', nome: 'manga' }
  ];

  var fraseIdx    = 0;
  var timerFrase  = null;
  var fugindo     = false;
  var bolasNaTela = [];

  /* ================================================
     CRIAÇÃO DO MASCOTE
  ================================================ */
  function criar() {
    if (document.getElementById('ita-mascote')) return;

    var wrap = document.createElement('div');
    wrap.id = 'ita-mascote';

    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES_NORMAL[0];
    wrap.appendChild(balao);

    var img = document.createElement('img');
    img.src     = 'images/itamandua_lambendo.webp';
    img.alt     = 'Itamanduá — Mascote da Sorveteria Itapolitana';
    img.width   = 140;
    img.height  = 140;
    img.loading = 'lazy';
    img.title   = 'Clique para ver o Itamanduá correr! 🏃';
    img.id      = 'ita-img';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    // Entrada suave pela direita após 1.2s
    setTimeout(function () {
      wrap.classList.add('visivel');
      setTimeout(function () {
        balao.classList.add('mostrar');
        iniciarFrases(balao, FRASES_NORMAL);
      }, 800);
    }, 1200);

    img.addEventListener('click', function () {
      if (fugindo) return;
      fugir(wrap, balao, img);
    });
  }

  /* ================================================
     TROCA DE FRASES
  ================================================ */
  function iniciarFrases(balao, lista) {
    clearInterval(timerFrase);
    fraseIdx = 0;
    timerFrase = setInterval(function () {
      balao.classList.remove('mostrar');
      setTimeout(function () {
        fraseIdx = (fraseIdx + 1) % lista.length;
        balao.textContent = lista[fraseIdx];
        balao.classList.add('mostrar');
      }, 350);
    }, 3200);
  }

  function mostrarFrase(balao, texto) {
    clearInterval(timerFrase);
    balao.classList.remove('mostrar');
    setTimeout(function () {
      balao.textContent = texto;
      balao.classList.add('mostrar');
    }, 300);
  }

  /* ================================================
     EFEITO DE IMPACTO (PLOFT!)
  ================================================ */
  function criarImpacto(x, y) {
    var el = document.createElement('div');
    el.className = 'ita-impacto';
    el.style.cssText = [
      'position:fixed',
      'left:' + (x - 20) + 'px',
      'bottom:' + y + 'px',
      'width:40px',
      'height:20px',
      'border-radius:50%',
      'background:rgba(232,0,13,0.18)',
      'z-index:9988',
      'pointer-events:none',
      'transform:scale(0)',
      'transition:transform 0.25s ease-out, opacity 0.3s ease 0.2s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.transform = 'scale(1)';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 600);
    }, 30);
    return el;
  }

  /* ================================================
     CRIA UMA BOLA DE SORVETE
  ================================================ */
  function criarBola(bola, posX, delay) {
    var el = document.createElement('div');
    el.className = 'ita-bola';
    el.style.cssText = [
      'position:fixed',
      'width:40px',
      'height:40px',
      'border-radius:50%',
      'background:radial-gradient(circle at 35% 35%, ' + bola.cor + ', ' + bola.sombra + ')',
      'box-shadow:0 4px 14px rgba(0,0,0,0.35),inset -5px -5px 10px rgba(0,0,0,0.18)',
      'z-index:9989',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'left:' + posX + 'px',
      'bottom:230px',
      'opacity:0',
      'transform:scale(0.3) rotate(-20deg)',
      'transition:none',
      'pointer-events:none'
    ].join(';');
    el.textContent = bola.emoji;
    document.body.appendChild(el);

    setTimeout(function () {
      // Aparece
      el.style.transition = 'opacity 0.1s, transform 0.15s ease-out';
      el.style.opacity = '1';
      el.style.transform = 'scale(1) rotate(0deg)';

      // 1ª queda
      setTimeout(function () {
        var rotacao = (Math.random() * 50 - 25) + 'deg';
        el.style.transition = 'bottom 0.55s cubic-bezier(0.55,0,1,0.45), transform 0.55s ease';
        el.style.bottom = '72px';
        el.style.transform = 'rotate(' + rotacao + ')';

        // Impacto no chão
        setTimeout(function () {
          criarImpacto(posX + 20, 72);

          // 1º quique
          el.style.transition = 'bottom 0.22s cubic-bezier(0.33,0,0.66,1)';
          el.style.bottom = '115px';
          setTimeout(function () {
            // 2º quique
            el.style.transition = 'bottom 0.18s cubic-bezier(0.33,0,0.66,1)';
            el.style.bottom = '72px';
            setTimeout(function () {
              // Para no chão
              el.style.transition = 'bottom 0.12s ease-out';
              el.style.bottom = '72px';
            }, 180);
          }, 220);
        }, 550);
      }, 150);
    }, delay);

    return el;
  }

  /* ================================================
     RECOLHE AS BOLAS — PULAM PARA A CASQUINHA
  ================================================ */
  function recolherBolas(xCasquinha) {
    var mascote = document.getElementById('ita-mascote');
    var yAlvo = mascote ? (window.innerHeight - mascote.getBoundingClientRect().top - 60) : 200;

    bolasNaTela.forEach(function (el, i) {
      if (!el || !el.parentNode) return;
      setTimeout(function () {
        // Arco de pulo em direção à casquinha
        el.style.transition = [
          'left 0.5s cubic-bezier(0.4,0,0.6,1)',
          'bottom 0.5s cubic-bezier(0.2,0.8,0.4,1.4)',
          'transform 0.5s ease',
          'opacity 0.15s ease 0.35s'
        ].join(',');
        el.style.left      = (xCasquinha + i * 5) + 'px';
        el.style.bottom    = yAlvo + 'px';
        el.style.transform = 'scale(0.3) rotate(' + (i % 2 === 0 ? '360deg' : '-360deg') + ')';
        el.style.opacity   = '0';
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 600);
      }, i * 200);
    });
    bolasNaTela = [];
  }

  /* ================================================
     EFEITO DE POEIRA (FREADA)
  ================================================ */
  function criarPoeira(x, y) {
    for (var p = 0; p < 5; p++) {
      (function (idx) {
        var puff = document.createElement('div');
        puff.style.cssText = [
          'position:fixed',
          'width:' + (8 + idx * 4) + 'px',
          'height:' + (8 + idx * 4) + 'px',
          'border-radius:50%',
          'background:rgba(180,140,80,0.35)',
          'left:' + (x - 20 + idx * 8) + 'px',
          'bottom:' + (y + idx * 6) + 'px',
          'z-index:9987',
          'pointer-events:none',
          'opacity:0.8',
          'transition:all 0.5s ease-out'
        ].join(';');
        document.body.appendChild(puff);
        setTimeout(function () {
          puff.style.opacity = '0';
          puff.style.transform = 'translate(' + (idx * 12 - 24) + 'px, -20px) scale(2)';
          setTimeout(function () {
            if (puff.parentNode) puff.parentNode.removeChild(puff);
          }, 500);
        }, 30 + idx * 40);
      })(p);
    }
  }

  /* ================================================
     LÓGICA DE FUGA — VERSÃO DEFINITIVA ENGRAÇADA
  ================================================ */
  function fugir(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    // --- FASE 1: SUSTO (0ms) ---
    balao.classList.remove('mostrar');
    img.style.transition = 'transform 0.12s ease';
    img.style.transform  = 'translateY(-22px) scale(1.18) rotate(10deg)';

    setTimeout(function () {
      // Volta do susto
      img.style.transition = 'transform 0.1s ease';
      img.style.transform  = '';

      // --- FASE 2: COMEÇA A CORRER (200ms) ---
      setTimeout(function () {
        wrap.classList.add('correndo');

        // --- FASE 3: BOLAS CAEM EM SEQUÊNCIA (300ms, 700ms, 1100ms) ---
        var rect  = wrap.getBoundingClientRect();
        var baseX = rect.left + 20;
        bolasNaTela = [];

        BOLAS.forEach(function (bola, i) {
          var el = criarBola(bola, baseX - 15 + i * 20, i * 400);
          bolasNaTela.push(el);
        });

        // --- FASE 4: FUGA PARA A ESQUERDA (500ms após início) ---
        setTimeout(function () {
          wrap.classList.remove('visivel');
          wrap.classList.add('fugindo');

          // --- FASE 5: REPOSICIONA SILENCIOSAMENTE À DIREITA ---
          setTimeout(function () {
            wrap.style.transition = 'none';
            wrap.classList.remove('fugindo', 'correndo');
            wrap.style.transform = 'translateX(220px)';
            void wrap.offsetWidth; // força reflow

            // --- FASE 6: VOLTA PELA DIREITA (após 4.5s) ---
            setTimeout(function () {
              wrap.style.transition = '';
              wrap.classList.add('visivel');

              // Recolhe bolas ao mesmo tempo
              var retRect = wrap.getBoundingClientRect();
              recolherBolas(retRect.right - 50);

              // --- FASE 7: FREADA COM POEIRA ---
              setTimeout(function () {
                var r = wrap.getBoundingClientRect();
                criarPoeira(r.left + 20, 80);

                // Balão especial de volta
                var fraseVolta = FRASES_VOLTA[Math.floor(Math.random() * FRASES_VOLTA.length)];
                mostrarFrase(balao, fraseVolta);

                // Após 3s, volta às frases normais
                setTimeout(function () {
                  fugindo = false;
                  iniciarFrases(balao, FRASES_NORMAL);
                }, 3000);
              }, 900);
            }, 4500);
          }, 1300); // tempo para sair da tela
        }, 500);
      }, 200);
    }, 130);
  }

  /* ================================================
     INICIALIZA
  ================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criar);
  } else {
    criar();
  }

})();
