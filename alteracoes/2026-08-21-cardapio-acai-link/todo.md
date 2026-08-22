# Botão Peça e retire

- [x] Identificar todos os botões de compra e retirada existentes.
- [x] Padronizar o rótulo ativo para Peça e retire.
- [ ] Fazer cada botão preencher o formulário com produto e SKU.
- [ ] Manter bloqueios para itens indisponíveis e regras especiais.
- [ ] Exibir confirmação manual obrigatória da sorveteria antes da produção.
- [ ] Informar prazo de até uma hora após a confirmação para preparo.
- [ ] Mostrar regras reduzidas antes do envio da solicitação.
- [ ] Informar que a ausência de confirmação em 15 minutos indica falha técnica e cancela a solicitação, sem elaboração do produto.
- [ ] Exigir aceite explícito do cliente sobre essa condição antes de permitir o envio.
- [ ] Planejar futuramente o Delivery em outro repositório e ambiente de testes, sem alterar o site principal nesta etapa.
- [x] Aplicar os botões somente no cardápio principal, sem modificar a página ou as regras de Encomendas.
- [x] Conferir o total de produtos com SKU na fonte oficial antes de alterar o cardápio.
- [x] Conferir o total de produtos renderizados no cardápio principal antes de aplicar os botões.
- [x] Criar carrinho de retirada único para reunir vários SKUs escolhidos em seções diferentes do cardápio.
- [x] Manter o resumo do carrinho acessível durante a navegação no celular.
- [x] Preservar integralmente os fluxos, regras e páginas de Encomendas.
- [x] Permitir que o cliente navegue entre abas sem perder os produtos e SKUs previamente selecionados.
- [x] Concluir auditoria do pedido de retirada multisseção, baseada em padrões de grandes sites, antes de implementar o novo carrinho.
- [x] Apresentar o fluxo auditado para aprovação antes de alterar o cardápio.
- [x] Garantir linguagem, botões, resumo e aceite compreensíveis por pessoas de todas as idades e com pouca experiência digital.
- [x] Permitir excluir itens e ajustar quantidade exclusivamente antes do envio do pedido.
- [x] Oferecer ação visível para continuar escolhendo produtos sem perder a seleção atual.
- [x] Disponibilizar no formulário uma lista única, organizada e pesquisável dos 198 produtos com SKU.
- [x] Fazer o botão Peça e retire abrir uma página própria com todos os 198 produtos enumerados por seção.
- [x] Reutilizar, para produtos que exigem sabores, a mesma lógica clara de seleção existente em Encomendas.
- [x] Informar que sabores, itens e observações dependem de disponibilidade e serão confirmados manualmente pela sorveteria no WhatsApp.
- [x] Criar um HTML separado de retirada com todos os produtos, tamanhos, sabores e SKUs da sorveteria, usando a lógica de sabores de Encomendas.
- [x] Alterar somente os botões Peça e retire do cardápio para direcionar ao novo HTML.
- [x] Manter açaís com combinações fixas, sem abrir seleção dos 38 sabores de massa.
- [x] Aplicar os 38 sabores de massa apenas aos produtos que permitem essa escolha.
- [x] Aplicar aos picolés preço de varejo abaixo de 100 unidades e preço de atacado a partir de 100, como em Encomendas.
- [ ] Validar cada etapa da retirada em celular, tablet e computador, sem sobreposição, deformação ou perda de navegação.
- [ ] Garantir que Peça e retire use a mesma validação de quantidade, disponibilidade, seleção e confirmação de sabores de Encomendas.
- [ ] Reaplicar no novo HTML o padrão de cores de identificação e seleção dos sabores de Encomendas.
- [ ] Apresentar prévia visual mobile e desktop do padrão de retirada antes de aplicar a camada visual definitiva.
- [ ] Manter o comportamento de um toque para selecionar e outro toque no mesmo sabor para remover a escolha antes da confirmação.
- [ ] Após os sabores, exigir escolha entre consumir na loja e embalar para viagem nos produtos de massa elegíveis, exceto picolés e açaís.
- [ ] Acrescentar R$ 1,00 de embalagem para cada produto marcado para viagem.
- [ ] Discriminar a modalidade, a embalagem e o valor de embalagem por produto no resumo final e na mensagem do WhatsApp.
- [ ] Limitar o horário de retirada de 10h00 a 20h00 no formulário e validar esse intervalo antes do envio.
- [ ] Liberar botões de pedido e retirada somente das 11h00 às 20h00 e bloqueá-los nos demais horários com aviso claro.
- [ ] Exibir ao toque fora do horário: Pedidos para retirada disponíveis das 11h00 às 20h00. Volte nesse horário para montar seu pedido.
- [ ] Bloquear automaticamente o botão de envio pelo WhatsApp fora de 11h00 a 20h00, mesmo que o formulário esteja preenchido.
- [ ] Usar uma única regra de disponibilidade por horário no cardápio, na retirada e no envio, com estado visual bloqueado e aviso acessível.
- [ ] Exibir em Encomendas fora do período: Encomendas disponíveis todos os dias, das 10h00 às 20h00. Volte nesse período para enviar sua encomenda.
- [ ] Consolidar a retirada como fluxo-piloto para orientar futuramente o Delivery em outro repositório.
- [ ] Abrir automaticamente o carrinho após confirmar um produto e alinhar carrinho e formulário visualmente ao fluxo de Encomendas.
- [ ] Adaptar o fluxo Peça e retire ao padrão de escolha, revisão e confirmação simples usado por grandes plataformas de alimentação.
- [ ] Auditar todos os 198 SKUs e os controles de disponibilidade existentes antes de criar a administração única.
- [ ] Cadastrar embalagens de 5 L, 10 L, 7 bolas, 9 bolas e 12 bolas como itens esgotáveis com dependências explícitas.
- [ ] Criar painel administrativo único para produtos, sabores, SKUs e embalagens, sem listas duplicadas.
- [ ] Propagar a alteração de disponibilidade do painel para todo o site e refletir mudanças operacionais de volta no painel.
- [ ] Separar no painel o esgotamento de embalagens do esgotamento de sabores de massa.
- [ ] Manter picolés e açaís com esgotamento exclusivamente pelo próprio produto/SKU.
- [ ] Exibir tarja Esgotado e bloquear a seleção quando um SKU de produto ou uma embalagem dependente estiver indisponível.
- [ ] Bloquear apenas o sabor indisponível nas escolhas de massa, mantendo o produto disponível com os demais sabores.
- [ ] Permitir esgotar individualmente um produto, um sabor ou uma embalagem e também esgotar em lote todos os SKUs de uma linha.
- [ ] Auditar produtos exibidos sem SKU oficial ou ligados a fontes paralelas e migrá-los para a base única.
- [ ] Executar auditoria de engenharia de SKUs, fontes, carrinhos, retirada, Encomendas, administração e dependências antes de novas correções.
- [ ] Garantir que botões Peça e retire de açaí e demais produtos redirecionem ao HTML de retirada pelo SKU oficial.
- [ ] Garantir que todos os botões Peça e retire do cardápio principal usem retirada.html?sku=SKU_OFICIAL, exceto produtos exclusivos de Encomendas.
- [ ] Auditar produto a produto os botões Peça e retire, seus SKUs e os destinos no HTML de pedidos.
- [ ] Extrair itens exibidos sem SKU oficial, classificar o risco por fluxo e só corrigir vínculos que não causem regressões.
- [ ] Usar inventário, testes em cópia controlada, correções reversíveis e validação de fluxos antes de alterar itens sem SKU.
- [ ] Exibir SKU oficial ao lado da descrição em todas as linhas do painel administrativo único.
- [ ] Unificar todos os produtos em uma lista administrativa integrada à edição manual segura e à base oficial.
- [ ] Adaptar busca, confirmação de salvamento, filtros e proteção contra edição acidental ao painel administrativo.
- [ ] Validar SKU obrigatório, formato permitido e unicidade antes de salvar qualquer edição manual.
- [ ] Exigir confirmação explícita antes de esgotar e antes de reativar produto, sabor ou embalagem.
- [ ] Usar o botão Atualizar site para enviar ao GitHub apenas alterações de disponibilidade já confirmadas.
- [ ] Criar comprovante térmico de 80 mm com margem zero, alto contraste, texto legível e sem corte lateral para pedidos administrativos.
- [ ] Revisar todos os textos do Peça e retire para eliminar interpretação ambígua sobre produto, sabor, embalagem, valor, horário e envio.
- [ ] Pesquisar e adaptar padrões internacionais de instrução e revisão de pedidos de alimentos ao fluxo Peça e retire.
- [ ] Destacar na página inicial a chamada Não fazemos delivery · Peça e retire na loja, com link responsivo para retirada.html.
- [x] Exibir no HTML de pedidos somente produtos vendáveis do cardápio; sabores de massa e picolé devem aparecer apenas dentro da escolha de cada produto.
- [x] Manter a sequência pública limpa, iniciando com sorvetes de massa e açaí, sem blocos de sabores entre as seções.
- [x] Auditar no formulário de retirada os controles de aumentar, diminuir por unidade e excluir cada produto antes do envio.
- [x] Permitir que cada milkshake seja pedido com um ou até dois sabores e identificar chantilly e Nutella nos modelos Top.
- [ ] Validar e ajustar o fluxo de retirada com prioridade para telas de celular, incluindo catálogo, modais, carrinho e formulário.
- [x] Corrigir controles travados de aumentar, diminuir por unidade e excluir em itens já adicionados ao carrinho de retirada.
- [x] Definir 50 unidades como estoque inicial de cada sabor de picolé na base central.
- [x] Exibir no formulário de retirada uma ação clara de voltar para comprar mais sem perder os itens já selecionados.
- [ ] Aplicar no Peça e retire as regras visuais de cores, botões e estados da página Encomendas.
- [x] Corrigir carrinho de retirada que mostra pedido vazio com total residual e controles inconsistentes.
- [x] Revisar e validar somas de quantidade, subtotais, embalagem e total geral após cada alteração no carrinho.
- [x] Remover automaticamente a embalagem e seu valor quando a última unidade do produto correspondente for retirada do carrinho.
- [ ] Adaptar ao Peça e retire as cores, os estados e a hierarquia de botões usados em Encomendas.
- [x] Garantir que excluir todos os produtos deixe itens, embalagens, subtotais e total geral em R$ 0,00.
- [x] Executar testes completos e consolidar um formulário de retirada validado, inspirado em grandes sites de alimentação e adaptado à sorveteria.
- [x] Vincular a embalagem de viagem à mesma quantidade do produto, incluindo e removendo ambos na mesma ação.
- [x] Aplicar às tortas de sorvete aviso e validação de retirada com antecedência mínima de 48 horas.
- [x] Reforçar no Peça e retire que todos os itens e a execução dependem de confirmação manual da sorveteria antes da produção.
- [x] Usar somente horário nos pedidos do mesmo dia e exibir data obrigatória apenas quando houver torta de sorvete no carrinho.
- [x] Mostrar ao escolher torta uma tarja vermelha obrigatória: pronta entrega somente mediante consulta pelo WhatsApp; produção com 48 horas de antecedência.
- [x] No Peça e retire, permitir para torta escolher consulta de pronta entrega pelo WhatsApp ou produção com 48 horas e informar data e horário.
- [x] Bloquear retiradas comuns com menos de uma hora e manter tortas com data mínima de 48 horas, sem dispensar confirmação manual.
- [x] Destacar um campo livre de observações adicionais para a pessoa escrever o que quiser à sorveteria.
- [ ] Auditar commits, sincronização remota e publicação das regras solicitadas para o Peça e retire.
- [x] Comparar o PDF recebido com o cardápio central e completar apenas ingredientes ausentes, sem alterar preços.
- [x] Preservar todos os preços existentes e validar que nenhuma alteração de preço ocorreu ao completar ingredientes por SKU.
- [x] Auditar a estrutura do cardápio-mãe por SKU e listar produtos com ingredientes ainda ausentes.
- [ ] Comparar a lista ampliada de sabores de sorvete e atualizar seus SKUs no cardápio-mãe e no Peça e retire.
- [ ] Aplicar no Peça e retire a regra de que cada bola do produto equivale a exatamente um sabor escolhido.
- [x] Aplicar no Peça e retire a regra de que cada bola do produto equivale a exatamente um sabor escolhido.
- [x] Permitir distribuir bolas por sabor em caixas de 4 a 12 bolas, mantendo caixas de 5L/10L e tortas com no máximo 3 sabores.
- [x] Adicionar nas caixas de 4 a 12 bolas um campo de observação da quantidade desejada por sabor, exibido no carrinho e no WhatsApp.
- [x] Permitir sabores livres e repetidos nos produtos por bolas, limitando caixas de 5L/10L e tortas a três sabores.
- [x] Aplicar de forma cirúrgica um controle de distribuição por quantidade, mantendo o restante do fluxo de retirada intacto.
- [x] Aplicar no controle de distribuição o padrão visual de cartões, cores e estados usado em Encomendas.
- [x] Demonstrar ao vivo a validação da distribuição, a inclusão no carrinho, a exclusão e o total zerado.
- [x] Corrigir a exibição indevida de data de torta em pedidos de caixas por bolas.
- [x] Criar controles de mais e menos por sabor que somem exatamente a quantidade de bolas de cada produto, mantendo caixas e tortas na escolha fixa atual.
- [x] Exibir em cada produto por bolas a instrução de que cada bola corresponde a um sabor distribuível pelos controles de mais e menos.
- [x] Configurar caixas de 4 a 12 bolas exclusivamente para viagem, com embalagem automática e sem opção de consumo na loja.
- [x] Copiar para as caixas de 4 a 12 bolas os complementos compatíveis do fluxo de Encomendas.
- [x] Integrar os complementos para viagem após a escolha dos sabores das caixas de 4 a 12 bolas.
- [x] Alinhar fontes, cores, botões e estados de erro do fluxo de caixas ao padrão de Encomendas em celular e computador.
- [x] Abrir a prévia salva do Peça e retire para conferência visual do usuário.
- [x] Corrigir os botões de Escolher sabores que ficaram cinza e bloqueados indevidamente na prévia.
- [x] Reproduzir fielmente no Peça e retire a tipografia, cores, cartões e botões de Encomendas, sem adaptação parcial.
- [x] Auditar de ponta a ponta o Peça e retire: catálogo, botões, sabores, caixas, complementos, carrinho, prazos, formulário e WhatsApp.
- [ ] Sincronizar a branch main e publicar a versão aprovada no site público pelo fluxo conectado do Cloudflare.
- [ ] Validar no cardápio principal o botão Peça e retire, incluindo o redirecionamento de Açaí Natureon com SKU correto.
- [ ] Auditar todos os botões Peça e retire e comparar seus destinos com os SKUs oficiais do catálogo central.
- [ ] Vincular todos os botões Peça o seu e Peça e retire à página de retirada com o SKU correspondente quando houver produto associado.
- [ ] Limitar a auditoria de vínculos ao cardápio inicial entre Sorvetes de massa e Sobremesas.
- [ ] Padronizar todos os botões desse trecho como Peça e retire na loja, com link por SKU e destaque pulsante responsivo.
- [ ] Demonstrar em celular um pedido de teste com produtos representativos, sem enviar mensagem real ao WhatsApp.
- [ ] Atualizar o rótulo dos botões vinculados para Peça e retire na loja e remover o sufixo visual Indisponível, mantendo aviso de horário ao toque.
- [ ] Liberar temporariamente a prévia para a demonstração e restaurar a regra real de 11h00 às 20h00 ao final.

