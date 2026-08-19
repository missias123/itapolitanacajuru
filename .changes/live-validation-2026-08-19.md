# Validação live — 2026-08-19

## Resultado

A página `https://itapolitanacajuru.com.br/promocao.html?v=b407cbe` já apresenta corretamente o novo banner e formulário: o sorteio da caixa de sorvete está encerrado, as inscrições da torta estão abertas pelo site oficial da Itapolitana Cajuru e o primeiro sorteio será em janeiro de 2027.

## Discrepância encontrada

Ao abrir o tema `🎉 Promoções e Sorteios` no itaBot live, ainda aparece a mensagem antiga sobre promoções semanais/mensais e comentário no Instagram. O código local e o teste `scripts/verify_promo_2027.js` já estão atualizados, portanto é necessário identificar a fonte duplicada ou cache do widget live e publicar a correção correspondente.

## Segunda validação live

Após publicar o commit `090f75b`, a página passou a carregar `scripts/ita-bot-widget.js?v=20260819-promo-open`, eliminando a versão antiga do arquivo. O banner e o formulário continuam corretos; o tema do itaBot foi reaberto e está pronto para a verificação final do texto.

## Resultado final

O tema `🎉 Promoções e Sorteios` do itaBot live agora exibe:

- O sorteio da caixa de sorvete foi encerrado, com mais de 1.400 inscritos.
- As inscrições para o sorteio mensal de uma torta de sorvete já estão abertas.
- O primeiro sorteio será em janeiro de 2027.
- O cadastro é exclusivamente pelo site oficial da Itapolitana Cajuru, na aba Promoção.

A orientação antiga para comentar no Instagram não aparece mais na resposta live.
