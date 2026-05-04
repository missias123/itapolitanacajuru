# RELATORIO.md – Melhorias Home & Cardápio (PR #13)

## 1. Mapa de Arquivos

### Arquivos que renderizam a Home e o Cardápio

| Arquivo | Função |
|---|---|
| `index.html` | **Arquivo único** que contém Home + Cardápio completo (SPA em arquivo único) |
| `dados/config.json` | Configuração central: heroTitulo, heroBadge, heroDescricao, heroCta, heroCtaWhats, cardapioTitulo, SEO, WhatsApp, footer, etc. |
| `scripts/site-loader.js` | Carregador do site: fetch do config.json, inicializa dados (carregado com `defer`) |
| `scripts/products.js` | Dados de produtos/preços (carregado com `defer`) |
| `carrossel.html` | Carrossel de banners (carregado via iframe dentro do `#cardápio`) |

### Includes comuns (header/footer/assets)

| Elemento | Localização em `index.html` |
|---|---|
| `<header class="header">` | linha ~1872 — logo + nav (Encomendas, Promoção, Dicas, Fidelidade) |
| `<footer class="footer">` | linha ~2292 — logo, horário, endereço, redes sociais, mapa |
| Logo | `images/logo.webp` — preloaded com `fetchpriority="high"` |
| CSS | Tudo inline em `<style>` dentro do `<head>` |
| Scripts externos | `defer`: `site-loader.js`, `products.js`; `async`: Google Analytics/GTM |

### Onde acontece a injeção de dados do painel

| Dado | Fonte | Como aplica |
|---|---|---|
| Textos Hero (título, badge, frases) | `config.json` → `aplicarConfig()` | IDs `hero-título`, `hero-badge`, `frase-rotativa` |
| Título/subtítulo do cardápio | `config.json` → `aplicarConfig()` | Classe `.cardápio-h` |
| Preços e produtos | `products.js` + localStorage | Funções `renderSorvetes()`, `renderMilk()`, etc. |
| Loops de categorias (accordions) | `products.js` → `renderTudo()` | Grids `#sorvetes-grid`, `#milk-grid`, etc. |
| Configuração WhatsApp | `config.json` → `aplicarConfig()` | Todos os `a[href*="wa.me"]` |
| Promoções | `config.json` → `carregarBarraPromo()` | `#promo-top-bar`, `#promo-fab` |
| Fidelidade/Estrela | `estrelas_ciclo.json` + `motor-estrelas-v2.js` | Mascote via `mascote.js` |

---

## 2. Mudanças Aplicadas na PR #13

### SEO – Títulos e Meta

| Campo | Antes | Depois |
|---|---|---|
| `<title>` | `Sorveteria Itapolitana Cajuru – Sorvete Artesanal e Açaí SP` | `Sorveteria Itapolitana Cajuru – Sorvetes tipo artesanal & Açaí` |
| H1 (fallback HTML) | `O Sorvete que Cajuru Ama de Verdade` | `Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí` |
| `config.json` `heroTitulo` | `O Sorvete que Cajuru Ama de Verdade` | `Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí` |

**Headings recomendados na Home (hierarquia atual):**
- `H1`: Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí (hero)
- `H2`: 🍦 Escolha sua Felicidade Hoje (cardápio)
- `H2`: 💬 O que nossos clientes dizem (avaliações)

---

### 3. Hero – Melhorias Aplicadas

1. **H1 único e forte** com texto SEO: "Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí"
2. **Linha de prova social** (`#hero-proof`): "19+ anos · 35+ sabores · 4,8 ⭐ no Google"
3. **Dois CTAs**:
   - Primário (`#hero-cta`): "🍦 Ver cardápio completo" → ancora em `#cardápio` + abre o accordion
   - Secundário (`#hero-cta-whats`): "💬 Pedir no WhatsApp" → link direto `wa.me`
4. **Configuráveis via `config.json`**: campos `heroCta` e `heroCtaWhats` agora estão conectados a `#hero-cta-text` e `#hero-cta-whats-text` em `aplicarConfig()`

---

### 4. Cardápio – Navegação Sticky

**Barra horizontal sticky** adicionada dentro do `#vc-container` (aparece quando o cardápio abre):
- ID: `#menu-categorias-cardapio`
- Mobile-first: overflow-x scroll sem scrollbar visível
- Pills com emoji + nome de categoria
- Clique na pill: abre o accordion correspondente + scroll suave (`prefers-reduced-motion` respeitado)
- A barra aparece/oculta junto com o cardápio via `toggleCardápio()` / `fecharCardápio()`

**IDs dos accordions mapeados na barra:**

