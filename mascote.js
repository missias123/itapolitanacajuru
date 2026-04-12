/* =====================================================
   ITAMANDUÁ — Mascote da Sorveteria Itapolitana
   Versão: Fuga Engraçada ao Clicar
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
  var timerVolta = null;
  var fugindo    = false;

  function criar() {
    // Evita duplicação
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
    img.src     = 'images/itamandua_lambendo.webp';
    img.alt     = 'Itamanduá — Mascote da Sorveteria Itapolitana Cajuru';
    img.width   = 140;
    img.height  = 140;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.title   = 'Clique para ver o Itamanduá correr!';
    wrap.appendChild(img);

    document.body.appendChild(wrap);

    // Entrada suave após 1.2s
    setTimeout(function () {
      wrap.classList.add('visivel');
      setTimeout(function () {
        balao.classList.add('mostrar');
        iniciarFrases(balao);
      }, 600);
    }, 1200);

    // Clique — fuga engraçada
    img.addEventListener('click', function () {
      if (fugindo) return;
      fugir(wrap, balao, img);
    });
  }

  function iniciarFrases(balao) {
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

    // 1. Esconde balão
    balao.classList.remove('mostrar');
    clearInterval(timerFrase);

    // 2. Susto — pula para cima
    img.style.transition = 'transform 0.18s ease';
    img.style.transform  = 'translateY(-25px) rotate(10deg) scale(1.2)';

    setTimeout(function () {
      // 3. Vira para a esquerda (espelha) e começa a correr
      img.style.transition = 'none';
      img.style.transform  = 'scaleX(-1)'; // vira para esquerda

      // 4. Adiciona animação de corrida (pernas)
      wrap.classList.add('correndo');

      // 5. Desloca pela tela toda para a esquerda e some
      wrap.classList.remove('visivel');
      wrap.classList.add('fugindo');

    }, 220);

    // 6. Após sair da tela, reposiciona para voltar da esquerda
    setTimeout(function () {
      wrap.classList.remove('fugindo');
      wrap.classList.add('voltando-prep');

      // Vira de volta para a direita
      img.style.transition = 'none';
      img.style.transform  = 'scaleX(-1)'; // ainda virado para esquerda (correndo para direita)

      // 7. Entra correndo da esquerda
      setTimeout(function () {
        wrap.classList.remove('voltando-prep');
        wrap.classList.add('voltando');

        setTimeout(function () {
          // 8. Chegou — para, vira normal, retoma flutuação
          wrap.classList.remove('correndo', 'voltando');
          img.style.transition = 'transform 0.3s ease';
          img.style.transform  = 'scaleX(1)';

          setTimeout(function () {
            img.style.transition = '';
            img.style.transform  = '';
            fugindo = false;

            // Retoma balão
            setTimeout(function () {
              balao.classList.add('mostrar');
              iniciarFrases(balao);
            }, 500);
          }, 300);
        }, 900);
      }, 100);
    }, 1200);
  }

  // Inicia quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criar);
  } else {
    criar();
  }
})();
