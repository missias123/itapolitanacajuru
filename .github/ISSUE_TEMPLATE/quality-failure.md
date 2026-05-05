---
name: "🚨 Quality Check Falhou"
about: Issue criada automaticamente quando o workflow de qualidade detecta erros
title: "🚨 Quality Check falhou — branch: [BRANCH] ([SHA])"
labels: ["quality-failure", "bug"]
assignees: []
---

## 🚨 Falha no Quality Check Automático

**Data:** [DATA]
**Branch:** `[BRANCH]`
**Commit:** `[SHA]`
**Disparado por:** @[ACTOR]

### 🔗 Logs do Workflow
👉 [Ver logs completos aqui]([URL_DO_WORKFLOW])

### 📋 O que pode ter falhado
O workflow de qualidade detectou um ou mais problemas:
- ❌ Erros de sintaxe JavaScript em scripts inline ou em `scripts/*.js`
- ⚠️ Problemas de HTML (HTMLHint) em páginas principais
- 🔒 Token exposto no código
- 📁 Arquivo crítico ausente
- 🗃️ JSON inválido em `dados/`

### 🤖 Instruções para o Copilot

> **Copilot:** use este Issue para localizar e corrigir os erros nesta branch.
>
> **Regras obrigatórias:**
> 1. **Não truncar** arquivos grandes (ex.: `index.html`, `fidelidade.html`).
> 2. **Não remover** seções importantes (hero, cardápio, fidelidade, promoções, encomendas, footer).
> 3. **Não inventar** regras de negócio. Se faltar informação, marcar com `// TODO: definir com o proprietário`.
> 4. Manter o site **responsivo** em mobile, tablet e desktop.
> 5. Comentar mudanças com prefixos: `// SEO:`, `// Perf:`, `// A11y:`, `// Segurança:`, `// Fidelidade:`.
>
> **Passos:**
> 1. Leia os logs do workflow (link acima).
> 2. Abra os arquivos indicados nos erros.
> 3. Corrija os erros de lint/sintaxe sem alterar lógica de negócio.
> 4. No final, liste os arquivos alterados e como testar.

---
_Issue criada automaticamente pelo workflow `create-issue-on-failure.yml`._
