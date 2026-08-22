# Validação do formulário protegido — 22/08/2026

## Escopo

O Peça e retire foi validado em sessão móvel isolada. O teste não abriu WhatsApp, não enviou solicitação, não processou pagamento e não criou cobrança.

## Resultado

| Regra | Resultado |
|---|---|
| Pagamento | Exclusivamente presencial na loja, após confirmação humana |
| Pix, QR Code e chave de pagamento na retirada | Não exibidos |
| CNPJ na retirada e na mensagem do pedido | Não exibido |
| Horário de retirada | Calculado no horário de Brasília |
| Antecedência mínima | Uma hora, com arredondamento para o próximo intervalo de 15 minutos |
| Escolha abaixo do mínimo | Campo destacado em vermelho com orientação do próximo horário válido |
| Mensagem para a sorveteria | Inclui resumo prioritário, aceite do cliente, prazo de 15 minutos e pagamento presencial |

## Cenário executado

No momento do teste, o primeiro horário permitido era 14:00 no horário de Brasília. A escolha manual de 11:00 foi bloqueada com o aviso vermelho. A escolha de 14:00 foi aceita. A mensagem simulada continha o resumo prioritário e o aceite do cliente, sem CNPJ ou Pix.
