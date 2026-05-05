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
