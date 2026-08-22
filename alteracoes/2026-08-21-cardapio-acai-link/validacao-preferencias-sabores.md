# Validação — preferências de sabores e caixas grandes

**Data:** 22/08/2026  
**Ambiente:** Peça e retire local, tela de computador `1280 × 900 px`.  
**Segurança:** o envio foi interceptado; nenhum WhatsApp foi aberto e nenhum pedido real foi encaminhado.

| Cenário | Resultado validado |
|---|---|
| Produto de 3 bolas | O botão de adicionar iniciou bloqueado. Após preencher três combinações diferentes de três sabores, escolher copo e confirmar a modalidade, o botão foi liberado. |
| Revisão no carrinho | O item mostrou Opção 1, Opção 2 e Opção 3 em sequência, junto de SKU, recipiente e subtotal. |
| Caixa 5 L — 2 sabores | SKU `CAX-5L_2S` exibido; três combinações de dois sabores registradas; embalagem `EMB-5L` indicada como incluída; subtotal preservado em **R$ 100,00**. |
| Caixa 10 L — 3 sabores | SKU `CAX-10L_3S` exibido; três combinações de três sabores registradas; embalagem `EMB-10L` indicada como incluída; subtotal preservado em **R$ 165,00**. |
| Picolé comum | Começou bloqueado e foi liberado somente após Opção 1, Opção 2 e Opção 3 diferentes. |
| Picolé especial | O grupo Especiais ficou com uma única escolha, sem abas de alternativas. |
| Mensagem simulada | A mensagem interceptada trouxe as Opções 1, 2 e 3 de sorvete em bolas e picolé, além dos SKUs das caixas e da embalagem incluída. |

A captura `demonstracao-desktop-preferencias-sabores.png` confirma que a revisão do carrinho mantém as preferências legíveis no computador. A regra de preço foi preservada: opções alternativas são apenas preferências de disponibilidade e não acrescentam taxa ou alteram o valor do produto.
