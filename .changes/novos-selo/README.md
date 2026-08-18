# Alteração: selos NOVO e rótulo DÚVIDAS

Foram aplicados selos vermelhos, redondos e pulsantes nos sabores **Cheesecake**, **Passas ao Rum** e **Bem Casado** em `index.html` e `encomendas.html`.

O selo usa `pointer-events: none`, portanto não intercepta cliques. Em Encomendas, a seleção continua sendo executada pelo card `.sabor-item`, com o indicador de seleção reposicionado quando necessário.

O itaBot recebeu o rótulo visual **DÚVIDAS** abaixo do robô. O launcher permanece um único botão clicável, e a faixa inferior legada do asset é ocultada visualmente por recorte CSS para não exibir o texto antigo.

Validações realizadas: `node --check scripts/ita-bot-widget.js`, `git diff --check`, 38 chips no Cardápio, 38 cards em Encomendas e seleção funcional de Bem Casado com `pointer-events: none` no selo.
