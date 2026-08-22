# Inventário de botões internos para retirada

## Grupos a validar

| Grupo do cardápio | Gerador atual | Regra de destino |
|---|---|---|
| Sorvetes de massa | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Milkshakes | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Taças tradicionais | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Taças premium | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Açaí Natureon | Link visual próprio e `botaoPeçaERetire` | Preservar o padrão visual e abrir o SKU do produto |
| Picolés | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Caixas para viagem | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |
| Sobremesas | `botaoPeçaERetire` | `retirada.html?sku=SKU#catalogo` |

## Limite de acesso

A página de retirada não deve aparecer em menu, hero, cabeçalho, rodapé ou links soltos. Somente os botões de produto do cardápio podem abrir o fluxo, carregando o SKU oficial correspondente.
