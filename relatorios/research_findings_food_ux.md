# Descobertas de benchmark de UX para sites de alimentos

## Escopo e método

Foram observados o site oficial da McDonald's, a página pública do iFood (a página principal exibiu CAPTCHA no ambiente de teste, portanto foram usados apenas conteúdos públicos extraídos), além de referências oficiais de design systems e grid responsivo. Também foram coletadas estimativas públicas de visitas e ranking global pelo Similarweb para o período de maio a julho de 2026. Os números não são métricas internas dos sites e devem ser tratados como estimativas do provedor.

## Benchmark de audiência

| Domínio | Visitas estimadas em julho de 2026 | Ranking global em julho de 2026 | Leitura para o projeto |
|---|---:|---:|---|
| ubereats.com | 73.305.713 | 357 | Referência de catálogo amplo, busca e fluxo transacional |
| ifood.com.br | 30.317.420 | 1.438 | Referência local de delivery, entrada por necessidade e categorias |
| mcdonalds.com | 27.202.408 | 1.978 | Referência de marca, campanha, produto e CTA primário |
| starbucks.com | 18.290.884 | 2.769 | Referência de cardápio, personalização e consistência visual |

Os números completos estão em `benchmark_trafego_food.json`. A comparação não prova que um modelo seja universalmente “o mais visualizado do mundo”; ela identifica benchmarks globais fortes e separa claramente audiência de qualidade de interface.

## Fórmula extraída

A fórmula comum é: **sistema de tokens + componentes reutilizáveis + padrões de tarefa + grid responsivo + CTA único por etapa + preservação de contexto**.

A referência de design system da Figma descreve design systems como um conjunto compartilhado de componentes, diretrizes, tokens e documentação, com ganhos de consistência, acessibilidade e escala. A referência oficial USWDS trata padrões como “receitas” para tarefas específicas, combinando componentes, tokens e orientação de usabilidade. O grid responsivo do Material Design separa o layout em colunas, gutters e margens, ajustando quantidade de colunas e espaçamentos por breakpoint.

Na página oficial da McDonald's, a hierarquia pública observada é consistente: navegação global, ação “Order Now”, blocos de campanha com imagem, título, explicação curta e CTA; o conteúdo não mistura várias ações primárias dentro do mesmo bloco. Na página pública do iFood, a entrada é orientada por tarefa: busca, categorias de serviço e chamadas diretas para ver opções, mantendo linguagem simples e foco no próximo passo.

## Aplicação segura ao Itapolitana Cajuru

O Itapolitana deve usar uma única camada visual FUEAP com os seguintes tokens: margem móvel de 16px como base, gutter móvel de 8–12px, margem de tablet de 24px e container desktop limitado; grids com `minmax(0, 1fr)` para evitar overflow; cards de sabor com proporção 1:1; textos com quebra controlada; modais com scroll interno e `overscroll-behavior: contain`; botão primário visualmente único por etapa; e preservação integral de IDs, `onclick`, funções globais e sequência do carrinho.

A fórmula não deve copiar marca, textos, imagens ou código proprietário dos benchmarks. Ela deve adaptar apenas princípios públicos de estrutura e usabilidade ao catálogo da sorveteria, incluindo a separação entre 35 sabores Tipo Artesanal e o catálogo especializado de picolés.

## Fontes

[1] [McDonald's — site oficial](https://www.mcdonalds.com/us/en-us.html)

[2] [iFood — site público](https://www.ifood.com.br/)

[3] [Figma — exemplos e fundamentos de design systems](https://www.figma.com/resource-library/design-system-examples/)

[4] [U.S. Web Design System — Introducing patterns](https://designsystem.digital.gov/patterns/intro/)

[5] [Material Design — Responsive layout grid](https://m2.material.io/design/layout/responsive-layout-grid.html)

[6] [Similarweb — benchmark coletado para os domínios](https://www.similarweb.com/)
