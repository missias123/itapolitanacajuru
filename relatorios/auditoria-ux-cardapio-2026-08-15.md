# Auditoria de UX de Cardápios e Accordions — 2026-08-15

## Fontes consultadas

1. Nielsen Norman Group — Accordions on Mobile: https://www.nngroup.com/articles/mobile-accordions/
2. Shopify — How To Implement Accordion UI Design: https://www.shopify.com/blog/accordion-ui-design
3. Rappi Developer Portal — Managing Store Menus: https://dev-portal.rappi.com/en/managing-store-menus/

## Achados aplicáveis ao Itapolitana

O Nielsen Norman Group recomenda que accordions mobile ajudem o usuário a ver o panorama antes de entrar nos detalhes, expandam no próprio lugar e não simulem uma nova página. Quando o conteúdo aberto é longo, o botão de retorno deve permanecer facilmente acessível; o botão Voltar do navegador também pode desfazer a expansão. O artigo alerta que mover o painel para o topo pode causar desorientação. A solução recomendada para nosso caso é preservar o offset de rolagem, manter o painel no DOM e oferecer um retorno visível no próprio painel, sem esconder o restante por regras globais frágeis.

A Shopify recomenda cabeçalhos curtos e claros, indicador visual de expansão, animações discretas, ARIA controls/expanded, suporte a teclado e uma única fonte de verdade para o estado. Também recomenda evitar listas excessivamente longas e não ocultar informações críticas. Para o Itapolitana, o clique deve operar em um único handler, o corpo deve abrir com `max-height` calculado, e a renderização dos produtos deve ser idempotente, sem limpar um grid que ainda não recebeu dados.

A documentação da Rappi descreve menus como uma estrutura hierárquica de categorias, produtos e filhos/opções, com ordem, nomes, descrições, preços e validação imediata. Para o Itapolitana, isso reforça separar: categoria > produto > sabores/opções; cada produto deve ter identificação estável e a lista geral de 35 sabores não deve ser misturada com Picolés ou Açaí.

## Decisão técnica

Não usar `display:none` global em `.reveal`, nem `position:fixed` no `body` para o acordeão principal. Essas técnicas podem esconder o cardápio ou alterar o contexto de toque, como ocorreu com o primeiro botão. Usar um acordeão progressivo simples: apenas o painel clicado abre, o cabeçalho permanece no fluxo, o botão Voltar fecha o painel e restaura o `scrollY` salvo. O Modo Foco deve ser aplicado somente ao painel de detalhes que realmente possuir um container compatível, nunca depender de `.reveal` para localizar o acordeão principal.

## Critérios de aceite

- O primeiro botão Sorvetes abre com clique humano e teclado.
- O grid de produtos contém itens antes e depois da abertura.
- O botão Ver 35 Sabores renderiza exatamente 35 chips.
- Picolés e Açaí preservam suas listas específicas.
- Fechar/Voltar retorna ao mesmo `scrollY`, sem salto perceptível.
- Abrir uma categoria não esconde o cardápio inteiro.
- Todos os handlers são únicos, sem duplicidade de `onclick` e `addEventListener` concorrentes.
- A página permanece operável em celular, tablet e desktop.

## Diagnóstico observado no site ao vivo

O DOM ao vivo possui `#acc-sorvetes`, `#sorvetes-body` e `#sorvetes-grid`; o grid tinha conteúdo e o corpo tinha `scrollHeight` de 665px, mas estava com `max-height: 0px` durante a tentativa de clique. Os accordions principais não estão dentro de `.reveal`. Portanto, qualquer foco baseado em `acc.closest('.reveal')` é inadequado para eles e deve ser removido do caminho principal de abertura.

## Próximo passo

Refatorar somente o fluxo de acordeão de `index.html`, preservando o restante do site e criando uma cópia/backup antes da edição. Testar primeiro localmente, depois no navegador, e só então publicar.

## Validação intermediária no navegador local

O servidor local foi aberto em `http://127.0.0.1:4173/index.html`. O botão `VER CARDÁPIO` abriu o painel, e o primeiro acordeão `Sorvetes de massa Tipo artesanais` também abriu. Antes da alteração, o HTML já continha `#sorvetes-grid`, quatro cards de produto e o botão `Ver 35 Sabores`; o problema principal confirmado no código era o Modo Foco transformar o `body` inteiro em `position: fixed` e esconder todos os `.reveal` que não fossem o pai do acordeão. Como o primeiro acordeão está em `<section class="cardápio">` e não em `.reveal`, essa estratégia era estruturalmente frágil.

A correção aplicada no backup de trabalho mantém o `body` apenas com overflow bloqueado e transforma somente `.acc.menu-foco-ativo` em painel `position: fixed`, com `inset: 0`, `100dvh`, rolagem interna e sem `display:none` global. Também foram removidas as dependências de `acc.closest('.reveal')` do JavaScript.

## Diagnóstico pós-recarregamento

A primeira leitura do navegador ainda refletia o CSS antigo em cache: `getComputedStyle(#acc-sorvetes).position` retornava `relative`, e a regra encontrada no stylesheet ainda era a versão anterior. Depois de recarregar com query string de versão, o cardápio voltou ao estado fechado e pronto para novo clique; a validação seguinte deve medir o estilo computado no documento versionado, evitando concluir com base no cache antigo.
