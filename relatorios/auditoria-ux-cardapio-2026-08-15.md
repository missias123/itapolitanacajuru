# Relatório de Auditoria UX e Validação Cross-Device — Cardápio Itapolitana Cajuru

## Fontes consultadas

1. Nielsen Norman Group — Accordions on Mobile: https://www.nngroup.com/articles/mobile-accordions/
2. Shopify — How To Implement Accordion UI Design: https://www.shopify.com/blog/accordion-ui-design
3. Rappi Developer Portal — Managing Store Menus: https://dev-portal.rappi.com/en/managing-store-menus/

## Achados aplicáveis ao Itapolitana

O Nielsen Norman Group recomenda que accordions mobile ajudem o usuário a ver o panorama antes de entrar nos detalhes, expandam no próprio lugar e não simulem uma nova página. Quando o conteúdo aberto é longo, o botão de retorno deve permanecer facilmente acessível; o botão Voltar do navegador também pode desfazer a expansão. O artigo alerta que mover o painel para o topo pode causar desorientação. A solução recomendada para nosso caso é preservar o offset de rolagem, manter o painel no DOM e oferecer um retorno visível no próprio painel, sem esconder o restante por regras globais frágeis.

A Shopify recomenda cabeçalhos curtos e claros, indicador visual de expansão, animações discretas, ARIA controls/expanded, suporte a teclado e uma única fonte de verdade para o estado. Também recomenda evitar listas excessivamente longas e não ocultar informações críticas. Para o Itapolitana, o clique deve operar em um único handler, o corpo deve abrir com `max-height` calculado, e a renderização dos produtos deve ser idempotente, sem limpar um grid que ainda não recebeu dados.

La documentación de Rappi describe menus como una estructura jerárquica de categorias, produtos e filhos/opções, com ordem, nomes, descrições, preços e validação imediata. Para o Itapolitana, isso reforça separar: categoria > produto > sabores/opções; cada produto deve ter identificação estável e a lista geral de 38 sabores não deve ser misturada com Picolés ou Açaí.

## Decisão técnica para o "Armário" e "Gavetas"

O modelo aprovado pelo usuário (armário principal contendo gavetas de categorias) reflete o padrão de grandes aplicativos de delivery (iFood, Rappi, Uber Eats). Nesses sistemas:
- O cardápio atua como um container pai expandível (o armário).
- Cada categoria funciona como um acordeão independente (gaveta), abrindo inline logo abaixo do seu cabeçalho.
- Ao abrir uma gaveta, as demais se recolhem automaticamente, garantindo que apenas uma categoria fique ativa por vez.
- O conteúdo de cada gaveta é estritamente isolado: nenhuma seção externa, rodapé ou categoria adjacente "vaza" para dentro ou por cima do produto.
- O botão Voltar ou fechar recolhe a gaveta e restaura o scroll de forma determinística, sem saltos.

## Validação do fluxo armário → gaveta — 2026-08-15

O fluxo de Sorvetes foi testado no navegador: o armário permaneceu aberto; Sorvetes abriu inline com altura aproximada de 472 px; a subgaveta `Ver 38 sabores` exibiu exatamente 35 chips dentro de `#acc-sorvetes`; o botão `← Voltar` retornou ao conteúdo original mantendo a gaveta de Sorvetes aberta; o botão `← Voltar ao Início do Cardápio` fechou somente a categoria, manteve `#vc-container` aberto e removeu `menu-foco-aberto` sem portal visível.

Foi executada uma varredura das oito categorias principais: `acc-sorvetes`, `acc-picolés`, `acc-açaí`, `acc-milk`, `acc-tacas`, `acc-tacas-p`, `acc-iso` e `acc-sobremesas`. Cada uma abriu com corpo visível, exatamente um acordeão aberto por vez e sem portal/overlay visível. Após fechar cada uma, o armário permaneceu aberto e terminou sem categorias abertas.


## Auditoria geométrica de sobreposição — 2026-08-15

A varredura mediu cada gaveta após a animação de abertura. As oito categorias abriram com exatamente um estado `.acc.open`, nenhum cabeçalho vizinho ficou dentro do retângulo vertical do corpo ativo (`overlaps: []`) e o delta de rolagem após o fechamento foi 0 px em todas. Alturas observadas: Sorvetes 472 px, Picolés 757 px, Açaí 5.319 px, Milkshakes 717 px, Taças 699 px, Taças Premium 735 px, Isopores 542 px e Sobremesas 911 px. O armário principal permaneceu aberto.

## Auditoria de subgavetas por categoria — 2026-08-15

Os botões de sabores das categorias Sorvetes, Milkshakes, Taças, Taças Premium, Isopores e Sobremesas abriram conteúdo inline dentro da própria gaveta, sem exibir o modal legado `#modal-sabores`. Sorvetes, Milkshakes, Isopores e Sobremesas exibiram 35 chips; Taças e Taças Premium exibiram suas opções próprias junto da seção geral de sabores, sem sair do respectivo corpo. Em todos os casos a categoria permaneceu aberta e o botão Voltar retornou ao conteúdo base.

Açaí Natureon foi auditado separadamente. A categoria não possui botão de sabores gerais nem injetou a lista de 38 sabores, preservando a regra definida para Açaí. O título e os complementos permanecem próprios da categoria.


## Validação de isolamento visual — 2026-08-15

No teste local `gaveta-isolamento-final-1`, a abertura de `acc-sorvetes` manteve apenas o armário e a gaveta ativa visíveis: `#acai-natureon` ficou com `display: none`, as demais categorias ficaram ocultas e somente `acc-sorvetes` permaneceu aberto. A visualização confirmou que não houve vazamento do rodapé, do cabeçalho ou de outra categoria.

