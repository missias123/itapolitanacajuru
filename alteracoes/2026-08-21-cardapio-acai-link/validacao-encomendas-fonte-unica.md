# Validação de Encomendas com fonte única

Em 21/08/2026, a página `encomendas.html` foi aberta após a alteração para aplicar `scripts/catalogo-mestre.js` sobre `dados/produtos.json` antes de montar caixas, tortas, acréscimos, sabores e picolés.

| Verificação | Resultado |
|---|---|
| Carregamento da página | A página exibiu normalmente as quatro seções de Encomendas. |
| Erros de navegador | Nenhum erro registrado no console após o carregamento. |
| Fonte de dados | O carregamento agora passa pelo adaptador `ITAP_CATALOGO_MESTRE.aplicar`, que usa o cadastro oficial de SKUs e a disponibilidade derivada de embalagens. |

Ainda será necessário substituir o restante dos arrays de prévia e a interface administrativa legada nas próximas etapas da unificação.

## Verificação complementar de exposição do catálogo

Os recursos `catalogo-mestre.js` e `produtos.json` responderam com HTTP 200. A variável global `window.PRODUTOS_DATA` não é utilizada diretamente por esta página; a próxima checagem deve confirmar o consumo do catálogo oficial pelo controlador próprio de Encomendas, sem tratar essa ausência como erro por si só.

## Verificação visual das caixas

A seção **Sorvete em Caixa** foi aberta no navegador após a auditoria. As quatro opções de caixa (5 L e 10 L, com 2 ou 3 sabores) foram renderizadas com disponibilidade, preço e botão de escolha de sabores, sem falha visual ou bloqueio indevido.