## Acesso restrito à retirada

- [ ] Remover qualquer acesso direto, menu ou chamada pública para `retirada.html`.
- [ ] Manter o fluxo oculto e acessível somente pelos botões internos de produtos no cardápio.
- [ ] Preservar em cada botão interno o SKU oficial do produto para abrir a retirada correspondente.
- [ ] Validar que hero, cabeçalho, rodapé e páginas institucionais não exponham a retirada.

## Auditoria ao vivo dos botões do cardápio

- [x] Extrair a lista completa de botões internos “Peça o seu” e “Peça e retire” com produto, SKU e destino esperado.
- [x] Testar cada botão no cardápio sem enviar pedido ao WhatsApp.
- [x] Confirmar em cada teste que a página de retirada abre e recebe o SKU oficial correspondente.
- [ ] Corrigir somente vínculos ausentes, duplicados ou incompatíveis, mantendo o padrão do Açaí Natureon.

## Demonstração móvel do redirecionamento

- [ ] Abrir o cardápio em largura de celular e exibir um botão interno de produto.
- [ ] Demonstrar o toque no botão e a abertura de `retirada.html` com o SKU do produto na URL.
- [ ] Confirmar que a demonstração não adiciona item, não envia pedido e não abre o WhatsApp.

## Exclusão restrita do sorvete Diet

