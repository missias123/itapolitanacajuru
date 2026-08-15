# Auditoria funcional inicial do cardápio — 2026-08-15

A página inicial contém 12 acordeões: `acc-sorvetes`, `acc-picolés`, `acc-açaí`, `acc-milk`, `acc-tacas`, `acc-tacas-p`, `acc-iso`, `acc-sobremesas`, `acc-enc-caixas`, `acc-enc-tortas`, `acc-enc-picolés` e `acc-complementos`.

O varredor automatizado conseguiu aplicar o estado `menu-foco-aberto` e `menu-foco-ativo` a cada categoria. Porém, em todos os 12 casos, o painel ativo e o `.acc-body` ficaram com altura/visibilidade computada zero no momento da medição (`bodyRect` top/bottom/height = 0; `visibleAccs = []`). Isso indica que as regras atuais de isolamento estão ocultando ou colapsando o próprio acordeão ativo, apesar das classes de foco estarem presentes.

O resultado de vazamento foi inconclusivo porque a regra atual de ocultação também removeu o vazamento da amostra automatizada; a imagem fornecida pelo usuário comprova que a seção externa `#acai-natureon` ainda aparece no navegador real. A causa estrutural já confirmada é que `#vc-container` está dentro de `#vc-wrap`, enquanto `#acai-natureon` é uma seção irmã posterior; portanto, uma lista de seletores que presume filhos diretos do `body` é frágil.

Conclusão: substituir o bloqueio por seletores negativos por uma camada/portal de foco criada como filha direta do `body`, mover temporariamente somente o acordeão ativo para essa camada, preservar um placeholder no local original e restaurar o elemento no fechamento. Assim, nenhum texto ou seção irmã poderá aparecer, e o conteúdo ativo não será colapsado por regras do ancestral original.
