# Auditoria de produtos e botões do cardápio

Data da auditoria: 21 de agosto de 2026.

## Fonte oficial de SKUs

A fonte única `dados/produtos.json`, no objeto `cadastro_skus.por_chave`, possui **198 produtos**, todos ativos, com SKU preenchido e sem SKU duplicado.

| Categoria | Produtos com SKU |
|---|---:|
| Açaí (250 ml a 700 ml) | 58 |
| Milk-shake de Açaí | 4 |
| Taças Gourmet de Açaí | 4 |
| Sorvetes de massa | 11 |
| Sabores de massa | 38 |
| Picolés | 39 |
| Milkshakes | 6 |
| Taças tradicionais | 8 |
| Taças premium | 7 |
| Sobremesas | 9 |
| Isopores para viagem | 4 |
| Caixas para encomenda | 4 |
| Tortas por encomenda | 1 |
| Acréscimos | 5 |
| **Total** | **198** |

## Produtos exibidos no cardápio principal

No site oficial, foram encontrados **109 produtos renderizados com botão individual** no cardápio principal. Eles são os itens elegíveis para a ação individual de retirada nesta etapa.

| Seção do cardápio | Produtos renderizados |
|---|---:|
| Massas e sabores | 4 |
| Picolés | 5 |
| Açaí Natureon | 66 |
| Milkshakes | 6 |
| Taças tradicionais | 8 |
| Taças premium | 7 |
| Isopores para viagem | 4 |
| Sobremesas | 9 |
| **Total** | **109** |

Os **89 itens restantes** do cadastro oficial pertencem a sabores, opções, acréscimos e produtos do fluxo de Encomendas. Eles não serão modificados nesta etapa.

## Validação no site oficial

Foi confirmada a presença de **109 botões individuais** com o rótulo `Peça e retire`. Os 109 apontam para o WhatsApp oficial da sorveteria (`5516996062046`) e **nenhum** foi inserido nas seções de Encomendas.

## Critérios adotados para o botão

O botão continuará único por produto, com linguagem direta, alto contraste, área de toque de pelo menos 44 px e leitura simples no celular. A implementação manterá o CTA dentro de cada cartão, após o preço, sem inserir botões em Encomendas. Esses critérios seguem referências de simplicidade, contraste e contexto da ação em comércio eletrônico mobile.[1][2]

## Referências

[1] [Shopify — Ecommerce Call to Action: 15 Examples and Tips](https://www.shopify.com/blog/17156160-7-inspiring-ecommerce-call-to-action-examples-and-why-they-work)

[2] [Nielsen Norman Group — The Mobile Checkout Experience](https://www.nngroup.com/articles/mobile-checkout-ux/)
