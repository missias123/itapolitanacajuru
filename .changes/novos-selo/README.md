# Alteração: selos NOVO e rótulo DÚVIDAS

Foram aplicados selos vermelhos, redondos e pulsantes nos sabores **Cheesecake**, **Passas ao Rum** e **Bem Casado** em `index.html` e `encomendas.html`.

O selo usa `pointer-events: none`, portanto não intercepta cliques. Em Encomendas, a seleção continua sendo executada pelo card `.sabor-item`, com o indicador de seleção reposicionado quando necessário.

O itaBot recebeu o rótulo visual **DÚVIDAS** abaixo do robô. O launcher permanece um único botão clicável, e a faixa inferior legada do asset é ocultada visualmente por recorte CSS para não exibir o texto antigo.

Validações realizadas: `node --check scripts/ita-bot-widget.js`, `git diff --check`, 38 chips no Cardápio, 38 cards em Encomendas e seleção funcional de Bem Casado com `pointer-events: none` no selo.

## Validação pública após o commit 102d6ab

- O GitHub Pages concluiu o deploy `32198577156` com sucesso.
- O widget público carregou `ita-bot-widget.js?v=d50eb20-duvidas-novo`.
- O launcher público exibiu o rótulo `DÚVIDAS` e o aria-label `Abrir ItaBot — Dúvidas`.
- O modal público exibiu exatamente três selos `NOVO`: Bem Casado, Cheesecake e Passas ao Rum.
- O clique no card Cheesecake foi aceito: a validação mudou para `Faltam 1 sabores.` e o elemento permaneceu com `onclick="window.toggleSabor('Cheesecake', this)"`; o selo continua não interativo.

## Ajuste de posição do selo

O selo `NOVO` foi reposicionado para a parte inferior direita nos chips do Cardápio e nos cards de Encomendas. O sinal `✓` permanece no canto superior direito quando o sabor é selecionado. No teste local, Cheesecake foi selecionado normalmente, a mensagem passou para `Faltam 1 sabores.` e o selo continuou visual, sem bloquear o clique.
