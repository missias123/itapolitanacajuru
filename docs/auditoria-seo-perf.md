# Auditoria SEO & Performance — Sorveteria Itapolitana Cajuru
> Referência: Google Lighthouse · Core Web Vitals · WCAG 2.1 AA  
> Data: 2026-05-05  
> Workflow automático: `.github/workflows/lighthouse-audit.yml`

---

## 1. Infraestrutura Lighthouse (já configurada)

O repositório já possui o workflow `lighthouse-audit.yml` que executa auditorias diárias às 04:00 UTC e a cada push na branch `main`, auditando:

- `index.html` (todas as categorias: Performance, Accessibility, Best Practices, SEO, PWA)
- `fidelidade.html`
- `encomendas.html`

Relatórios são publicados como artefatos em `docs/relatorios/` com retenção de 30 dias.

---

## 2. Pontos Identificados e Correções Implementadas

### 2.1 Performance — Core Web Vitals

| # | Problema | Impacto | Status |
|---|----------|---------|--------|
| P1 | Ausência de `preconnect` para `fonts.googleapis.com` e `fonts.gstatic.com` | LCP piora por conexão extra ao Google Fonts a cada visita | ✅ **Corrigido** — adicionadas 2 hints de `preconnect` no `<head>` antes do preload da fonte |
| P2 | Ausência de fallback `<noscript>` para carregamento de fonte | Usuários com JS desabilitado não carregam Poppins/Inter | ✅ **Corrigido** — adicionado `<noscript><link rel="stylesheet" ...></noscript>` |
| P3 | Font preload com `onload` trick já implementado | Evita render-blocking | ✅ Já existia — mantido |
| P4 | Imagem logo com `preload` + `fetchpriority="high"` | Otimiza LCP da logo no header sticky | ✅ Já existia — mantido |
| P5 | `contain: layout` em seções pesadas (hero, cardápio, accordeões) | Isola reflows, melhora CLS | ✅ Já existia — mantido |
| P6 | `aspect-ratio: 3/2` no carrossel iframe | Reserva espaço, elimina CLS do iframe | ✅ Já existia — mantido |

### 2.2 SEO Técnico

| # | Problema | Impacto | Status |
|---|----------|---------|--------|
| S1 | `<title>` presente e otimizado | "Sorveteria Itapolitana Cajuru – Sorvete Artesanal e Açaí SP" | ✅ OK |
| S2 | `<meta name="description">` presente | 160 chars, com palavras-chave primárias | ✅ OK |
| S3 | `<link rel="canonical">` presente | `https://itapolitanacajuru.com.br/` | ✅ OK |
| S4 | Schema.org `IceCreamShop` + `FoodEstablishment` + `Restaurant` | Markup rico para Google Knowledge Panel | ✅ OK — duplo schema no `<head>` e antes do `</style>` (consolidação futura recomendada) |
| S5 | Schema `AggregateRating` nos produtos | Rich snippets de estrelas no Google | ✅ OK |
| S6 | Open Graph e Twitter Card completos | Compartilhamento em redes sociais | ✅ OK |
| S7 | `robots.txt` presente | `index, follow` | ✅ OK |
| S8 | `sitemap.xml` presente | Mapeamento de URLs para Google | ✅ OK |
| S9 | H1 único e descritivo | "O Sorvete que Cajuru Ama de Verdade" | ✅ OK |
| S10 | Imagens com `alt` descritivos | Auditoria manual: todas as imagens inline com alt relevante | ✅ OK |
| S11 | `geo.region` e `geo.placename` meta tags | Relevância local para buscas em Cajuru/SP | ✅ OK |

### 2.3 Acessibilidade (WCAG 2.1 AA)

| # | Problema | Impacto | Status |
|---|----------|---------|--------|
| A1 | Strip sensorial: `color:#F9A825` sobre `background:#C62828` → contraste ~1.85:1 | Texto ilegível para baixa visão (muito abaixo de WCAG AA 4.5:1) | ✅ **Corrigido** — mudado para `#fff` (contraste ~5.5:1, passa WCAG AA) |
| A2 | Botão skip link "Pular para o conteúdo principal" | Navegação por teclado | ✅ Já existia — mantido |
| A3 | `aria-expanded`, `aria-controls`, `tabindex` nos accordeões | Navegação por leitor de tela | ✅ Já existia — mantido |
| A4 | `aria-label` em botões de fechar modais | Leitores de tela | ✅ Já existia — mantido |
| A5 | `lang="pt-BR"` no `<html>` | Leitores de tela pronunciam corretamente | ✅ OK |
| A6 | `.avaliacao-autor` usa `color:#e91e63` (pink) fora da paleta da marca | Inconsistência visual leve | ⚠️ Sugestão futura: alinhar para `#E8000D` |

