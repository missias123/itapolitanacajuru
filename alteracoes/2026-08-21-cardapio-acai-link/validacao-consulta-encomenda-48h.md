# Validação — consulta e encomenda de 48 horas

**Data:** 22/08/2026  
**Ambiente:** Peça e retire local, com interceptação de aberturas externas.

| Cenário | Resultado |
|---|---|
| Torta `SOB-001` — Consultar disponibilidade | A consulta gerou somente o endereço de conversa do WhatsApp com o SKU da torta. O modal foi fechado e nenhum item entrou no carrinho. |
| Caixa 5 L `CAX-5L_2S` — Consultar disponibilidade | A consulta gerou somente o endereço de conversa do WhatsApp com o SKU da caixa. O modal foi fechado e nenhum item entrou no carrinho. |
| Caixa 10 L `CAX-10L_3S` — Encomendar | O modal permaneceu no site, exigiu a seleção de sabores e inseriu a caixa no carrinho. O campo de data apareceu com mínimo em `2026-08-24`, respeitando 48 horas a partir do teste em 22/08/2026. |

>Nenhuma conversa real foi aberta e nenhum pedido foi enviado. A abertura de WhatsApp foi interceptada exclusivamente para conferir o destino e o conteúdo da consulta.
