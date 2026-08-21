# Referências para edição manual no painel administrativo

## Padrões aproveitados

As plataformas consultadas tratam o SKU como identificador único de inventário e oferecem busca, edição por linha, filtros e alteração em lote com confirmação. A adaptação para a Sorveteria Itapolitana seguirá uma versão simples desse padrão: cada linha exibirá SKU, produto, descrição, preço e disponibilidade; a busca poderá localizar por SKU ou nome; alterações de disponibilidade serão revisadas antes do salvamento; e a edição em lote ficará restrita a estados seguros, como marcar uma linha inteira como esgotada.

| Prática observada | Adaptação para a sorveteria |
|---|---|
| SKU único para variante/produto | Mostrar e pesquisar o SKU oficial em toda linha administrativa. |
| Tabela com propriedades por coluna | Exibir nome, SKU, tamanho, preço, tipo, embalagem dependente e status. |
| Busca e filtros | Filtrar por SKU, nome, seção, produto, sabor ou embalagem. |
| Salvamento explícito | Exigir ação de salvar e informar o resultado da alteração. |
| Edição em lote | Permitir somente ações administrativas previsíveis, como esgotar uma embalagem e seus dependentes. |
| Validação antes de persistir | Impedir SKU duplicado, referência de embalagem inválida e alteração incompleta. |

## Fontes

1. [Shopify — Using SKUs to manage your inventory](https://help.shopify.com/en/manual/products/details/sku)
2. [Shopify — Bulk editing](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/bulk-editing)
3. [Square — Bulk edit and update items](https://squareup.com/help/us/en/article/8228-bulk-edit-items-in-square-dashboard)
