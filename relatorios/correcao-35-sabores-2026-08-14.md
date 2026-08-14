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
