# Auditoria de compra simulada completa — versão pública

## Escopo de segurança

A auditoria foi executada diretamente em `https://itapolitanacajuru.com.br/retirada.html`, em sessão isolada de navegador e largura móvel. O bloqueio de abertura do WhatsApp permaneceu ativo durante todo o teste; não houve envio de mensagem, cobrança, confirmação ou encaminhamento de pedido à sorveteria.

## Resultado

| Critério | Resultado |
|---|---:|
| Produtos diretos ou com modal incluídos no carrinho | 110 |
| Sabores de picolé incluídos pelo fluxo de estoque | 34 |
| Linhas no carrinho de simulação | 144 |
| Itens totais na simulação | 144 |
| Falhas de adição ou escolha | 0 |
| Itens inválidos no carrinho | 0 |
| Aberturas do WhatsApp | 0 |
| Total do carrinho de simulação | R$ 2.683,00 |

## Fluxos validados

Foram percorridos os produtos de massa, casquinha/copo, caixas por bolas, açaís prontos, milk-shakes, picolés, taças, sobremesas e tortas. A auditoria completou escolhas obrigatórias de recipiente, sabores, distribuição de bolas, modalidade de consumo/viagem, complementos e opção de torta antes de adicionar cada item.

O carrinho resultante não apresentou SKU, nome, preço ou quantidade inválidos. A etapa de envio não foi acionada.
