# Diagnóstico de responsividade — 2026-08-15

## Alteração auditada
O grid `.home-enc-comp-grid` foi centralizado com `max-width: 960px`, `margin: 0 auto`, `box-sizing: border-box`, padding lateral responsivo e duas colunas a partir de 768px. Os cartões `.home-enc-comp-card` receberam largura integral e `box-sizing: border-box`.

## Medição no navegador desktop
Viewport: 1280 × 1100.
Grid: left 153px, right 1113px, width 960px.
Cartões: primeiro left 169px/right 622px; segundo left 644px/right 1097px; mesmas posições na segunda linha.
Resultado: grid centralizado, duas colunas equilibradas e sem overflow horizontal.

## Renderização headless Android e Tablet
As capturas `android-390.png` e `tablet-768.png` ficaram visualmente em branco, com fundo creme uniforme. Isso indica que o método headless com fragmento `#acc-encomendas` não carregou a seção no primeiro enquadramento ou posicionou a captura fora do conteúdo; não é evidência de falha do CSS do grid. A prévia interativa do navegador carregou o site normalmente e permitiu medir o grid.

## Próximo passo
Validar as dimensões móveis por inspeção computada e, se necessário, renderizar uma âncora/rota de teste específica para a seção antes de publicar.
