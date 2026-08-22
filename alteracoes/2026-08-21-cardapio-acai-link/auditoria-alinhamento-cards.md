# Auditoria visual — alinhamento de cards do cardápio

## Evidência do usuário

A captura panorâmica de `1285 × 313 px` foi lida em cortes horizontais com sobreposição. Nos dois primeiros cortes, os cards de picolés exibem preços e descrições com alturas diferentes; por isso, os botões **Peça e retire na loja** e **Sabores** começam em posições verticais diferentes entre colunas.

O ajuste necessário é estrutural: cada card deve usar uma coluna flexível, preservar o conteúdo informativo no topo e empurrar o conjunto de ações para um rodapé comum. Isso mantém os dois botões alinhados na mesma linha inferior da grade, sem encurtar descrições nem reduzir a área clicável.

Os cortes `tile_001_x000000_y000000.png` e `tile_002_x000342_y000000.png` confirmam o problema. O terceiro corte será usado para verificar o mesmo padrão na extremidade direita.

## Captura inicial do cardápio

As primeiras capturas localizadas mostram que os blocos de entrada de Encomendas & Complementos mantêm alinhamento horizontal e vertical correto tanto em computador quanto em celular. No celular, o banner de consentimento ocupa o rodapé e pode ocultar conteúdo inferior durante a inspeção; ele será fechado na próxima captura de auditoria. A próxima verificação abrirá especificamente a seção Picolés para conferir os botões corrigidos dentro dos cards.

## Validação após a correção

Na captura atualizada de computador, os cinco cards de categoria de picolé ocupam uma única grade com altura equivalente. Mesmo com diferenças de tamanho de título e descrição, os botões principais começam na mesma linha horizontal do rodapé visual.

Na captura de celular, os cards são empilhados com largura integral, leitura centralizada e botões largos. A área de ações fica abaixo do preço e não invade o conteúdo do card. As capturas `demonstracao-desktop-alinhamento-cardapio.png` e `demonstracao-mobile-alinhamento-cardapio.png` registram essa validação.
