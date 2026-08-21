# Validação da retirada com disponibilidade central

O HTML `retirada.html` foi aberto após a integração do controlador `scripts/retirada.js` com a base oficial de SKUs.

| Verificação | Resultado |
|---|---|
| Catálogo | Carregou as seções oficiais de produtos, sabores, picolés, açaís, caixas, tortas, isopores e acréscimos. |
| Produtos de massa | Mantiveram botão de escolha de sabores e os dados de SKU/preço no catálogo. |
| Picolés | Mantiveram controles individuais por sabor, preço de varejo/atacado e SKU exibido. |
| Console | Nenhum erro foi registrado após o carregamento. |
| Regra central | O controlador passou a calcular a disponibilidade de cada SKU considerando `ativo` e `dependencias_embalagem` do arquivo oficial. |

O próximo cenário de validação será marcar uma embalagem ou SKU como indisponível no painel e conferir a tarja **Esgotado** no site.
