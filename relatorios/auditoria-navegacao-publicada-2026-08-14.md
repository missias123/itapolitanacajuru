# Auditoria humana da página publicada — 14/08/2026

## Fonte verificada
URL: https://itapolitanacajuru.com.br/index.html

## Evidências observadas no navegador
A página inicial carregou com o cabeçalho, navegação principal, botão `VER CARDÁPIO` e categorias do cardápio. Ao clicar no botão principal, o cardápio foi aberto visualmente e a viewport permaneceu aproximadamente na região do cardápio; a interface mostrou os acordeões de Sorvetes, Picolés e Açaí.

Na página publicada, a categoria de sorvetes apresentou o botão `Ver 38 Sabores`. O texto extraído da página mostrou os produtos de sorvete e a lista de 38 Sabores como promessa de catálogo. A categoria de Picolés apresentou seis grupos com contagens específicas: 8, 4, 12, 1, 1 e 8 sabores. Isso confirma visualmente que a página publicada não está usando uma contagem única de 38 Sabores para os picolés.

A categoria de Açaí exibiu produtos e complementos próprios, com vários links `Pedir pelo WhatsApp`; não foi observada a lista genérica de 38 Sabores no conteúdo textual da categoria de Açaí.

## Limitação do teste nesta etapa
O clique no botão `Ver 38 Sabores` foi realizado, mas a resposta visual retornada pelo navegador ainda apresentou o mesmo conjunto de elementos e não permitiu concluir, somente por essa captura, se o painel inline de sabores foi renderizado corretamente. Portanto, esse ponto está classificado como **não conclusivo**, não como aprovado.

## Observação de desempenho e leveza
A página carregou muitos links e itens de Açaí no DOM inicial. O catálogo de Açaí apareceu com dezenas de links de pedido na extração da página. Antes de qualquer alteração, é necessário medir se esses itens são renderizados inicialmente ou apenas quando a categoria é aberta. Não será feita afirmação de desempenho sem essa medição.

## Regra de honestidade
Nenhuma alteração de código foi considerada validada por este teste. A página `encomendas.html` ainda precisa passar por uma verificação de regressão separada.

## Verificação DOM após o clique
A consulta do DOM após o clique mostrou `scrollY: 2240`, sem classes `menu-foco-aberto` ou `menu-foco-ativo`. O corpo `sorvetes-body` permaneceu visível e com `scrollTop: 242`, mas seu texto inicial continuou mostrando apenas os produtos, sem os nomes dos 38 Sabores no trecho consultado. Foram encontrados 13 elementos cuja classe contém referência a sabores no conjunto da página, porém isso não prova que o botão de sorvetes tenha mostrado a lista correta. O resultado é **falha ou comportamento não conclusivo no fluxo visual**, e exige inspeção do evento e do DOM específico antes de qualquer correção.

A mesma consulta mostrou que várias categorias permanecem no DOM e visíveis ao mesmo tempo. Isso é uma observação factual do estado publicado naquele momento; ainda não é uma recomendação de alteração.

O resultado da consulta foi salvo também em `/home/ubuntu/console_outputs/exec_result_2026-08-14_22-18-06_950.txt`.

## Inspeção do botão publicado
O botão está ligado a `abrirSaboresInline('sorvetes','38 Sabores de Sorvete',this)`. A função existe no navegador e `getSaboresDisponíveis()` retorna exatamente 35 itens, começando por `Abacaxi ao Vinho`, `Abacaxi Suíço (c/caramelo)`, `Blue Ice (Algodão Doce Azul)`, `Amarena (Cereja Italiana Azeda)` e `Ameixa`. Portanto, a fonte de dados não está vazia.

No momento da inspeção, o corpo `sorvetes-body` ainda continha somente os cards de produtos, o botão, o CTA de WhatsApp e o botão de voltar. Isso mostra que o clique não concluiu a renderização esperada ou que o navegador publicou uma versão cuja função encontrou um problema no caminho. A causa ainda não deve ser afirmada sem inspecionar `_getAccBody` e `mostrarSaboresInline` e executar a função diretamente de modo controlado.

## Teste humano de abrir e voltar
A execução controlada da mesma função alterou o painel de sorvetes para o modo inline: o navegador mostrou `38 Sabores de Sorvete`, a instrução de pedido, os 35 nomes e o botão `← Voltar`. O painel recebeu a classe de foco `acc-sorvetes`.

Na captura visual imediatamente após a renderização, o conteúdo apareceu no texto extraído, mas a imagem da viewport mostrou principalmente o fundo, sem uma apresentação visual confiável do painel. Isso indica que a estratégia atual de modo foco/trava precisa ser revisada antes de ser considerada boa para um usuário humano.

Ao clicar em `Voltar`, o navegador manteve o painel em modo de sabores e os elementos `← Voltar ao cardápio` e `← Voltar` ainda foram listados. Não foi possível classificar o retorno como aprovado: a tela não demonstrou de forma inequívoca a restauração do cardápio original nem a volta à posição anterior. O fluxo atual está **reprovado como experiência humana**, embora a lista de 38 Sabores tenha sido encontrada no DOM após execução direta.

## Confirmação da falha do botão Voltar
Após dois cliques humanos no botão `← Voltar`, o navegador continuou listando o botão `← Voltar ao cardápio` dentro do acordeão e o botão `← Voltar` do nível de sabores. A classe `menu-foco-aberto` permaneceu ativa e a classe `menu-foco-ativo` permaneceu em `acc-sorvetes`. Portanto, o retorno não foi confirmado e o modo foco/trava não está concluindo a transição como esperado na página publicada.

