## Evidências visuais — 2026-08-15

A captura Android 360×800, feita após a abertura da gaveta, mostra somente o conteúdo do cardápio ativo, sem cabeçalho, banner, Açaí Natureon, rodapé ou categorias vizinhas. Os cards estão em formato horizontal, com imagem à esquerda e nome, descrição e preço à direita. A parte inferior apresenta os CTAs `Ver 35 Sabores`, `Falar no WhatsApp` e `Voltar ao Início do Cardápio`, todos com área ampla de toque. A captura corresponde a uma posição rolada no fim do drawer, demonstrando que o documento pode ser percorrido até os últimos produtos; não há corte lateral visível no card ativo.

A primeira captura Android feita antes da correção do roteiro registrava a tela inicial e o banner de cookies, portanto não era evidência válida do drawer aberto. O roteiro foi corrigido para capturar somente depois da interação e das medições.

Achado técnico associado: em 360×800, `body` e `html` permanecem com `overflow-y: auto`; o `.acc-body` ativo permanece `overflow-y: visible`, `touch-action: pan-y` e `-webkit-overflow-scrolling: touch`, com `scrollHeight` maior que o viewport. A rolagem programática avançou de `scrollBefore=0` para `scrollAfter=500`.

## Evidências visuais — Picolés

A captura Android 360×800 da gaveta `Picolés` mostra a categoria isolada durante a rolagem, com cartões verticais de boa largura e CTAs vermelhos amplos para `4 Sabores`, `12 Sabores`, `1 Sabores` e demais grupos. Os textos permanecem dentro da largura do viewport, sem corte lateral; a captura está no meio/final do conteúdo, confirmando que a lista ultrapassa uma tela e pode ser percorrida por gesto. O padrão visual é consistente com a gaveta de Sorvetes, embora Picolés use cards verticais porque seus itens têm descrição, preço e CTA próprio.

A matriz automatizada com gesto simulado registrou avanço positivo de rolagem para todos os 12 casos: Sorvetes e Picolés em Android 360×800, Android 390×844, iPhone 375×812, iPhone 393×852, tablet 768×1024 e PC 1366×768. Todos os casos retornaram `opened=true`, `overflowY=visible`, `touchAction=pan-y` e o primeiro card permaneceu dentro do viewport horizontal (`rightWithinViewport=true`).