- [x] Localizar o SKU Diet e remover o item exclusivamente do catálogo Peça e retire.
- [x] Preservar o cardápio principal, o cadastro mestre e a página de Encomendas.
- [x] Validar que o produto Diet não possa ser encontrado ou pedido na retirada.

## Complementação textual e lista de SKUs

- [x] Extrair do PDF apenas descrições, nomes e ingredientes, ignorando todos os preços do documento.
- [x] Vincular cada texto apenas ao SKU oficial correspondente, preservando preços e disponibilidade do site.
- [x] Gerar uma lista completa atualizada de SKUs para conferência em tela.
- [x] Registrar itens do PDF sem correspondência inequívoca para validação manual, sem criar texto ou SKU novo.

## Auditoria de SKUs sem descrição

- [x] Filtrar produtos que não possuem ingredientes ou texto descritivo no cadastro central.
- [x] Gerar e entregar a lista organizada por categoria para conferência.

## Visualização de ingredientes e seleção de sabores

- [x] Conferir no Peça e retire os SKUs que receberam ingredientes do PDF.
- [x] Padronizar os limites de sabores, contadores e confirmações para as taças alteradas.
- [x] Capturar e mostrar a demonstração móvel dos produtos alterados na tela.

## Regra geral do botão Peça e retire

