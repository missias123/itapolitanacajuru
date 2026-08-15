# Auditoria visual responsiva — achados iniciais

Data: 15/08/2026

## Homepage em 360px

A barra superior usa uma grade de navegação em duas colunas e permanece dentro da largura da tela, sem corte horizontal aparente. Os rótulos longos, especialmente “DICAS/DEPOIMENTOS”, quebram em duas linhas; isso é funcional, mas merece revisão de hierarquia para evitar variação de altura entre botões. O banner principal está encaixado na largura disponível. O painel de cookies ocupa a região inferior e cobre parte do conteúdo, o que é esperado enquanto a decisão de consentimento não foi tomada, mas precisa ter espaçamento seguro em relação à navegação mobile fixa.

## Página Encomendas em 360px

O cabeçalho compartilhado aparece consistente com a homepage. A faixa de alerta ocupa a largura inteira e quebra em três linhas sem corte. As quatro categorias aparecem como cartões verticais bem enquadrados. O cartão de “Picolés no Atacado” tem tipografia menor que os demais e apresenta uma hierarquia visual desigual; o subtítulo é muito comprimido em comparação às outras categorias. O enquadramento geral está funcional em 360px, mas o fluxo expandido e a barra inferior ainda precisam ser testados.

## Riscos a verificar nas próximas etapas

1. Verificar se o consentimento de cookies cobre CTAs ou a barra mobile em outras páginas.
2. Testar páginas com conteúdo longo em 360px e 390px, especialmente `dicas.html`, `sobre.html`, `galeria.html` e `politica-privacidade.html`.
3. Abrir cada categoria de `encomendas.html` em viewport móvel e verificar largura dos cards, rolagem interna e ausência de overflow horizontal.
4. Comparar desktop para confirmar que as correções mobile não reduziram o aproveitamento de espaço em telas largas.
5. Tratar `encomendas.html` e `promocao.html`, que não possuem a barra mobile global segundo a auditoria estática, como possíveis inconsistências de navegação pública.
6. Distinguir páginas operacionais (`admin-painel`, `painel-qualidade`, `carrossel`, `demo-icones`) das páginas públicas antes de aplicar o cabeçalho padrão.

## Dicas em 360px

A página mantém o cabeçalho superior e a barra mobile fixa. O título e os depoimentos estão legíveis, com cards arredondados e boa largura. A barra fixa inferior apresenta rótulos que quebram ou ficam truncados em alguns itens, sobretudo “CARDÁPIO” e “ENCOMENDAS”; essa é uma inconsistência visual relevante porque a navegação não tem o mesmo enquadramento de 360px em todas as abas. O CTA “Ver Avaliações no Google Maps” está bem enquadrado, mas ocupa duas linhas, portanto deve ser validado com foco em toque mínimo e sem sobreposição.

## Galeria em 360px

O cabeçalho da galeria não começa exatamente no mesmo eixo horizontal das demais páginas: há uma margem lateral visível diferente do restante do conteúdo. O título quebra em duas linhas de forma natural, e a mídia azul ocupa grande área vertical. A barra mobile inferior repete o problema de rótulos comprimidos/truncados. A página é funcional, porém precisa de um sistema único de largura do shell e de uma regra comum para abreviar ou dimensionar os rótulos da barra mobile.

## Achado transversal

A barra mobile global tem cinco itens em 360px, mas os rótulos “CARDÁPIO” e “ENCOMENDAS” não cabem com a tipografia atual. Uma solução segura é usar `white-space: nowrap`, reduzir somente o tamanho dos rótulos em até 360px e garantir `min-width: 0` nos itens, sem reduzir o alvo de toque. A solução deve ser aplicada ao CSS compartilhado, não por página isolada.

## Quem Somos em 360px

O cartão de conteúdo está bem centralizado e a tipografia do texto corrido está confortável. Os cartões vermelhos de métricas têm boa leitura, mas a barra mobile encosta na região inferior enquanto o conteúdo continua por trás dela; o espaçamento inferior deve ser garantido em todas as páginas longas. O título interno possui boa hierarquia, embora o cabeçalho geral ocupe uma altura muito grande em relação ao primeiro conteúdo.

## Promoções em 360px

O contador está bem dividido em quatro blocos e cabe na largura sem overflow. O título do sorteio quebra em três linhas dentro do card, sem corte. A imagem ocupa boa largura, mas o conteúdo abaixo fica fora da primeira captura e precisa ser auditado com rolagem longa. A página usa o mesmo cabeçalho geral, porém não exibe a barra mobile global no diagnóstico estático; essa diferença deve ser corrigida se `promocao.html` for uma rota pública.