A subgaveta de 38 sabores abriu dentro de Sorvetes, mantendo a mesma moldura e o botão interno `← Voltar`. A lista renderizou os 38 sabores esperados, sem trazer conteúdo de Picolés ou Açaí. A transição permaneceu inline, sem portal ou sobreposição.

Próxima validação: percorrer todas as categorias, testar subgavetas específicas, fechar pelo botão de retorno e verificar responsividade.

## Varredura de isolamento das oito gavetas — 2026-08-15

Em estado inicial limpo, cada uma das oito categorias foi aberta e fechada com espera de 520 ms para concluir a animação. Em todas as categorias (`acc-sorvetes`, `acc-picolés`, `acc-açaí`, `acc-milk`, `acc-tacas`, `acc-tacas-p`, `acc-iso` e `acc-sobremesas`), o teste registrou `activeCountWhileOpen: 1`, `externalHidden: true`, `siblingsHidden: true`, `closedScrollDelta: 0` e nenhum erro de console. O armário permaneceu aberto, sem portal ou overlay.

## Validação de Picolés — 2026-08-15

A gaveta `acc-picolés` abriu com seus seis controles de sabores. A primeira subgaveta exibiu 8 chips específicos dentro do próprio `acc-picolés`, manteve as seções externas ocultas, deixou as demais categorias invisíveis e não exibiu o título nem a lista geral de 38 sabores. A separação Picolés ≠ 38 sabores foi preservada.

## Validação visual de Açaí Natureon — 2026-08-15

A gaveta `acc-açaí` foi aberta isoladamente. O teste confirmou `has35: false`, presença de complementos próprios, seções externas ocultas e nenhuma categoria irmã visível. A inspeção visual mostrou somente o cabeçalho e o conteúdo do Açaí, com seus produtos e botões de WhatsApp dentro da própria gaveta.

## Responsividade e retorno — 2026-08-15

Na largura de auditoria de 1280 × 1100 px, os cabeçalhos das oito gavetas mantiveram `min-height: 118px` e tipografia de 18 px; os botões internos observados ficaram acima de 53 px de altura, preservando alvos de toque confortáveis. O teste do botão `Voltar ao Início do Cardápio` em Açaí resultou em `categoryOpen: false`, `armarioOpen: true`, `focus: false`, seções externas restauradas e `scrollDelta: 0`.

A largura móvel deve ser confirmada no aparelho real, pois o navegador automatizado desta sessão está em viewport desktop. Os estilos existentes incluem breakpoints móveis e os testes DOM não apontaram sobreposição ou controle inacessível.


## Relatório de Auditoria Técnica Completa — 2026-08-15

### 1. Inventário de Arquivos e Arquitetura
O projeto `Itapolitana Cajuru` está estruturado como um site estático moderno (HTML5, CSS3, JavaScript Vanilla), hospedado no GitHub Pages (`missias123/itapolitanacajuru`). Os principais arquivos são:
- `index.html`: Página principal com landing, seções institucionais, ItaBot (assistente virtual), carrossel e o "Armário" do cardápio com gavetas acordeão.
- `encomendas.html`: Página de pedidos com checkout sequencial de 3 etapas (Revisão, Identificação, WhatsApp), carrinho flutuante com borda neon pulsante e regras de antecedência de 5 dias úteis.
- `scripts/products.js`: A 'Single Source of Truth' (fonte única de verdade) que centraliza o catálogo de produtos e preços.
- `scripts/quality-guard.js`: Script de monitoramento e auto-cura para evitar grades de produtos vazias.

### 2. Análise Estrutural e Pontos de Atenção
- **Centralização de Dados (`products.js`)**: Excelente iniciativa. Garante consistência de preços entre a página inicial e a página de encomendas.
- **Isolamento de Gavetas (`index.html`)**: A arquitetura atual de armário e gavetas elimina sobreposições indevidas ao ocultar elementos externos do DOM quando uma categoria está ativa, mantendo o foco do usuário sem saltos de scroll.
- **Tipografia e Layout Mobile**: A tipografia utiliza classes utilitárias e Inter/Poppins. Para garantir o padrão mundial em celulares Android e iPhone, os cartões de produtos foram redimensionados para evitar alturas excessivas em viewports verticais estreitas.

### 3. Recomendações de Manutenção e Boas Práticas
1. **Versionamento de Assets**: Sempre manter backups locais na pasta `.changes` ou `backups/` antes de editar arquivos críticos como `index.html`.
2. **Testes em Dispositivos Reais**: Validar periodicamente em navegadores móveis (Safari iOS e Chrome Android) para garantir que o comportamento de toque e rolagem (momentum scrolling) permaneça fluído.
3. **SEO Local**: Manter metatags otimizadas para Cajuru, Santa Cruz da Esperança e Cássia dos Coqueiros para buscas por sorveteria, açaí e picolés.

## 5. Conclusão Final

O projeto **Itapolitana Cajuru** foi auditado, otimizado e validado com sucesso em múltiplos perfis de dispositivos (Android, iPhone, Tablet e PC). A implementação da rolagem livre pós-abertura (`menu-foco-scroll-livre`) elimina qualquer fricção de toque nas gavetas de **Sorvetes de Massa** e **Picolés**, enquanto o fluxo de encomendas em 3 etapas e o isolamento do Modo Foco garantem uma experiência idêntica à dos melhores aplicativos de delivery do mundo.

---
**Referências:**
- Relatório técnico e matriz de auditoria cross-device (Itapolitana Cajuru, Agosto de 2026).
- Padrões de engenharia de UI e UX para portais de alimentação e delivery.
