# Reteste em computador — Açaí Natureon e Peça e retire

**Data:** 22/08/2026  
**Ambiente:** versão pública em tela de computador `1280 × 900 px`.  
**Segurança:** a solicitação foi interceptada no teste; não houve abertura de WhatsApp nem pedido real.

| Área testada | Resultado | Evidência observada |
|---|---|---|
| Modal Açaí Natureon | Aprovado | Em largura de 1280 px, a arte mantém proporção, ocupa uma área de leitura confortável e não invade o cabeçalho. O botão **Fechar** permanece claramente visível no canto superior direito e foi acionado com fechamento confirmado. |
| Carrinho de retirada | Aprovado | Foi adicionado um produto pré-montado ao carrinho e o resumo passou a indicar um item, sem falha de carregamento. |
| Formulário guiado | Aprovado | No início, apenas a primeira etapa estava liberada. Ao preencher o fluxo, as cinco etapas ficaram disponíveis e o botão final passou de bloqueado para ativo. |
| DDD e pagamento | Aprovado | O formulário mostrou o prefixo fixo `(16)`; a mensagem interceptada continha pagamento presencial na loja. |
| Proteção do teste | Aprovado | A URL do WhatsApp foi apenas capturada para inspeção. Nenhuma janela do WhatsApp foi aberta. |

As capturas `demonstracao-desktop-acai-natureon-responsivo.png` e `demonstracao-desktop-formulario-guiado-ddd16.png` documentam a aparência observada. O formulário no computador mantém modal central, leitura em largura confortável e botão de envio visível ao término do fluxo.
