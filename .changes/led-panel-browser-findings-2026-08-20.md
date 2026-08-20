# Validação visual do painel LED do itaBot — 2026-08-20

A home local foi aberta em `http://localhost:4174/index.html` após a alteração definitiva de `scripts/ita-bot-widget.js`.

## Constatações verificadas

- O arquivo atualizado carregou sem erro de sintaxe no `node --check`.
- O launcher visível é `#itabot-launcher`, injetado pelo widget oficial.
- O robô exibido usa `images/itabot-3d-full-body-transparent.png`.
- A antiga etiqueta `.itabot-launcher-label` foi substituída pelo painel `.itabot-launcher-led-panel`.
- O texto do painel é `DÚVIDA — CLIQUE AQUI` e está em branco sobre fundo vermelho, com contorno escuro e linhas de varredura LED.
- O painel fica imediatamente abaixo da área do robô, abaixo dos pés, dentro da mesma área clicável do botão.
- A imagem deixou de ser recortada por `clip-path` na parte inferior, permitindo manter os pés visíveis.
- O painel usa `pointer-events:none`, portanto o clique é recebido pelo botão único `#itabot-launcher` e continua chamando `_itabotAbrirTelaCheia()`.
- O cálculo de posicionamento inteligente continua ativo e mantém o launcher acima de overlays inferiores quando existe espaço; a captura também mostrou a barra de consentimento/cookies presente na viewport, sem criação de um segundo robô.

## Observação de aprovação

A implementação está aplicada localmente para validação. Ainda não foi feito commit nem publicação externa nesta etapa.
