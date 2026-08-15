# Validação de Dicas e Depoimentos

## Escopo

A página `dicas.html` recebeu um enquadramento premium responsivo sobre a estrutura existente. O controlador compartilhado do cabeçalho foi versionado de forma uniforme em todas as páginas ativas para evitar cache divergente e garantir o mesmo topo da tela inicial.

## Correção do cabeçalho

O problema observado em Dicas era compatível com carregamento de versão antiga do `nav-active.js`. A referência do controlador foi uniformizada para `scripts/nav-active.js?v=20260815-header-canonical-1` em `index.html`, `encomendas.html`, `promocao.html`, `dicas.html`, `galeria.html`, `sobre.html`, `offline.html` e `politica-privacidade.html`.

## Auditoria responsiva específica

| Viewport | Cabeçalhos | Cards | Cards fora do enquadramento | Overflow horizontal | Links sem destino |
|---|---:|---:|---:|---:|---:|
| Android 360×800 | 1 | 7 | 0 | Não | 0 |
| iPhone 393×852 | 1 | 7 | 0 | Não | 0 |
| Tablet 768×1024 | 1 | 7 | 0 | Não | 0 |
| Desktop 1366×768 | 1 | 7 | 0 | Não | 0 |

## Resultado visual

A página passou a usar uma moldura central responsiva, cards de depoimentos com proporções consistentes, bloco de dicas com hierarquia visual, sombras e bordas controladas, além de uma adaptação específica para telas estreitas. O selo de acessibilidade `prefers-reduced-motion` foi respeitado para as animações existentes da página.

## Observação

A auditoria móvel geral do projeto continua registrando `clipping` como um objeto de diagnóstico, mas esse campo não representa uma falha booleana: o script apenas serializa os retângulos dos elementos. A auditoria específica desta página mediu efetivamente os limites dos cards e confirmou `badRectCount=0` e `horizontalOverflow=false` nos quatro viewports.
