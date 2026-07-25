# RELATORIO.md — Validação do Lote 0 (Aprovação Condicional)

> Última atualização: 2026-07-25 | Branch: copilot/valores-estao-erraods
> Status do Lote 0: **APROVADO COMO BASE DE PLANEJAMENTO (CONDICIONAL)**

---

## 1) STATUS CORRIGIDO DO LOTE 0

O Lote 0 **não** está classificado como “100% somente leitura”, pois houve alteração de código em `scripts/ita-bot-widget.js`.

Classificação correta:
- `scripts/ita-bot-widget.js` = **correção prévia já executada** e vinculada ao eixo **UX mobile (Lote D)**.
- Documentação do Lote 0 = base de planejamento aprovada, com pendências bloqueadoras abaixo.

---

## 2) LISTA DOS COMMITS QUE ALTERARAM CÓDIGO (REFERÊNCIA DESTA VALIDAÇÃO)

| Commit | Tipo | Arquivos de código | Classificação |
|---|---|---|---|
| `6cfe3a61d0bc194c51bb52ee65b0f51d4543d494` | Ajuste técnico + docs | `scripts/ita-bot-widget.js` | Correção prévia já executada (não tratar como somente leitura) |
| `d9fed857f6931a476e6802a4b1f7b29723737b7f` | Fix UX mobile teclado | `scripts/ita-bot-widget.js` | Alteração do Lote D — UX mobile |
| `df3158d5cda48e9bd614f418fa90dd96ea313e9c` | Ajustes mobile amplos | múltiplos + `scripts/ita-bot-widget.js` | Histórico anterior de UX mobile |

> Não fazer novas alterações em `scripts/ita-bot-widget.js` antes da aprovação explícita do Lote A.

---

## 3) DIFF RESUMIDO DA CORREÇÃO MOBILE

Commit de referência principal: `d9fed857f6931a476e6802a4b1f7b29723737b7f`

Resumo:
- 1 arquivo alterado: `scripts/ita-bot-widget.js`
- 7 inserções, 7 remoções
- Ajustes de viewport/altura do painel para manter o campo de digitação visível com teclado mobile.

Complemento técnico posterior:
- Commit `6cfe3a61d0bc194c51bb52ee65b0f51d4543d494` refinou variáveis de viewport (`--ita-visual-height`, `--ita-visual-top`) e agendamento de atualização por `requestAnimationFrame`.

---

## 4) TESTES EXECUTADOS (EVIDÊNCIA DISPONÍVEL)

| Item | Evidência |
|---|---|
| Testes registrados no commit `d9fed857...` | Não há registro explícito de suíte no próprio commit |
| Evidência histórica de validação mobile | Commit `df3158d...` inclui atualização de `tests/e2e/06-itabot.spec.js` e `docs/relatorios/playwright-results.json` |
| Dispositivo real Android/Chrome | **Pendente de confirmação documental** |
| Dispositivo real iPhone/Safari | **Pendente de confirmação documental** |
| Retrato e paisagem | **Pendente de confirmação documental** |

Classificação atual da correção mobile:
- **Validado em código/local; validação em dispositivo real pendente.**

---

## 5) EVIDÊNCIA DE NÃO ALTERAÇÃO DE PREÇOS, PRODUTOS, PEDIDOS E CLIENTES

Para os commits `d9fed857...` e `6cfe3a61...`:
- Arquivo de dados de preços/produtos (`dados/produtos.json`): **não alterado**.
- Arquivos de pedidos/clientes (`dados/pedidos*.json`, `dados/clientes*.json`): **não alterados**.
- Alterações concentradas em `scripts/ita-bot-widget.js` e documentos.

Conclusão: não há evidência de mudança direta em preços, produtos, pedidos ou clientes nesses commits de referência.

---

## 6) PLANO DE ROLLBACK ESPECÍFICO

1. Identificar o commit a reverter (`6cfe3a61...` ou `d9fed857...`).
2. Executar `git revert <sha>` em branch de teste.
3. Validar fluxo crítico do bot (abertura, digitação, envio, rolagem final).
4. Reexecutar testes automatizados do Ita Bot (`tests/e2e/06-itabot.spec.js`) em ambiente de teste.
5. Confirmar que não houve alteração em `dados/produtos.json`, `dados/pedidos*.json`, `dados/clientes*.json`.

