/* =====================================================
   ITAMANDUÁ — Mascote Sorveteria Itapolitana
   Versão 8 — DOIS TRILHOS (pista oval)

   LÓGICA COMO PISTA OVAL:
   ┌──────────────────────────────────────────────────┐
   │  TELA VISÍVEL                                    │
   │                                                  │
   │  TRILHO VOLTA (bottom:140px) →→→→→→→→→→→→→→→  │
   │                                                  │
   │  TRILHO IDA   (bottom: 80px) ←←←←←←←←←←←←←←  │
   │                                                  │
   └──────────────────────────────────────────────────┘
         ↑ curva fora                    ↑ curva fora
         da tela esq                     da tela dir

   SEQUÊNCIA AO CLICAR:
   1. Susto
   2. TRILHO IDA: corre de frente → esquerda → some
   3. Bolas caem no chão em sequência
   4. Curva fora da tela (invisível)
   5. TRILHO VOLTA: entra pela esquerda → corre de frente → direita
   6. Passa pelas bolas → cada uma pula para a casquinha
   7. Chega na posição original → para com poeira
   8. Balão "Ufa! Recuperei meu sorvete!"
   9. Retoma frases normais

   REGRA DE OURO: ZERO scaleX. A imagem SEMPRE de frente.
   Só o container (left) se move.
   ===================================================== */
