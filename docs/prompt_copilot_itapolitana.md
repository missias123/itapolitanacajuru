# Prompt Mestre para o Copilot — Manutenção e Evolução da Sorveteria Itapolitana Cajuru

Este documento serve como referência definitiva e prompt estruturado para o GitHub Copilot ou qualquer IA que venha a dar manutenção no repositório `missias123/itapolitanacajuru`.

---

## 🎯 Objetivo e Diretrizes do Projeto

O site da **Sorveteria Itapolitana Cajuru** (`itapolitanacajuru.com.br`) opera sob uma política de qualidade contínua **(Score ≥ 90/100, zero erros críticos, zero alertas CodeQL)**. Qualquer alteração deve respeitar estritamente a arquitetura existente, evitando regressões.

---

## 🛠️ Arquitetura Técnica Atual

1. **Frontend**: HTML5, CSS3, e JavaScript Vanilla estruturados em páginas estáticas otimizadas (`index.html`, `promocao.html`, `encomendas.html`, `admin-painel.html`).
2. **Backend & API**: Cloudflare Workers (`cloudflare-worker/src/index.js`) conectado ao Cloudflare KV Storage para gerenciamento de inscrições e assinantes.
3. **Domínio Oficial**: `api.itapolitanacajuru.com.br` (Worker) e `itapolitanacajuru.com.br` (Frontend).
4. **Segurança e Validação**:
   - Validação estrita de **DDD 16** em todos os formulários e rotas de API.
   - Inscrição mensal única por pessoa (bloqueio de duplicatas no ciclo vigente, com reativação após exclusão pelo admin).
   - Rate limit ativo no Worker para proteção contra spam e ataques DDoS.

---

## 📋 Funcionalidades Críticas (NÃO REMOVER OU QUEBRAR)

1. **Ita Bot (Bot de Dúvidas)**:
   - Inicializado via script modular (`scripts/ita-bot-widget.js` e `scripts/ita-bot-engine.js`).
   - Botão no topo (`#ita-bot-duvidas`) possui prioridade visual máxima (`z-index: 9999999`) e clique direto (`onclick`).
2. **Promoção Mensal e Cronômetro**:
   - O cronômetro zera obrigatoriamente todo dia 01 às 00:01, iniciando o ciclo mensal.
   - O formulário utiliza revelação progressiva (*Progressive Disclosure*): as regras aparecem ao clicar nos botões, e o formulário só é liberado após o aceite dos termos.
   - Confirmação de cadastro envia link direto para o WhatsApp oficial da sorveteria (`16996062046`) contendo um **ID de Inscrição Único**.
3. **Painel Administrativo (`admin-painel.html`)**:
   - Permite listar, filtrar e deletar inscritos individualmente ou em lote mensal.
   - Exclusão libera o usuário para nova inscrição no mês seguinte.

---

## ⚠️ Regras para o Copilot ao Alterar o Código

- **Nunca introduza dependências externas pesadas** em JavaScript (mantenha Vanilla JS para velocidade e pontuação 100/100).
- **Sempre valide o DDD 16** em qualquer input de telefone do site.
- **Respeite a API unificada**: Utilize sempre `https://api.itapolitanacajuru.com.br` nas chamadas `fetch`.
- **Garanta o CodeQL limpo**: Evite Regex constantes vulneráveis, injeções de HTML (`innerHTML` sem sanitização) e variáveis globais não tratadas.
