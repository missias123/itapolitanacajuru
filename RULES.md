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
- **Uma vez por dia**, se a campanha estiver ativa, o LED do robô exibe **"🍦 ENCONTRE UM PICOLÉ · CLIQUE AQUI"** durante uma janela de **exatos 5 segundos**.
- Nesse momento, o usuário deve **clicar no robô** — o servidor valida o primeiro clique e, se ainda não houver vencedor, abre automaticamente o **formulário exclusivo do Picolé**.
- O formulário solicita **nome completo** e **celular com DDD 16**, além dos aceites obrigatórios; a confirmação e o código de retirada são enviados pelo canal oficial informado no fluxo.
- A retirada é presencial na loja e não há delivery para este prêmio.
- Ao clicar no robô **fora do momento do LED de Picolé Grátis**, abrirá o formulário de **Dúvidas do ItaBot** — que é diferente.

### Regra obrigatória:
- O formulário de Dúvidas do ItaBot **deve sempre exibir um aviso destacado** (fundo amarelo com borda dourada) informando que Picolé Grátis é em outro formulário, para evitar que usuários enviem pedidos de picolé pelo canal errado.
- **Nunca remover ou ocultar esse aviso do campo "💬 Enviar mensagem direta via WhatsApp" no painel de Dúvidas.
- A comunicação de Dúvidas deve explicar que “Encontre um Picolé” usa outro formulário e só pode ser apresentada como oportunidade ativa quando o endpoint público estiver validado como HTTP 200 com JSON válido.