- [x] Aplicar a exibição de ingredientes fixos para qualquer SKU que os possua.
- [x] Exigir seleção de sabores somente quando o SKU indicar sabores de sorvete.
- [x] Exibir limite, contador e bloqueio de confirmação até a seleção ficar válida.
- [x] Preservar regras especiais: picolés por estoque, caixas por bolas, milkshake até 2 sabores e tortas com 3 sabores.

## Confirmação humana após o pedido

- [x] Exibir antes do envio o aviso de ligação para confirmar o recebimento pelo WhatsApp da sorveteria.
- [x] Informar que, sem ligação nem resposta em até 15 minutos, a solicitação será cancelada.
- [x] Incluir a orientação no aceite e na mensagem enviada para o WhatsApp.
- [x] Destacar no formulário recebido pela sorveteria que a confirmação depende de ligação e resposta humana.
- [x] Determinar no formulário enviado que a ligação confirma itens, quantidades, sabores, alterações, retirada e pagamento antes da elaboração.

## Fluxo premium do Peça e retire

- [x] Pesquisar padrões de navegação, descoberta de produtos e checkout de plataformas de alimentos.
- [x] Simplificar a entrada por seções e orientar a pessoa durante a escolha de produtos.
- [x] Reforçar ações de voltar, continuar comprando, revisar pedido e seguir para a confirmação.
- [x] Preservar integralmente regras de sabores, estoque, retirada, embalagem e confirmação humana.
- [x] Validar a jornada completa no celular antes de publicar.

