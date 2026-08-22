# Relatório de Auditoria de Botões e Jornadas

**Data:** 22/08/2026
**Escopo:** páginas públicas, cardápio, Peça e retire, Encomendas, modal Açaí Natureon e carrinhos.
**Regra de segurança:** nenhum teste abriu WhatsApp, enviou pedido, realizou pagamento, salvou ou excluiu dados administrativos.

## Resultado executivo

A auditoria inventariou **494 controles visíveis em 13 páginas**. Dos controles com links, foram verificados **122 destinos internos**, todos com resposta HTTP válida. Os **109 links de produto** que direcionam para `retirada.html?sku=` apontam para SKUs ativos no cadastro mestre.

| Área auditada | Evidência | Resultado |
|---|---:|---|
| Controles públicos | 494 | Inventariados |
| Destinos internos | 122 | 0 destinos quebrados |
| Links de SKU para retirada | 109 | 0 SKUs inativos ou ausentes |
| Regressão automatizada | 19 testes | Todos aprovados |
| Retorno de picolé no desktop | 1280×900 | diferença de rolagem: 0 px |
| Retorno de picolé no celular | 375×812 | diferença de rolagem: 0 px |
| Modal Açaí Natureon no celular | 375×812 | 12 páginas renderizadas; foco retornou ao gatilho |

## Jornada humana verificada

O fluxo prioritário foi a continuidade após adicionar um produto. Ao abrir o carrinho a partir de um picolé, o sistema registra a posição vertical e o deslocamento do cartão acionado. Ao escolher **Continuar comprando**, o carrinho é fechado, a rolagem é restaurada suavemente e o foco retorna ao botão do último produto, sem reposicionar a pessoa no início do catálogo.

As jornadas de seleção direta de sabores também foram retestadas. Produtos por bolas usam os controles de quantidade até completar o total exigido; caixas grandes preservam a escolha de dois ou três sabores; o grupo de picolés especiais mantém uma única escolha; e milk-shakes tradicionais permitem até dois sabores, com Ovomaltine opcional. As combinações prontas de Açaí Natureon permanecem sem etapa de sabores.

| Fluxo seguro | Critério confirmado |
|---|---|
| Picolés | Total visível; atacado automático a partir de 100 unidades; retorno ao último ponto de compra |
| Caixas 5 L e 10 L | Consulta interceptada em teste; encomenda de 48 horas exige data mínima e mantém a embalagem incluída |
| Copo recheado e cestinha | Coberturas e complementos opcionais registrados sem alterar o preço |
| Formulário de retirada | DDD 16, pagamento presencial, horário de Brasília e aceite humano mantidos |
| Encomendas | Abertura e fechamento do lote de picolés preservam a posição testada |
| Açaí Natureon | Modal abre, renderiza as 12 páginas e devolve o foco ao elemento acionador |

## Correção aplicada

Foi consolidada a correção de contexto no **Peça e retire**. Antes de abrir uma escolha de produto ou o carrinho, o catálogo captura a posição atual. Depois de fechar a revisão, a página restaura essa posição com rolagem suave e foco sem deslocamento. A correção cobre produtos comuns, grupos de picolés e o resumo do carrinho.

O processo também atualizou testes que ainda procuravam as antigas abas de “Opção 1, 2 e 3”. O fluxo atual usa seleção direta, conforme a regra aprovada, e a suíte foi ajustada para validar a distribuição de bolas pelos controles `+` e `−`.

## Limites da auditoria

Os botões administrativos foram apenas inventariados e tiveram seus destinos conferidos. Nenhuma ação de salvar, excluir, limpar carrinho administrativo ou alterar disponibilidade foi executada. Da mesma forma, links externos de WhatsApp foram interceptados dentro das sessões de teste, sem envio de mensagem.

## Arquivos de evidência

| Arquivo | Conteúdo |
|---|---|
| `inventario-botoes-site.json` | Inventário dos controles públicos |
| `resultado-destinos-clicaveis-publicos.json` | Resposta dos destinos internos |
| `resultado-links-sku-catalogo.json` | Conformidade dos links de SKU |
| `resultado-suite-regressao.log` | Execução dos 19 testes |
| `testar-retorno-ultima-compra.mjs` | Retorno ao último picolé em desktop e celular |
| `testar-modal-acai-natureon.mjs` | Abertura, fechamento e foco do modal de Açaí |

> A publicação deve manter o cache-busting atual de `retirada.html`, para que o navegador carregue o controlador com a correção de continuidade.
