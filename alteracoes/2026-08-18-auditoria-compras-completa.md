# Auditoria completa de compras — 2026-08-18

## Fase 1 — Caixas e sabores

- URL pública testada: https://itapolitanacajuru.com.br/encomendas.html?v=compra-auditoria-20260818
- Cabeçalho exibido com cinco botões: INÍCIO, PROMOÇÃO, FEEDBACK, HISTÓRIA e COMPRAR.
- A seção Sorvete em Caixa abriu corretamente.
- Foram exibidas quatro opções: Caixa 5L com 2 sabores, Caixa 5L com 3 sabores, Caixa 10L com 2 sabores e Caixa 10L com 3 sabores.
- O catálogo mostrou 38 sabores, incluindo Bem Casado, Cheesecake e Passas ao Rum.
- A primeira seleção de sabores foi aberta com sucesso; regra de seleção exata ainda será testada.

Observação: nenhum pedido real foi enviado; a auditoria é simulada e não conclui compra nem pagamento.
## Fase 2 — Retirada na loja e teste local

- O formulário foi alterado localmente para informar que a compra é exclusivamente para retirada na loja e que não há delivery.
- A antiga lógica de endereço foi removida do HTML e substituída por confirmação obrigatória de retirada.
- A seção de caixas abre localmente e os quatro produtos continuam visíveis.
- Ao abrir o modal local de sabores, a estrutura do modal aparece, mas os botões de sabores não são renderizados nessa execução via `file://`. Isso pode ser limitação de carregamento de JSON por origem local; deve ser confirmado em HTTP/publicado antes de concluir a correção.
## Fase 2 — Confirmação por HTTP local

- A mesma página foi servida por HTTP local para eliminar a limitação de segurança do protocolo `file://`.
- A página inicial de Encomendas abriu normalmente, com cabeçalho unificado e as quatro seções de compra visíveis.
- O teste de sabores deve prosseguir nessa origem HTTP; o modal vazio observado anteriormente em `file://` foi acompanhado por `Failed to fetch` do catálogo, indicando limitação de origem local, não conclusão de falha do catálogo publicado.
## Teste HTTP local — caixas

Fonte testada: https://4173-i66jvw33g5h8nde5va9o5-25d0cefe.us1.manus.computer/encomendas.html?v=retirada-loja-http-20260818

A seção de Sorvete em Caixa exibiu corretamente quatro produtos: Caixa 5 Litros com 2 Sabores, Caixa 5 Litros com 3 Sabores, Caixa 10 Litros com 2 Sabores e Caixa 10 Litros com 3 Sabores. Os quatro botões “Escolher Sabores” ficaram disponíveis. O cabeçalho manteve os cinco botões oficiais.
## Correção do fluxo de sabores — teste HTTP

Após remover o controlador duplicado `scripts/enc-v4.js` e corrigir `ESTOQUE_URL` de `dados/produtos.js` (arquivo inexistente) para `dados/produtos.json`, o modal da Caixa 5 Litros voltou a exibir os 38 sabores oficiais. A causa combinada era: (1) enc-v4.js sobrescrevia a lógica inline e esperava IDs de status diferentes; (2) a lógica inline apontava para um arquivo de catálogo inexistente, deixando sua lista vazia.

No teste HTTP, foram exibidos os sabores Abacaxi ao Vinho, Abacaxi Suíço, Amarena, Ameixa, Banana com Nutella, Bem Casado, Bis e Trufa, Blue Ice, Cereja Trufada, Cheesecake, Chocolate Belga, Chocolate com Café, Coco Queimado, Creme Paris, Croquer, Doce de Leite, Ferrero Rocher, Flocos, Kinder Ovo, Leite Condensado, Leite Ninho, Leite Ninho Folheado, Leite Ninho com Oreo, Leite Ninho Trufado, Limão, Limão Suíço, Menta com Chocolate, Milho Verde, Morango Trufado, Mousse de Maracujá, Mousse de Uva, Nozes, Nutella, Ovomaltine, Passas ao Rum, Pistache, Prestígio e Sensação.

Fonte testada: https://4173-i66jvw33g5h8nde5va9o5-25d0cefe.us1.manus.computer/encomendas.html?v=single-controller-products-json-20260818
## Carrinho e formulário de retirada — teste HTTP

A Caixa 5 Litros — 2 Sabores foi adicionada ao carrinho com os sabores Bem Casado e Cheesecake, total de R$ 100,00. O carrinho mostrou as ações Editar, Excluir, Voltar, Limpar e Prosseguir para Identificação.

Na Etapa 2, o formulário exibiu corretamente: nome completo; confirmação obrigatória de retirada na loja; WhatsApp de contato com DDD 16; e ciência do prazo mínimo de 5 dias úteis após confirmação/pagamento. O aviso informa explicitamente que não há delivery. Não foi enviado nenhum pedido real.
## Validação do checkout — botão final liberado

Com o nome de teste, a confirmação obrigatória de retirada na loja, o WhatsApp com DDD 16 e a ciência do prazo mínimo de 5 dias úteis preenchidos, o botão **Enviar Pedido via WhatsApp** foi liberado. O teste foi interrompido antes do clique final; nenhum pedido real foi enviado e nenhum WhatsApp foi aberto.

## Evidência técnica — cardápio inicial (HTTP local)

URL testada: https://4173-i66jvw33g5h8nde5va9o5-25d0cefe.us1.manus.computer/index.html?v=menu-fix-20260818-1

O painel VER CARDÁPIO abriu e exibiu as categorias, mas o clique em MASSAS & SABORES não expandiu o conteúdo. A inspeção do DOM mostrou `onclick="toggleAcc('acc-sorvetes')"`, porém `window.toggleAcc` e `window.renderTudo` estavam `undefined`, enquanto `window.PRODUTOS_DATA` continha as chaves oficiais do catálogo. Isso indica que o bloco inline de scripts não foi executado integralmente; a causa provável é a sintaxe quebrada no carregador ou a ordem de execução. O próximo passo é corrigir o carregamento do bloco, recarregar e confirmar a expansão dos produtos e sabores.

## Correção definitiva do cardápio inicial — 2026-08-18
Foram encontradas duas ocorrências de sintaxe corrompida no `index.html`, ambas transformando chamadas `r.json()` em `r.js?v=...on()`. Isso interrompia o bloco inline e deixava `toggleAcc` indisponível. As duas ocorrências foram corrigidas e os 10 blocos inline passaram em `node --check`. No teste HTTP seguinte, `toggleAcc` passou a ser uma função e os contêineres das categorias passaram a conter produtos e sabores. O catálogo carregado expôs as categorias oficiais `sorvetes`, `picolés`, `açaí`, `milkshake`, `taças`, `sobremesas`, `caixas_enc`, `tortas_enc` e `acrescimos`, incluindo os 38 sabores de sorvete. Ainda resta revisar texto residual proibido no conteúdo ativo, independentemente da correção funcional.