## Critérios para reduzir confusão

- [x] Reduzir escolhas simultâneas e apresentar somente a próxima decisão necessária.
- [x] Manter carrinho, retorno e continuidade sempre claros em todas as etapas.
- [x] Separar produtos por intenção de compra e não por campos técnicos do cadastro.

## Regras premium do pedido

- [x] Uma decisão por tela ou etapa: produto, sabor, modalidade, revisão e confirmação.
- [x] Categorias curtas, com nomes de compra compreensíveis e quantidade de produtos visível.
- [x] Regras e limites junto da escolha correspondente, não escondidos no final do formulário.
- [x] Carrinho persistente com quantidade, total e retorno para continuar comprando.
- [x] Revisão final sem surpresa, com alteração de quantidades e confirmação humana destacada.

## Teste móvel ao vivo

- [x] Abrir o domínio público em largura de celular.
- [x] Demonstrar as seções, a abertura de um produto e o carrinho sem enviar pedido.
- [x] Mostrar as telas da demonstração ao responsável.

## Compra simulada completa

- [x] Inventariar todos os produtos públicos e seus tipos de fluxo de escolha.
- [x] Simular a inclusão de cada produto no carrinho sem abrir ou enviar WhatsApp.
- [x] Conferir limites de sabores, estoque de picolés, embalagem, complementos, torta e totais.
- [x] Registrar falhas por SKU e repetir os testes após qualquer correção.

## Aba única de milk-shakes

- [x] Reunir Milkshake e Milk-shake de Açaí Natureon em uma única seção de pedidos.
- [x] Separar visualmente as opções tradicionais das combinações prontas de açaí dentro da mesma aba.
- [x] Preservar a escolha de até dois sabores no tradicional e a adição direta no de açaí.
- [x] Testar ambos os fluxos em celular antes de publicar.
- [x] Confirmar que os milk-shakes de Açaí Natureon não abram seleção de sabores.

## Barras de seção do catálogo

- [x] Usar barras de largura total e textos centralizados para cada seção, no computador e no celular.
- [x] Aplicar somente as cores institucionais já usadas no site nas barras de categoria.
- [x] Preservar as cores específicas apenas nos controles de seleção de sabores.
- [x] Replicar o padrão visual das barras de produtos da página inicial nos cabeçalhos do Peça e retire.

## Sete cores de separação visual

- [x] Identificar as cores funcionais já usadas em Encomendas e na página principal.
- [x] Atribuir uma cor única a cada uma das sete seções de produto, sem repetição.
- [x] Aplicar a mesma cor no cabeçalho e nos botões internos da respectiva seção.
- [x] Usar blocos neutros e contraste para manter preço, texto e ações legíveis.
- [x] Reutilizar as cores apenas como identificação dos blocos relacionados do formulário.
- [x] Fazer cada campo de produto herdar a cor da sua seção no cabeçalho, cartão e botão.

## Composição de cores para compra

- [x] Usar a barra da seção como identificação do grupo, com texto centralizado e contraste alto.
- [x] Usar botão em cor complementar e distinta da barra para indicar a única ação principal do produto.
- [x] Manter preço e disponibilidade em cores funcionais, sem competir com a ação de compra.
- [x] Validar que as divisões de produto sejam visualmente reconhecíveis no celular e no computador.

## Identificação por cor no formulário final

