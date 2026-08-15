# Scripts de Auditoria Admin × Site

## `audit-admin-site.js`

Script de **somente leitura** que compara os dados nos arquivos JSON do GitHub
com as expectativas do site público.

### Como executar

```bash
# Requer Node.js >= 18 (fetch nativo)
node scripts/tests-admin-sync/audit-admin-site.js
```

### O que verifica

1. **Campos obrigatórios** em `config.json`, `produtos.json`, `promo.json`
2. **Consistência** entre `config.json` e `fidelidade.json` (prêmios do clube)
3. **Conflito de campos duplicados** entre `config.json` e `promo.json`
4. **Estado da promoção** (`promocaoAtiva` no config vs `ativo` no promo.json)
5. **Configuração de horário** (valores numéricos, texto do rodapé)
6. **WhatsApp** (número válido e formatado)

### Garantias

- **Não escreve** em nenhum arquivo
- **Não usa** token GitHub (apenas fetch público via GitHub Raw CDN)
- **Não bloqueia** o site em caso de erro
- Retorna `exit code 1` se houver erros críticos, `0` se OK ou apenas avisos

### Saída esperada

```
=== AUDITORIA ADMIN × SITE — Sorveteria Itapolitana ===
Modo: SOMENTE LEITURA (nenhum arquivo é modificado)

🔄 Carregando arquivos do GitHub...

────────────────────────────────────────────────────────────
Disponibilidade dos arquivos JSON
────────────────────────────────────────────────────────────
  ✅  dados/config.json — carregado com 80 chaves de nível raiz
  ✅  dados/produtos.json — carregado com 12 chaves de nível raiz
  ...
```

### Integração com GitHub Actions

Para usar como check de auditoria (não bloqueante):

```yaml
- name: Auditoria Admin × Site
  run: node scripts/tests-admin-sync/audit-admin-site.js
  continue-on-error: true  # não bloqueia o deploy
```

## Cenários simulados — Admin (carga, edição e salvamento)

### 1) Encomendas
- Abrir aba **Encomendas** e validar carga de `encomendaAviso`, `encomendaMinPicoles`, hero, CTAs e SEO.
- Editar valores e salvar.
- Reabrir aba e confirmar persistência.
- Validar no `encomendas.html` atualização do aviso e SEO (title/description/keywords).

### 2) Produtos
- Abrir aba **Produtos** e validar tabela carregada.
- Criar produto, editar produto existente e excluir produto.
- Salvar, recarregar painel e confirmar persistência em `dados/produtos.json`.
- Validar reflexo no fluxo de encomendas/cardápio.

### 3) Fidelidade
- Abrir aba **Fidelidade** e validar carga de prêmios, passos, regras, URLs e SEO.
- Alterar campos e salvar.
- Reabrir aba e confirmar persistência.
- Validar no `` atualização de CTAs (regras/resgate) e SEO.

### 4) Dicas
- Abrir aba **Dicas** e validar carga de `depTitulo`, `depSubtitulo`, depoimentos e `dicasItens`.
- Adicionar, editar e remover cards de dicas (título/descrição/imagem/link).
- Salvar e recarregar painel.
- Validar no `dicas.html` renderização dos cards dinâmicos e SEO da página.

### 5) Qualidade
- Abrir aba **Qualidade** e validar carga de observações internas.
- Editar observações e salvar.
- Reabrir aba e confirmar persistência em `config.adminConteudoPaginas.qualidade`.

### 6) Rastreio
- Abrir aba **Rastreio** e validar carga de observações internas.
- Editar observações e salvar.
- Reabrir aba e confirmar persistência em `config.adminConteudoPaginas.rastreio`.

### 7) Auditoria
- Abrir aba **Auditoria** e validar carga de observações internas.
- Editar observações e salvar.
- Reabrir aba e confirmar persistência em `config.adminConteudoPaginas.auditoria`.
