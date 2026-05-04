# RELATORIO.md — Evolução Home e Cardápio com UX/SEO/Performance

> **PR:** Evoluir Home e Cardápio com UX/SEO/performance mantendo painel

---

## 1. Objetivo

Evoluir visualmente e tecnicamente as páginas **Home** e **Cardápio** da Sorveteria Itapolitana (Cajuru/SP) com foco em:
- UX/UI moderna (estilo grandes marcas: iFood, McDonald's, Outback)
- SEO técnico e semântico (H1, title, meta description, JSON-LD)
- Performance / Core Web Vitals (lazy loading, CLS, scripts diferidos)
- 100% de compatibilidade com o painel admin existente (nenhum campo removido ou renomeado)

---

## 2. Mapa de Arquivos — Quais páginas renderizam o quê

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| **Home + Cardápio** | `index.html` | Página única. Contém hero, stats, categorias, destaques, encomendas, cardápio completo (accordions), depoimentos, footer. |
| **Promoções** | `promocao.html` | Página isolada de promoções e sorteio. |
| **Encomendas** | `encomendas.html` | Página de encomendas (caixas, tortas, picolés, carrinho). |
| **Dicas/Depoimentos** | `dicas.html` | Dicas e avaliações de clientes. |
| **Fidelidade** | `fidelidade.html` | Clube de fidelidade / estrelas. |
| **Admin** | `admin-painel.html` | Painel administrativo. Salva dados em `dados/*.json` via GitHub API. |
| **Carrossel** | `carrossel.html` | Banners/carrossel de fotos — embutido via `<iframe>` no `index.html`. |

### Includes / Assets comuns
- **CSS principal:** embutido em `<style>` no `<head>` do `index.html` (sem arquivo externo separado)
- **CSS mascote:** `mascote.css` — importado via `<link>` no `<head>`
- **JS principal:** embutido em múltiplos `<script>` inline no `index.html`
- **JS motor estrelas:** `scripts/motor-estrelas-v2.js` — carregado dinamicamente via `<script>` inline no final do body
- **JS mascote:** `mascote.js` — carregado dinamicamente após o motor de estrelas
- **Google Analytics:** `gtag/js` (async) — no `<head>`
- **Google Tag Manager:** snippet inline — no `<head>`
- **Dados do painel:** `dados/config.json`, `dados/produtos.json`, `dados/promo.json`, `dados/clientes.json`, `dados/fidelidade.json`, `dados/encomendas.json` — via GitHub Raw URL

---

## 3. Como o conteúdo dinâmico do painel é injetado

### 3.1 Fonte de dados
Todos os dados são armazenados no GitHub em arquivos JSON dentro da pasta `dados/`. O painel admin (`admin-painel.html`) salva diretamente via GitHub API (GitHub token no browser). O site lê via `https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/dados/*.json`.

### 3.2 config.json → index.html

A função `carregarConfig()` faz `fetch` do `dados/config.json` e chama `aplicarConfig(c)`. Esta função aplica cada campo ao DOM por ID:

```js
// Exemplo de mapeamento config.json → DOM
document.getElementById('hero-título').innerHTML      ← c.heroH1 || c.heroTitulo
document.getElementById('hero-subtitulo-seo')        ← c.heroSubtituloSEO
document.getElementById('hero-prova')                 ← c.heroProva
document.getElementById('hero-cta-primario')          ← c.heroCTAPrimario
document.getElementById('hero-cta-secundario')        ← c.heroCTASecundario
document.getElementById('home-categorias-titulo')     ← c.homeCategoriasTitle
document.getElementById('home-destaques-titulo')      ← c.homeDestaquesTitle
document.getElementById('home-encomendas-titulo')     ← c.homeEncomendasTitle
document.getElementById('home-encomendas-texto')      ← c.homeEncomendasTexto
document.getElementById('footer-horário')             ← c.footerHorario
document.getElementById('brand-name')                 ← c.nomeEmpresa
```

### 3.3 produtos.json → Cardápio

A função `carregarPreçosNuvemCardápio()` faz `fetch` do `dados/produtos.json` e atualiza o objeto `produtos` em memória. Depois, `renderTudo()` renderiza todos os accordions:

```
produtos.sorvetes.sabores       → renderSorvetes() → #sorvetes-grid
produtos.milkshake              → renderMilk()      → #milk-grid
produtos.tacas.tradicionais     → renderTacas()     → #tacas-grid
produtos.tacas.sujas            → renderTacasP()    → #tacas-p-grid
produtos.açaí.copos             → renderAçaí()      → #açaí-body
produtos.açaí_promo             → renderAçaíPromo() → #açaí-promo-body
produtos.picolés                → renderPicolés()   → (accordions picolés)
produtos.caixas_viagem          → (lista-caixas-cardápio)
produtos.sobremesas             → renderSobremesas()
```

### 3.4 Loop padrão (categoria → itens)

```js
// Padrão de loop: categoria → itens com preço
Object.entries(produtos.tacas.tradicionais).forEach(([nome, preco]) => {
  // cria card de produto com nome e preço
});
```

### 3.5 Navegação inline em 3 níveis

O cardápio usa um sistema de navegação **sem modal e sem pulo de página**:
- **Nível 1:** página principal
- **Nível 2:** cardápio aberto (via `toggleCardápio()`)
- **Nível 3:** categoria expandida (accordion via `toggleAcc()`)
- **Nível 4:** detalhe do produto (via `abrirSaboresInline()`, `abrirPicoléInline()`, etc.)

Usa `_semPulo(fn)` para congelar `scrollY` antes de qualquer mudança de conteúdo e restaurar depois.

---

## 4. Lista de Arquivos Alterados/Criados nesta PR

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `index.html` | Modificado | Hero SEO, seções Categorias/Destaques/Encomendas, performance, aplicarConfig() |
| `dados/config.json` | Modificado | Novos campos heroH1, heroProva, heroCTAPrimario, heroCTASecundario, featured_product_ids, homeCategoriasTitle, homeDestaquesTitle, homeEncomendasTitle, homeEncomendasTexto |
| `RELATORIO.md` | Criado | Este documento |

---

## 5. Novos Campos no Painel (config.json)

Os campos abaixo foram **adicionados** ao `dados/config.json`. Nenhum campo existente foi removido ou renomeado. O painel admin pode exibir estes campos na seção "Configurações da Home".

| Campo | Tipo | Exemplo | Usado em |
|-------|------|---------|----------|
| `heroH1` | string | "Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí" | `#hero-título` (H1 SEO) |
| `heroSubtituloSEO` | string | "35 sabores de sorvete tipo artesanal, açaí, taças, sobremesas e encomendas para festas." | `#hero-subtitulo-seo` |
| `heroProva` | string | "Mais de 19 anos em Cajuru · 35 sabores tipo artesanal · 4,8 ★ no Google" | `#hero-prova` (prova social) |
| `heroCTAPrimario` | string | "Ver cardápio completo" | `#hero-cta-primario` (botão CTA vermelho) |
| `heroCTASecundario` | string | "Fazer pedido pelo WhatsApp" | `#hero-cta-secundario` (botão CTA verde) |
| `homeCategoriasTitle` | string | "🍦 Categorias do Cardápio" | `#home-categorias-titulo` |
| `homeDestaquesTitle` | string | "🌟 Destaques do Momento" | `#home-destaques-titulo` |
| `homeEncomendasTitle` | string | "📦 Encomendas & Eventos" | `#home-encomendas-titulo` |
| `homeEncomendasTexto` | string | "Caixas de sorvete 5L e 10L, tortas geladas, picolés em atacado e carrinhos cortesia para eventos. Prazo mínimo: 3 dias úteis." | `#home-encomendas-texto` |
| `featured_product_ids` | array | `[]` | `#home-destaques-grid` (futuro: produtos destaque via painel) |

### Fallbacks seguros
Todos os novos campos têm valores padrão hardcoded no HTML. Se o campo não estiver preenchido no painel, o fallback estático é exibido sem nenhum erro.

### Como adicionar ao painel admin
No `admin-painel.html`, na seção de configurações, adicionar campos de texto correspondentes que salvem para `dados/config.json`. Exemplo de código PHP/JS a adicionar:

```js
// No admin-painel.html, na seção CONFIG:
const novosCampos = {
  heroH1: document.getElementById('cfg-heroH1').value,
  heroSubtituloSEO: document.getElementById('cfg-heroSubtituloSEO').value,
  heroProva: document.getElementById('cfg-heroProva').value,
  heroCTAPrimario: document.getElementById('cfg-heroCTAPrimario').value,
  heroCTASecundario: document.getElementById('cfg-heroCTASecundario').value,
  homeCategoriasTitle: document.getElementById('cfg-homeCategoriasTitle').value,
  homeDestaquesTitle: document.getElementById('cfg-homeDestaquesTitle').value,
  homeEncomendasTitle: document.getElementById('cfg-homeEncomendasTitle').value,
  homeEncomendasTexto: document.getElementById('cfg-homeEncomendasTexto').value,
  featured_product_ids: [], // array de IDs de produtos destaque
};
// Mesclar com config existente e salvar via GitHub API
```

---

## 6. Mudanças Implementadas

### 6.1 SEO
- **`<title>`** atualizado: `"Sorveteria Itapolitana Cajuru/SP – Sorvete Tipo Artesanal e Açaí"` (≤60 chars) — inclui "Cajuru/SP" e "sorvete tipo artesanal"
- **`<meta description>`** atualizado: versão persuasiva com "4,8★ no Google", "Encomendas para festas" e "Peça pelo WhatsApp!" (≤160 chars)
- **H1** atualizado: `"Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí"` — inclui todos os termos-chave
- **JSON-LD `IceCreamShop`** já existente no `<head>` — mantido sem alterações
- **JSON-LD `FAQPage`** e **`BreadcrumbList`** já existentes — mantidos

### 6.2 Hero Section (UX/CTA)
- **H1 SEO** com termos "sorveteria", "Cajuru/SP", "sorvete tipo artesanal", "açaí"
- **Subtítulo SEO** (`<p id="hero-subtitulo-seo">`) — complementa o H1 com mais palavras-chave
- **Prova social** (`<div id="hero-prova">`) — "Mais de 19 anos em Cajuru · 35 sabores tipo artesanal · 4,8 ★ no Google"
- **CTA Primário** (`#hero-cta-primario`) — botão vermelho "Ver cardápio completo" — abre o cardápio via `toggleCardápio()`
- **CTA Secundário** (`#hero-cta-secundario`) — botão verde WhatsApp "Fazer pedido pelo WhatsApp"
- Todos os textos dos CTAs são editáveis via painel (campo `heroCTAPrimario`/`heroCTASecundario`)

### 6.3 Seção "Categorias do Cardápio"
Nova seção `#home-categorias` com 9 botões (tiles coloridos), um por categoria:
- Sorvetes de Massa, Picolés, Açaí, Milkshakes, Taças, Taças Premium, Viagem, Sobremesas, Encomendas
- Cada botão: abre o cardápio + expande o accordion correto + scroll suave até a categoria
- Layout responsivo: 3 colunas mobile → 4 colunas tablet → 5 colunas desktop
- Acessível: `type="button"`, `aria-label`, `role="list"`

### 6.4 Seção "Destaques do Momento"
Nova seção `#home-destaques` com 3 cards de produtos destaque (fallback estático):
- Taça Premium Kit Kat, Açaí 500ml Especial, Torta de Sorvete
- Cada card exibe: emoji/foto, badge "Mais pedido / Favorito", nome, preço
- Campo `featured_product_ids` em config.json reservado para futuro preenchimento dinâmico via painel

### 6.5 Seção "Encomendas & Eventos"
Nova seção `#home-encomendas` com fundo azul escuro (cor do brand):
- Título e texto editáveis via painel
- Botão primário "Encomendar sorvete em caixa" → `encomendas.html`
- Botão WhatsApp "Encomendar picolés em atacado" → `wa.me`

### 6.6 Performance
- Imagens above-the-fold: `loading="eager"` + `fetchpriority="high"` (logo, herói) — já existiam
- Imagens below-the-fold: `loading="lazy"` + `decoding="async"` — já presentes em todas as imagens existentes
- `width` e `height` em imagens: já presentes nos elementos `<img>` com `picture`
- Google Analytics: `async` — já presente
- Scripts não essenciais (motor estrelas, mascote): carregados via criação dinâmica de `<script>` no final do body — padrão correto

---

## 7. Como Testar

### 7.1 Funcionalidade
- [ ] Abrir `index.html` no browser
- [ ] Verificar H1 exibe "Sorveteria Itapolitana em Cajuru/SP – Sorvete tipo artesanal e Açaí"
- [ ] Verificar prova social exibe "Mais de 19 anos em Cajuru · 35 sabores..."
- [ ] Clicar "Ver cardápio completo" → cardápio abre (accordion visível)
- [ ] Clicar "Fazer pedido pelo WhatsApp" → abre WhatsApp (nova aba)
- [ ] Clicar cada botão de categoria → abre cardápio e rola até a categoria correta
- [ ] Verificar seção Destaques exibe 3 cards com nome e preço
- [ ] Verificar seção Encomendas exibe título, texto e 2 botões funcionais
- [ ] Testar `dados/config.json`: alterar `heroH1` e verificar que o H1 é atualizado ao recarregar

### 7.2 Responsividade
- [ ] Mobile (375px): categorias em 3 colunas, hero com CTAs empilhados, prova social legível
- [ ] Tablet (768px): categorias em 4 colunas
- [ ] Desktop (1200px): categorias em 5 colunas, hero com layout flex

### 7.3 Performance
- Usar Lighthouse (Chrome DevTools) → Performance tab
- Meta: LCP < 2,5s, CLS < 0,1, FID < 100ms
- Verificar no PageSpeed Insights: https://pagespeed.web.dev/

### 7.4 SEO
- [ ] Ver source code (`Ctrl+U`) e verificar `<title>` ≤60 chars
- [ ] Verificar `<meta name="description">` ≤160 chars
- [ ] Confirmar apenas 1 `<h1>` por página (usar `document.querySelectorAll('h1').length`)
- [ ] Usar Google Rich Results Test para validar JSON-LD: https://search.google.com/test/rich-results
- [ ] Usar SEO Meta Checker: confirmar keywords "sorveteria", "sorvete tipo artesanal", "açaí", "Cajuru/SP" no H1 e meta description

### 7.5 Acessibilidade
- [ ] Navegar pelo teclado (Tab/Enter) pelos botões de categoria e CTAs
- [ ] Verificar `aria-label` nos botões de categoria
- [ ] Testar com leitor de tela (NVDA/VoiceOver)
- [ ] Verificar contraste de cores (WCAG AA): https://webaim.org/resources/contrastchecker/

---

## 8. Restrições Mantidas

- ✅ Nenhum campo do painel foi removido ou renomeado
- ✅ URLs/rotas principais mantidas (`/`, `/encomendas.html`, `/promocao.html`, etc.)
- ✅ Loop de dados painel → template mantido integralmente
- ✅ Lógica de acordeões, navegação inline em 3 níveis e `_semPulo()` preservados
- ✅ Integração com `dados/config.json`, `dados/produtos.json` e `dados/promo.json` mantida
- ✅ Painel admin (`admin-painel.html`) não foi alterado
- ✅ Todos os novos campos têm fallbacks HTML estáticos seguros

---

## 9. Próximos Passos Recomendados

1. **Painel admin:** Adicionar campos de edição para os novos `heroH1`, `heroProva`, `heroCTAPrimario`, `heroCTASecundario`, `homeCategoriasTitle`, `homeDestaquesTitle`, `homeEncomendasTitle`, `homeEncomendasTexto` e `featured_product_ids`.
2. **featured_product_ids:** Implementar lógica JS para buscar produtos do `dados/produtos.json` pelos IDs configurados e renderizar os cards de destaque dinamicamente.
3. **Fotos de produtos:** Adicionar campo de imagem (`foto`) nos produtos do cardápio para exibir fotos reais nos cards de destaque e no cardápio.
4. **WebP/AVIF:** Converter imagens de banners/carrossel para WebP com `srcset` para telas retina.
5. **Critical CSS:** Extrair os primeiros 300–500 linhas de CSS do hero/header para inline no `<head>` e carregar o restante de forma assíncrona via `<link rel="preload">`.
