# 🤖 Fluxo de Correções Automáticas — Sorveteria Itapolitana Cajuru

Este documento explica como funciona o sistema de detecção automática de erros e
como usar o **GitHub Copilot Agent** para corrigir problemas com segurança, sem
quebrar o site.

---

## 1. Visão Geral do Sistema

```
Push / PR / Daily Schedule
        │
        ▼
┌─────────────────────────────┐
│  quality-check.yml          │  ← Roda ESLint, HTMLHint,
│  (lint + JS syntax + JSON)  │    verificação de arquivos e tokens
└──────────────┬──────────────┘
               │ failure?
               ▼
┌─────────────────────────────┐
│  create-issue-on-failure.yml│  ← Cria Issue automática com
│                             │    instruções prontas para o Copilot
└──────────────┬──────────────┘
               │
               ▼
       🤖 Copilot corrige
       com base no Issue
```

### Quando os workflows disparam
| Gatilho | Workflow |
|---------|----------|
| `push` para `main` | `quality-check.yml` |
| `pull_request` para `main` | `quality-check.yml` |
| Todo dia às 06h (Brasília) | `quality-check.yml` |
| Após `quality-check` falhar | `create-issue-on-failure.yml` |

---

## 2. O que é verificado

| Verificação | Ferramenta | Ação se falhar |
|-------------|-----------|----------------|
| Sintaxe JS nos scripts | `auto-repair.js --check` | ❌ Falha o job |
| Lint nos `scripts/*.js` | ESLint 8 | ⚠️ Aviso |
| HTML das páginas principais | HTMLHint 1 | ⚠️ Aviso |
| Arquivos críticos presentes | Shell | ❌ Falha o job |
| Tokens hardcoded | Shell + grep | ❌ Falha o job |
| JSON válido em `dados/` | Node.js | ❌ Falha o job |
| Tamanho das páginas | Shell + `wc` | ⚠️ Aviso |

---

## 3. Quando um Issue é criado automaticamente

Quando o `quality-check` **falha** (conclusão = `failure`), o workflow
`create-issue-on-failure.yml` cria um Issue com:

- Título: `🚨 Quality Check falhou — branch: main (abc1234)`
- Link direto para os logs do workflow
- Lista do que pode ter causado a falha
- **Bloco de instruções já formatado para o Copilot**

> ℹ️ Se já existir um Issue aberto com o mesmo título, o workflow não duplica.

---

## 4. Passo a passo: corrigir com o Copilot Agent

### Passo 1 — Ver o Issue
1. Acesse **Issues** no repositório.
2. Abra o Issue com label `quality-failure`.
3. Leia o título e o corpo — o link para os logs está lá.

### Passo 2 — Abrir os logs do workflow
1. Clique no link "Ver logs completos aqui" dentro do Issue.
2. Expanda o job `🔍 Lint + HTML + JS Syntax`.
3. Identifique qual etapa falhou (ESLint, HTMLHint, JS Syntax, etc.).
4. Anote o nome do arquivo e o número da linha indicados nos logs.

### Passo 3 — Acionar o Copilot Agent
1. No GitHub, abra a aba **Copilot** (ou acesse `github.com/copilot`).
2. Selecione o repositório `missias123/itapolitanacajuru`.
3. Escolha a **branch onde ocorreu a falha** (normalmente `main`).
4. Use o seguinte prompt padrão (copie e adapte):

```
Este Issue foi criado automaticamente pelo workflow de qualidade.

Issue: [COLE O LINK DO ISSUE AQUI]
Logs: [COLE O LINK DOS LOGS AQUI]

Por favor:
1. Leia o Issue e os logs indicados.
2. Abra os arquivos citados nos erros.
3. Corrija os erros de lint/sintaxe encontrados.

Regras obrigatórias:
- NÃO truncar arquivos grandes (index.html, fidelidade.html etc.).
- NÃO remover seções importantes (hero, cardápio, fidelidade, promoções, encomendas, footer).
- NÃO alterar regras de negócio (fidelidade, promoções, preços).
- Manter o site responsivo em mobile, tablet e desktop.
- Comentar mudanças com prefixos: // SEO:, // Perf:, // A11y:, // Segurança:, // Fidelidade:.

No final, me diga:
- Quais arquivos foram alterados.
- O que foi corrigido em cada um.
- Como testar no navegador.
```

### Passo 4 — Revisar o diff do Copilot
1. O Copilot abrirá um Pull Request com as correções.
2. Acesse a aba **Files changed** do PR.
3. Verifique:
   - O arquivo HTML não foi truncado?
   - As seções importantes (hero, cardápio, fidelidade...) ainda existem?
   - A lógica de negócio (fidelidade, promoções) não foi alterada?
   - As correções resolvem o erro apontado nos logs?

### Passo 5 — Merge ou solicitação de ajuste
- Se tudo estiver OK: clique em **Merge pull request**.
- Se algo parecer errado: adicione um comentário no PR pedindo ajuste.
- Após o merge, o `quality-check` rodará novamente e deverá passar.

---

## 5. Regras de ouro (nunca esquecer)

| Regra | Por quê |
|-------|---------|
| Não truncar `index.html` ou `fidelidade.html` | Esses arquivos têm lógica crítica de negócio embutida |
| Não alterar `dados/fidelidade.json`, `dados/clientes.json` | Dados reais de clientes |
| Não mudar regras de pontuação/fidelidade | Definidas com o proprietário |
| Testar em mobile depois de qualquer mudança de layout | 80%+ dos usuários acessam pelo celular |

---

## 6. Estrutura dos arquivos criados

```
.github/
  workflows/
    quality-check.yml          ← Verifica qualidade a cada push/PR/dia
    create-issue-on-failure.yml ← Cria Issue se quality-check falhar
    auto-repair.yml            ← (existente) Auto-repara erros de JS
  ISSUE_TEMPLATE/
    quality-failure.md         ← Template de Issue para falhas de qualidade
  hooks/
    pre-commit                 ← (existente) Hook local de proteção
  instalar-guardiao.sh         ← (existente) Instalador do hook local

.eslintrc.json                 ← Config ESLint para scripts/
.htmlhintrc                    ← Config HTMLHint para páginas HTML

docs/
  fluxo-correcoes-automaticas.md  ← Este arquivo
```

---

## 7. Como adicionar mais verificações no futuro

Para adicionar uma nova verificação (ex.: teste com Playwright), basta
adicionar uma nova etapa no job `quality-check` dentro de
`.github/workflows/quality-check.yml`:

```yaml
- name: 🎭 Playwright smoke test
  run: |
    npx playwright install --with-deps chromium
    npx playwright test tests/smoke.spec.js
  continue-on-error: true  # mudar para false quando o teste estiver estável
```

---

_Documento criado em 2026 — Sorveteria Itapolitana Cajuru._
