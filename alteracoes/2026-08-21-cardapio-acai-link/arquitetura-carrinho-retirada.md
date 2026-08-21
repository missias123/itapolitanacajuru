# Arquitetura do carrinho de retirada entre abas

## Objetivo

Permitir que o cliente escolha produtos em diferentes partes do cardápio principal — por exemplo, Massas, Picolés, Açaí, Taças e Sobremesas — sem perder o que já selecionou ao navegar entre abas.

## Fluxo adotado

1. O botão atual de cada produto passa a dizer **Adicionar à retirada**.
2. Ao adicionar, o site guarda o SKU, nome, detalhe, preço e quantidade em um carrinho exclusivo da página inicial.
3. Um resumo fixo no rodapé do celular mostra a quantidade total e o valor parcial: `Ver pedido · 3 itens · R$ 38,00`.
4. O cliente continua navegando livremente pelo cardápio. O resumo permanece acessível em todas as abas, sem cobrir botões ou conteúdos essenciais.
5. Ao abrir o resumo, um painel exibe produtos, SKU, quantidade, subtotal, controles de adicionar/remover e ação de voltar ao cardápio.
6. A ação final será **Pedir retirada pelo WhatsApp**; ela consolida todos os itens em uma única mensagem. Nesta etapa não há pagamento, confirmação ou produção automática.

## Separação de regras

O estado do novo carrinho será separado do carrinho de `encomendas.html`. Não haverá compartilhamento de variáveis, `localStorage` ou regras de atacado. Portanto, estoque de picolés, mínimo de 100 unidades, preços de atacado e fluxos de Encomendas permanecem intocados.

## Critérios de navegação mobile

| Elemento | Decisão |
|---|---|
| Ação no produto | Botão de texto direto, abaixo do preço, com área de toque mínima de 44 px |
| Feedback | Confirmação persistente no próprio botão e contador/valor do carrinho |
| Navegação entre abas | Itens permanecem no carrinho, sem mudança de página ou perda de contexto |
| Revisão | Painel único, editável, com quantidade, SKU, valor e remoção explícita |
| Finalização | Um único ponto de envio, depois da revisão completa |

## Critérios de compreensão universal

O fluxo deve funcionar para pessoas com pouca experiência digital, crianças e idosos. Por isso, cada tela terá uma única tarefa clara, texto direto, contraste alto, letras legíveis, botões grandes e rótulos completos. Não serão usados ícones sem texto, contagens escondidas, mensagens que somem sozinhas ou etapas ambíguas.

Antes do envio, a tela de revisão terá três ações explícitas em cada item: **Mais um**, **Menos um** e **Excluir produto**. Também terá um botão destacado **Continuar escolhendo produtos**, que retorna ao cardápio sem limpar a seleção.

Os campos do formulário final mostrarão quais são obrigatórios, aceitarão formatos usuais de telefone e apresentarão, ao lado do campo, uma mensagem simples sobre como corrigir qualquer erro. O envio ficará bloqueado até o pedido poder ser entendido e confirmado pelo próprio cliente.

## Referências

O carrinho persistente adotará contador visível, valor parcial e feedback claro após cada adição, com opção de continuar comprando ou revisar o pedido. Este padrão reduz a incerteza de quem compra vários itens e mantém o carrinho acessível em telas pequenas.[1]

A organização do cardápio manterá categorias de alto nível e navegação simples, evitando criar níveis extras que façam a pessoa se perder enquanto reúne produtos.[2]

[1] [Nielsen Norman Group — Adding an Item to a Shopping Cart: Provide Clear, Persistent Feedback](https://www.nngroup.com/articles/cart-feedback/)

[2] [Baymard Institute — The State of Mobile E-Commerce Search and Category Navigation](https://baymard.com/blog/mobile-ecommerce-search-and-navigation)

[3] [Nielsen Norman Group — Usability for Older Adults: Challenges and Changes](https://www.nngroup.com/articles/usability-for-senior-citizens/)

[4] [W3C — Cognitive Accessibility Design Pattern: Design Forms to Prevent Mistakes](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p04-supportive-forms/)

[5] [W3C — Understanding Success Criterion 3.3.1: Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
