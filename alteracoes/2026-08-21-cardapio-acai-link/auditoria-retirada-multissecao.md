# Auditoria de retirada multisseção

**Site:** Sorveteria Itapolitana Cajuru  
**Escopo:** Cardápio principal e futura página de retirada  
**Data:** 21 de agosto de 2026  
**Situação:** Auditoria anterior à implementação

## 1. Objetivo do fluxo

O cliente deve conseguir montar **um único pedido para retirada na loja**, escolhendo produtos de qualquer seção, sem se perder e sem repetir etapas. A página deve ser compreensível por quem usa o celular com frequência e também por crianças, idosos ou pessoas com pouca experiência digital.

O pedido final continuará sendo apenas uma **solicitação**: não haverá produção, pagamento, confirmação ou agendamento automático no site.

## 2. Auditoria da situação atual

O cardápio principal tem **109 produtos renderizados em oito seções** e cada produto possui o botão individual `Peça e retire`. O cadastro oficial, porém, possui **198 SKUs únicos, ativos e sem duplicação**. Atualmente, cada botão abre uma conversa individual no WhatsApp. Não existe carrinho ou resumo persistente que reúna itens de seções diferentes.

| Situação verificada | Resultado | Consequência para o cliente |
|---|---|---|
| Produtos com SKU no cadastro oficial | 198 | Fonte única consistente e pronta para uma lista de retirada. |
| Produtos no cardápio principal | 109 | Os demais produtos pertencem a sabores, adicionais e fluxos especializados. |
| Botões individuais de retirada | 109 | O cliente consegue pedir um item, mas não forma uma lista única. |
| Resumo persistente de produtos selecionados | Não existe | Ao mudar de aba, a pessoa não tem referência do que já pretendia pedir. |
| Página única com produtos por seção | Não existe | Não há local central para comparar ou reunir as escolhas. |
| Seleção de sabores em Encomendas | Existe | É uma lógica funcional que pode orientar a escolha de sabores no novo fluxo, sem alterar Encomendas. |

> **Diagnóstico:** o cardápio atual funciona para pedidos individuais. Para pedidos com vários produtos, ele oferece muitos pontos independentes de envio e nenhum lugar único para conferência. Isso aumenta a chance de a pessoa esquecer itens, abrir o WhatsApp cedo demais ou não saber como voltar para continuar escolhendo.

## 3. O que grandes fluxos de compra fazem

As boas práticas de comércio digital e cardápios de alimentação convergem em quatro pontos: manter um retorno visível da inclusão no carrinho; permitir continuar escolhendo sem perder a seleção; disponibilizar uma revisão editável antes da finalização; e reduzir erros com linguagem clara, campos mínimos e mensagens descritivas.[1][2][3][4][5]

| Princípio auditado | Aplicação na retirada da Itapolitana |
|---|---|
| Feedback persistente | Após tocar em adicionar, o item entra no resumo e o contador/valor muda de forma visível. |
| Uma navegação, vários produtos | O cliente pode escolher em seções diferentes e manter um único pedido. |
| Revisão antes de enviar | Nome, SKU, sabor, quantidade, valor e subtotal ficam visíveis e editáveis. |
| Saída fácil | O botão **Continuar escolhendo produtos** volta à lista sem apagar nada. |
| Prevenção de erros | Campos obrigatórios explícitos; telefone aceita formatos usuais, mas valida DDD 16; explicações simples. |
| Leitura universal | Letras legíveis, alto contraste, botões grandes, uma ação principal por tela e sem termos técnicos. |

## 4. Fluxo proposto para aprovação

### Passo 1 — Abrir a página de retirada

No cardápio principal, qualquer botão `Peça e retire` deve abrir a nova página `retirada.html`. O produto que originou o clique aparece já destacado na página, mas o cliente não fica preso a ele: pode escolher qualquer outro produto.

### Passo 2 — Ver a lista única dos 198 produtos

A página mostrará **todos os 198 SKUs**, enumerados por seção e apresentados em blocos simples. Cada item exibirá número, nome, tamanho quando aplicável, preço e o botão **Adicionar**.

| Seção da lista única | Itens cadastrados |
|---|---:|
| Sorvetes de massa | 11 |
| Sabores de massa | 38 |
| Picolés | 39 |
| Açaí (250 ml a 700 ml) | 58 |
| Milk-shake de Açaí | 4 |
| Taças Gourmet de Açaí | 4 |
| Milkshakes | 6 |
| Taças tradicionais | 8 |
| Taças premium | 7 |
| Sobremesas | 9 |
| Isopores para viagem | 4 |
| Caixas para encomenda | 4 |
| Tortas por encomenda | 1 |
| Acréscimos | 5 |
| **Total** | **198** |

### Passo 3 — Escolher sabores quando necessário

Produtos que dependem de sabores devem abrir uma seleção equivalente à já aprovada em `encomendas.html`:

