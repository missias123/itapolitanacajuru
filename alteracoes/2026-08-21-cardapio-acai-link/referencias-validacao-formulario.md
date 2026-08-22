# Referências de validação do formulário — 22/08/2026

## Padrões adotados

O fluxo de retirada mantém o carrinho como fonte de verdade, bloqueia o avanço sem campos necessários e mostra mensagens específicas no ponto da correção. Esse padrão é coerente com a orientação da commercetools para validar carrinho vazio, dados obrigatórios, preços e regras de negócio antes do checkout. Fonte: [Cart preparation and review](https://docs.commercetools.com/learning-implement-checkout/custom-checkout/cart-preparation-and-review).

Como a sorveteria exige confirmação humana antes de produzir, o fluxo usa uma solicitação pendente e a ligação como etapa de aprovação manual. A documentação da Toast descreve o modo de aprovação manual para que os pedidos sejam confirmados antes de seguir para preparo. Fonte: [Getting Started With Online Ordering](https://support.toasttab.com/en/article/Getting-Started-Online-Ordering).

As mensagens de erro serão curtas e específicas, próximas do campo que precisa ser corrigido. A FAQ da Toast recomenda orientar o cliente sobre o dado exato a revisar em vez de apresentar erro genérico. Fonte: [Online Ordering FAQ](https://support.toasttab.com/en/article/Online-Ordering-FAQ).
