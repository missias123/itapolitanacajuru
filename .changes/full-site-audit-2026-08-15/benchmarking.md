# Benchmarking de design premium para cards responsivos

## Referências técnicas consultadas

### Material Design 3 — Cards
URL: https://m3.material.io/components/cards

O Material Design define cards como superfícies para exibir conteúdo relacionado e ações sobre um mesmo tema. A página oficial destaca variantes como cards elevados, que usam sombra para criar separação do fundo. O princípio aplicado ao site será: cada card deve ter um assunto claro, hierarquia de título/preço/ação e sombra suficiente para separar a superfície sem criar poluição visual.

### Material Design 3 — Breakpoints
URL: https://m3.material.io/foundations/layout/breakpoints

A documentação recomenda layouts adaptativos por faixa de largura, redimensionando cards e reorganizando a composição em layouts compactos, médios e expandidos. Aplicação: uma coluna em celulares estreitos; duas colunas apenas quando houver espaço real; não forçar duas colunas quando isso reduzir legibilidade.

### web.dev — Accessible tap targets
URL: https://web.dev/articles/accessible-tap-targets

A recomendação técnica apresentada é manter alvos de toque próximos de 48px independentes para interações móveis. Aplicação: manter botões, controles de abrir/fechar e ações de pedido com área mínima confortável, sem reduzir o botão visualmente a ponto de prejudicar o toque.

### web.dev — Responsive web design basics
URL: https://web.dev/articles/responsive-web-design-basics

A abordagem responsiva deve considerar viewport, toque, adaptação de layout e leitura em diferentes dispositivos. Aplicação: testar 360px, 390px, 768px e desktop, medir overflow real e tratar conteúdo que não cabe com quebra ou rolagem controlada.

### W3C WCAG 2.2 — Target Size Minimum
URL: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

A WCAG 2.2 trata o tamanho mínimo de alvos de ponteiro e os espaçamentos que evitam ativações acidentais. Aplicação: evitar controles colados e preservar espaçamento entre ações vizinhas.

## Síntese para a Itapolitana

O padrão premium não é simplesmente aumentar sombras, fontes ou cores. É manter uma composição previsível: eixo vertical consistente, espaçamento baseado em uma escala, títulos com largura controlada, preço em posição repetível e CTA separado visualmente. Para os quatro cards de encomendas, a composição recomendada é: cabeçalho em duas áreas estáveis (produto à esquerda e indicador à direita), conteúdo interno centralizado por um contêiner único e CTA no mesmo eixo dos produtos. Em mobile estreito, o conteúdo deve mudar para uma coluna sem comprimir títulos e indicadores.
