# Validação visual v2 — cabeçalho mobile

## Resultado dos botões

Em 320px e 360px, o Feedback está centralizado na primeira linha e os quatro destinos ficam em uma grade 2x2. Os cinco botões agora têm aparência mais equilibrada: os quatro inferiores usam a mesma largura e altura, o botão ativo não cresce artificialmente, e todos os textos permanecem em uma única linha. A composição ocupa menos espaço vertical e está mais adequada para celular.

## Achado residual

As capturas ainda mostram uma pequena etiqueta vermelha "FALE" na parte inferior do ItaBot, junto ao robô, apesar de o seletor HTML legado ter sido removido. Isso confirma que o texto está incorporado no PNG atualmente carregado (`images/itabot-3d.png`). O cabeçalho não é a origem desse elemento. A troca da arte deve ser feita somente com um PNG realmente transparente e sem artefatos.
