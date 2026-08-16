# Verificação visual — etiqueta de atacado

Data: 2026-08-15

A prévia local foi aberta em viewport móvel e o fluxo `Encomendas -> Picolés -> Montar lote` foi testado. Cada grupo renderizou o nome da categoria separado da etiqueta de atacado. A etiqueta apareceu na frente do tipo, em amarelo-dourado, com texto preto e negrito. Foram conferidos os valores: R$ 1,80; R$ 2,00; R$ 2,00; R$ 3,00; R$ 6,00, todos com a indicação `acima de 100 un.`.

A lista interna permaneceu rolável e os controles de quantidade continuaram visíveis. O texto do nome da categoria deixou de herdar a cor vermelha do cabeçalho e passou a usar grafite. A validação de JavaScript confirmou 3 blocos válidos e `git diff --check` não encontrou problemas.
