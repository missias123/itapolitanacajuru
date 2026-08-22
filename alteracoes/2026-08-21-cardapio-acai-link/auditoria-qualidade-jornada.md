# Auditoria de qualidade da jornada Peça e retire

## Escopo avaliado

A auditoria percorreu a entrada do catálogo, a busca e os atalhos de seção, a escolha de produto, a configuração de sabores e modalidade, o carrinho editável, o formulário de retirada e a confirmação humana pelo WhatsApp.

## Controles já presentes

| Etapa | Controle existente | Avaliação |
|---|---|---|
| Catálogo | Busca, atalhos de seção, cores por campo e indicação de quantidade | Mantido |
| Produto | Regras de sabores, recipiente, consumo/viagem e estoque | Mantido |
| Carrinho | Quantidade, exclusão, total detalhado e retorno ao catálogo | Mantido |
| Retirada | Horário de Brasília, antecedência mínima e regra de torta | Mantido |
| Confirmação | Aceite, chamada telefônica, cancelamento em 15 minutos e pagamento presencial | Mantido |

## Melhorias prioritárias

| Prioridade | Melhoria | Motivo |
|---|---|---|
| Alta | Formulário com etapas desbloqueadas de cima para baixo | Evita a pessoa preencher campos fora de ordem e reduz erros na confirmação |
| Alta | DDD 16 fixo no telefone | Elimina a principal variação inválida do contato e deixa o preenchimento menor |
| Alta | Botão final cinza até todas as condições serem válidas | Deixa claro que ainda existe uma ação pendente |
| Alta | Aceite pulsante apenas enquanto estiver pendente | Direciona a última ação obrigatória sem competir com campos já concluídos |
| Média | Instrução curta no bloco ativo e estado de espera nos demais | Diminui a carga de leitura e organiza o avanço no celular |
| Média | Rolagem guiada ao liberar a próxima etapa | Mantém a pessoa na sequência correta sem exigir busca manual |
| Média | Foco acessível e mensagens em texto além da cor | Melhora navegação por teclado, leitor de tela e compreensão de erros |

## Critério de qualidade

O padrão adotado é: **uma decisão por vez, campo válido antes de avançar, erro explicado no próprio contexto, carrinho editável antes do envio e confirmação humana explicitamente registrada**. As cores identificam grupos, mas texto, ícones, rótulos e estados mantêm a compreensão mesmo sem depender apenas de cor.