Rollback emergencial sugerido (ordem):
- Reverter primeiro `6cfe3a61...`.
- Se necessário, reverter `d9fed857...`.

---

## 7) BENCHMARK — STATUS CORRIGIDO

- Denominação corrigida para: **“Benchmark em ondas de sites relevantes de alimentação, sobremesas e negócios locais.”**
- Separação explícita entre analisado e planejado no arquivo `docs/BENCHMARK.md`.
- Referências irrelevantes removidas do benchmark principal.

---

## 8) AGGREGATERATING E REVIEW — DECISÃO ATUAL

Status: **BLOQUEADOR DE SEO ATÉ CONFIRMAÇÃO DOCUMENTAL DO PROPRIETÁRIO**.

Ação obrigatória antes de produção:
- Confirmar documentalmente os blocos com `reviewCount` e `Review` (incluindo autor “Carlos Augusto”).
- Se houver qualquer resposta “não”, “não sei” ou sem comprovação:
  - remover `AggregateRating`
  - remover `Review`
  - remover `reviewCount` e `ratingValue` não verificáveis
  - manter somente depoimentos reais, autorizados e visíveis

Checklist de confirmação está em `docs/PLANO-SEO.md`.

---

## 9) MAPA DE FONTES, DEPENDÊNCIAS E MATRIZ DE INTENÇÕES

Consolidados em:
- `docs/ARQUITETURA-ITA-BOT.md`
  - mapa de fontes oficiais
  - mapa de dependências
  - matriz de intenções
  - estratégia única de roteamento
  - fallback e clarificação
  - matriz de testes críticos

---

## 10) LISTA DE ARQUIVOS DO LOTE A E TESTES A CRIAR

Consolidados em:
- `docs/PLANO-LOTE-A.md`
  - lista de arquivos de implementação
  - lista de arquivos fora de escopo
  - testes automatizados e manuais obrigatórios
  - gates de liberação

---

## 11) ENTREGA CONSOLIDADA (15 ITENS ANTES DO LOTE A)

1. Status corrigido do Lote 0 — **entregue neste relatório**.
2. Lista dos commits que alteraram código — **seção 2**.
3. Diff da correção mobile — **seção 3**.
4. Benchmark com referências relevantes — **`docs/BENCHMARK.md`**.
5. Separação entre analisado e planejado — **`docs/BENCHMARK.md`**.
6. Fontes irrelevantes removidas do benchmark principal — **`docs/BENCHMARK.md`**.
7. Decisão sobre AggregateRating — **seção 8 + `docs/PLANO-SEO.md`**.
8. Decisão sobre Review — **seção 8 + `docs/PLANO-SEO.md`**.
9. Mapa de fontes — **`docs/ARQUITETURA-ITA-BOT.md`**.
10. Mapa de dependências — **`docs/ARQUITETURA-ITA-BOT.md`**.
11. Matriz de intenções — **`docs/ARQUITETURA-ITA-BOT.md`**.
12. Lista de arquivos do Lote A — **`docs/PLANO-LOTE-A.md`**.
13. Testes que serão criados — **`docs/PLANO-LOTE-A.md`**.
14. Plano de rollback — **seção 6 + `docs/PLANO-LOTE-A.md`**.
15. Confirmação de não alteração de preços/produtos/pedidos/clientes — **seção 5**.

---

## 12) DECISÃO SOBRE O LOTE A

Lote A aprovado **somente** para preparação/implementação em branch de teste após:
- classificação correta da alteração mobile;
- benchmark filtrado e relevante;
- decisão documentada de AggregateRating/Review;
- confirmação do mapa de fontes e dependências;
- criação dos testes críticos antes da alteração.

Não autorizado para:
- produção;
- alteração de preços/produtos/pedidos/clientes;
- alteração do Worker;
- alterações administrativas.

**Após esta atualização, aguardar aprovação explícita para iniciar implementação do Lote A.**