- [x] Separar visualmente dados, retirada, pagamento, regras e aceite com cores institucionais funcionais.
- [x] Manter a cor do botão final distinta dos blocos de identificação.
- [x] Validar a leitura e o contraste do formulário em celular e computador.

## Sequência lógica de produtos

- [x] Ordenar as seções pela facilidade de decisão e frequência de compra.
- [x] Apresentar itens simples antes dos produtos com escolhas, opções prontas e itens com antecedência.
- [x] Manter as categorias especiais claramente identificadas, sem ocultar produto ou regra de pedido.
- [x] Inserir em cada barra o ponto-chave de compra aplicável àquela seção.

## Taças Gourmet Açaí Natureon

- [ ] Identificar as quatro taças de 500 ml e preservar seus SKUs e preços atuais.
- [ ] Mover a apresentação para dentro da seção Açaí Natureon, após as combinações prontas.
- [ ] Exibir o grupo com o nome “Taças Gourmet Açaí Natureon” para evitar confusão.
- [ ] Validar a adição direta das quatro receitas, sem seleção de sabores.

## Confirmação humana simplificada

- [ ] Reduzir a repetição de regras no bloco final do formulário.
- [ ] Destacar ligação em até 15 minutos, conferência integral e cancelamento sem resposta.
- [ ] Preservar a regra de que nada é elaborado antes da confirmação e, em Pix, do pagamento confirmado.

## Registro de ciência no WhatsApp

- [x] Colocar no início da mensagem os dados e regras prioritárias para a sorveteria.
- [x] Registrar que o cliente marcou o aceite e foi informado sobre ligação, 15 minutos, sabores, alterações, retirada e pagamento.
- [x] Manter o resumo de itens e preços após o bloco prioritário, sem ocultar dados de execução.

## Validação sem erros no formulário

- [x] Validar cada campo no momento adequado, com mensagem curta junto ao erro.
- [x] Manter bloqueio de envio até dados, horário, pagamento e aceite estarem válidos.
- [x] Organizar a mensagem recebida pela sorveteria com resumo prioritário e registro de ciência do cliente.

## Formulário guiado com DDD 16

- [x] Exibir o prefixo fixo (16) no campo de telefone e aceitar somente o número do cliente.
- [x] Validar oito ou nove dígitos após o DDD antes de liberar a etapa seguinte.
- [x] Liberar dados, retirada, pagamento, observações e aceite na ordem de cima para baixo.
- [x] Manter o botão de envio cinza até todas as etapas ficarem válidas e pulsar somente o aceite pendente.
- [x] Rolar para a próxima etapa liberada e, ao final, para o botão de envio ativo.
- [x] Exibir uma instrução curta no bloco atualmente liberado e manter os demais em estado de espera legível.

## Auditoria de qualidade máxima do Peça e retire

- [ ] Avaliar a entrada do catálogo, seções, busca e orientação inicial.
- [ ] Avaliar escolha de produto, sabores, modalidades e prevenção de erro.
- [ ] Avaliar carrinho, quantidades, totais, retorno e revisão.
- [ ] Avaliar formulário, acessibilidade, validação progressiva e confirmação humana.
- [ ] Documentar recomendações priorizadas e implementar as melhorias de maior impacto.

## Responsividade do Açaí Natureon na página inicial

- [x] Revisar a escala da área em computador, sem deixar cartões e chamadas pequenos.
- [x] Revisar a escala da área em celular, sem ampliar demais texto, cartões ou botões.
- [x] Ajustar tipografia, espaçamento, grade e alvos de toque por breakpoint.
- [x] Confirmar que os links de pedido funcionam nas duas larguras de tela.

## Reteste em tela de computador — 22/08/2026

- [x] Abrir e fechar o modal visual Açaí Natureon em largura de 1280 px, conferindo escala e proporção.
- [x] Montar um pedido simples em Peça e retire em largura de 1280 px, confirmando carrinho, etapas e botão final.
- [x] Garantir que a simulação não abra WhatsApp nem envie pedido real.

## Caixas de sorvete — 5 e 10 litros no Peça e retire

- [x] Incluir as quatro caixas oficiais de 5 e 10 litros na seção de caixas do Peça e retire, identificadas pelo SKU.
- [x] Preservar preço, capacidade e regra de 2 ou 3 sabores de cada caixa.
- [x] Ajustar o campo Observações adicionais para orientar outros sabores ou até 4 substituições, sujeitos à confirmação humana.
- [x] Validar os cartões, a seleção de sabores e a mensagem simulada sem encaminhar pedido real.

## Consulta e encomenda — tortas e caixas de 5 e 10 litros

