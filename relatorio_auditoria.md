# Relatório de Auditoria Semanal — Sorveteria Itapolitana Cajuru

**Data da Auditoria:** 12/04/2026 às 06:23
**Ferramentas:** Google Lighthouse 12.x · Análise DOM · Z-Index Mapper

---

## 1. Scores Lighthouse

| Página | Performance | Acessibilidade | Boas Práticas | SEO |
|--------|-------------|----------------|---------------|-----|
| `index.html` | ⚠️ 61/100 | ✅ 96/100 | ✅ 96/100 | ✅ 100/100 |
| `encomendas.html` | ⚠️ 69/100 | ✅ 100/100 | ✅ 100/100 | ✅ 100/100 |
| `fidelidade.html` | ⚠️ 63/100 | ✅ 100/100 | ✅ 96/100 | ✅ 100/100 |
| `promocao.html` | ⚠️ 61/100 | ✅ 95/100 | ✅ 96/100 | ✅ 100/100 |

---

## 2. Problemas por Página

### index.html

**Erros de Console JavaScript:**
- ❌ Failed to load resource: the server responded with a status of 404 ()
- ❌ ReferenceError: respostas is not defined
    at HTMLDocument.<anonymous> (https://itapolitanacajuru.com.br/:3455:15)
- ❌ X-Frame-Options may only be set via an HTTP header sent along with a document. It may not be set inside <meta>.

**Recursos com Erro 404:**
- ❌ [404] https://itapolitanacajuru.com.br/favicon.ico

**Problemas de UX/Mobile:**
- ⚠️ 111 fontes < 16px (zoom automático no iOS)

**Problemas de Performance:**
- ❌ [0%] Browser errors were logged to the console: 
- ❌ [0%] Minimize main-thread work: 7.2 s
- ❌ [0%] Largest Contentful Paint element: 5,860 ms
- ❌ [0%] Background and foreground colors do not have a sufficient contrast ratio.: 
- ❌ [0%] Elements with visible text labels do not have matching accessible names.: 
- ❌ [0%] Eliminate render-blocking resources: Est savings of 1,060 ms
- ❌ [0%] Reduce unused JavaScript: Est savings of 89 KiB
- ❌ [0%] Properly size images: Est savings of 212 KiB

### encomendas.html

**Problemas de UX/Mobile:**
- ⚠️ 61 fontes < 16px (zoom automático no iOS)

**Problemas de Performance:**
- ❌ [0%] Reduce initial server response time: Root document took 610 ms
- ❌ [0%] Minimize main-thread work: 3.5 s
- ❌ [0%] Largest Contentful Paint element: 3,910 ms
- ❌ [0%] Reduce unused JavaScript: Est savings of 64 KiB
- ❌ [0%] Document request latency: Est savings of 510 ms
- ❌ [0%] Network dependency tree: 
- ❌ [48%] Max Potential First Input Delay: 250 ms
- ⚠️ [50%] Serve static assets with an efficient cache policy: 8 resources found

### fidelidade.html

**Erros de Console JavaScript:**
- ❌ Failed to load resource: the server responded with a status of 404 ()

**Recursos com Erro 404:**
- ❌ [404] https://itapolitanacajuru.com.br/favicon.ico

**Problemas de UX/Mobile:**
- ⚠️ 3 fontes < 16px (zoom automático no iOS)

**Problemas de Performance:**
- ❌ [0%] Browser errors were logged to the console: 
- ❌ [0%] Minimize main-thread work: 3.2 s
- ❌ [0%] Largest Contentful Paint element: 5,870 ms
- ❌ [0%] Eliminate render-blocking resources: Est savings of 1,360 ms
- ❌ [0%] Reduce unused JavaScript: Est savings of 64 KiB
- ❌ [0%] Network dependency tree: 
- ❌ [0%] Render blocking requests: Est savings of 1,360 ms
- ❌ [6%] First Contentful Paint: 5.4 s

### promocao.html

**Erros de Console JavaScript:**
- ❌ Failed to load resource: the server responded with a status of 404 ()

**Recursos com Erro 404:**
- ❌ [404] https://itapolitanacajuru.com.br/favicon.ico

**Problemas de UX/Mobile:**
- ⚠️ 16 fontes < 16px (zoom automático no iOS)

**Problemas de Performance:**
- ❌ [0%] Browser errors were logged to the console: 
- ❌ [0%] Largest Contentful Paint element: 7,580 ms
- ❌ [0%] Background and foreground colors do not have a sufficient contrast ratio.: 
- ❌ [0%] Eliminate render-blocking resources: Est savings of 310 ms
- ❌ [0%] Properly size images: Est savings of 103 KiB
- ❌ [0%] Use efficient cache lifetimes: Est savings of 217 KiB
- ❌ [0%] Improve image delivery: Est savings of 189 KiB
- ❌ [0%] LCP request discovery: 

---

## 3. Resumo Executivo

Esta auditoria é executada automaticamente todo domingo às 03:00 pelo sistema Manus.
Problemas críticos (❌) devem ser corrigidos com prioridade máxima.
Problemas de atenção (⚠️) devem ser corrigidos na próxima sprint de manutenção.

*Relatório gerado automaticamente em 12/04/2026 às 06:23*