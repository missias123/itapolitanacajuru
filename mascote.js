/* =====================================================
   ITAMANDUÁ — Mascote Sorveteria Itapolitana
   Versão 6 DEFINITIVA
   
   REGRAS:
   - Sem clicar: fica parado no lado direito, flutua e fala
   - Ao clicar:
     1. Susto
     2. Corre para a esquerda
     3. 3 bolas caem no chão em sequência (ficam lá)
     4. Some pelo lado esquerdo
     5. Reposiciona fora da tela à ESQUERDA (invisível)
     6. Volta correndo da ESQUERDA para a DIREITA (visível na tela)
     7. Enquanto passa pelas bolas → cada uma pula para a casquinha
     8. Para no lado direito com poeira
     9. Diz frase engraçada e retoma frases normais
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

  var fugindo    = false;
  var timerFrase = null;
  var fraseIdx   = 0;
  var bolasNaTela = [];

  /* ==================================================
     INICIALIZAÇÃO
  ================================================== */
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

  /* ==================================================
     TROCA DE FRASES
  ================================================== */
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

  /* ==================================================
     CRIA BOLA DE SORVETE NO CHÃO
  ================================================== */
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
      /* Aparece */
      el.style.transition = 'opacity 0.1s ease';
      el.style.opacity = '1';

      /* Cai após aparecer */
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

  /* ==================================================
     POEIRA NA FREADA
  ================================================== */
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

  /* ==================================================
     RECOLHE BOLAS — pulam para a casquinha em sequência
     Chamado ENQUANTO ele está visível na tela
  ================================================== */
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

  /* ==================================================
     ANIMAÇÃO PRINCIPAL
  ================================================== */
  function animar(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    /* Captura posição atual do mascote */
    var rect  = wrap.getBoundingClientRect();
    var xBase = rect.left + rect.width / 2 - 20;

    /* ---- FASE 1: Susto ---- */
    balao.classList.remove('ita-balao-show');
    img.style.transition = 'transform 0.12s ease';
    img.style.transform  = 'translateY(-22px) scale(1.18) rotate(10deg)';

    setTimeout(function () {
      img.style.transition = 'transform 0.1s ease';
      img.style.transform  = '';

      /* ---- FASE 2: Corre para a esquerda ---- */
      setTimeout(function () {
        wrap.classList.add('ita-correndo');

        /* ---- FASE 3: Bolas caem em sequência ---- */
        bolasNaTela = [];
        BOLAS.forEach(function (bola, i) {
          var el = criarBola(bola, xBase - 15 + i * 22, i * 420);
          bolasNaTela.push(el);
        });

        /* ---- FASE 4: Some pelo lado esquerdo ---- */
        setTimeout(function () {
          wrap.classList.remove('ita-visivel');
          wrap.classList.add('ita-fugindo');

          /* ---- FASE 5: Reposiciona fora da tela À ESQUERDA (invisível) ---- */
          setTimeout(function () {
            wrap.style.transition = 'none';
            wrap.classList.remove('ita-fugindo');
            /* Posiciona fora da tela à ESQUERDA */
            wrap.style.right = 'auto';
            wrap.style.left  = '-250px';
            wrap.style.transform = 'translateX(0)';
            void wrap.offsetWidth; /* força reflow */

            /* ---- FASE 6: Volta correndo da ESQUERDA para a DIREITA ---- */
            /* Ele entra pela esquerda e corre até o lado direito — VISÍVEL NA TELA */
            setTimeout(function () {
              /* Restaura transição de corrida — agora de frente (voltando) */
              wrap.classList.remove('ita-correndo');
              wrap.classList.add('ita-voltando');
              wrap.style.transition = 'left 1.8s linear';
              /* Corre até o lado direito */
              wrap.style.left = (window.innerWidth - 160) + 'px';

              /* ---- FASE 7: Enquanto corre, recolhe bolas ao passar por elas ---- */
              /* As bolas estão espalhadas na tela — recolhe após 0.8s (já está visível) */
              setTimeout(function () {
                var r2 = wrap.getBoundingClientRect();
                var xCasq = r2.left + 30;
                var yCasq = window.innerHeight - r2.top - 60;
                recolherBolas(xCasq, yCasq);
              }, 800);

              /* ---- FASE 8: Para no lado direito com poeira ---- */
              setTimeout(function () {
                wrap.classList.remove('ita-correndo', 'ita-voltando');

                /* Restaura posicionamento para right:12px */
                wrap.style.transition = 'none';
                wrap.style.left  = 'auto';
                wrap.style.right = '12px';
                wrap.style.transform = 'translateX(0)';
                void wrap.offsetWidth;

                /* Poeira */
                var r3 = wrap.getBoundingClientRect();
                poeira(r3.left + 20);

                /* ---- FASE 9: Balão de volta + retoma frases ---- */
                setTimeout(function () {
                  var frase = FRASES_VOLTA[Math.floor(Math.random() * FRASES_VOLTA.length)];
                  balao.textContent = frase;
                  balao.classList.add('ita-balao-show');

                  setTimeout(function () {
                    fugindo = false;
                    rodarFrases(balao);
                  }, 3200);
                }, 300);
              }, 1900); /* tempo total da corrida */
            }, 1200); /* espera antes de voltar */
          }, 1200); /* tempo para sair da tela */
        }, 600);
      }, 200);
    }, 130);
  }

  /* ==================================================
     START
  ================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