- [x] Manter as caixas grandes abaixo das caixas de 4, 7, 9 e 12 bolas.
- [x] Fazer Consultar disponibilidade abrir somente o WhatsApp, sem formulário, para tortas e caixas grandes.
- [x] Fazer Encomendar para 48 horas seguir para o formulário, exigindo data e horário com antecedência mínima de 48 horas.

## Destaque de tamanhos e bolas

- [x] Dar destaque visual prioritário ao tamanho do copo e à quantidade de bolas logo no primeiro olhar dos cartões do Peça e retire.
- [x] Reforçar tamanho e quantidade na etapa de escolha de sabores, com leitura confortável em celular e computador.
- [x] Aplicar padrão premium: selo de tamanho antes do nome, preço e botão, com contraste e leitura rápida.

## Milk-shakes — sabores e acompanhamentos

- [x] Permitir a escolha de um ou até dois dos 38 sabores de massa nos milk-shakes tradicionais.
- [x] Manter os milk-shakes de Açaí Natureon como receitas pré-montadas, sem seleção de sabores.
- [x] Informar e registrar no Peça e retire que o Milk-shake TOP inclui chantilly e Nutella.
- [x] Oferecer adicional opcional de Ovomaltine por R$ 3,00 em todos os milk-shakes tradicionais e TOP, sem oferecer esse adicional nos produtos de Açaí Natureon.
- [x] Validar cardápio, carrinho e mensagem simulada sem encaminhar pedido real.

## Copos recheados e cestinhas — coberturas e complementos

- [x] Oferecer cobertura de morango, chocolate ou as duas juntas apenas nos copos recheados e cestinhas.
- [x] Oferecer granulado de chocolate ao leite e canudinho wafer nas mesmas opções de produto.
- [x] Manter todas as escolhas opcionais e incluídas no preço final, sem adicionar taxa mesmo quando o cliente marcar os complementos.
- [x] Registrar as escolhas no carrinho e na mensagem de solicitação sem aplicar as opções a outros produtos.

## Total de picolés em tempo real

- [x] Mostrar a quantidade de picolés no pedido e o valor acumulado ao lado do total, atualizando após cada adição, remoção ou ajuste de quantidade.
- [x] Aplicar automaticamente o preço de atacado aos picolés quando a quantidade total atingir 100 unidades e retornar ao varejo abaixo desse limite.

## Alinhamento de rodapé dos cards

- [x] Fixar os botões de ação no rodapé visual de cada card para que fiquem alinhados entre colunas, independentemente da altura do conteúdo.
- [x] Manter o alinhamento e alvos de toque confortáveis em computador e celular.

## Auditoria global de responsividade e alinhamento

- [x] Pesquisar padrões de alinhamento, hierarquia e conversão em sites de alimentação de alto nível.
- [x] Revisar vertical e horizontalmente cards, botões, preços, títulos, grades e espaços das páginas principais.
- [x] Aplicar correções responsivas de alto impacto para celular e computador sem alterar regras comerciais.

## Reteste público após publicação

- [x] Confirmar a disponibilidade pública da página e da versão atual do script.
- [x] Retestar os fluxos principais publicados sem abrir WhatsApp nem enviar pedido real.

## Preferências de sabores — Opções 1, 2 e 3

- [x] Exigir uma combinação principal e duas alternativas diferentes da primeira, respeitando a quantidade de sabores do produto nos itens elegíveis de bolas e picolés.
- [x] Manter o mesmo valor do produto para todas as combinações e excluir açaí Natureon das preferências de sabor.
- [x] Manter uma única escolha para o grupo de picolés especiais, que contém Leite Ninho e Ovomaltine; definir as combinações dos outros tipos pelo catálogo oficial.
- [x] Bloquear a adição ao carrinho e a finalização até todas as combinações obrigatórias estarem preenchidas.
- [x] Registrar as preferências na revisão do carrinho e na mensagem de solicitação, sem troca automática de sabores.

## Reversão solicitada — seleção direta de sabores

- [x] Remover Opção 1, Opção 2 e Opção 3 dos diálogos, carrinho e mensagem de solicitação.
- [x] Restaurar a seleção direta de sabores com os limites originais de cada produto.
- [x] Manter apenas os selos grandes de tamanho e quantidade de bolas nos cartões.
- [x] Orientar substituições de sabores exclusivamente no campo Observações adicionais.

## Nomenclatura de picolés no Peça e retire

- [x] Mapear os SKUs existentes de picolé por tipo, preço e sabores cadastrados.
- [x] Definir os nomes exibidos para água/frutas, leite sem recheio, leite recheado, especiais e premium Eskimós.
- [x] Aplicar somente os nomes exibidos, sem modificar SKU, preço, estoque ou sabores.

