# Alterações — cabeçalho mobile e login do admin

Data: 18/08/2026

## Cabeçalho mobile

O cabeçalho permanece no formato solicitado: **Feedback ocupa a primeira linha** e os outros quatro botões ficam em **grade 2x2**. A altura foi reduzida para 54 px nos quatro botões menores e 60 px no Feedback, preservando área de toque confortável sem o excesso de altura anterior.

## Painel administrativo

Removido um trecho de HTML cru inserido dentro do bloco JavaScript de inicialização do `admin-painel.html`. Esse trecho causava erro de sintaxe e impedia a execução dos handlers de login. O bloco resiliente de eventos já existente passa a poder registrar o clique do botão `#btn-entrar-admin` e as teclas Enter nos campos de senha e token.