1. O título informa exatamente o que está sendo escolhido.
2. A página diz quantos sabores devem ser marcados.
3. Cada sabor pode ser marcado ou desmarcado com um toque.
4. A mensagem informa claramente: `Faltam 2 sabores` ou `Tudo certo! Pode confirmar.`
5. O botão de confirmação só fica disponível quando a regra do produto for atendida.

Para a retirada comum, esta lógica registra sabores e não altera as regras de atacado, estoque ou mínimo de 100 unidades de `encomendas.html`. Esses fluxos continuarão separados.

### Passo 4 — Acompanhar sem se perder

Enquanto navega pela lista, o cliente vê uma barra fixa no rodapé:

> **Ver pedido · 3 itens · R$ 38,00**

Essa barra só aparece depois da primeira inclusão. Ela terá área grande para toque e nunca ocultará botões da lista. O contador será de itens, e não de seções, para evitar dúvidas.

### Passo 5 — Revisar antes de enviar

Ao tocar em `Ver pedido`, o cliente vê a lista final, sem sair da página de retirada.

| Informação por item | Ação disponível antes do envio |
|---|---|
| Produto e SKU | Conferir se é o produto correto |
| Tamanho e sabores | Conferir ou voltar para editar os sabores |
| Quantidade e subtotal | `Mais um` ou `Menos um` |
| Produto não desejado | `Excluir produto` |
| Pedido incompleto | `Continuar escolhendo produtos` |

Nada é enviado neste momento. O cliente pode voltar quantas vezes precisar, preservar a seleção e só avançar depois de conferir a lista.

### Passo 6 — Preencher e aceitar as regras

Depois da revisão, o formulário usará somente as informações necessárias: nome, WhatsApp com DDD 16, horário desejado, modalidade, pagamento, observações e aceite. Os campos obrigatórios serão marcados e cada erro explicará o que falta ou como corrigir.

O aceite usará texto direto:

> **Estou ciente de que este pedido é apenas uma solicitação. Se eu não receber confirmação da Sorveteria Itapolitana Cajuru em até 15 minutos, houve falha técnica de comunicação; a solicitação estará cancelada e o produto não será elaborado.**

Também será exibido, antes do envio, o aviso: **Os sabores, itens e observações escolhidos dependem de disponibilidade. A sorveteria confirmará pelo WhatsApp antes de produzir.**

### Passo 7 — Enviar uma única solicitação

Somente após a revisão e o aceite, o botão `Enviar pedido de retirada pelo WhatsApp` abre uma conversa com todos os itens, SKUs, sabores, quantidades e dados do cliente. A mensagem reforçará que a produção depende de confirmação manual da sorveteria e, em Pix, da confirmação do pagamento.

## 5. Regras que não serão alteradas

| Área | Proteção adotada |
|---|---|
| Encomendas | Página, carrinho e regras atuais permanecem como estão. |
| Atacado de picolés | Mínimo de 100 unidades e regra de preço continuam exclusivos de Encomendas. |
| Estoque de picolés | Nenhuma regra de contagem ou disponibilidade será modificada nesta auditoria. |
| Cadastro mestre | `dados/produtos.json` continua sendo a única fonte de nome, preço, tamanho e SKU. |
| Produção | Nenhuma produção automática; tudo depende da confirmação manual da sorveteria. |

## 6. Conclusão da auditoria

A solução mais clara não é abrir o WhatsApp a cada produto nem exibir uma lista única sem orientação. A solução recomendada é uma **página própria de retirada**, com a lista dos 198 produtos dividida por seções, adição simples, seleção de sabores conhecida, barra persistente de resumo e revisão editável antes do envio.

Esse desenho permite que uma pessoa escolha, por exemplo, um açaí, dois picolés e uma sobremesa em uma mesma solicitação sem perder itens ou se confundir. Ele respeita o modelo de confirmação manual da sorveteria e mantém `encomendas.html` isolada.

## 7. Validação de responsividade — 21/08/2026

O HTML de retirada foi verificado em uma área de visualização de **375 × 812 px**. Nessa largura, a regra de celular ficou ativa: a grade de sabores usa **duas colunas**, a barra do pedido permanece fixa e não foi identificado transbordamento horizontal. Em tela ampla, a grade passa progressivamente para três colunas conforme a regra definida no CSS.

## Referências

[1] [Nielsen Norman Group — Adding an Item to a Shopping Cart: Provide Clear, Persistent Feedback](https://www.nngroup.com/articles/cart-feedback/)

[2] [Nielsen Norman Group — The Mobile Checkout Experience](https://www.nngroup.com/articles/mobile-checkout-ux/)

[3] [Baymard Institute — The State of Mobile E-Commerce Search and Category Navigation](https://baymard.com/blog/mobile-ecommerce-search-and-navigation)

[4] [Nielsen Norman Group — Usability for Older Adults: Challenges and Changes](https://www.nngroup.com/articles/usability-for-senior-citizens/)

[5] [W3C — Cognitive Accessibility Design Pattern: Design Forms to Prevent Mistakes](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p04-supportive-forms/)