| Pill | ID do Accordion |
|---|---|
| Sorvetes | `#acc-sorvetes` |
| Picolés | `#acc-picolés` |
| Açaí Promo | `#acc-açaí-promo` |
| Açaí | `#acc-açaí` |
| Milkshakes | `#acc-milk` |
| Taças | `#acc-tacas` |
| Taças Premium | `#acc-tacas-p` |
| Viagem | `#acc-iso` |
| Sobremesas | `#acc-sobremesas` |
| Encomendas | `#acc-encomendas` → ancora `#acc-enc-caixas` |

---

### 5. Destaques / Mais pedidos

**Situação atual:** O painel não possui campo `is_featured` ou `destaque` nos produtos.

**Markup preparado:** CSS `.item-destaque` adicionado para uso futuro.

**Sugestão futura (sem alterar lógica de dados):**
1. Adicionar campo booleano `destaque: true` em `dados/produtos.json` para os itens desejados
2. No `renderTudo()` filtrar itens com `destaque === true` e renderizá-los numa seção `.cardapio-destaques` no topo do cardápio
3. Exemplo de produtos sugeridos como destaque: Sorvete 2 bolas, Açaí 400ml, Milkshake 300ml, Torta de Sorvete

---

### 6. Padronização de CTAs (Antes → Depois)

| Localização | Antes | Depois |
|---|---|---|
| acc-enc-tortas / botão | `🎂 Ver Tortas de Sorvete e Encomendar →` | `🎂 Ver tortas de sorvete` + `💬 Encomendar no WhatsApp` |
| acc-enc-picolés / botão | `🍭 Ver Picolés e Encomendar →` | `🍭 Ver picolés` + `💬 Encomendar no WhatsApp` |
| Hero / CTA principal | *(não existia)* | `🍦 Ver cardápio completo` |
| Hero / CTA secundário | *(não existia)* | `💬 Pedir no WhatsApp` |

**Padrão adotado:**
- Primário: verbo de ação + objeto curto ("Ver ...", "Pedir no ...")
- Secundário (WhatsApp): sempre "... no WhatsApp" ou "Encomendar no WhatsApp"
- Sem seta `→` exceto onde claramente indica navegação externa

---

### 7. Performance

#### Imagens
- **Logo (header)**: `loading="eager" fetchpriority="high"` ✅ (já existia)
- **Carrinhos cortesia (hero)**: `loading="lazy" decoding="async" width/height srcset` ✅ (já existia)
- **Footer logo**: `loading="lazy" decoding="async"` ✅ (já existia)
- **Ícone encomendas**: `loading="lazy" decoding="async" width/height srcset` ✅ (já existia)
- **Carrossel**: `loading="eager"` (correto – carrossel está acima da dobra)

#### Scripts
| Script | Antes | Depois |
|---|---|---|
| `site-loader.js` | `defer` | `defer` ✅ (mantido) |
| `products.js` | `defer` | `defer` ✅ (mantido) |
| Google Analytics | `async` | `async` ✅ (mantido) |
| `motor-estrelas-v2.js` + `mascote.js` | Dynamic inject (imediato) | `requestIdleCallback` com `timeout:3000` (fallback `setTimeout 1000ms`) |
| Ita Bot (exibição) | `setTimeout 5000ms` | `setTimeout 5000ms` ✅ (mantido – já é lazy) |
| Cookie banner | `DOMContentLoaded` | `DOMContentLoaded` ✅ (mantido) |

#### CSS
O CSS está 100% inline no `<head>` (~1600 linhas). **Observações:**
- Há múltiplos blocos `@media` com breakpoints sobrepostos (480px, 600px, 601px, 768px, 900px, 1024px, 1025px, 1200px). Pode-se consolidar em futura sprint.
- Regras para `.hero h2` e `.cardápio` aparecem em 4+ breakpoints separados. Oportunidade de uso de `clamp()` para reduzir repetição.
- Nenhum CSS de terceiros é carregado — zero bloqueio de renderização por CSS externo ✅

---

## 3. Compatibilidade com Painel Admin

- ✅ `dados/config.json` continua como fonte única de verdade
- ✅ `aplicarConfig()` atualizado para suportar `heroCta` e `heroCtaWhats` (IDs `#hero-cta-text`, `#hero-cta-whats-text`)
- ✅ Loops de produtos (`renderTudo()`, `renderSorvetes()`, etc.) não foram alterados
- ✅ IDs dos accordions mantidos idênticos (`#acc-sorvetes`, `#acc-picolés`, etc.)
- ✅ Rotas/URLs não foram alteradas
- ✅ Identidade visual (cores, gradientes, tipografia) mantida

---

*Gerado em 2026-05-04 · PR #13 · Branch: copilot/wip-13-evoluir-home-e-cardapio*
