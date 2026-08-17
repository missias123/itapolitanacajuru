# Evidência do teste local — index.html

Fonte testada: http://127.0.0.1:8080/index.html?qa=menu-foco-20260813-2

## Falha encontrada antes do ajuste
Ao acionar `Ver 38 sabores`, o navegador registrou `ReferenceError: produtos is not defined` em `getSaboresDisponíveis`. A origem era `scripts/products.js`, que expõe o dataset como `window.PRODUTOS_DATA`, enquanto o `index.html` usava `produtos`.

## Correção aplicada
Foi adicionado somente no `index.html` um alias dinâmico entre `produtos` e `window.PRODUTOS_DATA`. Também foi mantida a lógica isolada de Modo Foco no `index.html`, com travamento do fundo, rolagem interna do produto e botão `← Voltar ao cardápio`.

## Resultado após recarregar
O navegador confirmou:
- `typeof produtos` = `object`;
- `window.PRODUTOS_DATA` presente;
- nenhum erro ao executar `abrirSaboresInline`;
- classe `menu-foco-aberto` no HTML e no body;
- classe `menu-foco-ativo` no accordion `acc-sorvetes`;
- botão `← Voltar ao cardápio` presente;
- rolagem externa zerada enquanto o painel de produto está fixo;
- os 38 sabores oficiais do dataset foram renderizados no painel.

Os scripts inline do `index.html` também passaram em `node --check` (10 scripts JavaScript, 0 erros).