## Teste humano de Picolés
Após reiniciar a página e abrir o cardápio, o clique no acordeão `PICOLÉS DIFERENCIADOS` funcionou: o rótulo mudou para `Fechar opções`.

O clique no primeiro botão `8 Sabores` também funcionou e abriu o nível inline `🍭 Sabores – Picolé de Frutas`, mostrando oito sabores específicos: `Abacaxi`, `Caju`, `Goiaba`, `Groselha`, `Limão (base água)`, `Melância`, `Uva` e `Tamarindo`. Nesse fluxo a lista de 38 Sabores não apareceu, o que está de acordo com a separação exigida para Picolés.

O nível aberto apresentou `← Voltar ao cardápio` e `← Voltar`. A posição visual e o funcionamento do retorno ainda precisam ser confirmados em um clique seguinte; a abertura e a separação de dados foram confirmadas.

## Confirmação técnica do retorno de Picolés
Depois do clique humano em `← Voltar`, o DOM continuou contendo apenas a lista `🍭 Sabores – Picolé de Frutas` e um único botão `← Voltar`. O acordeão permaneceu com as classes `open menu-foco-ativo`, o documento permaneceu com `menu-foco-aberto`, `_menuFocoId` continuou como `acc-picolés` e `scrollY` ficou em `0`. A lista não voltou ao conjunto de seis grupos de Picolés. Este fluxo está **reprovado** no retorno.

## Reinício para categorias inferiores
A página foi recarregada e o botão `VER CARDÁPIO` abriu o painel: o botão mudou para `Fechar o cardápio` e o conteúdo do cardápio ficou acessível. O teste visual confirmou novamente a abertura do menu principal; nenhuma alteração foi feita no site durante esta auditoria.

## Teste visual de Milkshakes
A rolagem levou corretamente às categorias inferiores. Foram tentados dois cliques humanos no cartão de Milkshakes: um no corpo do cartão e outro no controle circular à direita. Após ambos, o cartão continuou mostrando `Clique para abrir` e não apareceu nenhum painel `Ver Sabores do Milkshake`. Portanto, neste teste visual, a abertura de Milkshakes **não foi confirmada**; o fluxo está pendente/reprovado até localizar o controle real e repetir a ação com evidência clara.

## Correção do teste visual de Milkshakes
Após medir a área real do botão e ajustar o ponto de clique humano para o centro geométrico, o cartão de Milkshakes abriu corretamente: o rótulo mudou para `Fechar opções`, seis cartões de produtos foram exibidos (300 ml, 400 ml, 500 ml, 750 ml, Top 360 ml e Top 600 ml) e apareceram os botões `Ver Sabores do Milkshake`, `Ver milk-shakes`, `Consultar opções no WhatsApp` e `← Voltar ao Início do Cardápio`.

O fato importante para desempenho é que a categoria inicialmente fechada não exibiu esses cartões na tela; o conteúdo passou a ser visível somente após a abertura. A lista de sabores ainda precisa ser testada pelo botão próprio.

## Resultado real do botão de sabores do Milkshake
O clique direto no controle identificado como botão 103 abriu a lista correta de 38 Sabores do Milkshake no DOM (`#milk-body`, classe `sabores-inline`, altura aproximada de 375 px). Porém, a mesma ação revelou um problema de navegação: `window.scrollY` ficou em `0`, enquanto o conteúdo principal e o cartão Milkshakes receberam posições negativas (`main y=-3202`, `acc-milk y=-988`). A lista existe, mas ficou fora da viewport. Isso é uma falha confirmada de preservação/trava de scroll, não uma suposição.

## Teste humano do botão “Ver 38 Sabores” de Sorvetes
Após reiniciar a página publicada, o botão “Ver 38 Sabores” foi acionado pelo navegador. O resultado observado foi uma rolagem para a área do cardápio, mas a lista não abriu. A inspeção posterior confirmou: `#sorvetes-body` continuou com o HTML original, `inlineCount=0`, `has35=false`, `window.scrollY=2352` e `_menuFocoId=null`. Portanto, nesta tentativa real, o botão não abriu a lista; não é correto considerar o fluxo aprovado.

## Verificação local da correção visual de encomendas
A versão local `file:///home/ubuntu/itapolitanacajuru/encomendas.html` foi aberta e a categoria “Sorvete em Caixa” foi expandida manualmente. Os cartões exibiram os quatro produtos, preços e botões “Escolher sabores”. Os estilos computados locais confirmaram `.prod-nome` em 18,88px, `.prod-preco` em 20,48px, `.btn-sabores` em 16,8px e `padding: 16px 20px`; os itens de sabor permanecem definidos para 0,95rem e altura mínima de 52px. A versão pública testada antes continua sem essa alteração porque ainda não foi publicada; portanto, não se deve afirmar que a correção já está no domínio.

## Regressão do seletor de sabores em encomendas
Na cópia local, a categoria de sorvete foi aberta e o botão “Escolher sabores” foi acionado manualmente. O modal exibiu a lista completa de 38 Sabores. Dois sabores foram selecionados individualmente; o estado mudou para selecionado, o texto de status mudou de “Faltam 2 sabores” para “Faltam 1 sabores” e depois para “Tudo certo! Pode confirmar.” O botão “Confirmar” ficou habilitado/verde. Este teste confirma que as alterações CSS não impediram a seleção nem alteraram essa parte do fluxo.
