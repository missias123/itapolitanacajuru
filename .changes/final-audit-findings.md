# Constatações da auditoria final — 2026-08-18

- O preview local de `encomendas.html` carregou o cabeçalho e as quatro categorias sem erro aparente.
- O arquivo `images/itabot-3d.png` ainda continha visualmente um botão vermelho `FALE` embutido na própria imagem, apesar da remoção anterior no HTML/CSS.
- Foi criada uma primeira limpeza em `images/itabot-3d-clean.png` e uma segunda versão focada em transparência real em `images/itabot-3d-clean2.png`; ambas removem o texto e o botão no preview visual, mas a transparência do PNG ainda precisa ser confirmada tecnicamente antes de substituir o asset definitivo.
- A auditoria automatizada confirmou 38/38 nomes oficiais na paleta do `index.html` e 38/38 em `encomendas.html`, sem classes `sabor-c-*` remanescentes e sem `git diff --check` pendente.

## Atualização do asset

- `itabot-3d-transparent.png` possui RGBA, mas a prévia mostrou linhas claras residuais fora do robô; não deve ser publicado ainda.
- `itabot-3d-final.png` possui RGBA no cabeçalho do PNG, porém a prévia mostra fundo escuro; é necessário checar os valores alpha nos cantos antes de decidir.

## Atualização após o recorte

- A versão `itabot-3d-final-transparent2.png` tem alpha real e remove o fundo escuro, mas ainda exibe faixas horizontais claras residuais na prévia. A estratégia será voltar à fonte quadriculada limpa e classificar todos os tons de fundo conectados às bordas, em vez de continuar ajustando a versão escura.

## Comparação adicional

- A fonte `itabot-3d-clean2.png` não contém FALE, mas o padrão quadriculado deixa resíduos claros quando convertido por máscaras simples.
- `itabot-3d-official-clean-v3.png` também mantém várias linhas horizontais, portanto não é uma alternativa segura.
- A decisão técnica é não publicar nenhum asset gerado/recortado com linhas residuais. O site continuará usando o asset atual até uma remoção de fundo sem artefatos ser obtida; o botão FALE será eliminado também por CSS/estrutura quando a integração do asset for corrigida.

## Auditoria de Encomendas e mobile

- A auditoria automatizada encontrou 38 sabores oficiais, 38 entradas na paleta do Cardápio, 38 entradas na paleta de Encomendas e zero classes `sabor-c-*` legadas.
- O modal abriu pelo botão de caixas e exibiu todos os 38 chips. A inspeção no DOM confirmou `Abacaxi Suíço` com borda amarela `#FACC15` e `Leite Ninho` com borda azul-clara `#60A5FA`; os chips mantêm `white-space: normal` para preservar legibilidade em telas estreitas.
- Os scripts principais passaram em `node --check` sem erros.
- Foram geradas capturas reais de Encomendas em 320, 360 e 430 px para a etapa de revisão visual.
- A alteração do launcher corta visualmente a faixa inferior da imagem legada dentro de um contêiner com `overflow:hidden`; o fluxo do itaBot continua carregando e o console não mostrou erro de execução.

## Revisão visual 320–360 px

As capturas mostram a composição móvel solicitada: Feedback ocupa a primeira linha e os quatro destinos ficam em grade 2×2. Em 320 e 360 px, os botões permanecem largos, os textos do cabeçalho não escapam dos limites e o carrinho fixo fica separado do conteúdo. Os cards de Encomendas mantêm hierarquia e leitura, embora alguns subtítulos naturalmente usem duas linhas em 320 px para evitar redução excessiva da tipografia.

## Métricas finais de responsividade

A medição em iframes com viewport CSS real confirmou os três breakpoints: em 320 px, o launcher ficou entre 228–310 px; em 360 px, entre 268–350 px; e em 430 px, entre 338–420 px. Em todos os casos, a composição do cabeçalho manteve cinco botões na regra 1+2×2, sem overflow de texto. Após abrir o modal, os 38 chips foram encontrados em cada viewport e nenhum apresentou overflow interno; o maior limite direito dos chips foi 309, 351 e 425 px, respectivamente, sempre dentro da largura disponível.

## Fluxo interativo de seleção

No preview interativo, a seleção de `Abacaxi Suíço` foi aceita pelo modal de caixa e a mensagem de validação mudou de “Faltam 2 sabores” para “Faltam 1 sabores”. A borda amarela e o estado selecionado ficaram visíveis no chip, confirmando que a paleta premium não interfere na lógica de seleção.

