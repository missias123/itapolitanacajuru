# Evidência móvel — redirecionamento de retirada

## Captura inicial

Foram geradas telas em 375 × 812 pixels para o cardápio e para a página de retirada com o SKU `SVM-CC-01`.

## Resultado observado

A página de retirada carregou corretamente em layout móvel, com cabeçalho, aviso de confirmação manual e regras de retirada visíveis. A captura inicial do cardápio ficou acima da região dos cartões de produtos; uma nova captura será posicionada diretamente no primeiro botão interno para demonstrar o toque e o destino de forma visual.

## Garantias do teste

O procedimento apenas abriu páginas e validou URLs. Nenhum item foi inserido no carrinho e nenhuma mensagem de WhatsApp foi enviada.

## Demonstração visual concluída

A captura foi reposicionada para mostrar a categoria **Massas & Sabores** aberta no celular e o botão interno **Peça e retire na loja** do produto Casquinha/copo. O botão avaliado contém o SKU `SVM-CC-01` e abre `retirada.html?sku=SVM-CC-01#catalogo`.

A segunda tela móvel mostra a página de retirada carregada, com catálogo e o produto Casquinha ou copo visíveis. O teste manteve o carrinho vazio, não enviou WhatsApp e não iniciou produção.
