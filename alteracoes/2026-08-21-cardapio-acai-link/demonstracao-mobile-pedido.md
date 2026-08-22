# Demonstração móvel do pedido

## Estado preparado

O cardápio foi aberto na prévia com `demo-retirada=aberta`. Nesse modo, exclusivo do domínio de prévia Manus, os botões de produto permanecem disponíveis para demonstração e propagam o SKU e o parâmetro de demonstração ao HTML `retirada.html`.

## Primeiro vínculo conferido

- Produto: Casquinha/copo.
- SKU: `SVM-CC-01`.
- Destino esperado: `retirada.html?sku=SVM-CC-01&demo-retirada=aberta#catalogo`.
- Rótulo do botão: `Peça e retire na loja`.

## Modal demonstrado

O fluxo de demonstração abriu o modal de `Casquinha ou copo`, exibindo primeiro as opções de recipiente e mantendo o botão de adicionar bloqueado até a escolha obrigatória. A regra real de horário não foi alterada; a liberação é exclusiva do domínio de prévia e do fragmento `#catalogo&demo-retirada=aberta`.

Após selecionar `Casquinha`, o modal confirmou a regra do produto: `Escolha as quantidades por sabor até totalizar 1 bolas.` O botão de adicionar permaneceu bloqueado até a distribuição de sabor ser completada.

O controle de quantidade foi validado ao atingir `Distribuição completa: 1 de 1 bolas.` Em seguida, a seleção de `Embalar para viagem` liberou o botão final com a mensagem `Tudo certo! Revise e adicione este produto ao pedido.`

Antes da demonstração representativa, foi identificada uma torta usada em testes anteriores no armazenamento `itap_retirada_v1`. Esse dado de teste será removido para que o carrinho mostrado contenha somente os itens da nova demonstração.