(function () {
  'use strict';

  var FRASES = [
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
    'Clique em mim! 😜'
  ];

  var FRASES_VOLTA = [
    'Ufa! Recuperei meu sorvete! 😅',
    'Quase perdi tudo! 😤',
    'Meu sorvete tá salvo! 🍦✅',
    'Nunca mais faço isso! 😅'
  ];

  var BOLAS = [
    { cor: '#e75480', sombra: '#c0395f', emoji: '🍓' },
    { cor: '#6B3A2A', sombra: '#4a2518', emoji: '🍫' },
    { cor: '#FFB300', sombra: '#e09000', emoji: '🥭' }
  ];

  var fugindo     = false;
  var timerFrase  = null;
  var fraseIdx    = 0;
  var bolasNaTela = [];

  /* ================================================
     INICIALIZAÇÃO
  ================================================ */
  function init() {
    if (document.getElementById('ita-mascote')) return;

    var wrap = document.createElement('div');
    wrap.id = 'ita-mascote';

    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES[0];
    wrap.appendChild(balao);

    var img = document.createElement('img');
    img.id      = 'ita-img';
    img.src     = 'images/itamandua_lambendo.webp';
    img.alt     = 'Itamanduá — Mascote da Sorveteria Itapolitana';
    img.width   = 140;
    img.height  = 140;
    img.loading = 'lazy';
    img.title   = 'Clique para ver o Itamanduá correr!';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    /* Entra pela direita após 1.5s */
    setTimeout(function () {
      wrap.classList.add('ita-visivel');
      setTimeout(function () {
        balao.classList.add('ita-balao-show');
        rodarFrases(balao);
      }, 900);
    }, 1500);

    img.addEventListener('click', function () {
      if (fugindo) return;
      animar(wrap, balao, img);
    });
  }

  /* ================================================
     TROCA DE FRASES
  ================================================ */
  function rodarFrases(balao) {
    clearInterval(timerFrase);
    timerFrase = setInterval(function () {
      balao.classList.remove('ita-balao-show');
      setTimeout(function () {
        fraseIdx = (fraseIdx + 1) % FRASES.length;
        balao.textContent = FRASES[fraseIdx];
        balao.classList.add('ita-balao-show');
      }, 300);
    }, 3000);
  }

  /* ================================================
     CRIA BOLA DE SORVETE NO CHÃO
  ================================================ */
  function criarBola(bola, xPos, delay) {
    var el = document.createElement('div');
    el.className = 'ita-bola-sorvete';
    el.style.cssText = [
      'position:fixed',
      'z-index:9989',
      'width:40px',
      'height:40px',
      'border-radius:50%',
      'background:radial-gradient(circle at 35% 35%,' + bola.cor + ',' + bola.sombra + ')',
      'box-shadow:0 4px 14px rgba(0,0,0,0.3),inset -4px -4px 8px rgba(0,0,0,0.15)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'pointer-events:none',
      'left:' + xPos + 'px',
      'bottom:240px',
      'opacity:0',
      'transition:none'
    ].join(';');
    el.textContent = bola.emoji;
    document.body.appendChild(el);

    setTimeout(function () {
      el.style.transition = 'opacity 0.1s ease';
      el.style.opacity = '1';

      setTimeout(function () {
        var rot = (Math.random() * 50 - 25) + 'deg';
        el.style.transition = 'bottom 0.55s cubic-bezier(0.6,0,1,0.5), transform 0.55s ease';
        el.style.bottom = '72px';
        el.style.transform = 'rotate(' + rot + ')';

        /* 1º quique */
        setTimeout(function () {
          el.style.transition = 'bottom 0.22s ease-out';
          el.style.bottom = '110px';
          /* 2º quique */
          setTimeout(function () {
            el.style.transition = 'bottom 0.18s ease-in';
            el.style.bottom = '72px';
          }, 220);
        }, 550);
      }, 100);
    }, delay);

    return el;
  }

  /* ================================================
     POEIRA NA FREADA
  ================================================ */
  function poeira(xPos) {
    for (var i = 0; i < 5; i++) {
      (function (n) {
        var p = document.createElement('div');
        p.style.cssText = [
          'position:fixed',
          'width:' + (7 + n * 5) + 'px',
          'height:' + (7 + n * 5) + 'px',
          'border-radius:50%',
          'background:rgba(160,120,60,0.38)',
          'left:' + (xPos + n * 10 - 20) + 'px',
          'bottom:' + (76 + n * 4) + 'px',
          'z-index:9987',
          'pointer-events:none',
          'transition:all 0.45s ease-out'
        ].join(';');
        document.body.appendChild(p);
        setTimeout(function () {
          p.style.opacity = '0';
          p.style.transform = 'translate(' + (n * 14 - 24) + 'px,-20px) scale(2.5)';
          setTimeout(function () {
            if (p.parentNode) p.parentNode.removeChild(p);
          }, 500);
        }, 20 + n * 30);
      })(i);
    }
  }

  /* ================================================
     RECOLHE BOLAS — pulam para a casquinha
  ================================================ */
  function recolherBolas(xCasquinha, yCasquinha) {
    var lista = bolasNaTela.slice();
    bolasNaTela = [];
    lista.forEach(function (el, i) {
      if (!el || !el.parentNode) return;
      setTimeout(function () {
        el.style.transition = [
          'left 0.5s ease-in',
          'bottom 0.5s cubic-bezier(0.2,0.8,0.4,1.5)',
          'transform 0.5s ease',
          'opacity 0.15s ease 0.38s'
        ].join(',');
        el.style.left      = xCasquinha + 'px';
        el.style.bottom    = yCasquinha + 'px';
        el.style.transform = 'scale(0.2) rotate(360deg)';
        el.style.opacity   = '0';
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 700);
      }, i * 230);
    });
  }

  /* ================================================
     ANIMAÇÃO PRINCIPAL — DOIS TRILHOS
  ================================================ */
  function animar(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    var W = window.innerWidth;

    /* Posição atual do mascote (lado direito) */
    var rect  = wrap.getBoundingClientRect();
    var xBase = rect.left + rect.width / 2 - 20;

    /* ---- FASE 1: Susto ---- */
    balao.classList.remove('ita-balao-show');
    img.style.transition = 'transform 0.12s ease';
    img.style.transform  = 'translateY(-22px) scale(1.18) rotate(10deg)';

    setTimeout(function () {
      img.style.transition = '';
      img.style.transform  = '';

      /* ---- FASE 2: Entra no TRILHO IDA (bottom: 80px) ---- */
      /* Prepara: define left atual antes de remover right */
      var xAtual = rect.left;
      wrap.style.transition = 'none';
      wrap.classList.remove('ita-visivel');
      wrap.classList.add('ita-correndo', 'ita-trilho-ida');
      wrap.style.right = 'auto';
      wrap.style.left  = xAtual + 'px';
      void wrap.offsetWidth; /* força reflow */

      /* ---- FASE 3: Bolas caem em sequência (enquanto corre) ---- */
      bolasNaTela = [];
      BOLAS.forEach(function (bola, i) {
        var el = criarBola(bola, xBase - 15 + i * 22, i * 420);
        bolasNaTela.push(el);
      });

      /* Corre para a esquerda — sai da tela (TRILHO IDA) */
      setTimeout(function () {
        wrap.style.left = (-300) + 'px'; /* sai pela esquerda */
      }, 50);

      /* ---- FASE 4: Chegou fora da tela à esquerda ---- */
      /* Faz a "curva" invisível: reposiciona no TRILHO VOLTA, fora da tela à ESQUERDA */
      setTimeout(function () {
        wrap.style.transition = 'none';
        wrap.classList.remove('ita-trilho-ida');
        wrap.classList.add('ita-trilho-volta');
        /* Posiciona fora da tela à esquerda, no trilho de volta (bottom: 140px) */
        wrap.style.left = (-300) + 'px';
        void wrap.offsetWidth; /* força reflow */

        /* ---- FASE 5: TRILHO VOLTA — corre de frente da esquerda para a direita ---- */
        setTimeout(function () {
          /* Adiciona classe ita-voltando para aplicar scaleX(-1) no CSS — fica de frente */
          wrap.classList.remove('ita-correndo');
          wrap.classList.add('ita-voltando');
          /* Corre até o lado direito (posição original) */
          wrap.style.left = (W - 160) + 'px';

          /* ---- FASE 6: Recolhe bolas enquanto passa por elas ---- */
          setTimeout(function () {
            var r2 = wrap.getBoundingClientRect();
            recolherBolas(r2.left + 30, 120);
          }, 700);

          /* ---- FASE 7: Chegou no lado direito — para com poeira ---- */
          setTimeout(function () {
            /* Remove classes de corrida */
            wrap.classList.remove('ita-correndo', 'ita-voltando', 'ita-trilho-volta');

            /* Restaura posicionamento original: right:12px, bottom:80px */
            wrap.style.transition = 'none';
            wrap.style.left   = 'auto';
            wrap.style.right  = '12px';
            wrap.style.bottom = '80px';
            wrap.style.transform = 'translateX(0)';
            void wrap.offsetWidth;

            /* Poeira */
            var r3 = wrap.getBoundingClientRect();
            poeira(r3.left + 20);

            /* ---- FASE 8: Balão "Ufa!" ---- */
            setTimeout(function () {
              var frase = FRASES_VOLTA[Math.floor(Math.random() * FRASES_VOLTA.length)];
              balao.textContent = frase;
              balao.classList.add('ita-balao-show');

              setTimeout(function () {
                fugindo = false;
                rodarFrases(balao);
              }, 3200);
            }, 300);

          }, 1700); /* tempo do trilho volta */

        }, 200); /* pequena pausa antes de entrar no trilho volta */

      }, 1800); /* tempo para sair pela esquerda no trilho ida */

    }, 130);
  }

  /* ================================================
     START
  ================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
