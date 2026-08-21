# Auditoria de itens sem SKU oficial

## Escopo

A verificação comparou a base única em `dados/produtos.json` com os carregadores do cardápio principal, retirada e Encomendas. Os links de compra são gerados dinamicamente no navegador e, por isso, foram verificados também na página já renderizada.

| Verificação | Resultado | Risco |
|---|---:|---|
| SKUs oficiais no cadastro mestre | 198 | Nenhum |
| Registros com SKU vazio | 0 | Nenhum |
| SKUs duplicados | 0 | Nenhum |
| Dependências de embalagem apontando para SKU ausente | 0 | Nenhum |
| Botões Peça e retire renderizados no cardápio | 109 | Nenhum |
| Botões Peça e retire sem SKU | 0 | Nenhum |
| Botões Peça e retire com destino incorreto | 0 | Nenhum |

## Classificação dos itens fora do botão de retirada

| Tipo de item | Tratamento correto | Ação nesta auditoria |
|---|---|---|
| Sabores de massa | São SKUs de disponibilidade, escolhidos dentro de produtos de massa; não são um produto isolado com botão. | Mantidos na base única. |
| Produtos de Encomendas | Seguem o fluxo especial de caixas, tortas e atacado, com suas próprias regras. | Mantidos fora do redirecionamento comum quando exclusivos de Encomendas. |
| Copos de açaí | São SKUs fechados, cada um com receita própria. | Mantidos com botão e redirecionamento por SKU. |
| Picolés | Têm SKU por sabor e regra de atacado. | Mantidos no cardápio e no fluxo próprio de Encomendas, sem lista paralela. |
| Embalagens operacionais | São dependências internas; não são produtos de venda direta. | Mantidas no bloco central de disponibilidade. |

## Decisão de segurança

Não há item exibido sem SKU que precise ser removido ou cadastrado nesta rodada. A única correção segura identificada foi o envio do SKU no link do botão **Peça e retire**, já aplicado para os 109 botões renderizados. Nenhum produto foi excluído nem teve nome, preço, categoria ou regra comercial alterada.
