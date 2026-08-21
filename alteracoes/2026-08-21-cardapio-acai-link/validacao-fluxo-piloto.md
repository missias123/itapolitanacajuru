# Validação do fluxo-piloto de retirada

## Testes executados

| Área | Resultado |
|---|---|
| Catálogo de retirada | Carrega a lista oficial organizada por seções. |
| Sabores de massa | Seleção por toque, remoção por novo toque, cores e selos de Encomendas confirmados. |
| Modalidade por produto | Após completar sabores, exige escolha entre consumir na loja e embalar para viagem. |
| Embalagem | A opção viagem soma R$ 1,00 por produto e é discriminada no carrinho. |
| Carrinho | Inclusão de produto pronto abre automaticamente a revisão; carrinho mostra itens, edição, exclusão, embalagem e formulário. |
| Picolés | Mantêm controles por sabor, estoque e preço de atacado a partir de 100 unidades. |
| Horários | Regra central confirma Retirada aberta às 11h00 e bloqueada às 20h00; Encomendas aberta às 10h00 e bloqueada às 20h00. |
| Integridade | `node --check` foi aprovado para `retirada.js` e `horario-pedidos.js`; `git diff --check` sem erros. |

## Observação operacional

O envio real não foi executado durante os testes. O botão de WhatsApp permanece uma ação do cliente e é protegido pela validação de horário, dados obrigatórios, DDD 16 e aceite das regras.
