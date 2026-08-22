# Referências para o fluxo premium de pedidos

## Padrões externos aproveitados

| Referência | Padrão observado | Adaptação para a Itapolitana |
|---|---|---|
| [Uber Eats](https://www.uber.com/us/en/newsroom/multi-store-ordering/) | O pedido é construído incrementalmente: selecionar itens, voltar ao menu para adicionar mais e só então ir ao checkout. | Manter o carrinho persistente e a ação clara de continuar comprando depois de cada item adicionado. |
| [Square Online Ordering](https://squareup.com/us/en/online-ordering) | Perfis de pedido direto suportam retirada e mantêm menu, horários e disponibilidade sincronizados. | Exibir a retirada como fluxo principal, respeitar a janela de atendimento e usar o cadastro mestre como fonte única. |
| [McDonald’s Mobile Order & Pay](https://www.mcdonalds.com/us/en-us/mobile-order-and-pay.html) | O fluxo separa: montar pedido, conferir local/modalidade de retirada e concluir; alterações e cancelamentos têm limites explícitos. | Separar produto, escolhas obrigatórias, carrinho e confirmação humana; nenhuma elaboração começa antes da validação da sorveteria. |
| [Toast Online Ordering FAQ](https://support.toasttab.com/en/article/Online-Ordering-FAQ) | Navegação móvel por categorias com busca, contagem de itens por seção e seleções obrigatórias organizadas em sequência. | Criar atalhos de seção por intenção de compra, mostrar quantidade de produtos e colocar escolhas obrigatórias em ordem. |
| [Flipdish](https://www.flipdish.com/us/resources/blog/crafting-the-perfect-online-menu-for-higher-conversions) | Menus claros, categorias lógicas, preços visíveis, personalização simples e revisão antes da confirmação reduzem abandono. | Usar nomes de seção compreensíveis, ingredientes e preço no cartão, e regras de sabores junto da escolha. |

## Regras premium adotadas

1. **Uma decisão por vez.** O cliente escolhe produto, depois somente as opções que aquele produto exige, e vê o próximo passo em linguagem simples.
2. **Seções por intenção de compra.** Produtos semelhantes ficam juntos com títulos de compra claros; sabores não aparecem como produtos públicos.
3. **Limites no momento da escolha.** Sabores, bolas, estoque e modalidades são mostrados com contador e bloqueio de avanço quando a seleção estiver incompleta.
4. **Carrinho sempre recuperável.** Quantidade, total, revisão, remoção e “continuar comprando” permanecem acessíveis sem reiniciar a jornada.
5. **Revisão sem surpresa.** O resumo discrimina produto, sabores, ingredientes, embalagem, complementos e total antes do formulário.
6. **Confirmação humana explícita.** A solicitação só avança para elaboração após ligação e conferência de itens, sabores, alterações, retirada e pagamento; sem ligação nem resposta em quinze minutos, é cancelada.
