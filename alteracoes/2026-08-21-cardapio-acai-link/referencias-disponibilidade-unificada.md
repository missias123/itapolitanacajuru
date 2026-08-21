# Referências de disponibilidade unificada

## Princípios aplicados

As regras da administração única seguem dois princípios usados por plataformas de comércio: a disponibilidade pertence à variante vendável e embalagens físicas diferentes podem ter estoque separado sem criar listagens públicas duplicadas.

| Princípio aplicado na Itapolitana | Referência |
|---|---|
| Cada SKU vendável tem estado próprio de disponibilidade, e a vitrine usa esse estado para determinar se o item pode ser pedido. | [Medusa — Product Variant Inventory](https://docs.medusajs.com/resources/commerce-modules/product/variant-inventory) |
| Embalagens 5 L, 10 L, 7 bolas, 9 bolas e 12 bolas são controladas separadamente e bloqueiam somente seus SKUs dependentes. | [Local Line — Track Inventory for Multiple Product Sizes, Cuts, and Packages](https://www.localline.co/blog/product-variants) |

## Adaptação adotada

1. Produtos vendáveis mantêm seus 198 SKUs oficiais em `cadastro_skus.por_chave`.
2. Sabores de massa e picolés continuam com seus SKUs próprios.
3. Embalagens operacionais entram no bloco `disponibilidade.embalagens` com SKU interno e lista explícita de SKUs dependentes.
4. O painel edita todos esses estados no mesmo arquivo `dados/produtos.json`.
