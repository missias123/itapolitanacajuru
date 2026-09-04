# 📜 Regras de Ouro - Itapolitana Cajuru

Este documento estabelece as regras obrigatórias para qualquer alteração no site, visando manter o padrão **World Class**.

## 1. Regra de Sincronização Obrigatória
> **"Antes de qualquer envio (push) ou publicação, o site DEVE estar sincronizado."**

Isso inclui:
- **Admin**: Todas as alterações feitas no painel devem refletir nos arquivos JSON locais.
- **GitHub**: O código local deve ser auditado antes de ser enviado ao repositório.
- **Cloudflare**: A integridade das rotas e bindings deve ser verificada.

## 2. Regra de Responsividade Mobile
- O cabeçalho mobile deve seguir o layout **1 (Feedback) + 2x2 (Outros botões)**.
- A altura dos botões no topo para celular deve ser mantida no limite compacto (**54px a 60px**).
- Todos os alvos de toque devem ser fáceis de clicar, mas sem desperdício de espaço vertical.

## 3. Regra do ItaBot 3D
- O robô deve ser mantido em **3D transparente**, flutuando como um "fantasma".
- O **visor LED** deve alternar entre expressões e mensagens.
- **Cores do LED**: Fundo vermelho com letras brancas (contorno preto) somente durante mensagens; fundo preto original nos demais momentos.

## 4. Automação de Auditoria
Sempre execute os gates antes de enviar alterações:
```bash
node scripts/quality-audit.js --fail
node scripts/dependency-audit.js
node scripts/admin-espelho-gate.js
node scripts/auditoria-semanal.js --ci
```
A rotina semanal também executa `node scripts/auto-corrigir-regras.js --check`, que detecta divergências determinísticas sem escrever, publicar ou alterar dados. Nenhum corretor pode modificar secrets, JSON de clientes/pedidos, reservas, bindings ou campanha ativa automaticamente. Falhas críticas bloqueiam o merge/publicação; correções seguras devem ser feitas em branch isolado, com backup, testes e rollback.

## 4.1 Critérios mínimos de qualidade
- O coletor deve verificar integridade de arquivos, sintaxe JavaScript, dependências locais, espelho Admin ↔ Site, exposição de tokens, rotas públicas, headers de segurança, mixed content e o endpoint promocional.
- Deve haver evidência JSON/Markdown por execução, com timestamp, URL, status, severidade, resultado e indicação explícita de que não houve mutação.
- A validação automatizada deve ser complementada por inspeção visual e testes manuais nos viewports 390, 430, 768 e 1280px.
- O deploy deve usar branch protegida, pull request, checks com nomes únicos e caminho de rollback. A versão do Worker deve ser validada separadamente de KV, Durable Objects e secrets.

## 5. Regra do Formulário de Picolé Grátis

> **O formulário de Picolé Grátis é SEPARADO do formulário de Dúvidas do ItaBot. São dois formulários diferentes.**

### Como funciona:
- **Todos os dias do ciclo mensal**, se a campanha estiver activa, um **robô-clone independente** do ItaBot de Dúvidas pode aparecer em qualquer página. O clone exibe no LED **"🍦 CLIQUE E GANHE UM PICOLÉ"** durante uma janela de **exactos 5 segundos**.
- O horário diário é sorteado e controlado pelo servidor, usando o fuso de Brasília. O horário exacto não pode repetir-se dentro do ciclo mensal; o navegador não pode calcular, alterar ou antecipar a janela.
- O clone aceita **apenas o primeiro clique** da janela. Depois do clique ou dos 5 segundos, ele desaparece e não altera, move, redimensiona, bloqueia ou desactiva o ItaBot principal.
- O primeiro clique válido abre exclusivamente o **formulário de Ganhe um Picolé**. Fora da janela, o clone não deve aparecer nem interceptar cliques do ItaBot de Dúvidas.
- O formulário solicita nome completo, data de nascimento e celular com DDD 16, além dos aceites obrigatórios. A participação é exclusiva para pessoas com **18 anos ou mais**; menores devem ser recusados antes de qualquer armazenamento.
- A retirada é presencial na loja, sem delivery, às segundas, quartas ou sextas, com horário marcado e conferência presencial de documento de identificação. Não guardar número, fotografia ou cópia do documento.
- O cadastro confirmado não é uma promessa de vitória. A mensagem de sucesso só pode ser exibida após confirmação real do servidor, com idempotência e sem duplicação de vencedor.
- Ao clicar no ItaBot principal, fora do clone promocional, deve abrir apenas o formulário de **Dúvidas do ItaBot**, que é diferente.

### Regra obrigatória:
- O formulário de Dúvidas do ItaBot **deve sempre exibir um aviso destacado** (fundo amarelo com borda dourada) informando que Picolé Grátis é em outro formulário, para evitar que usuários enviem pedidos de picolé pelo canal errado.
- **Nunca remover ou ocultar esse aviso do campo "💬 Enviar mensagem direta via WhatsApp" no painel de Dúvidas.
- A comunicação de Dúvidas deve explicar que “Encontre um Picolé” usa outro formulário e só pode ser apresentada como oportunidade ativa quando o endpoint público estiver validado como HTTP 200 com JSON válido, `status: ativo`, `campaign_active: true`, `activation_explicit: true`, `paused: false`, `schedule_created: true` e `safeToAnnounce: true`.
- A criação/ativação de campanha é exclusivamente administrativa e autenticada. O GET público de status e a auditoria semanal são somente leitura: não podem criar campanha, gerar horários, expirar dia, reservar prêmio ou alterar estado.
- O ciclo mensal usa um **horário exacto diferente por dia** dentro da faixa administrativa definida para a campanha; a hora/minuto/segundo sorteados não podem repetir-se no ciclo. Não interpretar a regra como autorização para o cliente escolher o horário ou para o navegador gerar o calendário.

## 6. Regra de Escalonamento para o Copilot

Quando um problema for detectado e não puder ser corrigido com segurança, não inventar uma solução, não mascarar a falha e não declarar sucesso. Registrar o motivo comprovado do bloqueio e entregar um prompt específico, pronto para uso no GitHub Copilot, contendo:

- o arquivo e a linha ou trecho afectado;
- a reprodução factual do problema;
- a causa confirmada ou, se não confirmada, a indicação expressa de que a causa não foi determinada;
- a alteração esperada, sem inventar dados comerciais;
- os testes obrigatórios e o critério de aceite;
- os limites de segurança, privacidade e não mutação em produção;
- a classificação final como corrigido, pendente, bloqueado ou não verificável.

O prompt para o Copilot deve orientar execução em branch isolada, com backup, testes, PR e prova de publicação quando aplicável. Nenhum item pode ser marcado como corrigido sem alteração real e evidência correspondente.
