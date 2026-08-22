# Validação — formulário guiado com DDD 16

**Data:** 22/08/2026  
**Escopo:** fluxo de retirada em celular, sem abrir WhatsApp ou enviar solicitação real.

| Verificação | Resultado | Evidência |
|---|---|---|
| Estado inicial | Aprovado | Somente a etapa 1 fica ativa; as etapas 2 a 5 ficam bloqueadas e o envio permanece cinza. |
| Identificação | Aprovado | Nome e número local válido liberam a retirada; o telefone exibe `99999-1234`, com `(16)` fixo apresentado fora do campo. |
| Liberação sequencial | Aprovado | Retirada, pagamento presencial, observações e aceite são desbloqueados na ordem definida. |
| Aceite | Aprovado | O aceite só fica disponível ao final e a ação de envio continua bloqueada até ser marcado. |
| Envio | Aprovado | Após o aceite, o botão passa a exibir “Enviar solicitação para confirmação no WhatsApp”. |
| Mensagem simulada | Aprovado | A captura do destino confirmou telefone em `(16) 99999-1234`, pagamento presencial e o registro do aceite. Não havia Pix ou CNPJ. |
| Segurança do teste | Aprovado | Nenhuma janela do WhatsApp foi aberta e nenhum pagamento foi realizado. |

A captura `demonstracao-mobile-formulario-guiado-ddd16.png` confirma a última etapa em largura de 390 px: textos legíveis, confirmação humana destacada, aceite marcado e botão final ativo. O teste interceptou somente a URL que seria aberta, sem executar a abertura do WhatsApp.
