# Auditoria móvel — 2026-08-14

## Evidência reproduzida
A página `encomendas.html` foi renderizada localmente com Chromium headless em viewport de 360×800 px antes e depois da correção CSS.

## Antes
Arquivo: `evidencias/encomendas-360-antes.png`. O layout já cabia na viewport de 360 px, mas usava regras fixas e não declarava uma estratégia explícita de largura fluida para cabeçalho, alerta, contêiner e cartões. A implementação tinha `max-width:800px` e margens automáticas no alerta e no `.container`, além de navegação com colunas sem `minmax(0,1fr)` e ausência de `box-sizing` global.

## Depois
Arquivo: `evidencias/encomendas-360-depois.png`. A versão corrigida mantém os cinco botões do cabeçalho dentro da viewport, preserva duas colunas iguais e o botão de largura total, ocupa a largura móvel disponível no alerta e nos cartões, e evita depender de larguras fixas. O texto permanece legível e não foi necessário alterar JavaScript, catálogo, carrinho, preços, estoque ou regras de quantidade.

## Limite da conclusão
Esta evidência comprova o comportamento em 360×800 px localmente. Ainda não comprova publicação online, navegador interno do Instagram, todos os fluxos de pedido, painel administrativo nem nota 100/100; esses itens exigem testes separados.

## Fonte técnica do teste
Cópia local: `file:///home/ubuntu/itapolitanacajuru/encomendas.html`.

## Regressão funcional pós-correção
Na cópia local, o clique humano em `Sorvete em Caixa` abriu os quatro produtos normalmente. O clique em `Escolher sabores` abriu o seletor correto, com os 38 Sabores exibidos, contador de seleção, botão `Voltar` e botão `Confirmar`. A alteração visual não impediu a abertura do acordeão nem do seletor. Este teste comprova o fluxo local dessa categoria; ainda faltam confirmar seleção, confirmação, carrinho, picolés, tortas, açaí, index.html, publicação e administração.

## Teste adicional de larguras móveis
Foram geradas reproduções em 320×900, 390×900 e 430×900 px. Em 320 px, menu, alerta e cartões permanecem dentro da viewport; o rótulo `DICAS/DEPOIMENTOS` quebra em duas linhas, mas não gera overflow horizontal. Em 430 px, as duas colunas do cabeçalho ficam equilibradas e os cartões usam a largura disponível com texto mais confortável. A quebra em 320 px é aceitável como fallback de largura mínima; não é uma falha funcional, mas pode ser refinada futuramente com rótulo mais curto ou ajuste de fonte se o usuário desejar.

## Console pós-correção
Após recarregar `encomendas.html`, o console não mostrou erro de sintaxe ou exceção de JavaScript. Apareceu apenas o aviso `[Encomendas] estoque não carregado: Failed to fetch`, compatível com a cópia local sendo aberta via `file://` e sem o endpoint de estoque. Esse aviso é uma limitação do ambiente local, não foi causado pelo CSS; deve ser revalidado na versão publicada antes de qualquer conclusão sobre produção.
