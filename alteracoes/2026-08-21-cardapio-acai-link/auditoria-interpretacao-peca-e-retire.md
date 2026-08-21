# Auditoria de interpretação — Peça e retire

## Objetivo

Identificar palavras, etapas e valores que podem ser entendidos de mais de uma forma pelo cliente, sobretudo no celular, antes de alterar o HTML de retirada.

## Pontos encontrados

| Área | Texto ou comportamento atual | Risco de interpretação | Melhoria planejada |
|---|---|---|---|
| Casquinha/copo | Um único item chamado `Casquinha/copo` | O cliente pode não saber se receberá casquinha, copo ou se pode escolher entre os dois. | Apresentar o produto como **Casquinha ou copo** e exigir a escolha clara do recipiente antes dos sabores. |
| Botão `Escolher` | O rótulo não explica o próximo passo. | Pode parecer que já adiciona o produto ou que escolhe o recipiente. | Trocar por **Escolher sabores** ou **Escolher tamanho e sabores**, conforme o item. |
| Produtos prontos | O botão diz apenas `Adicionar`. | O cliente pode não perceber que o produto será inserido diretamente no pedido. | Usar **Adicionar ao pedido** e manter indicação de que a receita é fixa para açaís. |
| Sabores de massa | A lista dos 38 sabores aparece também como uma seção do catálogo. | Pode dar a impressão de que sabor é um produto separado ou de que deve ser pedido isoladamente. | Renomear a seção para **Sabores disponíveis para produtos de massa** e explicar que ela serve apenas de consulta. |
| Embalagem | A escolha aparece após sabores, mas apenas em produtos elegíveis. | O cliente pode achar que todos os itens têm embalagem de R$ 1,00 ou não entender por que a opção não apareceu. | Explicar: **A escolha aparece somente quando este produto pode ser consumido na loja ou embalado para viagem.** |
| Taxa de embalagem | O valor é explicado na escolha, porém pode não ser percebido no total. | O cliente pode interpretar o total como acréscimo inesperado. | Repetir no carrinho: **Embalagem para viagem — R$ 1,00 por produto escolhido para viagem**. |
| Picolés | O preço de atacado está no cabeçalho do grupo. | Pode não ficar claro que a regra considera a soma de todos os picolés do pedido. | Incluir instrução: **A partir de 100 picolés no total do pedido, o preço de atacado é aplicado automaticamente.** |
| Formulário | A modalidade é citada no formulário, embora seja definida por produto antes. | Pode parecer que o cliente precisa preencher esse campo de novo. | Mostrar texto de confirmação: **A forma de receber cada produto já aparece no resumo acima.** |
| Pagamento | `Pagar na loja` e `Pix` aparecem sem consequência imediata visível. | O cliente pode não entender que Pix precisa ser confirmado antes da produção. | Incluir ajuda curta em cada opção. |
| Horário | O intervalo é informado, mas não explica que é hora desejada, não confirmação. | Pode ser interpretado como horário já garantido. | Usar **Horário desejado para retirar — a sorveteria confirma pelo WhatsApp**. |
| Envio | O botão leva ao WhatsApp. | Pode ser interpretado como pedido confirmado. | Renomear para **Enviar solicitação pelo WhatsApp** e repetir que o pedido só vale após confirmação. |

## Critério de aplicação

Cada texto será alterado apenas se responder, no próprio ponto de uso, três perguntas do cliente: **o que estou escolhendo? quanto isso acrescenta? o que acontece depois?**