## Confirmação e carrinho

A seleção de `Abacaxi Suíço` e `Leite Ninho` atingiu o estado “Tudo certo! Pode confirmar.”. Ao confirmar, o modal foi fechado e o carrinho fixo passou para `1 itens - R$ 100,00`, demonstrando que a combinação de sabores e o produto foram transferidos para o carrinho sem erro.

## Revisão do carrinho

A etapa 1 exibiu corretamente `Caixa 5 Litros - 2 Sabores`, os sabores `Abacaxi Suíço` e `Leite Ninho`, o preço de `R$ 100,00` e o total do pedido de `R$ 100,00`. Os controles `Editar`, `Excluir`, `Voltar`, `Limpar` e `Prosseguir para Identificação` ficaram presentes e acessíveis. Nenhuma submissão real foi realizada.

## Etapa de identificação

O botão de prosseguimento abriu a Etapa 2 sem submeter informações. O formulário apresentou nome completo, confirmação obrigatória de retirada na loja, WhatsApp com exigência de DDD 16, ciência do prazo de 5 dias úteis e o botão de envio via WhatsApp desabilitado enquanto os campos obrigatórios permanecem vazios. O teste foi encerrado antes de qualquer dado pessoal ou envio.

## Publicação confirmada em produção

O commit `0107a8b` foi recebido pelo GitHub e o workflow `pages build and deployment` concluiu com sucesso. O endereço público configurado é [https://itapolitanacajuru.com.br/](https://itapolitanacajuru.com.br/). Tanto `index.html` quanto `encomendas.html` públicos já servem `SABOR_MASSA_PALETA`; a página pública de Encomendas também carregou a seção de caixas e os quatro produtos.

## Validação visual no site público

No endereço público `https://itapolitanacajuru.com.br/encomendas.html`, o seletor carregou exatamente 38 chips. A leitura do estilo computado confirmou `Abacaxi Suíço` com borda esquerda `rgb(250, 204, 21)` — `#FACC15`, amarelo — e `Leite Ninho` com borda esquerda `rgb(96, 165, 250)` — `#60A5FA`, azul-claro — ambas com 3 px. A paleta `SABOR_MASSA_PALETA` também está presente no HTML público.

## Verificação do Cardápio público

No endereço `https://itapolitanacajuru.com.br/index.html?palette-audit=0107a8b`, a seção `Massas & Sabores` e o botão `Ver 38 Sabores` estão publicados. A página pública carregou o conteúdo do Cardápio completo e a navegação para a seção de encomendas. Durante a inspeção visual, o asset exibido do itaBot ainda apresentou um pequeno elemento vermelho com o texto `FALE` na página pública; esse ponto é separado da paleta dos sabores e precisa de correção de asset/recorte em uma etapa posterior.

A inspeção do DOM público confirmou a presença de `SABOR_MASSA_PALETA`. Antes do acionamento, os chips individuais ainda não estavam no DOM; o botão `Ver 38 Sabores` foi encontrado e acionado para abrir a lista completa e medir os estilos renderizados.

A lista aberta do Cardápio público contém chips `chip-inline sabor-massa-premium`. A medição do DOM confirmou 38 sabores oficiais; `Abacaxi Suíço` está com borda `rgb(250, 204, 21)` / `#FACC15`, `Leite Ninho` com borda `rgb(96, 165, 250)` / `#60A5FA`, ambas com 3 px. Portanto, a alteração de cores também repercutiu no Cardápio público, não apenas em Encomendas.

## Auditoria do rótulo DÚVIDAS e do asset do itaBot — 2026-08-18

A versão pública ainda carregava o widget com a query antiga `v=20260818-fale-clean-1`, por isso o navegador exibiu o FALE antigo e não o rótulo DÚVIDAS. As páginas públicas foram atualizadas para `v=d50eb20-duvidas-novo` para invalidar esse cache.

O widget local já contém o rótulo `DÚVIDAS`, com `pointer-events:none`, e mantém o launcher inteiro como botão clicável. O asset local `images/itabot-3d.png` está em RGB e contém o padrão quadriculado; não deve ser publicado como versão transparente. A candidata `images/itabot-3d-official-clean-v2.png` possui RGBA e não mostra FALE, mas exibe faixas horizontais claras, portanto também precisa de tratamento antes de substituir o asset oficial.

Achado: publicar primeiro a correção de cache das páginas; manter o asset atual até selecionar uma versão RGBA sem artefatos ou aplicar um recorte seguro.
