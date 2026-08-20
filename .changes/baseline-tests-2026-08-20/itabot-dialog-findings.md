# Baseline do itaBot — 20/08/2026

## Abertura
O clique em `#itabot-launcher` abre o painel HTML de dúvidas com conteúdo válido (`ITABOT · DÚVIDAS`, temas e respostas). Isso confirma que o launcher oficial está conectado ao destino correto.

## Defeito encontrado antes da limpeza
Depois de um único clique, existem dois elementos visíveis com a mesma interface: o wrapper `#chat-dialog.itabot-fullscreen-mode.aberto` e um filho `.chat-box.itabot-fullscreen-box[role="dialog"]`. O segundo elemento é o conteúdo do primeiro e não parece ser um segundo painel independente, mas os testes de contagem devem distinguir wrapper de conteúdo para não marcar falso positivo. A validação visual deverá confirmar que não há dois overlays sobrepostos.

## Conclusão
O fluxo abre, mas a auditoria funcional deve testar o fechamento, o campo de pergunta e uma segunda abertura para confirmar que não há duplicação acumulativa. Nenhuma remoção deve ser publicada antes dessa verificação.

## Fontes
Resultados salvos em `console_outputs/exec_result_2026-08-20_17-13-15_659.txt` e `console_outputs/exec_result_2026-08-20_17-13-27_501.txt`.

## Falha durante teste de ciclo
O teste automatizado de fechamento/reabertura foi interrompido com `Page.evaluate: Inspected target navigated or closed`. A página retornou à home local e permaneceu carregada, mas o acionamento do fechamento causou uma navegação/recarregamento inesperado ou invalidação do contexto do navegador. Isso deve ser reproduzido por um teste isolado antes de qualquer publicação ou remoção.

A captura posterior mostrou a home carregada; o robô aparece no canto inferior direito e o painel LED permanece presente.