## Migração global de SKUs e categorias de picolés

- [x] Atualizar SKUs e nomes em todos os lugares ativos do site para: Base Água & Frutas; AO LEITE Cremosos S/ Recheio; AO LEITE Cremosos Recheados; AO LEITE Especiais; AO LEITE Premium Eskimós.
- [x] Preservar preços, sabores, disponibilidade e estoque de cada item durante a migração.
- [x] Validar que catálogo, carrinho, mensagens e Encomendas usam os novos SKUs e categorias.

## Qualidade de nomenclatura das linhas de picolé

- [x] Pesquisar nomenclaturas de linhas de marcas de sorvetes e picolés para elevar a percepção de qualidade da Itapolitana.
- [x] Propor nomes curtos, claros e premium que separem base água/frutas, leite sem recheio, leite recheado, especiais e Eskimós.

## Padrão aprovado — linhas e SKUs de picolés

- [x] 1. Picolés Base Água & Frutas: `PIC-AG-001` a `PIC-AG-008`.
- [x] 2. Picolés AO LEITE Cremosos S/ Recheio: `PIC-CR-001` a `PIC-CR-004`.
- [x] 3. Picolés AO LEITE Cremosos Recheados: `PIC-REC-001` a `PIC-REC-012`.
- [x] 4. Picolés AO LEITE Especiais: `PIC-ESP-001` a `PIC-ESP-002`.
- [x] 5. Picolés AO LEITE Premium Eskimós: `PIC-PREM-ESKIMO-001` a `PIC-PREM-ESKIMO-008`.

- [x] Manter a apresentação em ordem crescente de preço: Base Água & Frutas, Cremosos S/ Recheio, Cremosos Recheados, Especiais e Premium Eskimós.

## Integridade da base de alimentos

- [x] Garantir que cada novo SKU de picolé seja único na base de alimentos do site.
- [x] Confirmar que a alteração de SKU deve ocorrer no cadastro mestre e em todos os lugares do site onde os picolés são usados.
- [ ] Basear o fluxo em seleção sequencial, rótulos claros de preferência, retorno visual imediato e mensagem curta de confirmação humana.

## Horário de Brasília e CNPJ

- [x] Calcular a antecedência mínima usando sempre o horário de Brasília.
- [x] Exibir aviso vermelho no campo de horário se a escolha tiver menos de uma hora de antecedência.
- [x] Impedir o envio enquanto o horário estiver abaixo do mínimo.
- [x] Localizar o CNPJ configurado e retirar sua exposição dos arquivos públicos.

## Pagamento por Pix

- [x] Verificar se existe chave Pix ou QR Code de cobrança confiável configurado para a sorveteria.
- [x] Cancelar a exibição de QR Code e comprovante por orientação da sorveteria.
- [x] Não criar, inventar ou publicar uma chave Pix que não tenha sido fornecida pela sorveteria.

## Pagamento presencial e proteção de dados

- [x] Remover Pix como opção do formulário de retirada.
- [x] Exibir somente pagamento presencial na loja após a confirmação humana.
- [x] Não exibir ou encaminhar o CNPJ no fluxo Peça e retire.
- [x] Preservar as demais áreas do site; a regra de pagamento presencial é exclusiva do Peça e retire.

## Retirada global de Pix

- [ ] Remover referências públicas a Pix da página inicial, FAQ e chatbot.
- [ ] Substituir instruções de pagamento antecipado por pagamento presencial após confirmação humana.
- [ ] Confirmar que nenhuma página pública exiba Pix, QR Code, chave Pix ou CNPJ.

## Infraestrutura GitHub e Cloudflare

- [ ] Inventariar a origem que publica `itapolitanacajuru.com.br` e corrigir o caminho de publicação de `retirada.html`.
- [ ] Revisar proteção da branch principal, permissões, alertas de dependências e histórico de implantação no GitHub.
- [ ] Revisar domínio, HTTPS, redirecionamentos, cache, cabeçalhos de segurança e páginas de erro no Cloudflare.
- [ ] Definir publicação previsível por ambiente, com validação antes de disponibilizar alterações ao público.
- [ ] Aplicar somente ajustes reversíveis que não alterem Encomendas, preços, SKUs ou as regras de confirmação manual.
- [ ] Validar o domínio público após cada alteração de infraestrutura e registrar o resultado da publicação.

## Acesso ao pedido de retirada

- [ ] Remover qualquer link público solto para `retirada.html` fora dos botões internos dos produtos do cardápio.
- [ ] Preservar nos botões internos o vínculo por SKU oficial para que cada produto abra o pedido correspondente.
- [ ] Validar que menus, hero, rodapé e páginas institucionais não exibam acesso direto à retirada.
