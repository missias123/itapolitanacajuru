# Validação live — 2026-08-19

## Resultado

A página `https://itapolitanacajuru.com.br/promocao.html?v=b407cbe` já apresenta corretamente o novo banner e formulário: o sorteio da caixa de sorvete está encerrado, as inscrições da torta estão abertas pelo site oficial da Itapolitana Cajuru e o primeiro sorteio será em janeiro de 2027.

## Discrepância encontrada

Ao abrir o tema `🎉 Promoções e Sorteios` no itaBot live, ainda aparece a mensagem antiga sobre promoções semanais/mensais e comentário no Instagram. O código local e o teste `scripts/verify_promo_2027.js` já estão atualizados, portanto é necessário identificar a fonte duplicada ou cache do widget live e publicar a correção correspondente.
