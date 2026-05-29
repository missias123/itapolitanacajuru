# 🔄 Fluxo de Correções Automáticas

> Documento descrevendo o ecossistema de auditoria automática + integração com IA para o site da Sorveteria Itapolitana Cajuru.

---

## Visão Geral

O site conta com **3 grandes camadas de verificação automática**, todas rodando via GitHub Actions sem precisar de servidor externo. Qualquer falha gera automaticamente um **Issue com instruções prontas para IA** (Copilot, Claude, GPT).

```
Push/PR/Schedule
      │
      ├── 🧹 Lint (ESLint + HTMLHint)
      │       └─ Falhou? → Issue com logs + prompt IA
      │
      ├── 🎭 E2E Playwright
      │       └─ Falhou? → Issue com relatório + prompt IA
      │
      └── 🔦 Lighthouse / Axe
              └─ Score crítico? → Issue com relatório + prompt IA
```

---

## 1. 🧹 Lint — ESLint / HTMLHint

**Workflow:** `.github/workflows/quality-check.yml`  
**Trigger:** A cada `push` e `pull_request` para `main`, + diário às 03:00 UTC  
**O que verifica:**

| Ferramenta | Arquivos | O que pega |
|------------|----------|------------|
| ESLint | `scripts/*.js` | Erros JS: variáveis não definidas, eval, debugger, erros de sintaxe |
| HTMLHint | `*.html` principais | Erros HTML: tags não fechadas, IDs duplicados, atributos obrigatórios faltando |
| Segurança | `*.html`, `*.js` | Tokens GitHub hardcoded (ghp_, github_pat_) |
| Tamanho | `index.html`, etc. | Páginas acima de 500KB (alerta de performance) |
| JSON | `dados/*.json` | JSON mal formatado nos dados críticos |

---

## 2. 🎭 Testes E2E — Playwright

**Workflow:** `.github/workflows/e2e-tests.yml`  
**Trigger:** A cada `push` e `pull_request` para `main`, + diário às 02:00 UTC  
**O que verifica:**

| Arquivo de Teste | O que testa |
|------------------|-------------|
| `01-paginas-basicas.spec.js` | Carregamento sem erros JS, elementos principais visíveis |
| `02-botoes-navegacao.spec.js` | Clique nos botões do header, links WhatsApp, hero |
| `03-formularios.spec.js` | Validação de campos obrigatórios, banner LGPD/cookies |
| `04-fidelidade.spec.js` | Wizard de fidelidade, campo celular, botão "Validar Código" |
| `06-itabot.spec.js` | Ita Bot abre/fecha, input de mensagem, sugestões rápidas |
| `07-pwa.spec.js` | manifest.json, service worker, offline.html, apple-touch-icon |

**Relatórios gerados:**
- `docs/relatorios/playwright-results.json` — dados estruturados
- `docs/relatorios/playwright-html/` — relatório visual HTML
- Artefatos no GitHub Actions (retidos por 7 dias)

---

## 3. 🔦 Auditoria Lighthouse / Axe

**Workflow:** `.github/workflows/lighthouse-audit.yml`  
**Trigger:** A cada `push` para `main`, + diário às 04:00 UTC  
**O que verifica:**

| Categoria | Threshold crítico | O que significa |
|-----------|-------------------|-----------------|
| Performance | < 50 → ❌ crítico | Velocidade de carregamento |
| Accessibility | < 50 → ❌ crítico | Acessibilidade (A11y) |
| Best Practices | < 50 → ❌ crítico | Boas práticas web |
| SEO | < 50 → ❌ crítico | Otimização para busca |
| PWA | < 50 → ⚠️ aviso | Progressive Web App |

**Páginas auditadas:** `index.html`, ``, `encomendas.html`

**Relatórios gerados:**
- `docs/relatorios/lighthouse-YYYY-MM-DD.md` — resumo em Markdown
- `docs/relatorios/lighthouse-*.report.html` — relatório completo do Lighthouse
- Artefatos no GitHub Actions (retidos por 30 dias)

---

## 4. 🐛 Issue Automático em Falha

**Workflow:** `.github/workflows/create-issue-on-failure.yml`  
**Trigger:** Quando qualquer um dos 3 workflows acima finaliza com `failure`

### O que o Issue contém:
1. **Tipo de falha** (Lint, E2E ou Lighthouse)
2. **Links diretos** para logs e artefatos do GitHub Actions
3. **Bloco de prompt pronto** para colar em Copilot, Claude ou GPT

---

## 5. Como Usar uma IA para Corrigir um Issue

Quando um Issue automático for criado, siga este processo:

### Passo a passo:
1. **Abra o Issue** no GitHub
2. **Clique no link dos logs** para entender o erro
3. **Copie o bloco de prompt** que está no Issue
4. **Cole em uma IA** (GitHub Copilot Chat, Claude, ChatGPT, etc.)
5. A IA vai ler os logs, identificar os arquivos com erro e propor a correção
6. **Revise as mudanças** — especialmente se tocar em regras de negócio
7. Faça commit e push → os workflows rodam novamente automaticamente

### ⚡ Prompt de Exemplo (para usar diretamente):

```
Você é um tech lead sênior de front-end para sites de alimentos.
Repositório: https://github.com/missias123/itapolitanacajuru

[COLE AQUI O LINK DOS LOGS DO WORKFLOW FALHO]

INSTRUÇÕES:
1. Leia os logs e identifique os arquivos/linhas com erro.
2. Abra os arquivos correspondentes no repositório.
3. Corrija os problemas sem truncar HTML, sem remover seções importantes
   (hero, cardápio, promoções, fidelidade, rodapé) e sem alterar regras de negócio.
4. Mantenha o site responsivo em mobile, tablet e desktop.
5. Comente mudanças importantes com:
   // Testes: | // Auditoria: | // Perf: | // A11y: | // Segurança:
6. Liste os arquivos alterados e explique o que foi corrigido em cada um.
```

---

## 6. Horários dos Workflows

| Workflow | Horário UTC | Horário Brasília |
|----------|-------------|------------------|
| 🧹 Quality Check (lint) | 03:00 | 00:00 |
| 🎭 E2E Playwright | 02:00 | 23:00 (dia anterior) |
| 🔦 Lighthouse Audit | 04:00 | 01:00 |

Todos os workflows também rodam a cada `push` e `pull_request` para `main`.

---

## 7. Regras Gerais de Segurança para Correções

Ao corrigir qualquer problema identificado pelas auditorias, **nunca**:

- ❌ Truncar arquivos grandes (index.html tem ~4768 linhas — preservar tudo)
- ❌ Remover seções: hero, cardápio, promoções, fidelidade, encomendas, rodapé
- ❌ Commitar tokens ou credenciais no código

Use `// TODO: confirmar regra com o proprietário` quando algo não estiver claro.
