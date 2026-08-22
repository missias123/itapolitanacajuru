# Demonstração ao vivo — caixa de 12 bolas

A prévia foi reaberta com o catálogo limpo para demonstração do fluxo da caixa de 12 bolas. A seção pública exibida é **Caixas de sorvete — 4 a 12 bolas**, com quatro opções: 4, 7, 9 e 12 bolas.

O teste será feito apenas no navegador de prévia, sem enviar mensagem ao WhatsApp e sem manter itens no carrinho após a conferência.

## Etapa 1 — bloqueio por soma incompleta

Na tela, foi aberto **Isopore 12 Bolas** e preenchido `8 Chocolate + 3 Morango`. O cartão azul exibiu a mensagem “Distribuição informada: 11 de 12 bolas. Ajuste até fechar a quantidade.” e o botão **Adicionar este produto ao pedido** permaneceu bloqueado.

## Etapa 2 — soma completa

O texto foi corrigido para `8 Chocolate + 4 Morango`. O contador mudou para “Distribuição completa: 12 de 12 bolas.”, ficou verde e liberou o botão de adicionar. Na mesma tela, foi escolhida a opção de embalar para viagem para conferir a embalagem vinculada no carrinho.

## Etapa 3 — carrinho

O carrinho mostrou a distribuição `8 Chocolate + 4 Morango`, o produto de R$ 50,00, a embalagem de viagem de R$ 1,00 e o total de R$ 51,00. Durante a demonstração, o campo de data de torta apareceu indevidamente para essa caixa; a inconsistência foi registrada para correção antes de concluir o teste.

## Correção de data condicional

A regra do controlador já ocultava a data para a caixa, mas uma regra visual de campo sobrescrevia o atributo HTML `hidden`. Foi adicionada a regra específica `.field[hidden]{display:none!important}`, mantendo data e aviso de 48 horas visíveis somente para tortas em produção.

## Preparação para os controles por sabor

O carrinho temporário da demonstração anterior foi removido do navegador antes de validar os novos controles de mais e menos, para que nenhuma seleção de teste permaneça na prévia.

## Instruções por produto

A prévia passou a exibir a regra diretamente em cada produto por bolas: por exemplo, 1 bola pede 1 sabor; 2 bolas podem ser distribuídas entre um ou dois sabores; e 12 bolas podem ser distribuídas livremente, desde que a soma seja 12.

## Controles ao lado do sabor

Na tela da caixa de 12 bolas, cada sabor passou a ter os botões **− quantidade +** ao lado do nome. O contador começa em 0 e o botão de adicionar permanece bloqueado até a soma alcançar 12 bolas.

## Soma concluída com controles

No teste ao vivo, foram adicionadas 8 bolas de **Abacaxi ao Vinho** e 4 bolas de **Abacaxi Suíço** pelos botões de mais. O contador confirmou “Distribuição completa: 12 de 12 bolas.” e liberou a inclusão no pedido.
