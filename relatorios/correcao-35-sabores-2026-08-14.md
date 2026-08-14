# Correção dos 35 sabores — evidências verificadas

## Diagnóstico

- No `index.html`, a função `getSaboresDisponíveis()` estava seguida por um bloco órfão (`}catch(e){}` e um `return` adicional), localizado nas linhas 3999–4001 antes da correção.
- Esse bloco interrompia a execução do script principal. No navegador local, antes da correção, `window.abrirSaboresInline` existia, mas `window.getSaboresDisponíveis` era `undefined`; o botão tinha sido clicado como usuário e nenhum `.sabores-inline` foi criado.
- A lista oficial `SABORES_35_OFICIAL` já existia no arquivo e contém 35 itens, de “Abacaxi ao Vinho” a “Torta de Chocolate”. Portanto, o problema comprovado era de execução/escopo do JavaScript, não de ausência da lista.

## Correção aplicada

- Criado backup: `index.html.backup-2026-08-14-before-sabores`.
- Removido somente o bloco órfão do `index.html`. Nenhuma alteração foi feita em `encomendas.html`, `scripts/products.js` ou na lista oficial.

## Verificação após a correção

- Após recarregar o arquivo local, `window.getSaboresDisponíveis` passou a existir e retornou `35` itens.
- O HTML do botão continua chamando `abrirSaboresInline('sorvetes','35 Sabores de Sorvete',this)`.
- O console não apresentou erro de sintaxe do `index.html`; os avisos observados no modo `file://` são falhas de `fetch` esperadas nesse protocolo local, com fallback de dados.
- O clique visual ainda precisa ser validado com o botão efetivamente enquadrado na viewport; uma inspeção geométrica mostrou que o ponto calculado do botão estava coberto por `.vc-banner`, portanto não se deve declarar o fluxo aprovado antes de corrigir/testar essa sobreposição.

Fonte da evidência: cópia local `file:///home/ubuntu/itapolitanacajuru/index.html`, console do navegador e código-fonte local. Data: 2026-08-14.

## Escopo protegido

Não foram alterados preços, carrinho, estoque, regras de encomenda, senha administrativa ou `encomendas.html` nesta correção.

## Evidência do teste humano local após a remoção do watermark repetido

- A categoria `acc-sorvetes` abriu visualmente e exibiu os quatro produtos.
- O botão `Ver 35 Sabores` ficou visível no fluxo normal após rolar até sua posição.
- A inspeção do DOM confirmou que, antes do clique final, a função inline ainda não havia sido executada: não havia painel adicional de sabores.
- A marca d’água repetida deixou de aparecer no estado local testado; o fundo do cardápio ficou limpo.
- O banner de cookies permanece sobreposto na parte inferior da viewport durante o teste e pode cobrir controles nessa região; isso deve ser tratado separadamente do problema da lista.
- O teste final deve clicar com o botão efetivamente dentro da viewport e conferir se o painel cria exatamente 35 itens e permanece visível.

Status: diagnóstico em andamento; a correção ainda não deve ser declarada concluída.

## Confirmação do fluxo completo

O teste humano foi concluído na cópia local. Primeiro, a categoria Sorvetes de Massa foi aberta; depois, o botão `Ver 35 Sabores` foi acionado quando estava enquadrado na viewport. O painel exibiu visualmente os 35 botões em grade, com a lista completa iniciando em `Abacaxi ao Vinho` e terminando em `Torta de Chocolate`. A inspeção textual do navegador também retornou os 35 nomes, sem lista vazia. O botão `Voltar` apareceu abaixo da lista.

Resultado desta etapa: **aprovado localmente para Sorvete de Massa**. Ainda falta validar o retorno sem pulo, outros produtos que devem usar a lista, separação de Picolés/Açaí, publicação e regressão das outras páginas.

## Teste humano de Picolés — 2026-08-14

Fonte: cópia local `file:///home/ubuntu/itapolitanacajuru/index.html?watermark-fix=1`, navegador Chromium, viewport aproximada de 895×766.

Após fechar o painel de Sorvete de Massa, o clique no botão `PICOLÉS DIFERENCIADOS` abriu a categoria corretamente. O DOM e a tela exibiram seis grupos específicos: Picolé de Frutas (8 sabores), Picolé de Leite (4), Picolé Recheado (12), Picolé Leite Ninho (1), Picolé de Ovomaltine (1) e Picolé Esquimó (8). Nenhum grupo exibiu a lista de 35 sabores de sorvete. O painel de Picolés mostrou os botões de grupos, links de atacado/orçamento e o botão de retorno ao início do cardápio.

O teste confirma a separação visual inicial entre Sorvete de Massa e Picolés. Ainda falta abrir individualmente cada grupo e testar o botão de retorno de cada nível.

Observação visual: a captura do navegador mostrou marcações de inspeção sobre os elementos e o aviso de cookies sobreposto na parte inferior; essas marcações pertencem ao modo de teste, não ao conteúdo normal do site.

## Evidência adicional — teste de Milkshake

No teste local em `index.html?watermark-fix=1`, o painel `#acc-milk` estava aberto, mas o botão `Ver Sabores do Milkshake` permaneceu sem chips renderizados (`chipCount: 0`). A medição do DOM mostrou o botão com `x=142.5`, `y=1046.34`, `width=980`, `height=54.80`, enquanto `document.elementFromPoint()` no centro retornou um parágrafo da barra de cookies. Portanto, a barra de cookies está sobrepondo o botão e bloqueando o clique humano; isso é uma causa comprovada para a falha de abertura nesse fluxo, não uma suposição. A correção deve manter o consentimento, mas não cobrir controles essenciais: reduzir ou reposicionar a barra em telas pequenas, ou garantir espaço de segurança para que o botão permaneça acessível.

## Teste após ajuste da barra de cookies

Após recarregar `index.html?cookie-layout-fix=2` com a correção aplicada, a barra de cookies ficou com `height=100.5px` no viewport testado e o `body` recebeu `padding-bottom=117px`. O botão `Ver Sabores do Milkshake`, quando trazido para o centro da viewport, ficou em `y=520.58`, fora da área da barra, cujo topo estava em `y=999.5`; portanto, a reserva de espaço foi aplicada. A medição do ponto central retornou um `DIV` do cardápio, não a barra de cookies. Ainda é necessário executar o clique humano quando o botão estiver realmente visível e verificar a quantidade de sabores renderizados.

## Resultado do clique após liberar o botão do Milkshake

Após a correção de espaço da barra de cookies, o botão ficou acessível e não estava mais coberto. Porém, o teste humano seguido de inspeção do DOM mostrou que `#milk-body` e `#milk-grid` continuavam com `0` chips e nenhum elemento `.chip-inline`, `.sabor-chip` ou `[data-sabor]` foi criado. Portanto, existem dois problemas separados: (1) a barra de cookies bloqueava o clique, já corrigido localmente; (2) a função do botão do Milkshake ainda não está renderizando a lista após o clique. Não considerar o Milkshake aprovado.


## Validação bem-sucedida do Milkshake

Após a atualização robusta de `_getAccBody`, o clique no botão do Milkshake localizou corretamente o elemento `.acc-body` (`milk-body`), renderizando exatamente 35 chips com os sabores oficiais (`Abacaxi ao Vinho`, `Abacaxi Suíço`, etc.) sem causar saltos de rolagem (`_semPulo`).
