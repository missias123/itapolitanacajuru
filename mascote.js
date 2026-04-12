/* =====================================================
   ITAMANDUÁ — Mascote Sorveteria Itapolitana
   Versão 4 — Fuga + Bolas de Sorvete Caindo
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
    'Feito com amor! ❤️'
  ];

  // Cores e emojis das 3 bolas de sorvete
  var BOLAS = [
    { cor: '#e75480', emoji: '🍓' }, // morango
    { cor: '#8B4513', emoji: '🍫' }, // chocolate
    { cor: '#FFD700', emoji: '🥭' }  // manga
  ];

  var fraseIdx   = 0;
  var timerFrase = null;
  var fugindo    = false;
  var bolasNaTela = [];

  /* ---- Cria o mascote ---- */
  function criar() {
    if (document.getElementById('ita-mascote')) return;

    var wrap = document.createElement('div');
    wrap.id = 'ita-mascote';

    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES[0];
    wrap.appendChild(balao);

    var img = document.createElement('img');
    img.src      = 'images/itamandua_lambendo.webp';
    img.alt      = 'Itamanduá — Mascote da Sorveteria Itapolitana';
    img.width    = 140;
    img.height   = 140;
    img.loading  = 'lazy';
    img.title    = 'Clique para ver o Itamanduá correr!';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    // Entrada: desliza da direita após 1.2s
    setTimeout(function () {
      wrap.classList.add('visivel');
      setTimeout(function () {
        balao.classList.add('mostrar');
        iniciarFrases(balao);
      }, 700);
    }, 1200);

    img.addEventListener('click', function () {
      if (fugindo) return;
      fugir(wrap, balao, img);
    });
  }

  /* ---- Troca frases ---- */
  function iniciarFrases(balao) {
    clearInterval(timerFrase);
    timerFrase = setInterval(function () {
      balao.classList.remove('mostrar');
      setTimeout(function () {
        fraseIdx = (fraseIdx + 1) % FRASES.length;
        balao.textContent = FRASES[fraseIdx];
        balao.classList.add('mostrar');
      }, 350);
    }, 3000);
  }

  /* ---- Cria uma bola de sorvete caindo ---- */
  function criarBola(bola, posX) {
    var el = document.createElement('div');
    el.className = 'ita-bola';
    el.style.cssText = [
      'position:fixed',
      'width:38px',
      'height:38px',
      'border-radius:50%',
      'background:' + bola.cor,
      'box-shadow:0 4px 12px rgba(0,0,0,0.3),inset -4px -4px 8px rgba(0,0,0,0.15)',
      'z-index:9989',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'left:' + posX + 'px',
      'bottom:220px',
      'transition:none',
      'pointer-events:none'
    ].join(';');
    el.textContent = bola.emoji;
    document.body.appendChild(el);

    // Anima a queda
    setTimeout(function () {
      el.style.transition = 'bottom 0.6s cubic-bezier(0.55,0,1,0.45), transform 0.6s ease';
      el.style.bottom = '75px';
      el.style.transform = 'rotate(' + (Math.random() * 60 - 30) + 'deg)';

      // Quique
      setTimeout(function () {
        el.style.transition = 'bottom 0.2s ease-out';
        el.style.bottom = '95px';
        setTimeout(function () {
          el.style.transition = 'bottom 0.15s ease-in';
          el.style.bottom = '75px';
        }, 200);
      }, 600);
    }, 50);

    return el;
  }

  /* ---- Recolhe as bolas — pulam de volta para a casquinha em sequência ---- */
  function recolherBolas(posXCasquinha) {
    // Pega a posição vertical do mascote para saber onde está a casquinha
    var mascote = document.getElementById('ita-mascote');
    var alturaAlvo = mascote ? mascote.getBoundingClientRect().top + 80 : 200;

    bolasNaTela.forEach(function (el, i) {
      setTimeout(function () {
        // Pulo para cima em direção à casquinha
        el.style.transition = 'left 0.45s ease-in, bottom 0.5s cubic-bezier(0.55,0,0.7,1.5), transform 0.45s ease, opacity 0.2s ease 0.3s';
        el.style.left   = posXCasquinha + 'px';
        el.style.bottom = (window.innerHeight - alturaAlvo) + 'px';
        el.style.transform = 'scale(0.5) rotate(-360deg)';
        el.style.opacity = '0';
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 600);
      }, i * 180); // sequência: 1ª, 2ª, 3ª bola
    });
    bolasNaTela = [];
  }

  /* ---- Lógica de fuga ---- */
  function fugir(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    // Esconde balão
    balao.classList.remove('mostrar');

    // 1. Susto rápido
    img.style.transition = 'transform 0.15s ease';
    img.style.transform  = 'translateY(-18px) scale(1.12) rotate(8deg)';

    setTimeout(function () {
      img.style.transition = '';
      img.style.transform  = '';

      // 2. Ativa corrida (espelha + bob)
      wrap.classList.add('correndo');

      // 3. Cria as 3 bolas caindo em SEQUÊNCIA — uma de cada vez
      var rect = wrap.getBoundingClientRect();
      var baseX = rect.left;
      bolasNaTela = [];
      BOLAS.forEach(function (bola, i) {
        setTimeout(function () {
          var el = criarBola(bola, baseX - 10 + i * 18);
          bolasNaTela.push(el);
        }, i * 400); // 0.4s entre cada bola
      });

      // 4. Fuga para a esquerda
      setTimeout(function () {
        wrap.classList.remove('visivel');
        wrap.classList.add('fugindo');

        // 5. Após sair da tela: reposiciona SILENCIOSAMENTE fora da tela à direita
        setTimeout(function () {
          // Remove classes de fuga e corrida SEM transição
          wrap.style.transition = 'none';
          wrap.classList.remove('fugindo', 'correndo');
          // Força posição fora da tela à direita (estado inicial)
          wrap.style.transform = 'translateX(220px)';

          // Força reflow para garantir que a posição foi aplicada
          void wrap.offsetWidth;

          // 6. Após 4 segundos, volta entrando pelo lado direito
          setTimeout(function () {
            // Restaura transição e anima entrada pela direita
            wrap.style.transition = '';
            wrap.classList.add('visivel');

            // Recolhe as bolas ao mesmo tempo
            var retRect = wrap.getBoundingClientRect();
            recolherBolas(window.innerWidth - 80);

            // 7. Quando chegar, retoma estado normal
            setTimeout(function () {
              wrap.style.transition = '';
              wrap.style.transform  = '';
              fugindo = false;

              setTimeout(function () {
                balao.classList.add('mostrar');
                iniciarFrases(balao);
              }, 400);
            }, 1000);
          }, 4000);
        }, 1200); // tempo para sair da tela
      }, 200); // pequeno delay antes de fugir
    }, 180); // duração do susto
  }

  /* ---- Inicializa ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criar);
  } else {
    criar();
  }

})();
