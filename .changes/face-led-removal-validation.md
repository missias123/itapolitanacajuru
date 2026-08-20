# Validação do itaBot — LED somente abaixo dos pés

Data: 2026-08-20

## Alteração

Removido o elemento `.itabot-face-led` e seu código de mensagens/animação do widget `scripts/ita-bot-widget-v2027.js`. O rosto do robô não recebe mais nenhum letreiro. O único texto LED preservado é `.itabot-launcher-led-panel`, abaixo dos pés, com `DÚVIDA — CLIQUE AQUI`.

## Teste de sintaxe

`node --check scripts/ita-bot-widget-v2027.js` passou sem erros.

## Teste responsivo com Chromium

- Desktop 1440x900: painel 47x15 px; texto 7,5px/13px; imagem 400x400 carregada; overflow horizontal: não.
- Android Pixel 5, 393x727: painel 42x15 px; texto 6,5px/13px; imagem 400x400 carregada; overflow horizontal: não.
- iPhone 13, 390x664: painel 42x15 px; texto 6,5px/13px; imagem 400x400 carregada; overflow horizontal: não.

Antes do ajuste, Android e iPhone comprimiam o painel para 3px. A correção aplicou `flex: 0 0 15px`, `min-height: 15px` e `box-sizing: border-box`.

## DOM local

- Launchers: 1.
- Elementos LED no rosto: 0.
- Painéis LED inferiores: 1.
- O clique no launcher abriu o estado de dúvidas visível. A contagem bruta de seletores de diálogo foi 2 porque os seletores usados podem capturar o mesmo fluxo em mais de um elemento; requer inspeção de IDs/classes antes de publicar.

## Estado

A alteração está validada localmente. Ainda não foi publicada neste registro após a remoção do LED facial.
