# Plano de SEO, Performance e LGPD — Lote 0

> **Status:** Diagnóstico (somente leitura) — não implementar sem aprovação
> Branch: copilot/valores-estao-erraods | Data: 2026-07-25

---

## ÍNDICE

1. [Diagnóstico SEO atual](#1-diagnóstico-seo-atual)
2. [Problemas identificados — prioridades](#2-problemas-identificados--prioridades)
3. [Sitemap proposto](#3-sitemap-proposto)
4. [Mapa de palavras-chave por página](#4-mapa-de-palavras-chave-por-página)
5. [Plano de SEO local](#5-plano-de-seo-local)
6. [Dados estruturados — diagnóstico e proposta](#6-dados-estruturados--diagnóstico-e-proposta)
7. [Performance e Core Web Vitals](#7-performance-e-core-web-vitals)
8. [Acessibilidade WCAG](#8-acessibilidade-wcag)
9. [Privacidade, Segurança e LGPD](#9-privacidade-segurança-e-lgpd)
10. [Priorização de melhorias](#10-priorização-de-melhorias)

---

## 1. DIAGNÓSTICO SEO ATUAL

### 1.1 Páginas existentes

| Página | URL atual | Title atual | Indexada |
|---|---|---|---|
| Início | `/` | "Sorveteria Itapolitana em Cajuru – Sorvetes tipo artesanais, picolés diferenciados e Açaí Natureon" | ✅ |
| Encomendas | `/encomendas.html` | A verificar | ✅ |
| Promoções | `/promocao.html` | A verificar | ✅ |
| Sobre | `/sobre.html` | A verificar | ✅ |
| Dicas | `/dicas.html` | A verificar | ✅ |
| Galeria | `/galeria.html` | A verificar | ✅ |
| Política de Privacidade | `/politica-privacidade.html` | A verificar | ✅ |
| 404 | `/404.html` | A verificar | ❌ noindex recomendado |
| Admin | `/admin-painel.html` | — | ❌ bloqueado |
| Painel qualidade | `/painel-qualidade.html` | — | ❌ bloqueado |

**O `sitemap.xml` e o `robots.txt` já existem e estão funcionais.**

### 1.2 O que já está bem implementado

| Item | Status | Observação |
|---|---|---|
| `sitemap.xml` | ✅ OK | Cobre 6 páginas, inclui imagens |
| `robots.txt` | ✅ OK | Admin e dados bloqueados corretamente |
| `canonical` | ✅ OK | Na página inicial |
| `lang="pt-BR"` | ✅ OK | No `<html>` |
| H1 único | ✅ OK | "O Sorvete que Cajuru Ama de Verdade" |
| `<title>` | ✅ OK | Descritivo e com palavras-chave locais |
| `<meta description>` | ✅ OK | Presente na página inicial |
| Open Graph | ✅ OK | Presente e completo |
| Schema.org | ✅ Presente | Mas com **problemas críticos** (ver seção 6) |
| `preconnect` para fontes | ✅ OK | Google Fonts otimizado |
| `<link rel="preload">` logo | ✅ OK | Otimiza LCP |
| HTTPS | ✅ OK | Redirecionamento ativo |
| Geo meta tags | ✅ OK | `geo.region`, `geo.placename` |
| `robots.txt` bloqueia admin | ✅ OK | |
| `skip link` acessibilidade | ✅ OK | "Pular para conteúdo" |

---

## 2. PROBLEMAS IDENTIFICADOS — PRIORIDADES

### 2.1 CRÍTICOS (bloquear aprovação se não corrigidos)

| # | Problema | Arquivo | Descrição |
|---|---|---|---|
| **SC-01** | AggregateRating com dados não verificados | `index.html` linhas 166-168, 204-206, 230-232 | `ratingValue: 4.8`, `reviewCount: 250/180/300` — se estes números não correspondem às avaliações reais verificáveis do Google, violam as diretrizes de dados estruturados do Google (risco de penalidade manual) |
| **SC-02** | Schema IceCreamShop duplicado | `index.html` linhas 86 e 1873 | 9 blocos `application/ld+json` no mesmo arquivo — Schema `LocalBusiness` aparece ao menos 2 vezes com dados redundantes. Consolidar. |
| **SC-03** | FAQ schema com resposta sobre entrega em Ribeirão Preto | `index.html` linha 2063 | "Para encomendas de entrega, consulte disponibilidade pelo WhatsApp" — mas o bot responde que não há delivery. Inconsistência de conteúdo entre schema e bot. |
| **SC-04** | `horarioStatusTexto` fixo no config.json | `dados/config.json` | "Aberto agora · Fecha às 22h" — texto fixo, não calculado. Pode aparecer em schema e metadados incorretamente. |

### 2.2 ALTOS (corrigir no Lote E — SEO técnico)

| # | Problema | Arquivo | Descrição |
|---|---|---|---|
| **SA-01** | URLs `.html` expostas no sitemap | `sitemap.xml` | `/encomendas.html`, `/sobre.html` — tecnicamente aceitável mas URLs sem extensão são melhores para SEO e UX (`/encomendas`, `/sobre`) |
| **SA-02** | Páginas secundárias sem `<meta description>` confirmada | `encomendas.html`, `sobre.html`, `dicas.html` | A verificar — cada página deve ter uma meta description única |
| **SA-03** | Páginas secundárias sem canonical | `encomendas.html`, `sobre.html`, `galeria.html` | Cada página deve ter `<link rel="canonical">` apontando para sua própria URL |
| **SA-04** | Carrossel (`carrossel.html`) sem rastreamento | `sitemap.xml` | Não está no sitemap. Verificar se deve ser indexada ou bloqueada. |
| **SA-05** | Dados estruturados sem `@id` canônico | `index.html` | Os blocos JSON-LD do LocalBusiness não têm `@id` com URL canônica, dificultando a mesclagem pelo Google Knowledge Graph |
| **SA-06** | Schema `Review` com autor "Carlos Augusto" hardcoded | `index.html` linha 177 | Avaliação fixa no código não é atualizada dinamicamente — Google pode interpretar como dado falso se não for uma avaliação real e verificável |
| **SA-07** | `sitemap.xml` com `<lastmod>` desatualizada | `sitemap.xml` | Data `2026-05-18` hardcoded — deve ser atualizada a cada deploy |

### 2.3 MÉDIOS (Lote E ou Lote F)

| # | Problema | Descrição |
|---|---|---|
| **SM-01** | Ausência de páginas dedicadas por categoria | Não há `/cardapio`, `/sorvetes`, `/picoles`, `/acai`, `/milk-shakes` — todo conteúdo em `index.html`. Oportunidade perdida de ranquear para buscas específicas. |
| **SM-02** | Breadcrumbs sem marcação ARIA | Schema BreadcrumbList existe, mas verificar se há `nav[aria-label]` + links visíveis correspondentes no HTML. |
| **SM-03** | H2/H3 dentro do JS injetado | O widget injeta HTML mas os headings não fazem parte do DOM rastreável inicial. |
| **SM-04** | Alt text em imagens carregadas dinamicamente | Imagens de sabores carregadas via `produtos.json` — verificar se têm `alt` descritivo. |
| **SM-05** | Performance do `index.html` (5.378 linhas) | Arquivo muito grande. JavaScript inline extenso pode afetar LCP e FID/INP. |
| **SM-06** | Falta de FAQ visível nas páginas de encomendas e categorias | FAQ schema existe no `index.html`, mas não há FAQ visível na página de encomendas. |

### 2.4 BAIXOS (Lote G)

| # | Problema | Descrição |
|---|---|---|
| **SB-01** | `sitemap.xml` sem `<image:loc>` para todas as imagens | Apenas logo está no sitemap. Imagens de produto poderiam ser incluídas. |
| **SB-02** | Páginas sem `<link rel="alternate" hreflang>` | Não aplicável agora (site monolíngue) mas documentar para o futuro. |
| **SB-03** | Perfil do Google não auditado diretamente | Verificar consistência NAP (Nome, Endereço, Telefone) entre site e Google Business Profile. |

---

## 3. SITEMAP PROPOSTO

### 3.1 Sitemap atual (6 URLs)

```xml
/                          priority 1.0
/encomendas.html           priority 0.9
/promocao.html             priority 0.85
/sobre.html                priority 0.75
/dicas.html                priority 0.7
/galeria.html              priority 0.65
```

### 3.2 Sitemap proposto (Lote E — aguarda aprovação)

O sitemap proposto **mantém as URLs existentes** e apenas adiciona as novas páginas que forem criadas. Não redirecionar ou remover URLs existentes sem aprovação e plano de redirecionamento.

```
URL                             Prioridade  Frequência   Tipo
───────────────────────────────────────────────────────────────────
/                               1.0         semanal      Início
/encomendas.html ou /encomendas 0.9         semanal      Conversão
/cardapio (NOVA)                0.85        semanal      Catálogo
/picolés (NOVA)                 0.80        mensal       Catálogo
/sorvetes (NOVA)                0.80        mensal       Catálogo
/acai (NOVA)                    0.80        mensal       Catálogo
/milk-shakes (NOVA)             0.75        mensal       Catálogo
/festas-e-eventos (NOVA)        0.85        mensal       Conversão
/revenda (NOVA)                 0.80        mensal       Conversão
/horario-e-localizacao (NOVA)   0.70        mensal       Informação
/promocao.html ou /promocoes    0.75        semanal      Conteúdo
/sobre.html ou /sobre           0.65        mensal       Institucional
/dicas.html                     0.60        mensal       Conteúdo
/galeria.html                   0.60        mensal       Conteúdo
/contato (NOVA)                 0.65        mensal       Contato
/politica-privacidade.html      0.30        anual        Legal
```

**Novas páginas** — criar somente com conteúdo original e finalidade real. Não criar páginas para repetir palavras-chave.

**Decisão pendente:** manter `.html` nas URLs ou migrar para URLs sem extensão com redirecionamento 301. Esta decisão requer aprovação e plano de redirecionamento.

---

## 4. MAPA DE PALAVRAS-CHAVE POR PÁGINA

### Metodologia

As palavras-chave listadas são baseadas em análise semântica e contexto local. Não representam volume garantido — verificar no Google Search Console e Google Keyword Planner antes de priorizar.

### 4.1 Página inicial `/`

| Tipo | Palavra-chave |
|---|---|
| **Principal** | sorveteria em Cajuru |
| **Principal** | sorvete em Cajuru SP |
| **Suporte** | sorveteria Cajuru SP |
| **Suporte** | Itapolitana Cajuru |
| **Suporte** | sorvete artesanal Cajuru |
| **Local** | sorvete perto de Cajuru |
| **Local** | onde tomar sorvete em Cajuru |
| **Navegacional** | Sorveteria Itapolitana horário |
| **Navegacional** | Sorveteria Itapolitana endereço |
| **Navegacional** | Sorveteria Itapolitana WhatsApp |
| **CTA** | aberto agora sorveteria Cajuru |

**H1 atual:** "O Sorvete que Cajuru Ama de Verdade"
**Title atual:** ✅ Bom — contém "Cajuru", "artesanais", "picolés", "Açaí"
**Meta description:** ✅ Presente — verificar se menciona "Cajuru/SP" explicitamente

---

### 4.2 Página `/encomendas.html`

| Tipo | Palavra-chave |
|---|---|
| **Principal** | encomenda de sorvete Cajuru |
| **Principal** | sorvete para festa Cajuru |
| **Suporte** | torta de sorvete encomenda |
| **Suporte** | picolé para festa encomenda |
| **Suporte** | sorvete em litros para evento |
| **Suporte** | picolé para revenda Cajuru |
| **Transacional** | pedir sorvete para festa SP |
| **Transacional** | encomendar sorvete artesanal |
| **Informacional** | como encomendar sorvete para festa |

**H1 proposto:** "Encomendas de Sorvete para Festas e Eventos em Cajuru"
**Sugestão:** Adicionar FAQ schema específico de encomendas nesta página.

---

### 4.3 Página `/cardapio` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | cardápio sorveteria Cajuru |
| **Principal** | sabores de sorvete Cajuru |
| **Suporte** | cardápio açaí Cajuru |
| **Suporte** | milk-shake Cajuru preço |
| **Suporte** | preço sorvete Cajuru |
| **Informacional** | quais sabores de sorvete tem em Cajuru |

---

### 4.4 Página `/picolés` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | picolé em Cajuru |
| **Principal** | picolé especial Cajuru |
| **Suporte** | picolé de Leite Ninho Cajuru |
| **Suporte** | picolé de Ovomaltine |
| **Suporte** | picolé para revenda preço |
| **Suporte** | picolé atacado sorveteria |
| **Transacional** | comprar picolé atacado Cajuru |

---

### 4.5 Página `/acai` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | açaí em Cajuru |
| **Principal** | açaí Cajuru SP |
| **Suporte** | açaí Natureon |
| **Suporte** | melhor açaí de Cajuru |
| **Suporte** | açaí cremoso Cajuru |

---

### 4.6 Página `/festas-e-eventos` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | sorvete para festas Cajuru |
| **Principal** | carrinho de sorvete para evento |
| **Suporte** | sorvete para aniversário Cajuru |
| **Suporte** | torta de sorvete festa |
| **Suporte** | picolé para festa infantil Cajuru |

---

### 4.7 Página `/revenda` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | revenda de sorvete Cajuru |
| **Principal** | picolé para revenda SP interior |
| **Suporte** | sorvete atacado Cajuru |
| **Suporte** | distribuição de picolé sorveteria |
| **Transacional** | quero revender picolé |

---

### 4.8 Página `/horario-e-localizacao` (NOVA — aguarda aprovação)

| Tipo | Palavra-chave |
|---|---|
| **Principal** | horário sorveteria Cajuru |
| **Principal** | endereço Sorveteria Itapolitana Cajuru |
| **Suporte** | onde fica Itapolitana Cajuru |
| **Suporte** | Praça Largo São Bento Cajuru sorvete |
| **Navegacional** | Sorveteria Itapolitana aberta agora |

---

## 5. PLANO DE SEO LOCAL

### 5.1 O que já está presente no site

| Item | Status | Detalhe |
|---|---|---|
| Endereço no schema | ✅ | Rua Cel. Manoel Caetano, 311 – Cajuru/SP |
| Coordenadas GeoCoordinates | ✅ | Lat/Long no schema |
| Horário no schema | ✅ | OpeningHoursSpecification — verificar se está correto |
| Telefone/WhatsApp | ✅ | (16) 99606-2046 no schema e conteúdo |
| `geo.region`, `geo.placename` | ✅ | Meta tags presentes |
| Cidades de alcance no schema | ✅ | Cajuru, Cássia dos Coqueiros, Ribeirão Preto, Santa Cruz da Esperança |

### 5.2 Perfil da Empresa no Google (Google Business Profile)

**Verificar consistência entre o site e o perfil:**

| Campo | Valor no site | Verificar no Google |
|---|---|---|
| Nome | Sorveteria Itapolitana | Deve ser exatamente o mesmo |
| Endereço | Rua Cel. Manoel Caetano, 311 – Praça Largo São Bento, Cajuru/SP | Deve ser idêntico |
| Telefone | (16) 99606-2046 | Deve ser idêntico |
| Horário | Todos os dias, 10h–22h | Deve ser atualizado com horários especiais |
| Categoria principal | Sorveteria | Confirmar se está como "Sorveteria" |
| Categorias secundárias | Açaíteria, Doceria | Adicionar se aplicável |
| Site | https://itapolitanacajuru.com.br | Deve apontar para a URL canônica |
| WhatsApp | (16) 99606-2046 | Adicionar ao perfil |

**Ações recomendadas para o Google Business Profile:**

1. Verificar se o perfil está reivindicado e verificado.
2. Adicionar fotos profissionais reais (ambiente, produtos, equipe).
3. Responder às perguntas do painel de Q&A.
4. Atualizar horários especiais (feriados, datas comemorativas).
5. Criar posts periódicos com promoções ou novidades.
6. **Nunca** criar avaliações falsas ou oferecer recompensa por avaliação.

### 5.3 Consistência NAP (Nome, Endereço, Telefone)

O NAP deve ser **idêntico** em:

- Site (página inicial + páginas de localização).
- Google Business Profile.
- Dados estruturados (schema.org).
- Instagram (bio).
- WhatsApp Business.
- iFood, Rappi ou qualquer plataforma de delivery (se houver presença).
- Páginas de avaliação (TripAdvisor, Google Maps).

**Divergências NAP** são um dos principais fatores de penalidade para SEO local.

---

## 6. DADOS ESTRUTURADOS — DIAGNÓSTICO E PROPOSTA

### 6.1 Blocos JSON-LD atuais (9 no index.html)

| # | Tipo | Linha | Problema |
|---|---|---|---|
| 1 | `IceCreamShop + FoodEstablishment + Restaurant` | 86 | ✅ OK, mas sem `@id` canônico |
| 2 | `Product` (sorvete) | 146 | ⚠️ `AggregateRating` com `reviewCount: 250` — verificar se é real |
| 3 | `Product` (açaí) | 184 | ⚠️ `AggregateRating` com `reviewCount: 180` — verificar se é real |
| 4 | `Product` (torta) | 210 | ⚠️ `AggregateRating` com `reviewCount: 300` — verificar se é real |
| 5 | (a verificar) | 1873 | Segundo bloco de LocalBusiness — **duplicata** |
| 6 | `FAQPage` | 2027 | ✅ OK — mas FAQ sobre entrega inconsistente com bot |
| 7 | `BreadcrumbList` | 2084 | ✅ OK |
| 8 | (a verificar) | 2129 | A auditar |
| 9 | (a verificar) | inline | A auditar |

### 6.2 Problema crítico: AggregateRating com dados não verificados

Os blocos de schema `Product` contêm avaliações (`AggregateRating`) com:
- `ratingValue: "4.8"` e `reviewCount: "250"`
- `ratingValue: "4.8"` e `reviewCount: "180"`
- `ratingValue: "4.7"` e `reviewCount: "300"`

E uma avaliação individual hardcoded:
- `Review` com autor `"Carlos Augusto"` e `ratingValue: "5"`

**Se estes números não correspondem às avaliações reais e verificáveis destes produtos**, isso viola as [Diretrizes de dados estruturados do Google](https://developers.google.com/search/docs/appearance/structured-data/product) e pode resultar em **penalidade manual**. O Google exige que avaliações em schema sejam de avaliações reais de usuários, coletadas de forma legítima.

**Ação recomendada:** Confirmar com o proprietário se estas avaliações são reais e verificáveis. Se não forem, remover os blocos `AggregateRating` e `Review` no Lote E.

**Não remover sem aprovação explícita do proprietário.**

### 6.3 Proposta de consolidação (Lote E)

```
index.html — manter somente:
  1. LocalBusiness (único, com @id canônico)
  2. FAQPage (atualizado e consistente com o bot)
  3. BreadcrumbList
  4. WebSite com SearchAction (se aplicável)

Remover ou corrigir:
  - Schema duplicado LocalBusiness
  - AggregateRating com dados não confirmados
  - Review hardcoded com autor fictício
```

---

## 7. PERFORMANCE E CORE WEB VITALS

### 7.1 Diagnóstico sem Lighthouse ao vivo (somente leitura)

| Fator | Diagnóstico estático | Risco |
|---|---|---|
| **index.html tamanho** | 5.378 linhas, JS inline extenso | ALTO — LCP e INP afetados |
| **JS inline no index.html** | Funções de cardápio, chat, RESPOSTAS, produtosJSON | MÉDIO — atrasa parsing |
| **Scripts de terceiros** | Google Analytics, Consent Mode v2 | MÉDIO — bloqueio possível |
| **Imagens** | `images/logo.webp` tem preload ✅ | BAIXO |
| **Fontes** | Poppins/Inter com preconnect ✅ | BAIXO |
| **PWA** | Service Worker presente (`sw.js`) | ✅ Positivo |
| **Cache** | Verificar headers Cloudflare | A verificar |
| **ita-bot-widget.js** | Carregado com `defer` | ✅ Não bloqueia |
| **Imagens de produtos** | Carregadas via JSON + DOM | MÉDIO — sem `loading="lazy"` confirmado |

### 7.2 Métricas-alvo (Core Web Vitals)

| Métrica | Meta Google "Bom" | Prioridade |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2,5s | ALTA |
| INP (Interaction to Next Paint) | < 200ms | ALTA |
| CLS (Cumulative Layout Shift) | < 0,1 | ALTA |
| FCP (First Contentful Paint) | < 1,8s | MÉDIA |
| TTFB (Time to First Byte) | < 800ms | MÉDIA (Cloudflare) |

### 7.3 Ações para o Lote F

| Ação | Impacto esperado | Risco |
|---|---|---|
| Extrair JS inline crítico para arquivos externos com `defer` | LCP, INP | MÉDIO — testar antes |
| Minificar `index.html` | LCP, TTFB | BAIXO |
| Verificar `loading="lazy"` em todas as imagens abaixo do fold | LCP, CLS | BAIXO |
| Auditar scripts de terceiros — remover ou adiar os não essenciais | INP | MÉDIO |
| Reservar espaço para imagens carregadas via JS | CLS | BAIXO |
| Executar Lighthouse no ambiente de teste | Todos | BÁSICO |

---

## 8. ACESSIBILIDADE WCAG

### 8.1 Diagnóstico estático

| Item | Status | Detalhe |
|---|---|---|
| Skip link | ✅ OK | "Pular para o conteúdo principal" presente |
| `lang="pt-BR"` | ✅ OK | No `<html>` |
| `aria-expanded`, `aria-controls` | ✅ OK | Nos accordeões |
| `aria-label` em botões de fechar | ✅ OK | |
| Contraste da `.strip-sensorial` | ✅ Corrigido | Era `#F9A825`/`#C62828` (1.85:1 — reprovado). Corrigido para `#fff` (5.5:1) |
| `aria-live` no chat | ✅ OK | `aria-live="polite"` na área de mensagens |
| Focus trap no modal do chat | ⚠️ Verificar | O `#chat-dialog` tem `role="dialog"` mas focus trap JS a confirmar |
| Foco retorna ao botão ao fechar chat | ⚠️ Verificar | `_itabotFecharChatDialog()` não restaura foco ao trigger |
| Contraste de `.avaliacao-autor` | ⚠️ Sugestão | `color:#e91e63` — verificar contraste sobre fundo claro |
| Área de toque mínima 44px | ⚠️ Verificar | Chips e botões do chat — confirmar via Lighthouse |
| `prefers-reduced-motion` | ⚠️ Verificar | Animações do strip sensorial e carrossel |
| Navegação por teclado no cardápio | ⚠️ Verificar | Abas e accordeões devem funcionar com Tab/Enter/Space |

### 8.2 Ações para o Lote D (acessibilidade mobile e Lote E)

- [ ] Verificar focus trap no `#chat-dialog` com `Tab` e `Shift+Tab`.
- [ ] Restaurar foco ao botão trigger ao fechar o chat.
- [ ] Testar todos os chips com teclado e leitor de tela (VoiceOver, TalkBack).
- [ ] Confirmar `prefers-reduced-motion` nas animações.
- [ ] Testar no NVDA + Chrome e VoiceOver + Safari.

---

## 9. PRIVACIDADE, SEGURANÇA E LGPD

### 9.1 Diagnóstico de segurança (somente leitura)

| Item | Status | Observação |
|---|---|---|
| HTTPS | ✅ OK | Redirecionamento ativo |
| HSTS (`Strict-Transport-Security`) | ✅ OK | Meta HTTP-equiv presente |
| `X-Content-Type-Options: nosniff` | ✅ OK | Meta presente |
| `Referrer-Policy` | ✅ OK | `strict-origin-when-cross-origin` |
| Admin bloqueado em `robots.txt` | ✅ OK | `/admin-painel.html` e similares bloqueados |
| Dados sensíveis no `robots.txt` | ✅ OK | `dados/clientes.json`, `dados/pedidos.json` bloqueados |
| Consent Mode v2 (Google) | ✅ OK | Presente antes do GA |
| Script `check-exposed-tokens.js` | ⚠️ Bloqueado em `robots.txt` | Mas o arquivo existe — verificar se tokens são carregados no cliente |
| Formulário "Fale Conosco" | ⚠️ Verificar | Verificar se envia PII para Analytics antes do envio |
| Chatbot solicita nome no fluxo de fidelidade | ⚠️ Fluxo residual | Programa encerrado — o fluxo ainda solicita nome, não deve |

### 9.2 Problemas de LGPD

| # | Problema | Risco | Ação |
|---|---|---|---|
| **L-01** | Fluxo de fidelidade encerrado ainda solicita nome | MÉDIO | Remover no Lote A ou B |
| **L-02** | Chat não informa se a conversa é armazenada | MÉDIO | Adicionar texto informativo ao abrir o bot |
| **L-03** | Analytics — verificar eventos com texto completo | ALTO | Confirmar que mensagens completas do chat NÃO são enviadas ao GA |
| **L-04** | Formulário "Fale Conosco" | BAIXO | Verificar se nome/telefone são enviados ao GA antes do clique do usuário |
| **L-05** | Cookie banner — verificar conformidade | MÉDIO | Verificar se o consentimento é obtido antes de ativar o GA |

### 9.3 Segurança do repositório

| Item | Status | Observação |
|---|---|---|
| Secrets no repositório | ✅ OK | `robots.txt` bloqueia `check-exposed-tokens.js` |
| `dados/auth.json` | ✅ Bloqueado | `robots.txt` protege |
| Tokens do GitHub API | ⚠️ Verificar | O sistema de fidelidade usa GitHub API — confirmar que tokens não estão no código cliente |
| Dados de clientes | ✅ Bloqueado | `dados/clientes.json` bloqueado em robots.txt |

---

## 10. PRIORIZAÇÃO DE MELHORIAS

### 10.1 Por lote

| Lote | Item | Impacto | Risco |
|---|---|---|---|
| **A** | Corrigir Ovomaltine (picolé vs sorvete) | CRÍTICO para UX | BAIXO |
| **A** | Remover fluxo de fidelidade encerrado (solicita nome) | MÉDIO para LGPD | BAIXO |
| **B** | Adicionar intenção de alergênicos com aviso de segurança | MÉDIO para UX | BAIXO |
| **B** | Delivery com CTA completo | MÉDIO para conversão | BAIXO |
| **C** | Horário dinâmico (calcular "aberto agora") | MÉDIO para UX e SEO | MÉDIO |
| **D** | Campo de digitação acima do teclado (mobile) | CRÍTICO para UX | MÉDIO |
| **E** | Remover/corrigir AggregateRating não verificado | CRÍTICO para SEO | ALTO (requer aprovação) |
| **E** | Consolidar 9 blocos JSON-LD em 3-4 | ALTO para SEO | MÉDIO |
| **E** | Canonical + meta description em todas as páginas | ALTO para SEO | BAIXO |
| **E** | Atualizar sitemap.xml com `<lastmod>` dinâmica | MÉDIO para SEO | BAIXO |
| **E** | FAQ schema consistente com respostas do bot | ALTO para SEO | BAIXO |
| **F** | Lighthouse no ambiente de teste | BÁSICO | BAIXO |
| **F** | Otimizar JS inline no index.html | MÉDIO para performance | ALTO |
| **G** | Páginas dedicadas por categoria (cardápio, picolés) | MÉDIO para SEO | MÉDIO |
| **G** | Google Business Profile auditado e otimizado | ALTO para SEO local | BAIXO |

### 10.2 Matriz impacto × risco

```
         BAIXO RISCO        MÉDIO RISCO         ALTO RISCO
ALTO     ─────────────────────────────────────────────────────
IMPACTO  Canonical todas    FAQ schema           AggregateRating
         Meta description   Horário dinâmico     JS inline otimizar
         Delivery CTA       Focus trap
         Fidelidade remover

MÉDIO    ─────────────────────────────────────────────────────
IMPACTO  Sitemap lastmod    Novas páginas        Tokens verificar
         Alergênicos        Lazy loading
         Breadcrumbs ARIA

BAIXO    ─────────────────────────────────────────────────────
IMPACTO  Alt text dinamico  Minificação          —
         hreflang futuro
```

### 10.3 Quick wins (alto impacto, baixo risco — Lote E)

1. **Adicionar `<meta description>` em todas as páginas** — 30 min, sem risco.
2. **Adicionar `<link rel="canonical">` em todas as páginas** — 30 min, sem risco.
3. **Corrigir FAQ schema para ser consistente com respostas do bot** — 1h, sem risco.
4. **Atualizar `<lastmod>` do sitemap com script de build** — 1h, baixo risco.
5. **Remover fluxo de fidelidade encerrado** — 1h, baixo risco (já aprovado no Lote A).

---

## DECISÕES QUE AGUARDAM APROVAÇÃO

| # | Decisão | Impacto | Aguarda |
|---|---|---|---|
| D-01 | Os `AggregateRating` e `Review` hardcoded são reais? | CRÍTICO — remover se não forem | Confirmação do proprietário |
| D-02 | Migrar URLs para sem extensão (`.html` → sem extensão)? | MÉDIO — risco de 404 se mal executado | Aprovação + plano de redirecionamento |
| D-03 | Criar páginas `/cardapio`, `/picolés`, `/sorvetes`? | ALTO para SEO | Aprovação de conteúdo |
| D-04 | Criar página `/revenda`? | ALTO para conversão B2B | Aprovação + conteúdo real |
| D-05 | Remover tokens da GitHub API do código cliente (fidelidade)? | CRÍTICO para segurança | Verificação técnica + aprovação |

---

*Documento de diagnóstico SEO — Lote 0. Não implementar sem aprovação por lote.*
