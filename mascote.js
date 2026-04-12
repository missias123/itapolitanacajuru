/* =====================================================
   ITAMANDUÁ — Mascote da Sorveteria Itapolitana
   Versão: Fuga Horizontal Correta
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
    'Manga, morango, açaí... 🥭',
    'Nota 4.9 no Google! ⭐',
    'Peça pelo WhatsApp! 📱',
    'Venha nos visitar! 📍',
    'Minha língua é enorme! 👅',
    'Feito com amor! ❤️'
  ];

  var fraseIdx   = 0;
  var timerFrase = null;
  var fugindo    = false;

  function criar() {
    if (document.getElementById('ita-mascote')) return;

    var wrap = document.createElement('div');
    wrap.id = 'ita-mascote';

    // Balão de fala
    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES[0];
    wrap.appendChild(balao);

    // Imagem
    var img = document.createElement('img');
    img.src      = 'images/itamandua_lambendo.webp';
    img.alt      = 'Itamanduá — Mascote da Sorveteria Itapolitana Cajuru';
    img.width    = 140;
    img.height   = 140;
    img.loading  = 'lazy';
    img.decoding = 'async';
    img.title    = 'Clique para ver o Itamanduá correr!';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    // Entrada: desliza da direita após 1.2s
    setTimeout(function () {
      wrap.classList.add('visivel');
      setTimeout(function () {
        balao.classList.add('mostrar');
        iniciarFrases(balao);
      }, 600);
    }, 1200);

    // Clique — fuga
    img.addEventListener('click', function () {
      if (fugindo) return;
      fugir(wrap, balao, img);
    });
  }

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

  function fugir(wrap, balao, img) {
    fugindo = true;
    clearInterval(timerFrase);

    // 1. Esconde balão
    balao.classList.remove('mostrar');

    // 2. Susto: pula rapidinho
    img.style.transition = 'transform 0.15s ease';
    img.style.transform  = 'translateY(-20px) scale(1.15) rotate(8deg)';

    setTimeout(function () {
      // 3. Inicia corrida para a esquerda
      img.style.transition = '';
      img.style.transform  = '';
      wrap.classList.remove('visivel');
      wrap.classList.add('correndo', 'fugindo');

      // 4. Após sair da tela (1.1s de transição + margem)
      setTimeout(function () {
        // 5. Remove classe de fuga, reposiciona sem transição à esquerda
        wrap.classList.remove('fugindo', 'correndo');
        wrap.classList.add('retorno-inicio', 'retornando');

        // 6. Força reflow para aplicar posição sem animação
        void wrap.offsetWidth;

        // 7. Anima retorno da esquerda para a direita
        setTimeout(function () {
          wrap.classList.remove('retorno-inicio');
          wrap.classList.add('retorno-fim');

          // 8. Chegou — limpa tudo e retoma estado normal
          setTimeout(function () {
            wrap.classList.remove('retorno-fim', 'retornando');
            wrap.classList.add('visivel');
            img.style.transition = '';
            img.style.transform  = '';
            fugindo = false;

            // Retoma balão
            setTimeout(function () {
              balao.classList.add('mostrar');
              iniciarFrases(balao);
            }, 500);
          }, 1100); // duração do retorno-fim
        }, 50);
      }, 1300); // aguarda fuga completa
    }, 200); // duração do susto
  }

  // Inicia quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criar);
  } else {
    criar();
  }
})();