## Prioridade de correção

1. Corrigir a barra mobile compartilhada para rótulos e espaçamento inferior.
2. Padronizar o shell horizontal em 360px entre Galeria, Dicas, Quem Somos e Promoções.
3. Validar conteúdo expandido e final de página, não somente a primeira dobra.
4. Não alterar o cabeçalho administrativo sem separar claramente rotas operacionais de páginas públicas.

## Homepage em 1280px

O cabeçalho usa a largura disponível com cinco cartões centrados e boa simetria. O banner principal ocupa quase toda a área horizontal e tem forte impacto visual, mas a captura mostra o painel de cookies cobrindo a parte inferior do hero e alguns indicadores do carrossel. Isso é aceitável durante o consentimento, porém o painel deve respeitar uma altura máxima e não ocultar elementos importantes em telas menores.

## Encomendas em 1280px

A página de encomendas apresenta bom uso de largura: os cartões de categoria ficam em uma coluna ampla, com iconografia, títulos e subtítulos alinhados no mesmo eixo. A faixa de alerta está centralizada e proporcional. Em comparação com a homepage, a página não mostra a barra mobile em desktop, o que não é problema visual no desktop, mas confirma a inconsistência estrutural encontrada no diagnóstico estático. O espaço vertical entre categorias é confortável; a validação crítica passa a ser a abertura de cada gaveta e o comportamento em 360px/390px.

## Conclusão parcial

Não há evidência de overflow horizontal nos screenshots capturados. Os principais pontos reais são consistência de navegação inferior, altura do cabeçalho mobile, hierarquia desigual em Picolés no Atacado e cobertura por cookie banner. As páginas operacionais devem ser mantidas fora do padrão público, enquanto todas as páginas de venda e conteúdo devem compartilhar o mesmo shell e o mesmo sistema de navegação.

## Gaveta Picolés em 360px

A gaveta abre sem corte horizontal e o preço mínimo aparece corretamente como R$ 1,80. Entretanto, a primeira dobra mostra apenas o convite “Montar lote”; os sabores e o contador aparecem em uma etapa posterior. Isso pode ser intencional, mas precisa ser validado no fluxo de clique. O botão “Voltar” recebe um brilho vermelho muito intenso e se destaca mais que o CTA principal, criando uma hierarquia invertida. O subtítulo da categoria é menor que os demais e fica visualmente comprimido.

## Gaveta Caixas em 360px

Os cards de caixas estão bem enquadrados e o selo “Leite Pasteurizado da Fazenda” cabe dentro do cartão sem sobreposição. O título, disponibilidade, preço e botão seguem uma sequência clara. O primeiro cartão tem borda azul, o segundo verde e o terceiro amarelo, mas essa variação de cores parece depender do estado/posição e deve ser verificada para não indicar ações ou categorias diferentes sem explicação. A rolagem vertical funciona no screenshot e não há evidência de overflow horizontal.

## Ponto funcional prioritário

Testar o clique em “Montar lote” e “Escolher sabores” em viewport móvel, pois o problema original do usuário envolvia rolagem e conteúdo interno de produtos. A captura de uma gaveta aberta não é suficiente para concluir o fluxo completo.

## Auditoria funcional do modal de Picolés

O deep-link `encomendas.html#picoles` abre corretamente a categoria. O botão “Montar lote” abre o modal, os filtros de categoria aparecem e os controles de quantidade respondem. Após adicionar uma unidade de Abacaxi, o contador foi atualizado para “Restante: 99 · Selecionados: 1 · Total: R$ 1,80”, confirmando a lógica do cálculo.

Foi detectado um risco concreto de responsividade no modal: em viewport de 1280px, existem elementos `.picole-aba-btn` com `right` até 1446px, ultrapassando a largura do documento (1280px). Isso indica que a faixa de abas de sabores pode gerar overflow horizontal, provavelmente por manter todas as categorias em uma única linha sem rolagem/encolhimento adequado. O documento global ainda reportou `scrollWidth` igual a `clientWidth`, portanto o overflow pode estar dentro de um contêiner interno, mas precisa ser corrigido e retestado em 360px, 390px, 768px e desktop.

A lógica de preço e contador está correta no cenário testado; a falha prioritária agora é o enquadramento das abas do modal.
