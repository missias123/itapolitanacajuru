# 📋 Política de Qualidade — Sorveteria Itapolitana Cajuru

> **Versão:** 1.0 · **Vigência:** a partir de maio/2026  
> Estado de referência: `v1.0-quality-94` (Score 94/100, 0 críticos)

---

## 1. Objetivo

Garantir que **nenhuma mudança no branch `main`** introduza regressões de qualidade
que prejudiquem a experiência do usuário, o SEO ou a segurança do site.

Benchmark: iFood, Rappi, McDonald's Brasil — sites de alimentação com excelência técnica.

---

## 2. Critérios Mínimos de Aprovação de PR

| Critério | Mínimo obrigatório | Como é verificado |
|----------|-------------------|-------------------|
| **Score de qualidade** | ≥ 90/100 | `node scripts/quality-audit.js --fail` |
| **Itens críticos** | 0 (zero) | `quality-audit.js --fail` → exit 1 se > 0 |
| **Erros de JavaScript** | 0 erros (warnings ok) | `npx eslint@8 scripts/*.js` |
| **Erros de HTML** | 0 erros | `npx htmlhint@1 *.html --config .htmlhintrc` |
| **Sintaxe JS em HTML** | 0 erros | `node scripts/auto-repair.js --check` |
| **JSON válido** | Todos os dados/* e manifest.json | CI valida com `node -e "JSON.parse(...)"` |
| **Tokens expostos** | Nenhum `ghp_`, `github_pat_`, `ghs_` | CI bloqueia com grep |
| **Arquivos críticos presentes** | Ver lista abaixo | CI verifica existência |

### Arquivos críticos que devem sempre existir

```
index.html    encomendas.html  dicas.html
promocao.html  carrossel.html  manifest.json  robots.txt
sitemap.xml  sw.js  dados/config.json  dados/produtos.json
```

---

## 3. Ferramentas e Checks Obrigatórios

### 3.1 Workflow: `quality-check.yml` (executa em todo push e PR)

| Etapa | Ferramenta | O que verifica |
|-------|-----------|----------------|
| Tokens expostos | `grep` | `ghp_`, `github_pat_`, `ghs_` em *.html e *.js |
| Lint JS | ESLint 8 | `scripts/*.js` — zero erros |
| Lint HTML | HTMLHint 1 | Páginas principais — zero erros |
| Auto-repair | `scripts/auto-repair.js --check` | Sintaxe JS inline em todo HTML |
| Arquivos críticos | bash | Existência dos 12 arquivos obrigatórios |
| JSON válido | Node.js | `dados/config.json`, `dados/produtos.json`, `dados/promo.json`, `manifest.json` |
| **Auditoria Estática** | `scripts/quality-audit.js --fail` | Score ≥ 90, 0 críticos (18 regras, 7 páginas) |

### 3.2 Workflow: `e2e-tests.yml` (executa em push, PR e diariamente às 02h UTC)

Testes Playwright que cobrem:
- Carregamento de todas as páginas
- Navegação entre seções
- Abertura do Ita Bot
- Fluxos de encomenda e fidelidade
- Responsividade mobile

### 3.3 Workflow: `auto-repair.yml` (executa em push para main)

Se erros JS forem detectados após o merge, corrige automaticamente restaurando
a última versão boa do Git e faz commit com `[skip ci]`.

### 3.4 Script de Auditoria: `scripts/quality-audit.js`

18 regras estáticas em 6 categorias:

| Categoria | Regras |
|-----------|--------|
| **Código** | meta charset, meta viewport, H1 na página |
| **SEO** | meta description, canonical, Open Graph, Schema.org |
| **Performance** | lazy loading, preload hero, tamanho da página, WebP |
| **Mobile / PWA** | manifest, theme-color, apple-touch-icon |
| **Segurança** | sem http:// (mixed content), sem tokens hardcoded |
| **Acessibilidade** | lang no `<html>`, todas as imagens com alt |

---

## 4. Proteção de Branch — Configuração no GitHub

Para proteger o branch `main`, configure em:  
**Settings → Branches → Branch protection rules → Add rule → `main`**

### Configurações recomendadas

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   Required checks:
   - "🔍 Validação HTML, Lint e Segurança"   ← quality-check.yml
   - "🎭 Playwright E2E"                     ← e2e-tests.yml
   - "🔦 Lighthouse Audit"                   ← lighthouse-audit.yml
   - "CodeQL" (ou nome equivalente no repositório) ← segurança estática

✅ Require branches to be up to date before merging

✅ Do not allow bypassing the above settings
```

> **Nota:** Os checks são configurados pelo nome exato do `job.name` no YAML.
> Veja `.github/workflows/quality-check.yml` → `jobs.lint.name`.

---

## 5. O Que Fazer Quando um PR Falhar na Qualidade

### 5.1 Falha no score (< 90) ou item crítico

1. Abra os logs do workflow em **Actions → quality-check → Auditoria Estática**
2. Identifique o item que falhou (ex: "H1 ausente", "token exposto", etc.)
3. Corrija no branch do PR (não faça push direto para main)
4. Push → o CI roda automaticamente novamente
5. Se ainda falhar, consulte o `painel-qualidade.html` para diagnóstico em tempo real

### 5.2 Falha de lint (ESLint/HTMLHint)

```bash
# Rodar localmente antes de fazer push:
npx eslint@8 scripts/*.js
npx htmlhint@1 index.html  encomendas.html ... --config .htmlhintrc
```

### 5.3 Falha de sintaxe JS em HTML

```bash
node scripts/auto-repair.js --dry-run   # mostra o que seria corrigido
node scripts/auto-repair.js             # aplica a correção
```

### 5.4 Falha nos testes E2E (Playwright)

1. Baixe o artefato `playwright-report-NNN` da aba **Actions → E2E Tests → Artifacts**
2. Abra `index.html` no browser para ver o trace visual do teste que falhou
3. Corrija o código e faça novo push

---

## 6. Regras de Ouro (Nunca Violar)

1. **Nunca commitar direto em `main`** — sempre via PR com checks aprovados
2. **Nunca truncar páginas HTML** — index.html, , encomendas.html têm conteúdo estrutural crítico
3. **Nunca remover seções de negócio** — hero, cardápio, promoções, fidelidade, encomendas, rodapé
4. **Nunca alterar regras de negócio** sem alinhamento: preços, fidelidade, caça à estrela
5. **Nunca expor tokens/credenciais** no código (usar GitHub Secrets)
6. **Sempre manter responsividade** — testar em 320px, 375px, 414px e 768px antes de aprovar PR

---

## 7. Estado Estável de Referência

| Atributo | Valor |
|---------|-------|
| Tag | `v1.0-quality-94` |
| Score médio | **94/100** |
| Itens críticos | **0** |
| Páginas auditadas | 7 |
| Regras ativas | 18 |
| Data | Maio/2026 |

Para restaurar para este estado estável:
```bash
git checkout v1.0-quality-94
```

---

## 8. Métricas Alvo (Benchmark iFood/Rappi)

| Métrica | Meta | Atual |
|---------|------|-------|
| Score qualidade estática | ≥ 90/100 | **94/100** ✅ |
| Itens críticos | 0 | **0** ✅ |
| LCP (Largest Contentful Paint) | < 2.5s | Monitorado via quality-guard.js |
| CLS (Cumulative Layout Shift) | < 0.1 | Monitorado via quality-guard.js |
| INP (Interaction to Next Paint) | < 200ms | Monitorado via quality-guard.js |
| PWA instalável | Sim | **Sim** ✅ |
| HTTPS | Sim | **Sim** ✅ |
| Schema.org | Todas as páginas principais | **Sim** ✅ |
| Imagens com alt | 100% | **100%** ✅ |
| H1 em todas as páginas | Sim | **Sim** ✅ |

---

*Documento mantido pelo sistema de qualidade automática — Sorveteria Itapolitana Cajuru.*  
*Atualizar sempre que novas regras ou ferramentas forem adicionadas ao pipeline de CI.*
