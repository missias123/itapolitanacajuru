/* =====================================================
   ITAMANDUÁ — Mascote Sorveteria Itapolitana
   Versão 10 — SORVETE EM CAMADAS

   SEQUÊNCIA COMPLETA:
   1. Susto
   2. TRILHO IDA: corre para a DIREITA
      - Perde bola 1 (rosa) → imagem troca para 2 bolas
      - Perde bola 2 (chocolate) → imagem troca para 1 bola
      - Perde bola 3 (manga) → imagem troca para cascão vazio 😱
      - Some pela direita
   3. Curva fora da tela (invisível)
   4. TRILHO VOLTA: corre para a ESQUERDA
      - Recupera bola 3 → imagem troca para 1 bola
      - Recupera bola 2 → imagem troca para 2 bolas
      - Recupera bola 1 → imagem troca para 3 bolas (original)
   5. Para no lado esquerdo com poeira
   6. Balão "Ufa! Recuperei meu sorvete!"

   IMAGENS:
   - 3 bolas: itamandua_lambendo.webp  (original)
   - 2 bolas: itamandua_2bolas.webp
   - 1 bola:  itamandua_1bola.webp
   - cascão:  itamandua_cascao.webp
   ===================================================== */
(function () {
  'use strict';

  var IMAGENS = {
    3: 'images/itamandua_lambendo.webp',
    2: 'images/itamandua_2bolas.webp',
    1: 'images/itamandua_1bola.webp',
    0: 'images/itamandua_cascao.webp'
  };

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

  /* Posições fixas das bolas no chão — espalhadas na tela */
  var BOLAS_X_PERCENT = [0.25, 0.50, 0.75];

  var fugindo     = false;
  var timerFrase  = null;
  var fraseIdx    = 0;
  var bolasNaTela = [];

  /* ================================================
     INICIALIZAÇÃO
  ================================================ */
  function init() {
    if (document.getElementById('ita-mascote')) return;

    /* Pré-carrega todas as imagens */
    Object.values(IMAGENS).forEach(function(src) {
      var i = new Image(); i.src = src;
    });

    var wrap = document.createElement('div');
    wrap.id = 'ita-mascote';

    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES[0];
    wrap.appendChild(balao);

    var img = document.createElement('img');
    img.id      = 'ita-img';
    img.src     = IMAGENS[3];
    img.alt     = 'Itamanduá — Mascote da Sorveteria Itapolitana';
    img.width   = 140;
    img.height  = 140;
    img.loading = 'lazy';
    img.title   = 'Clique para ver o Itamanduá correr!';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    /* Entra pela esquerda após 1.5s */
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
     TROCA IMAGEM DO MASCOTE (quantas bolas tem)
  ================================================ */
  function trocarImagem(img, numBolas) {
    var novaSrc = IMAGENS[numBolas];
    if (!novaSrc || img.src.indexOf(novaSrc.split('/').pop()) !== -1) return;
    img.style.transition = 'opacity 0.15s ease';
    img.style.opacity = '0.3';
    setTimeout(function() {
      img.src = novaSrc;
      img.style.opacity = '1';
    }, 150);
  }

  /* ================================================
     CRIA BOLA DE SORVETE — cai do alto e quica no chão
  ================================================ */
  function criarBola(bola, xPos, delay, callback) {
    var el = document.createElement('div');
    el.className = 'ita-bola-sorvete';
    el.style.cssText = [
      'position:fixed',
      'z-index:9989',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'background:radial-gradient(circle at 35% 35%,' + bola.cor + ',' + bola.sombra + ')',
      'box-shadow:0 4px 14px rgba(0,0,0,0.3),inset -4px -4px 8px rgba(0,0,0,0.15)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:20px',
      'pointer-events:none',
      'left:' + xPos + 'px',
      'bottom:' + (window.innerHeight * 0.6) + 'px',
      'opacity:0',
      'transition:none'
    ].join(';');
    el.textContent = bola.emoji;
    document.body.appendChild(el);

    setTimeout(function () {
      el.style.transition = 'opacity 0.12s ease';
      el.style.opacity = '1';

      setTimeout(function () {
        var rot = (Math.random() * 40 - 20) + 'deg';
        el.style.transition = 'bottom 0.5s cubic-bezier(0.6,0,1,0.5), transform 0.5s ease';
        el.style.bottom = '80px';
        el.style.transform = 'rotate(' + rot + ')';

        /* 1º quique */
        setTimeout(function () {
          el.style.transition = 'bottom 0.2s ease-out';
          el.style.bottom = '115px';
          /* 2º quique */
          setTimeout(function () {
            el.style.transition = 'bottom 0.16s ease-in';
            el.style.bottom = '80px';
            setTimeout(function () {
              if (callback) callback(el);
            }, 200);
          }, 200);
        }, 500);
      }, 120);
    }, delay);

    return el;
  }

  /* ================================================
     RECOLHE UMA BOLA — pula para a casquinha
  ================================================ */
  function recolherBola(el, xCasquinha, yCasquinha, callback) {
    if (!el || !el.parentNode) {
      if (callback) callback();
      return;
    }
    el.style.transition = [
      'left 0.45s ease-in',
      'bottom 0.45s cubic-bezier(0.2,0.8,0.4,1.6)',
      'transform 0.45s ease',
      'opacity 0.12s ease 0.35s'
    ].join(',');
    el.style.left      = xCasquinha + 'px';
    el.style.bottom    = yCasquinha + 'px';
    el.style.transform = 'scale(0.15) rotate(360deg)';
    el.style.opacity   = '0';
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (callback) callback();
    }, 600);
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
          'bottom:' + (84 + n * 4) + 'px',
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
     ANIMAÇÃO PRINCIPAL — DOIS TRILHOS + TROCA DE IMAGEM
  ================================================ */
  function animar(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    var W = window.innerWidth;
    var rect  = wrap.getBoundingClientRect();
    var xBase = rect.left;

    /* Posições X das 3 bolas no chão */
    var bolaX = BOLAS_X_PERCENT.map(function(p) {
      return Math.round(W * p);
    });

    /* ---- FASE 1: Susto ---- */
    balao.classList.remove('ita-balao-show');
    img.style.transition = 'transform 0.12s ease';
      img.style.transform  = 'translateY(-22px) scale(1.18) rotate(10deg)';

    setTimeout(function () {
      img.style.transition = '';
      img.style.transform  = '';

      /* ---- FASE 2: TRILHO IDA — corre para a DIREITA ---- */
      wrap.style.transition = 'none';
      wrap.classList.remove('ita-visivel');
      wrap.classList.add('ita-correndo', 'ita-trilho-ida');
      wrap.style.left  = xBase + 'px';
      wrap.style.right = 'auto';
      void wrap.offsetWidth;

      /* Duração da corrida de ida: 2000ms */
      var DURACAO_IDA = 2000;

      setTimeout(function () {
        wrap.style.left = (W + 300) + 'px';
      }, 50);

      /* ---- FASE 3: Perde bolas UMA A UMA — troca imagem ---- */
      bolasNaTela = [];

      /* Bola 1 (rosa) cai → mascote fica com 2 bolas */
      criarBola(BOLAS[0], bolaX[0], 200, function(el1) {
        bolasNaTela[0] = el1;
        trocarImagem(img, 2);
      });

      /* Bola 2 (chocolate) cai → mascote fica com 1 bola */
      criarBola(BOLAS[1], bolaX[1], 700, function(el2) {
        bolasNaTela[1] = el2;
        trocarImagem(img, 1);
      });

      /* Bola 3 (manga) cai → mascote fica com cascão vazio */
      criarBola(BOLAS[2], bolaX[2], 1200, function(el3) {
        bolasNaTela[2] = el3;
        trocarImagem(img, 0);
      });

      /* ---- FASE 4: Fora da tela — curva invisível ---- */
      setTimeout(function () {
        wrap.style.transition = 'none';
        wrap.classList.remove('ita-correndo', 'ita-trilho-ida');
        wrap.classList.add('ita-voltando', 'ita-trilho-volta');
        wrap.style.left = (W + 300) + 'px';
        void wrap.offsetWidth;

        /* ---- FASE 5: TRILHO VOLTA — corre para a ESQUERDA ---- */
        var DURACAO_VOLTA = 2000;
        setTimeout(function () {
          wrap.style.left = (-300) + 'px';

          /* ---- FASE 6: Recupera bolas UMA A UMA + troca imagem ---- */
          /* Na volta vem da DIREITA → ESQUERDA */
          /* Passa por bolaX[2] primeiro (mais à direita), depois [1], depois [0] */
          var velocidade = (W + 600) / DURACAO_VOLTA;

          /* Recupera bola 3 (manga) → fica com 1 bola */
          var dist2 = (W + 300) - bolaX[2];
          var t2 = Math.round(dist2 / velocidade);
          setTimeout(function () {
            var r = wrap.getBoundingClientRect();
            recolherBola(bolasNaTela[2], r.left + 20, 130, null);
            trocarImagem(img, 1);
          }, t2);

          /* Recupera bola 2 (chocolate) → fica com 2 bolas */
          var dist1 = (W + 300) - bolaX[1];
          var t1 = Math.round(dist1 / velocidade);
          setTimeout(function () {
            var r = wrap.getBoundingClientRect();
            recolherBola(bolasNaTela[1], r.left + 20, 130, null);
            trocarImagem(img, 2);
          }, t1);

          /* Recupera bola 1 (rosa) → fica com 3 bolas (original) */
          var dist0 = (W + 300) - bolaX[0];
          var t0 = Math.round(dist0 / velocidade);
          setTimeout(function () {
            var r = wrap.getBoundingClientRect();
            recolherBola(bolasNaTela[0], r.left + 20, 130, null);
            trocarImagem(img, 3);
          }, t0);

          /* ---- FASE 7: Chegou no lado esquerdo — para com poeira ---- */
          setTimeout(function () {
            wrap.classList.remove('ita-voltando', 'ita-trilho-volta');

            wrap.style.transition = 'none';
            wrap.style.right  = 'auto';
            wrap.style.left   = '6px';
            wrap.style.bottom = '160px';
    wrap.style.transform = 'translateX(0)';
        void wrap.offsetWidth;

            /* Garante imagem com 3 bolas e sem transform */
            img.style.transform = '';
            trocarImagem(img, 3);

            var r3 = wrap.getBoundingClientRect();
            poeira(r3.left + 20);

            /* ---- FASE 8: Balão "Ufa!" ---- */
            setTimeout(function () {
              var frase = FRASES_VOLTA[Math.floor(Math.random() * FRASES_VOLTA.length)];
              balao.textContent = frase;
              balao.classList.add('ita-balao-show');

              setTimeout(function () {
                fugindo = false;
                bolasNaTela = [];
                rodarFrases(balao);
              }, 3200);
            }, 300);

          }, DURACAO_VOLTA + 100);

        }, 150);

      }, DURACAO_IDA + 200);

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
