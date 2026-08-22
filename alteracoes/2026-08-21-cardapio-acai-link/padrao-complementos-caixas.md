# Padrão de complementos para caixas de 4 a 12 bolas

## Decisão aplicada

Os complementos serão apresentados **depois da distribuição dos sabores e antes da confirmação da caixa**, no mesmo modal. Eles serão opcionais, terão controle de quantidade por item e mostrarão o valor de cada escolha antes de adicionar a caixa ao carrinho.

## Motivo

Esta ordem mantém o produto principal como primeira decisão, evita uma página separada para itens que normalmente são adicionados depois da escolha do sorvete e permite que o resumo do carrinho detalhe a composição completa da caixa para viagem.

## Itens reutilizados da fonte central

Os complementos oficiais já cadastrados em `dados/produtos.json` são Canudinho Wafer, Casquinhas, Cascão, Cestinha Recheada e Cobertura 1.3L. Cada item manterá seu SKU, preço e disponibilidade oficial.

## Referências de padrão

* Baymard Institute: pedidos de alimentação priorizam caminhos de compra rápidos e controles diretos de quantidade.
* Otter: modificadores são opções associadas ao item principal e podem ser exibidos como um grupo no mesmo fluxo de pedido.
* Commerce7: um grupo de modificadores pode mostrar múltiplas opções e atualizar o total do item antes da confirmação.
