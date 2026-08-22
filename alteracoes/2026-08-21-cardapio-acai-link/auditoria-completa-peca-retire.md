# Auditoria completa — Peça e retire

## Escopo

| Fluxo | Critério de auditoria | Situação inicial |
|---|---|---|
| Horário e botões | Abrir no horário de retirada e explicar indisponibilidade fora dele | Validado após correção |
| Catálogo e busca | Exibir apenas produtos vendáveis, com atalhos e SKU de origem | Validado por renderização e SKU destacado |
| Sabores de massa | Abrir modal, respeitar regras por produto e indisponibilidade | Validado em produto de uma bola e controles por quantidade |
| Caixas por bolas | Somar exatamente as bolas, viagem obrigatória e complementos | Validado em caixa de 12 bolas |
| Picolés | Agrupar sabores, respeitar estoque e aplicar varejo/atacado | Validado em grupo de oito sabores, com estoque de 50 unidades |
| Milkshakes | Permitir um ou dois sabores e informar extras Top | Validado com dois sabores e embalagem de viagem |
| Torta de sorvete | Mostrar pronta entrega ou produção de 48 horas com data condicional | Validado com três sabores e prazo de 48 horas |
| Carrinho | Aumentar, reduzir, excluir, atualizar produto, embalagem, complemento e total | Validado em cenários isolados, com total zerado após exclusão |
| Formulário | Validar DDD 16, prazo de uma hora, tortas, pagamento e aceite | Revisado no controlador; envio externo não foi acionado na auditoria |
| WhatsApp | Gerar resumo com SKUs, sabores, complementos, embalagem e confirmação manual | Revisado no gerador de mensagem; envio externo não foi acionado |
| Visual e responsividade | Usar o padrão de Encomendas e manter leitura em celular e computador | Validado em 375 × 812 e 1280 × 900 |

## Falha já identificada

Os botões dinâmicos de **Escolher sabores** eram renderizados desabilitados fora da janela de retirada. Isso impede o clique que deveria exibir o aviso de horário, contrariando a regra de informar claramente a indisponibilidade ao cliente.

## Diagnóstico de horário

No horário real da auditoria (03h14 UTC), a regra central classificou a retirada como fechada e os 37 botões de **Escolher sabores** estavam desabilitados. Em uma simulação isolada de 14h00, a regra abriu corretamente, os botões foram habilitados e o primeiro modal de sabores foi aberto. Portanto, a disponibilidade por horário funciona, mas o estado fechado precisa preservar a possibilidade de explicar o motivo do bloqueio sem deixar apenas um botão cinza inerte.

## Teste de produto de massa

Foi testado o fluxo de uma bola com recipiente. O sistema exigiu, na ordem correta, recipiente, distribuição de um sabor e modo de recebimento. Com a opção de viagem, o carrinho registrou Copo recheado, um sabor, recipiente copo, `EMB-VIAGEM`, taxa de R$ 1,00 e total de R$ 11,00. Nenhuma falha foi identificada nesse caminho.

## Observação sobre o teste de picolés

O modal de um grupo de picolés abriu com oito sabores e controles de quantidade. A primeira tentativa de isolamento revelou que a remoção direta da chave de armazenamento não atualiza o estado de memória da página já carregada; por isso, os demais cenários serão sempre iniciados com limpeza seguida de recarga da prévia.

Após a recarga, o teste isolado confirmou que o grupo de picolés abriu com oito sabores. O primeiro sabor foi incluído no carrinho com uma unidade e estoque individual de 50 unidades.

Antes desse teste, a chave do carrinho foi removida e a página foi recarregada, confirmando que o cenário isolado começou sem itens persistidos.

## Teste de milkshake

O milkshake tradicional aceitou dois sabores (Chocolate e Morango), exigiu a escolha de modo de recebimento e registrou a embalagem `EMB-VIAGEM` no carrinho. O limite de dois sabores e a inclusão no carrinho funcionaram conforme a regra.

## Teste de torta de sorvete

O modal iniciou corretamente com duas opções de torta e bloqueou a adição até a escolha do caminho. No cenário de produção, aceitou três sabores, exigiu viagem, adicionou `EMB-VIAGEM` e exibiu o campo de data. A data mínima calculada foi 24/08/2026 para o relógio de teste em 22/08/2026 às 14h00, respeitando 48 horas.

## Correções aplicadas durante a auditoria

Os botões de produtos agora deixam de ficar cinza e inertes fora do horário. Eles exibem o texto **Ver horário de retirada**, permanecem clicáveis e mostram o aviso com a janela de 11h00 às 20h00. O fluxo aberto continua funcionando no horário simulado.

A base visual foi alinhada à linguagem de Encomendas: fonte Inter, superfície cinza clara, cartões brancos, vermelho institucional como ação principal, azul para caixas, roxo para picolés, verde para confirmação e amarelo para foco de teclado.

O controlador atualiza o catálogo pelo evento `itap:horario-pedidos-atualizado`. A simulação inicial usou outro nome de evento e não re-renderizou os botões; a validação foi ajustada para usar o evento correto.

A função central `estaAberto` é imutável por projeto. Para testar a abertura sem alterar a regra real, o cenário de auditoria precisa simular temporariamente o relógio do navegador.

Com o relógio da prévia simulado em 14h00, os botões deixaram o estado `is-order-closed`, exibiram seus rótulos corretos e abriram o modal de escolha de recipiente/sabores. A regra real continua bloqueando pedidos fora da janela operacional.

O relógio real do navegador foi restaurado ao final do teste e os botões voltaram ao aviso de horário, sem modificar a regra operacional do site.

## Revisão responsiva após as correções

As capturas de 375 × 812 e 1280 × 900 confirmaram que o cabeçalho, a introdução, os avisos, a busca, a navegação horizontal e os cartões iniciais permanecem legíveis e sem sobreposição. A nova base usa Inter, fundo cinza claro, cartões brancos e o vermelho institucional de Encomendas na hierarquia dos títulos e ações.

## Conclusão da auditoria

Não foram identificados erros de sintaxe no controlador ou no HTML após as correções. O único erro funcional encontrado na auditoria foi o estado cinza e inerte dos botões fora do horário; ele foi substituído por uma ação clicável que explica a indisponibilidade. A auditoria não enviou nenhuma mensagem real ao WhatsApp nem acionou produção, pagamento ou confirmação automática.