### 2.4 Best Practices

| # | Problema | Status |
|---|----------|--------|
| BP1 | HTTPS obrigatório via `.htaccess` | ✅ OK |
| BP2 | `Strict-Transport-Security` meta HTTP-equiv | ✅ OK |
| BP3 | `X-Content-Type-Options: nosniff` | ✅ OK |
| BP4 | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ OK |
| BP5 | Google Consent Mode v2 antes do GA | ✅ OK |
| BP6 | Schema.org duplicado (`IceCreamShop` aparece 2x) | ⚠️ Sugestão: consolidar em 1 único script JSON-LD |

---

## 3. Correções Implementadas (resumo)

```
index.html:
+ <link rel="preconnect" href="https://fonts.googleapis.com"/>
+ <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
+ <noscript><link href="https://fonts.googleapis.com/..." rel="stylesheet"/></noscript>
~ .strip-sensorial { color: #fff }  (era #F9A825 — contraste insuficiente)
~ .stats-section { background: linear-gradient(135deg, #C62828, #E8000D) }  (era pink/laranja)
~ botão FIDELIDADE: adicionado class="nav-yellow" + style="color:#fff;" no nav-label
```

---

## 4. O que ficou como sugestão para futuro

### Alta prioridade
| # | Sugestão | Motivo |
|---|----------|--------|
| F1 | **Consolidar Schema.org duplicado** — remover 1 dos 2 blocos `IceCreamShop` | Google pode priorizar um e ignorar o outro; melhor ter 1 bloco completo |
| F2 | **Minificar CSS inline** — o `<style>` em `index.html` tem ~1800 linhas não minificadas | Reduz tamanho da página (estimativa: ~15–20KB economizados) |
| F3 | **Imagens WebP responsivas com `srcset` completo** — alguns elementos usam apenas `src` sem `srcset` | Lighthouse penaliza por "serve images in next-gen format" e "properly sized images" |
| F4 | **Lazy load do carrossel iframe** — atualmente `loading="eager"` | Considerar `loading="lazy"` para melhorar FCP em conexões lentas |

### Média prioridade
| # | Sugestão | Motivo |
|---|----------|--------|
| F5 | **Service Worker update strategy** — `sw.js` pode ter cache stale longo | Usuários podem ver versão antiga; implementar `skipWaiting + clients.claim` |
| F6 | **`<meta name="viewport">` com `initial-scale=1`** — já presente, validar se não tem `user-scalable=no` | WCAG exige que usuários possam fazer zoom |
| F7 | **Remover `<meta name="generator">` com "Meta AI - Manus Agent"** | Informação irrelevante para SEO; pode confundir crawlers |
| F8 | **`avaliacao-autor` cor** — `#e91e63` (pink) fora da paleta da marca | Pequena inconsistência visual — mudar para `#E8000D` |

### Baixa prioridade
| # | Sugestão | Motivo |
|---|----------|--------|
| F9 | **PWA: `display: standalone`** — verificar manifest.json | Pode aumentar score PWA no Lighthouse |
| F10 | **`robots.txt`: Sitemap URL** — validar se aponta para URL correta com HTTPS | Google Search Console pode reclamar |
| F11 | **Adicionar `<meta name="theme-color" media="(prefers-color-scheme: dark)">** | Dark mode em Android Chrome |

---

## 5. Workflow Lighthouse (`.github/workflows/lighthouse-audit.yml`)

O workflow já está configurado e funcional. Executa:
- **Diariamente** às 04:00 UTC (01:00 Brasília)
- **A cada push** na branch `main`
- **Manualmente** via `workflow_dispatch`

Páginas auditadas: `index.html`, `fidelidade.html`, `encomendas.html`

Relatórios disponíveis em: `Actions → Lighthouse Audit → Artifacts → lighthouse-reports-YYYY-MM-DD`

---

## 6. Próximos passos recomendados para melhorar no Google

1. **Configurar Google Search Console** — verificar se o sitemap.xml está sendo indexado corretamente
2. **Core Web Vitals no campo** — usar `crux-api` ou PageSpeed Insights para ver dados reais de usuários
3. **Link building local** — citar o site em diretórios locais (Yelp Brasil, TripAdvisor, Guia Mais) com NAP consistente
4. **Google Business Profile** — manter horários, fotos e respostas a avaliações atualizados (impacto direto no ranking local)
5. **Conteúdo SEO** — adicionar página `/blog` ou FAQ com termos como "melhor sorvete Cajuru", "encomenda torta de sorvete Cajuru SP"
6. **Schema `FAQ`** — adicionar `FAQPage` markup para as perguntas frequentes do chatbot, aumentando rich snippets
