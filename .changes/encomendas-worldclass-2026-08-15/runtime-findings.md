# Evidências de teste — Encomendas World Class

Data: 2026-08-15

## Homepage

- Os quatro cards `acc-enc-caixas`, `acc-enc-tortas`, `acc-enc-picolés` e `acc-complementos` renderizam prévias de produtos e valores.
- Os CTAs encontrados no DOM são únicos e apontam para `encomendas.html#caixas`, `encomendas.html#tortas`, `encomendas.html#picoles` e `encomendas.html#acrescimos`.
- A inspeção encontrou zero IDs duplicados e nenhum erro registrado no `window.__itapPageErrors`.

## Deep-linking

- Carga completa de `encomendas.html?from=home&secao=acrescimos#acrescimos` abriu apenas a gaveta Acréscimos.
- O clique real do CTA `encomendas.html#acrescimos` partindo da homepage abriu a gaveta Acréscimos, com cinco produtos e controles.
- Carga completa de `encomendas.html#caixas` abriu a gaveta Caixas com quatro produtos e os botões Escolher sabores.

## Acréscimos e carrinho

- Acréscimos renderizados: Canudinho Wafer (R$ 0,25), Casquinhas (R$ 0,25), Cascão (R$ 1,00), Cestinha Recheada (R$ 1,00) e Cobertura 1.3L (R$ 40,00).
- O botão `+` alterou Canudinho Wafer para 1 unidade, subtotal R$ 0,25 e atualizou o carrinho fixo.
- A revisão do carrinho mostrou o item uma única vez, com quantidade, preço unitário, subtotal e total do pedido corretos.
- Não foram observadas duplicidades de item ou de IDs neste fluxo.

## Observação

- A troca direta de `#caixas` para `#acrescimos` na mesma URL pode preservar o DOM anterior no navegador de teste; isso não representa o fluxo real da homepage, que foi testado com navegação entre documentos e funcionou corretamente.
- O fluxo real deve ser mantido com links relativos para preservar a abertura correta das gavetas.

## Próximos testes

Validar também os CTAs de Tortas e Picolés, testar o retorno e executar checagem final de sintaxe e diff antes da publicação.


## Links adicionais testados

A navegação para `encomendas.html?from=home&secao=tortas#tortas` abriu somente **Tortas Geladas**, exibindo Torta de Sorvete, selo Leite Pasteurizado da Fazenda, estoque 10, preço R$ 100,00 e botão Escolher sabores.

A navegação para `encomendas.html?from=home&secao=picoles#picoles` abriu somente **Picolés no Atacado**, com o resumo do lote, mínimo de 100 unidades, preço inicial e botão Montar lote. As demais gavetas permaneceram fechadas no teste.

## Diagnóstico da troca de hash na mesma página

Após abrir `#picoles` e alterar o hash para `#acrescimos` via console, a página permaneceu sem uma gaveta identificada como aberta e a lista de Acréscimos ainda estava vazia na leitura feita após 500 ms. Não houve erro em `window.__itapPageErrors`. Será feita uma inspeção adicional do estado dos elementos e do tempo de carregamento para distinguir atraso de estoque de falha no listener.

## Resultado do diagnóstico de hashchange

Após aguardar a conclusão do carregamento do estoque, a troca de `#picoles` para `#acrescimos` funcionou: `sec-acrescimos` ficou com `display: block`, `sec-picoles` permaneceu fechado, a lista continha os produtos e não houve erros registrados. A leitura vazia anterior ocorreu antes da conclusão da renderização assíncrona, não por falha no listener.

## Validação final da homepage

A homepage exibiu quatro cards fechados por padrão. Caixas renderizou 4 prévias e preços de R$ 100,00, R$ 115,00, R$ 150,00 e R$ 165,00; Tortas renderizou 1 prévia a R$ 100,00; Picolés renderizou 6 prévias com valores de R$ 1,50, R$ 2,00, R$ 2,00, R$ 3,00, R$ 3,00 e R$ 6,00; Acréscimos renderizou 5 prévias a R$ 0,25, R$ 0,25, R$ 1,00, R$ 1,00 e R$ 40,00.

Cada card possui exatamente um CTA `Peça já`, com os destinos corretos `#caixas`, `#tortas`, `#picoles` e `#acrescimos`. A inspeção encontrou zero IDs duplicados e nenhum erro em `window.__itapPageErrors`.
