/**
 * ITAMANDUÁ — Mascote da Sorveteria Itapolitana Cajuru
 * Arquivo independente. Não modifica nenhum outro elemento da página.
 * Padrão: criação dinâmica via JS, carregamento assíncrono.
 */
(function () {
  'use strict';

  var FRASES = [
    'Oi! Sou o Itamanduá! 🍦',
    'Que sorvete gostoso! 😋',
    '17 anos de sabor! 🎉',
    'Temos 35 sabores! 🍨',
    'O melhor de Cajuru! ⭐',
    'Chocolate é vida! 🍫',
    'Nota 4.9 no Google! 🌟',
    'Peça pelo WhatsApp! 💬',
    'Venha nos visitar! 📍',
    'Feito com amor! ❤️'
  ];

  var frase_idx = 0;
  var oculto = false;

  function criar() {
    // Evitar duplicação
    if (document.getElementById('ita-mascote')) return;

    // Injetar CSS
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'mascote.css';
    document.head.appendChild(link);

    // Criar container
    var container = document.createElement('div');
    container.id = 'ita-mascote';
    container.setAttribute('role', 'complementary');
    container.setAttribute('aria-label', 'Mascote Itamanduá');

    // Balão de fala
    var balao = document.createElement('div');
    balao.id = 'ita-balao';
    balao.textContent = FRASES[0];

    // Imagem
    var img = document.createElement('img');
    img.src = 'images/itamandua_lambendo.webp';
    img.alt = 'Itamanduá — Mascote da Sorveteria Itapolitana Cajuru';
    img.width = 110;
    img.height = 110;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.title = 'Clique para esconder o Itamanduá';

    // Clicar esconde temporariamente
    img.addEventListener('click', function () {
      if (oculto) return;
      oculto = true;
      container.style.transform = 'translateX(-180px)';
      balao.classList.remove('mostrar');
      setTimeout(function () {
        container.style.transform = '';
        setTimeout(function () {
          balao.classList.add('mostrar');
          oculto = false;
        }, 900);
      }, 4000);
    });

    container.appendChild(balao);
    container.appendChild(img);
    document.body.appendChild(container);

    // Entrar na tela após 1.5s
    setTimeout(function () {
      container.classList.add('visivel');
      setTimeout(function () {
        balao.classList.add('mostrar');
      }, 600);
    }, 1500);

    // Trocar frases a cada 3.5s
    setInterval(function () {
      if (oculto) return;
      frase_idx = (frase_idx + 1) % FRASES.length;
      balao.classList.remove('mostrar');
      setTimeout(function () {
        balao.textContent = FRASES[frase_idx];
        balao.classList.add('mostrar');
      }, 350);
    }, 3500);
  }

  // Aguardar DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criar);
  } else {
    criar();
  }
})();
