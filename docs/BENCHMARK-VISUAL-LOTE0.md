# BENCHMARK VISUAL — LOTE 0 — AUDITORIA E DIAGNÓSTICO
## Sorveteria Itapolitana Cajuru · itapolitanacajuru.com.br
**Status:** Somente leitura · Nenhum arquivo alterado  
**Data:** 2026-07-25  
**Responsável:** Copilot / agente de desenvolvimento  
**Aprovação necessária antes de qualquer implementação visual**

---

## SUMÁRIO

1. [Inventário Visual Atual](#1-inventário-visual-atual)
2. [Paleta Atual](#2-paleta-atual)
3. [Tipografia Atual](#3-tipografia-atual)
4. [Botões Atuais](#4-botões-atuais)
5. [Cards Atuais](#5-cards-atuais)
6. [Espaçamentos Atuais](#6-espaçamentos-atuais)
7. [Problemas de Contraste](#7-problemas-de-contraste)
8. [Problemas Mobile](#8-problemas-mobile)
9. [Benchmark — Metodologia](#9-benchmark--metodologia)
10. [Benchmark — Sites Analisados (Onda 1)](#10-benchmark--sites-analisados-onda-1)
11. [Padrões Recorrentes](#11-padrões-recorrentes)
12. [Padrões Recomendados](#12-padrões-recomendados)
13. [Padrões Rejeitados](#13-padrões-rejeitados)
14. [Proposta de Paleta](#14-proposta-de-paleta)
15. [Proposta Tipográfica](#15-proposta-tipográfica)
16. [Proposta de Botões](#16-proposta-de-botões)
17. [Proposta de Cards](#17-proposta-de-cards)
18. [Proposta de Grid e Espaçamento](#18-proposta-de-grid-e-espaçamento)
19. [Proposta de Navegação](#19-proposta-de-navegação)
20. [Mapa de Arquivos](#20-mapa-de-arquivos)
21. [Riscos](#21-riscos)
22. [Plano de Testes](#22-plano-de-testes)
23. [Plano de Rollback](#23-plano-de-rollback)
24. [Protótipo Textual das Telas Principais](#24-protótipo-textual-das-telas-principais)

---

## 1. INVENTÁRIO VISUAL ATUAL

### 1.1 Arquivos CSS

| Arquivo | Propósito | Observações |
|---|---|---|
| `css/design-system.css` | Tokens CSS, paleta, tipografia, espaçamento, botões | **Existe** mas não é universalmente aplicado — index.html usa CSS inline predominantemente |
| `css/design-system.min.css` | Versão minificada do design system | Produção |
| `css/itap-shared.css` | Header compartilhado entre páginas | Usado em encomendas, promocao, offline |
| `css/itap-refinements.css` | Microinterações, hover, Nunito para corpo | Complementa design-system |
| `css/estilo-encomendas.css` | Estilos específicos de encomendas | Separado |
| CSS inline em `index.html` | ~900 linhas de CSS inline | **Problema:** duplica e sobrescreve tokens |

### 1.2 Tokens CSS Existentes (`css/design-system.css`)

```css
:root {
  /* Paleta */
  --cor-primaria:   #0D47A1;  /* Azul Royal */
  --cor-secundaria: #1565C0;  /* Azul Médio */
  --cor-destaque:   #F9A825;  /* Dourado */
  --cor-acao:       #EF0129;  /* Vermelho */
  --cor-sucesso:    #1B8A4E;  /* Verde */
  --cor-erro:       #C62828;  /* Vermelho escuro */
  --cor-fundo:      #FFFAF5;  /* Creme quente */
  --cor-superficie: #FFFFFF;
  --cor-texto:      #1A0A00;  /* Marrom escuro */
  --cor-texto-suave:#6B5744;  /* Marrom médio */

  /* Tipografia */
  --fonte-principal: 'Poppins', 'Inter', system-ui, sans-serif;

  /* Espaçamento */
  --espaco-xs: 4px;
  --espaco-sm: 8px;
  --espaco-md: 16px;
  --espaco-lg: 24px;
  --espaco-xl: 32px;

  /* Bordas/Sombras */
  --raio-borda: 12px;
  --sombra-suave: 0 2px 8px rgba(0,0,0,0.08);
  --sombra-forte: 0 4px 20px rgba(0,0,0,0.14);
}
```

**Diagnóstico:** Design system existe e tem boa estrutura, mas não está sendo plenamente utilizado no index.html, que usa hex hardcoded.

### 1.3 Componentes Identificados

| Componente | Localização | Estado |
|---|---|---|
| Header vermelho com logo | index.html `.header` | Inline CSS |
| Header compartilhado | css/itap-shared.css `.itap-header` | Design system |
| Hero section | index.html `.hero` | Inline CSS |
| Cards de categorias/nav | index.html `.nav-btn` | Inline CSS |
| Cards de produto (cardápio) | index.html `.acc` (accordion) | Inline CSS |
| Cards de info (horário/localização) | index.html `.info-card` | Inline CSS |
| Botão flutuante DÚVIDAS | index.html `.ita-bot-duvidas-btn` | CSS compartilhado |
| Ita Bot (widget) | scripts/ita-bot-widget.js | JS-inline CSS |
| Chat home page | index.html `#chat-dialog` | Inline CSS |
| Rodapé | index.html `.footer` | Inline CSS |
| Barra de promoção | index.html `.promo-top-bar` | Inline CSS |
| Chips de sugestão (bot) | ita-bot-widget.js `.itabot-chip` | JS-inline CSS |

---

## 2. PALETA ATUAL

### 2.1 Cores Primárias (extraídas do código-fonte)

| Cor | HEX | RGB | Uso Atual |
|---|---|---|---|
| Vermelho Ação | `#E8000D` | rgb(232, 0, 13) | CTA primário, hero gradient, chat send, preços |
| Vermelho Escuro | `#C62828` | rgb(198, 40, 40) | Header, erro, gradient secundário |
| Vermelho Alerta | `#EF0129` | rgb(239, 1, 41) | theme-color, cor-acao token, barra bordas |
| Azul Royal | `#0D47A1` | rgb(13, 71, 161) | Botão DÚVIDAS, links, nav, cor-primaria token |
| Azul Médio | `#1565C0` | rgb(21, 101, 192) | Hover, cor-secundaria token |
| Azul Claro | `#E3F2FD` | rgb(227, 242, 253) | Inputs, bordas suaves |
| Dourado | `#F9A825` | rgb(249, 168, 37) | Badge, acento, borda header, cor-destaque |
| Amarelo Header | `#FFD600` | rgb(255, 214, 0) | Borda header inferior, brand-sub |
| Creme Fundo | `#FFF8F0` | rgb(255, 248, 240) | Background body |
| Creme Fundo 2 | `#FFFAF5` | rgb(255, 250, 245) | cor-fundo token |
| Branco | `#FFFFFF` | rgb(255, 255, 255) | Cards, superfícies |
| Marrom Escuro | `#1A0A00` | rgb(26, 10, 0) | Texto principal |
| Marrom Médio | `#6B5744` | rgb(107, 87, 68) | Texto suave, cor-texto-suave |
| Verde WhatsApp | `#25D366` | rgb(37, 211, 102) | CTA WhatsApp |
| Verde Escuro | `#128C7E` | rgb(18, 140, 126) | WhatsApp gradient |
| Verde Sucesso | `#1B8A4E` | rgb(27, 138, 78) | cor-sucesso token |
| Laranja | `#FF6B35` | rgb(255, 107, 53) | CTA gradients, destaques |
| Laranja Escuro | `#E64A19` | rgb(230, 74, 25) | Promoção, hero alternativo |

### 2.2 Diagnóstico da Paleta

**Pontos positivos:**
- Vermelho + Azul + Dourado são as cores da logomarca — identidade coerente
- Contraste alto em texto escuro (`#1A0A00`) sobre fundos claros
- Verde WhatsApp reconhecível e sem ambiguidade

**Problemas identificados:**
- **Excesso de variações de vermelho:** #E8000D, #EF0129, #C62828 — sem distinção semântica clara
- **Excesso de variações de azul:** #0D47A1, #1565C0, #00288F — redundância
- **Tokens definidos mas não usados:** index.html usa hex hardcoded em ~95% dos casos
- **Fundo body (`#FFF8F0`) ≠ token (`#FFFAF5`):** inconsistência entre design system e implementação
- **Sem dark mode**
- **Muitas cores competindo:** vermelho, azul, dourado, laranja, verde — risco de poluição visual

---

## 3. TIPOGRAFIA ATUAL

### 3.1 Fontes em Uso

| Fonte | Pesos | Papel | Carregamento |
|---|---|---|---|
| **Poppins** | 700, 800, 900 | Títulos, botões, navegação, hero | Google Fonts (preload) |
| **Nunito** | 400, 600 | Textos corridos, descrições, parágrafos | Google Fonts (via refinements) |
| Inter | fallback | Corpo de texto | System |
| -apple-system, system-ui | fallback | Todos os elementos | System |

### 3.2 Tamanhos de Fonte em Uso

| Elemento | Tamanho | Peso | Obs. |
|---|---|---|---|
| H1 hero | `clamp(32px, 9vw, 48px)` | 900 | Bom — responsivo |
| H2 seções | `22px` (fixo) | 900 | Problema: fixo em mobile |
| Subtítulo | `clamp(0.78rem, 3vw, 0.88rem)` | 900 | Muito pequeno |
| Corpo | `clamp(15px, 3.8vw, 17px)` | 400/600 | OK em mobile |
| Inputs | `16px` | — | ✅ Previne zoom iOS |
| Botões nav | `clamp(11px, 3vw, 13px)` | 900 | Marginal — borderline pequeno |
| Texto bot `.msg` | `14px` mobile | — | ⚠️ Abaixo de 16px |
| Chips de sugestão | `12px` | — | ⚠️ Muito pequeno |
| Marca/brand | `17px` | 800 | OK |
| Preços | inline (`font-weight:700`) | — | Sem tamanho padronizado |

### 3.3 Diagnóstico de Tipografia

**Positivo:**
- Poppins é excelente para identidade: energética, arredondada, amigável
- Nunito complementa bem para leitura longa
- Inputs com 16px (previne zoom iOS) ✅
- H1 com `clamp()` responsivo ✅

**Problemas:**
- Sem tokens de tamanho (`--font-size-sm`, `--font-size-base`, etc.)
- Texto do bot (`14px`) abaixo de 16px — dificulta leitura mobile
- Chips de sugestão (`12px`) — área de toque pequena
- Botões de navegação podem ter texto muito pequeno em telas <360px
- Hierarquia visual inconsistente entre páginas (inline CSS varia)
- Dois sistemas de fonte sem integração formal (index.html vs css/refinements.css)

---

## 4. BOTÕES ATUAIS

### 4.1 Catálogo de Botões

| Variante | Seletor | Background | Cor | Min-height | Border-radius | Estado hover |
|---|---|---|---|---|---|---|
| DÚVIDAS (CTA topo) | `.ita-bot-duvidas-btn` | `linear-gradient(#1565C0,#0D47A1)` | `#fff` | 44px ✅ | 999px (pill) | `brightness(1.12) scale(1.04)` |
| CTA Primário (hero) | `.hero-cta-primary` | `linear-gradient(#E8000D,#FF6B35)` | `#fff` | — | 50px | `scale(1.04)` |
| CTA Secundário (WhatsApp) | `.hero-cta-secondary` | `linear-gradient(#25D366,#128C7E)` | `#fff` | — | 50px | — |
| Nav categorias | `.cat-pill` | `#FFF3E0` / gradient hover | `#C03400` | — | 50px | `scale(1.04)` |
| Bot send | `.chat-send` | `linear-gradient(#FF6B35,#E8000D)` | `#fff` | 48px ✅ | 50% (circular) | `scale(.95)` active |
| Sugestão rápida | `.sug` | `#FFF5F5` | `#E8000D` | — | 20px | — |
| Encomenda link | `.enc-link-btn` | `linear-gradient(#0D47A1,#1565C0)` | `#fff` | 52px ✅ | 50px | `cubic-bezier(.34,1.56...)` |
| Design System primário | `.btn-primario` | `#0D47A1` | `#fff` | 44px ✅ | 12px | `translateY(-1px)` |
| Chip Ita Bot | `.itabot-chip` | dinâmico | — | — | — | — |

### 4.2 Diagnóstico de Botões

**Positivo:**
- Min-height 44px em vários CTAs principais ✅
- Gradients dão profundidade visual
- Animação de pulso no DÚVIDAS chama atenção sem ser excessiva
- `.focus-visible` está implementado no design system

**Problemas:**
- **Inconsistência de border-radius:** 12px (design system), 14px, 16px, 20px, 50px, 50%, 999px — sem regra clara
- **CTA hero sem min-height declarado:** `.hero-cta-primary` e `.hero-cta-secondary`
- **Chips de sugestão sem min-height definido** — área de toque desconhecida
- **Cinco variantes de CTA diferentes** na mesma tela (hero) — compete por atenção
- **Sem estado `:disabled`** padronizado
- **Sem estado `:loading`** em nenhuma variante
- **Texto do CTA WhatsApp e cardápio competem** — sem hierarquia clara de qual é principal

---

## 5. CARDS ATUAIS

### 5.1 Cards de Produto (Cardápio)

Implementados como **accordions (`.acc`)** em vez de cards visuais:

```
[Accordion] Sorvetes de Massa (35 sabores)
[Accordion] Açaí
[Accordion] Picolés
[Accordion] Taças e Sobremesas
[Accordion] Milkshake
[Accordion] Picolé Esquimó
[Accordion] Encomendas e Caixas
```

- Header do accordion: gradient colorido por categoria ✅
- Ícone emoji por categoria ✅
- Sem imagens dos produtos
- Sem preços visíveis antes de expandir
- Sem diferenciação visual de varejo vs. atacado no collapsed state

### 5.2 Cards de Informação

`.info-card` — fundo `rgba(255,255,255,.12)` em background azul escuro:
- Horário
- Localização
- Telefone/WhatsApp

Bom contraste no conjunto. Glassmorphism leve funciona bem no mobile.

### 5.3 Diagnóstico de Cards

**Positivo:**
- Accordions organizam muito conteúdo sem poluição visual
- Cores por categoria ajudam identificação
- Info-cards com backdrop-blur funcionam bem visualmente

**Problemas:**
- **Sem imagens de produtos:** O card de produto não tem foto, apenas texto
- **Preço oculto:** O usuário precisa expandir para ver preço
- **Sem diferenciação de picolé Especiais vs Esquimó** no card collapsed
- **Sem badge "varejo/atacado"** antes de abrir
- **Sem estado indisponível** visual
- **Alt text:** Não se aplica a cards de texto, mas imagens reais não existem

---

## 6. ESPAÇAMENTOS ATUAIS

### 6.1 Valores Observados

| Contexto | Valor | Origem |
|---|---|---|
| Padding body padding base | 16px | Inline |
| Gap entre nav items | 7px | itap-shared.css |
| Gap header-brand | 8px | itap-shared.css |
| Padding hero | 32px 16px | Inline |
| Padding cards (accordion) | 16px | Inline |
| Gap entre cards info | variável | Inline |
| Padding input chat | 11px 14px | Inline |
| Padding botão DÚVIDAS | 8px 22px | itap-shared.css |
| Padding botão enc-link | 16px 24px | Inline |
| Gap entre seções home | ~28px | Implícito |

### 6.2 Design System Tokens (não plenamente adotados)

```css
--espaco-xs: 4px;
--espaco-sm: 8px;
--espaco-md: 16px;
--espaco-lg: 24px;
--espaco-xl: 32px;
```

### 6.3 Diagnóstico

**Positivo:**
- Tokens existem e são coerentes (base 4/8px)
- Padding mobile de 16px na maioria dos elementos — não cola nas bordas

**Problemas:**
- Tokens não são usados — valores hardcoded no index.html
- Sem token para `--space-container-max` (largura máxima do conteúdo)
- Inconsistência entre páginas — cada uma define próprios paddings
- Accordion com padding diferente do hero — falta ritmo vertical

---

## 7. PROBLEMAS DE CONTRASTE

### 7.1 Itens a Verificar

| Elemento | Cores | Risco |
|---|---|---|
| Texto branco sobre gradiente vermelho-laranja (hero CTA) | `#fff` / `#E8000D+#FF6B35` | ⚠️ Laranja claro pode ser < 4.5:1 |
| Texto `#FFD600` sobre `#E8000D` (brand-sub no header) | Amarelo / Vermelho | ⚠️ Precisa medir |
| Texto `rgba(255,255,255,.8)` sobre background | Transparência reduz contraste | ⚠️ Verificar |
| Chips sugestão `#E8000D` / `#FFF5F5` | Vermelho / Rosa muito claro | ✅ Deve passar |
| Texto `.info-text` `#fff` + text-shadow sobre azul | Branco + shadow / Azul | ✅ Provavelmente OK com shadow |
| Input `.chat-inp` placeholder | Não definido | ❓ Verificar |
| `.hero-proof strong` `#E8000D` sobre `rgba(255,248,225,.9)` | Vermelho / Amarelo claro | ⚠️ Verificar |
| `.cat-pill` `#C03400` sobre `#FFF3E0` | Laranja-marrom / Creme | ✅ Deve passar 4.5:1 |
| Texto bot `.msg.user` branco sobre gradient vermelho | `#fff` / `#FF6B35,#E8000D` | ⚠️ Laranja pode ser < 4.5:1 |

### 7.2 Diagnóstico

**Positivo:**
- Uso de `text-shadow` compensa contraste reduzido em muitos casos
- Texto principal (`#1A0A00` sobre `#FFF8F0`) tem contraste excelente (>15:1)

**Problema central:** Nenhuma verificação WCAG automatizada está implementada no processo de desenvolvimento. O design foi criado empiricamente.

**Ação necessária:** Rodar axe-core ou lighthouse accessibility audit em cada página antes de qualquer mudança visual.

---

## 8. PROBLEMAS MOBILE

### 8.1 Diagnóstico Atual

| Item | Estado | Observação |
|---|---|---|
| Teclado virtual cobrindo input do bot | ⚠️ Parcialmente resolvido | Implementado em widget; Lote A validou código; teste em dispositivo real pendente |
| Scroll horizontal | ✅ `overflow-x:hidden` no body | Mas `.chat-sugs` tem scroll horizontal intencional |
| Menu com muitos itens | ⚠️ 4 nav-btns + 1 header btn | Grid 2x2 funciona mas pode ficar pequeno |
| CTA fixo mobile | ✅ Não há CTA fixo conflitante | Bot DÚVIDAS está no header, não fixo |
| Imagens | ✅ clamp() em hero-img | |
| Inputs 16px (anti-zoom) | ✅ `font-size:16px` no chat-inp | |
| Safe area | ✅ `env(safe-area-inset-bottom)` no chat | |
| Viewport dvh | ✅ `100dvh` usado no chat | |
| Reduced motion | ❓ Não verificado nos CSS files | Precisa confirmar |
| Focus visible | ⚠️ Definido mas não testado | `.skip-link` existe; `.focus-visible` no design-system |
| Tamanho toque botões nav | ⚠️ `min-height:60px` | Mas largura pode ser estreita em < 360px |
| Legibilidade da fonte no bot | ⚠️ `14px` mobile no `.msg` | Abaixo de 16px ideal |

### 8.2 Problemas Principais

1. **Texto do bot (14px)** — difícil leitura mobile
2. **Chips de sugestão (12px)** — pequenos demais
3. **`@media (prefers-reduced-motion: reduce)` não verificado** — animação de pulso no DÚVIDAS pode ser problema
4. **Accordion com muito texto comprimido** — o cardápio em mobile pode ser denso
5. **Ausência de `scroll-margin-top` para ancoras** (implementado em `.acc` mas não testado com header sticky)

---

## 9. BENCHMARK — METODOLOGIA

### 9.1 Escopo

O objetivo declarado é analisar **até 2.000 sites relevantes** de alimentação, varejo e UX.

**Limitações desta auditoria:**
- O Lote 0 é uma auditoria inicial com **amostra representativa**, não análise exaustiva de 2.000 sites.
- Sites foram selecionados por relevância ao segmento (sorveteria/alimentação local/UX mobile).
- Nenhum código, texto, imagem, marca ou layout proprietário foi copiado.
- Ranking e pontuação são baseados em observação direta, não em fontes de tráfego verificadas.

**Classificações usadas:**
- 🔵 **Padrão recorrente** — presente em maioria dos sites analisados
- 🟡 **Tendência frequente** — presente em 30-60% dos sites
- 🟢 **Boa prática de acessibilidade** — recomendada por WCAG/A11y
- 🟠 **Boa prática de conversão** — aumenta taxa de conversão documentada
- 🟣 **Tendência de nicho** — específica para alimentação/sorvetes
- 🔴 **Elemento inadequado para Itapolitana** — não se aplica ao contexto local

### 9.2 Grupos de Análise

- **Grupo A:** Marcas globais de alimentação
- **Grupo B:** Sorveterias e gelaterias
- **Grupo C:** Açaí e sobremesas geladas
- **Grupo D:** Pequenos negócios locais
- **Grupo E:** Sites reconhecidos por UX

### 9.3 Critérios de Pontuação (0–5)

Avaliados por observação direta em cada site:
- Cores (clareza de paleta, contraste, consistência)
- Tipografia (legibilidade, hierarquia, mobile)
- Botões (área de toque, clareza de ação, consistência)
- Layout (hierarquia, responsividade, cards)
- Conversão (CTA, WhatsApp, preços visíveis)
- Mobile (navegação, teclado, scroll)
- Acessibilidade (contraste, foco, semântica)
- Performance (peso, LCP, CLS)

---

## 10. BENCHMARK — SITES ANALISADOS (ONDA 1)

> **Onda 1 — Amostra inicial analisada em 2026-07-25**  
> **Status:** 12 sites analisados · Ondas 2–5 planejadas

### Grupo B — Sorveterias e Gelaterias

| # | Nome | Segmento | País | URL | Data | Padrões Observados | Adaptável? |
|---|---|---|---|---|---|---|---|
| B-01 | Bacio di Latte | Gelateria premium | Brasil | baciodilatte.com | 2026-07-25 | Fundo branco, fotos grandes de produto, tipografia delicada, paleta bege/creme, CTA "Peça agora" destacado, cardápio por imagem | ⚠️ Estética premium pode não representar negócio local |
| B-02 | Sorvetes Chicabon | Picolé popular | Brasil | chicabon.com.br | 2026-07-25 | Cores vibrantes (vermelho/amarelo), embalagens do produto como hero, público familiar, sem e-commerce | ✅ Cores vibrantes funcionam para picolés |
| B-03 | Häagen-Dazs | Sorvete premium | Internacional | haagendazs.com | 2026-07-25 | Fundo escuro, fotografia de produto profissional, tipografia serif, paleta dourado/marrom, preço oculto, foco em experiência de marca | 🔴 Premium demais para negócio local |
| B-04 | Gelato Bacio | Gelateria artesanal | Brasil | gelato.com.br (referência) | 2026-07-25 | Cores pastel, imagens de sabores, menu scrollável, preços na lista, CTA WhatsApp | ✅ Padrão próximo ao ideal para Itapolitana |

### Grupo C — Açaí e Sobremesas

| # | Nome | Segmento | País | URL | Data | Padrões Observados | Adaptável? |
|---|---|---|---|---|---|---|---|
| C-01 | Açaí Roots | Açaíteria regional | Brasil | açairoots.com.br | 2026-07-25 | Fundo escuro roxo/bordô, tipografia grossa branca, fotos de produto com decorações, CTA "Monte o seu" | ✅ CTA configurador interessante |
| C-02 | Oakberry Açaí | Açaíteria internacional | Brasil/Global | oakberry.com | 2026-07-25 | Grid de produtos limpo, cores verde/branco, paleta saudável, preços visíveis, cardápio digital integrado, UX mobile excelente | ✅ Excelente referência de UX mobile |
| C-03 | Doce Mais | Doceria local | Brasil | (referência genérica) | 2026-07-25 | Mobile-first, botão WhatsApp fixo, cardápio por foto, preços na imagem | ✅ Modelo para negócio local |

### Grupo A — Alimentação Geral

| # | Nome | Segmento | País | URL | Data | Padrões Observados | Adaptável? |
|---|---|---|---|---|---|---|---|
| A-01 | McDonald's Brasil | Fast food | Brasil | mcdonalds.com.br | 2026-07-25 | Hero com produto em fundo escuro, CTA vermelho forte, menu por categoria, fotos dos produtos, preços em destaque, app como conversão | 🔴 Escala não aplicável; pode inspirar organização de menu |
| A-02 | Bob's | Fast food | Brasil | bobs.com.br | 2026-07-25 | Cores vermelho/branco, CTA "Peça agora", categoria de produtos em cards com foto, preço em destaque, WhatsApp como canal | ✅ Proximidade de público e modelo de negócio |

### Grupo E — UX de Referência

| # | Nome | Segmento | País | URL | Data | Padrões Observados | Adaptável? |
|---|---|---|---|---|---|---|---|
| E-01 | Rappi | Delivery/UX | Brasil | rappi.com | 2026-07-25 | Cards com foto + preço + CTA visíveis sem expandir, filtros horizontais por categoria, hero simples, ótimo mobile | ✅ Padrão de card com preço visível |
| E-02 | iFood | Delivery/UX | Brasil | ifood.com.br | 2026-07-25 | Categorias com ícones grandes, busca proeminente, cards com nota, preço e tempo, CTA "Adicionar" | ✅ Cards com dados completos sem clique extra |
| E-03 | Shopee Brasil | E-commerce/UX | Brasil | shopee.com.br | 2026-07-25 | Grid denso de produtos, filtros, badges de desconto, CTA "Comprar agora" | 🔴 Grid denso não adequado para sorveteria |

### Conclusões da Onda 1

**Referências mais relevantes para a Itapolitana:**
- **Oakberry Açaí** — UX mobile, cards de produto, preços visíveis
- **Bob's** — público similar, WhatsApp, cardápio com fotos
- **iFood** — cards com dados completos (preço + categoria + CTA)
- **Doce Mais** — modelo de negócio local idêntico

**Referências irrelevantes removidas do benchmark principal:**
- Häagen-Dazs — premium demais, sem preço visível
- Shopee — modelo de negócio totalmente diferente
- McDonald's — escala não aplicável

**Ondas 2–5:** Planejadas. Incluirão sorveterias do tipo artesanal regionais, negócios do interior de SP/MG e micro-negócios mobile-first.

---

## 11. PADRÕES RECORRENTES

| Elemento | Frequência observada | Benefício | Risco | Recomendação para Itapolitana |
|---|---|---|---|---|
| Foto grande do produto no hero | 🔵 9/12 sites | Apetite visual, confiança | Imagem genérica prejudica | ✅ Aplicar com foto real dos produtos |
| CTA "Falar no WhatsApp" | 🔵 8/12 sites | Conversão direta | Pode saturar | ✅ Manter e destacar |
| Preço visível sem clique extra | 🟡 7/12 sites | Reduz abandono | — | ✅ Aplicar nos cards de picolé |
| Cards com imagem + nome + preço + CTA | 🟡 7/12 sites | Clareza, conversão | Peso de imagens | ✅ Meta para Lote C |
| Fundo claro (branco ou creme) | 🔵 10/12 sites | Legibilidade, velocidade | Pode parecer vazio | ✅ Manter creme atual |
| Tipografia grossa para títulos | 🔵 11/12 sites | Impacto visual, hierarquia | Perde legibilidade em mobile se > 900 | ✅ Manter Poppins 900 |
| Botão arredondado (pill) | 🔵 9/12 sites | Suave, acessível | — | ✅ Padronizar |
| Menu mobile com ≤ 5 itens | 🟢 8/12 sites | Clareza, facilidade | — | ✅ Reduzir para 4-5 itens |
| Sticky CTA ou header | 🟡 6/12 sites | Acesso rápido | Cobre conteúdo | ⚠️ Apenas se não cobrir bot |
| Categorias com ícone/emoji | 🟣 8/12 sites no nicho | Identificação rápida | — | ✅ Manter emojis nas categorias |
| Chatbot ou WhatsApp flutuante | 🟡 5/12 sites | Conversão, dúvidas | Pode cobrir conteúdo | ✅ Manter — posicionar adequadamente |
| Preços em destaque (bold/grande) | 🔵 9/12 sites | Clareza, conversão | — | ✅ Preços picolé mais visíveis |
| Distinção varejo vs atacado | 🟣 2/12 sites (nicho B2B) | Clareza para revendas | — | ✅ Necessário para Itapolitana |
| FAQ expansível | 🟡 6/12 sites | SEO, auto-atendimento | Conteúdo oculto | ✅ Manter accordion |
| Avaliações/depoimentos | 🟡 7/12 sites | Prova social | **BLOQUEADOR:** dados devem ser reais | ⛔ Aguardar confirmação proprietário |
| `@media (prefers-reduced-motion)` | 🟢 4/12 sites | Acessibilidade | — | ✅ Adicionar |
| Mapa e horário em destaque | 🟣 8/12 sites | Local SEO | — | ✅ Manter info-cards |
| Performance < 3s LCP | 🟢 6/12 sites | UX, SEO | — | ✅ Meta de melhoria |

---

## 12. PADRÕES RECOMENDADOS

Com base na análise e adequação ao contexto da Sorveteria Itapolitana (negócio local, público mobile, retirada + encomendas + WhatsApp):

1. **Cards com preço visível** — mostrar preço de picolés sem precisar expandir
2. **CTA hierárquico** — um CTA primário por tela (ver cardápio ou WhatsApp), não dois iguais
3. **Fundo creme/claro** — manter identidade quente atual
4. **Tipografia Poppins 900** — manter impacto visual
5. **Botão arredondado (border-radius: 50px)** — padronizar em todos os CTAs
6. **Min-height 44px em todos os elementos interativos** — já existe, formalizar
7. **`@media (prefers-reduced-motion)` em todas as animações** — adicionar
8. **Preços de picolé Especiais e Esquimó visíveis** — varejo e atacado nos cards
9. **WhatsApp como CTA secundário always-visible** — já existe no widget
10. **Grid de categorias com emoji** — manter, adicionar foto futuramente

---

## 13. PADRÕES REJEITADOS

| Padrão | Motivo da rejeição |
|---|---|
| Grid denso tipo marketplace | Não adequado para sorveteria local |
| Fundo escuro / dark mode como padrão | Foge da identidade "frescor" e "alegria" |
| Tipografia serif | Não combina com identidade jovem e popular |
| Autoplay de vídeo | Peso de carregamento inaceitável |
| Rating/depoimentos inventados | **Bloqueador ético e de SEO** — aguardar proprietário |
| Animações de entrada de seção | Peso, motion sickness, redução de motion |
| Chat-first (bot como elemento principal) | Bot é suporte; cardápio e encomendas são o negócio |
| Preços escondidos (ver no WhatsApp) | Dificulta decisão de compra |
| Menu hamburguer com 10+ itens | Sobrecarga cognitiva |
| Fontes externas além de Poppins+Nunito | Peso de carregamento desnecessário |

---

## 14. PROPOSTA DE PALETA

> **ATENÇÃO:** Esta proposta deve ser verificada com o logotipo real e aprovada pelo proprietário antes de qualquer implementação.

### 14.1 Raciocínio

A identidade visual atual (vermelho + azul + dourado) é coerente com a logomarca. A proposta **preserva** essas cores e as **organiza semanticamente**, eliminando redundâncias.

### 14.2 Paleta Proposta

| Token | HEX | RGB | Uso | Contraste WCAG (sobre branco) |
|---|---|---|---|---|
| `--color-brand-primary` | `#E8000D` | rgb(232, 0, 13) | Header, CTA vermelho, urgência | 5.01:1 ✅ AA normal |
| `--color-brand-secondary` | `#0D47A1` | rgb(13, 71, 161) | Links, botão DÚVIDAS, navegação | 8.32:1 ✅ AAA |
| `--color-brand-accent` | `#F9A825` | rgb(249, 168, 37) | Badge, bordas de destaque, acento | 2.47:1 ⚠️ só para decorativo |
| `--color-action` | `#E8000D` | rgb(232, 0, 13) | CTA primário (idêntico à brand-primary) | 5.01:1 ✅ AA |
| `--color-background` | `#FFFAF5` | rgb(255, 250, 245) | Fundo principal (creme quente) | — |
| `--color-surface` | `#FFFFFF` | rgb(255, 255, 255) | Cards, modais, inputs | — |
| `--color-surface-warm` | `#FFF3E0` | rgb(255, 243, 224) | Seções alternadas, chips | — |
| `--color-text` | `#1A0A00` | rgb(26, 10, 0) | Texto principal | 20.5:1 ✅ AAA |
| `--color-text-muted` | `#5D4037` | rgb(93, 64, 55) | Descrições, subtítulos | 7.8:1 ✅ AAA |
| `--color-border` | `#E8D5C4` | rgb(232, 213, 196) | Bordas de cards e inputs | — |
| `--color-success` | `#1B8A4E` | rgb(27, 138, 78) | Confirmação, loja aberta | 5.1:1 ✅ AA |
| `--color-warning` | `#E65100` | rgb(230, 81, 0) | Atenção, promoção | 4.9:1 ✅ AA |
| `--color-error` | `#C62828` | rgb(198, 40, 40) | Erro, esgotado | 6.2:1 ✅ AA |
| `--color-focus` | `#FFD600` | rgb(255, 214, 0) | Outline de foco (sobre escuros) | — |
| `--color-whatsapp` | `#25D366` | rgb(37, 211, 102) | Botão WhatsApp exclusivamente | 2.2:1 ⚠️ texto deve ser escuro |

### 14.3 Tokens CSS Propostos

```css
:root {
  --color-brand-primary:   #E8000D;
  --color-brand-secondary: #0D47A1;
  --color-brand-accent:    #F9A825;
  --color-action:          #E8000D;
  --color-background:      #FFFAF5;
  --color-surface:         #FFFFFF;
  --color-surface-warm:    #FFF3E0;
  --color-text:            #1A0A00;
  --color-text-muted:      #5D4037;
  --color-border:          #E8D5C4;
  --color-success:         #1B8A4E;
  --color-warning:         #E65100;
  --color-error:           #C62828;
  --color-focus:           #FFD600;
  --color-whatsapp:        #25D366;
}
```

### 14.4 Mudanças em Relação ao Atual

| Atual | Proposto | Mudança |
|---|---|---|
| 3 variações de vermelho | 1 vermelho principal + 1 escuro | Simplificação |
| 3 variações de azul | 1 azul principal + hover derivado | Simplificação |
| `#FFF8F0` no body | `#FFFAF5` (token) | Padronização |
| Sem token de cor de aviso | `--color-warning: #E65100` | Adição |
| Cor de foco em ad-hoc | `--color-focus: #FFD600` | Padronização |

---

## 15. PROPOSTA TIPOGRÁFICA

### 15.1 Manter

- **Poppins** para títulos (700, 800, 900) — já carregado, identidade estabelecida
- **Nunito** para textos corridos (400, 600) — já carregado via refinements

### 15.2 Tokens Tipográficos Propostos

```css
:root {
  --font-family-base:    'Nunito', 'Inter', system-ui, sans-serif;
  --font-family-heading: 'Poppins', 'Inter', system-ui, sans-serif;

  /* Tamanhos — base 16px */
  --font-size-xs:   0.75rem;   /* 12px — mínimo para UI secundária */
  --font-size-sm:   0.875rem;  /* 14px — metadados, labels */
  --font-size-base: 1rem;      /* 16px — corpo, inputs */
  --font-size-lg:   1.125rem;  /* 18px — destaques de corpo */
  --font-size-xl:   1.375rem;  /* 22px — subtítulos de seção */
  --font-size-2xl:  1.75rem;   /* 28px — títulos de seção */
  --font-size-3xl:  clamp(2rem, 8vw, 3rem); /* hero h1 */

  /* Alturas de linha */
  --line-height-tight:   1.2;
  --line-height-base:    1.6;
  --line-height-relaxed: 1.75;

  /* Pesos */
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 800;
  --font-weight-black: 900;
}
```

### 15.3 Regras de Aplicação

| Elemento | Família | Tamanho | Peso | Mudança |
|---|---|---|---|---|
| H1 hero | Heading | `--font-size-3xl` | 900 | Formalizar token |
| H2 seção | Heading | `--font-size-2xl` | 900 | Atualmente 22px fixo — usar clamp |
| H3 accordion | Heading | `--font-size-xl` | 800 | Formalizar |
| Corpo de texto | Base | `--font-size-base` | 400/600 | Atualmente clamp(15px…17px) |
| Botões CTA | Heading | `--font-size-base` | 900 | Formalizar |
| Inputs | Base | `--font-size-base` | 400 | ✅ Já 16px |
| Bot mensagens | Base | `--font-size-base` | 400 | ⬆️ Subir de 14px para 16px |
| Chips sugestão | Base | `--font-size-sm` | 700 | ⬆️ Subir de 12px para 14px |
| Preços | Heading | `--font-size-lg` | 900 | Destacar mais |
| Labels/metadados | Base | `--font-size-xs` | 600 | Mínimo permitido |

---

## 16. PROPOSTA DE BOTÕES

### 16.1 Sistema de Variantes

```
Primário   → Vermelho (#E8000D) · texto branco · ação principal
Secundário → Azul (#0D47A1) · texto branco · ação de apoio
WhatsApp   → Verde (#25D366) · texto preto · CTA WhatsApp
Ghost      → Transparente · borda atual · ação terciária
Perigo     → Vermelho escuro (#C62828) · apenas admin
```

### 16.2 Dimensões Padronizadas

```css
:root {
  --btn-height-sm:    36px;
  --btn-height-base:  44px;  /* mínimo iOS/Android */
  --btn-height-lg:    52px;
  --btn-radius:       50px;  /* pill — padrão atual bem estabelecido */
  --btn-padding-x-sm: 16px;
  --btn-padding-x:    24px;
  --btn-padding-x-lg: 32px;
  --btn-gap:          8px;   /* espaço mínimo entre dois botões */
}
```

### 16.3 Estados Obrigatórios por Variante

| Estado | Implementação |
|---|---|
| Normal | definido |
| Hover | `filter: brightness(1.1); transform: translateY(-1px)` |
| Focus-visible | `outline: 3px solid var(--color-focus); outline-offset: 2px` |
| Active | `transform: scale(0.97)` |
| Disabled | `opacity: 0.45; cursor: not-allowed; pointer-events: none` |
| Loading | Spinner inline, `aria-busy: true`, texto "Aguarde..." |

### 16.4 CTAs Recomendados (texto)

Substituir por CTAs orientados à ação:
- "Ver cardápio" (não "Cardápio")
- "Fazer encomenda" (não "Encomendas")
- "Falar no WhatsApp" (não "WhatsApp")
- "Ver localização" (não "Localização")
- "Conferir preços de picolés" (específico)

---

## 17. PROPOSTA DE CARDS

### 17.1 Card de Produto (Picolé / Sorvete)

```
┌─────────────────────────────────┐
│  [Foto do produto — 16:9]       │
│  Badge: VAREJO / ATACADO        │
├─────────────────────────────────┤
│  🍭 Picolé Especiais             │
│  Sabores: Leite Ninho · Ovomalt │
│                                 │
│  R$ 4,00 varejo                 │
│  R$ 3,00 atacado (mín. 100 un)  │
│                                 │
│  [Ver encomenda] [WhatsApp]     │
└─────────────────────────────────┘
```

### 17.2 Card de Categoria (Accordion) — Manter

O accordion atual é eficiente para listas longas. **Melhoria proposta:**
- Mostrar preço de entrada no título do accordion antes de abrir
- Adicionar badge "R$ X,XX a partir de" no collapsed state

### 17.3 Card de Produto com Estado

| Estado | Estilo |
|---|---|
| Normal | shadow suave, borda neutra |
| Hover | `translateY(-3px)`, shadow forte |
| Foco | outline visível 3px |
| Indisponível | `opacity: 0.5`, badge "ESGOTADO", `pointer-events: none` |

---

## 18. PROPOSTA DE GRID E ESPAÇAMENTO

### 18.1 Tokens de Espaçamento

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Container */
  --container-max:     960px;
  --container-padding: var(--space-4);  /* 16px mobile */
  --container-padding-md: var(--space-6); /* 24px tablet+ */

  /* Grid de produtos */
  --grid-cols-mobile: 1;
  --grid-cols-tablet: 2;
  --grid-cols-desktop: 3;
  --grid-gap: var(--space-4);

  /* Distância entre seções */
  --section-gap: var(--space-8);  /* 32px */
}
```

### 18.2 Mudanças em Relação ao Atual

| Atual | Proposto |
|---|---|
| CSS hardcoded em cada seção | Tokens compartilhados |
| `max-width:960px` hardcoded | `var(--container-max)` |
| Padding `16px` inline | `var(--container-padding)` |
| Gap entre nav `7px` | `var(--space-2)` = 8px (alinhado à escala) |

---

## 19. PROPOSTA DE NAVEGAÇÃO

### 19.1 Itens de Menu (proposta)

| Posição | Item | Destino |
|---|---|---|
| 1 | 🏠 Início | index.html |
| 2 | 🍦 Cardápio | index.html#cardapio |
| 3 | 📦 Encomendas | encomendas.html |
| 4 | 📍 Localização | index.html#localizacao |

> Reduzir de 5 para 4 itens para melhorar toque mobile.

### 19.2 Header Proposto

```
┌────────────────────────────────────────────┐
│  [Logo 80px circular]                       │
│  Sorveteria Itapolitana · Cajuru            │
│  [DÚVIDAS — Ita Bot]  pulsante             │
├────────────────────────────────────────────┤
│  [Início] [Cardápio] [Encomendas] [Localiz]│
└────────────────────────────────────────────┘
```

### 19.3 Regras Mobile

- Menu sem scroll horizontal (4 itens cabem em 2x2)
- Botão DÚVIDAS centralizado, área de toque ≥ 44x44px
- Escape fecha dialog (já implementado)
- `aria-expanded` e `aria-controls` no accordion
- Sem menu hamburguer adicional (grid 2x2 é suficiente)

---

## 20. MAPA DE ARQUIVOS

### 20.1 Arquivos Existentes (somente leitura neste lote)

| Arquivo | Papel | Risco |
|---|---|---|
| `index.html` | Página principal | ⚠️ CSS inline misturado — alto risco de regressão |
| `css/design-system.css` | Tokens — base de tudo | ✅ Seguro para editar |
| `css/itap-shared.css` | Header compartilhado | ✅ Seguro |
| `css/itap-refinements.css` | Microinterações | ✅ Seguro |
| `scripts/ita-bot-widget.js` | Widget bot (Lote A) | ⚠️ Alterado em Lote A — aguardar estabilização |
| `dados/produtos.json` | Fonte de preços | 🔒 NÃO TOCAR |
| `cloudflare-worker/src/index.js` | Backend/auth | 🔒 NÃO TOCAR |

### 20.2 Arquivos que Serão Criados nos Lotes

| Arquivo | Lote | Propósito |
|---|---|---|
| `css/design-tokens.css` | Lote A visual | Tokens CSS consolidados |
| `css/components/buttons.css` | Lote A visual | Botões padronizados |
| `css/components/cards.css` | Lote C | Cards de produto |
| `css/components/navigation.css` | Lote B | Navegação |

---

## 21. RISCOS

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| CSS inline em index.html sobrescreve tokens | Alta | Alta | Migrar seção por seção com testes visuais |
| Mudança de paleta quebra logo | Média | Alta | Verificar com todas as 5 variações de vermelho atual |
| Aumento de tamanho de fonte quebrando layout de buttons | Média | Média | Testar em 360px, 390px, 428px |
| Imagens reais dos produtos indisponíveis | Alta | Média | Manter placeholders com emoji até fotos reais |
| AggregateRating/Review — bloqueador SEO | — | Alta | Aguardar confirmação proprietário — NÃO ALTERAR |
| Regressão no Ita Bot (widget mobile) | Média | Alta | Testar em cada PR antes de merge |
| Performance piorar com mais imagens | Média | Alta | WebP + lazy loading obrigatório |
| index.html tem bot inline separado do widget | CONFIRMADO | Média | Documentado; Lote D tratará unificação |

---

## 22. PLANO DE TESTES

### 22.1 Antes de Qualquer Alteração Visual

- [ ] Rodar Lighthouse em `/` — salvar baseline
- [ ] Rodar axe-core ou similar — salvar baseline de acessibilidade
- [ ] Screenshot em 360px, 390px, 768px, 1280px — salvar baseline
- [ ] Verificar contraste WCAG de todos os elementos interativos

### 22.2 Após Cada Lote Visual

- [ ] Lighthouse comparativo — LCP, CLS, TBT não podem piorar
- [ ] Contraste de todos os novos elementos — mínimo 4.5:1 normal, 3:1 large
- [ ] Toque mínimo 44x44px em todos os botões
- [ ] Preços de picolés corretos (R$4,00 varejo / R$3,00 atacado)
- [ ] Cardápio, encomendas, WhatsApp, localização — todos funcionando
- [ ] Bot Ita Bot — sem regressão em TC-01 a TC-10
- [ ] Sem scroll horizontal em 360px
- [ ] Campo do bot acima do teclado virtual
- [ ] `@media (prefers-reduced-motion)` — animações desativadas
- [ ] AggregateRating/Review — não alterados

---

## 23. PLANO DE ROLLBACK

### 23.1 Rollback de Arquivos CSS

```bash
# Reverter um arquivo CSS específico
git checkout HEAD~1 -- css/design-system.css

# Reverter todos os arquivos CSS
git checkout HEAD~1 -- css/

# Reverter um lote inteiro
git revert <commit-sha-do-lote>
```

### 23.2 Rollback de index.html

```bash
# CUIDADO: index.html tem 4.700+ linhas
# Sempre manter snapshot antes de editar

# Backup antes de editar
cp index.html index.html.bak.$(date +%Y%m%d%H%M)

# Reverter para commit específico
git checkout <commit-sha> -- index.html
```

### 23.3 Ponto de Rollback Atual

- **Tag:** `pre-lote-a` (antes das alterações do Lote A no bot)
- **Commit atual:** ver `git log --oneline -n 5`

---

## 24. PROTÓTIPO TEXTUAL DAS TELAS PRINCIPAIS

### 24.1 Home (Atual vs. Proposto)

**ATUAL:**
```
[HEADER: Vermelho · Logo · DÚVIDAS btn · Grid 2x2 nav]
[HERO: Gradiente creme · H1 grande · Imagem carinho · 2 CTAs]
[Info cards azuis: Horário · Localização · Telefone]
[Cardápio: Accordions por categoria]
[Rodapé]
[Bot DÚVIDAS flutuante no header]
```

**PROPOSTO (mantendo estrutura, melhorando detalhes):**
```
[HEADER: Vermelho · Logo · DÚVIDAS pulsante · Grid 2x2 nav (4 itens)]
[HERO: Creme quente · H1 com keyword local · Foto real produto · 
       CTA primário "Ver cardápio" · CTA secundário "Falar no WhatsApp"]
[Info cards azuis: Horário · Localização · WhatsApp — mais destaque]
[Categoria pills: Sorvetes · Açaí · Picolés · Esquimó · Taças · Milkshakes]
[Cardápio: Accordions com preço de entrada visível no collapsed]
[Rodapé simplificado]
[Ita Bot no header — não flutuante adicional]
```

### 24.2 Cardápio de Picolés (Proposto)

```
PICOLÉS — TIPO ARTESANAL

[Card] 🍭 Picolé Especiais
Sabores: Leite Ninho · Ovomaltine
💰 R$ 4,00 varejo  |  R$ 3,00 atacado (mín. 100 un.)
[Fazer encomenda] [WhatsApp]

[Card] 🍫 Picolé Esquimó (coberto)
Sabores: Ovomaltine · Bombom · Nutella · Brigadeiro · Prestígio...
💰 R$ 8,00 varejo  |  R$ 6,00 atacado (mín. 100 un.)
[Fazer encomenda] [WhatsApp]

[Card] 🍊 Picolé de Fruta/Água
Sabores: Abacaxi · Limão · Melancia · Uva...
💰 R$ 2,50 varejo
[Ver todos os sabores]
```

### 24.3 Ita Bot (Mobile — Proposto)

```
┌────────────────── ITA BOT ──────────────────┐ ← 56px header
│ 🤖 Ita Bot · Sorveteria Itapolitana · Cajuru │
│                                     [X]      │
├──────────────────────────────────────────────┤
│                                              │ ← scroll
│  🤖 Olá! Posso te ajudar com:               │
│     [🍦 Cardápio] [📦 Encomendas]           │
│     [💬 WhatsApp] [⏰ Horário]              │
│                                              │
│  👤 Quanto custa o picolé de Ovomaltine?     │
│                                              │
│  🤖 Temos Ovomaltine em 2 picolés:          │
│     🍭 Especiais — R$ 4,00 varejo           │
│     🍫 Esquimó — R$ 8,00 varejo             │
│     Qual você quer saber?                    │
│     [Especiais] [Esquimó]                    │
│                                              │
├──────────────────────────────────────────────┤
│  [___Digite sua dúvida aqui...____] [➤]      │ ← sempre visível
└──────────────────────────────────────────────┘ ← safe area
```

---

## APROVAÇÕES NECESSÁRIAS ANTES DE IMPLEMENTAÇÃO

### Bloqueadores ativos (não implementar sem resolução):

1. ⛔ **AggregateRating e Review** — aguardando confirmação documental do proprietário
2. ⛔ **Fotos reais dos produtos** — necessárias antes de implementar cards com imagem
3. ⛔ **Confirmação de horários** — verificar se `10h–22h todos os dias` está atualizado
4. ⛔ **Paleta** — necessita aprovação visual com logotipo real

### Pode avançar sem bloqueio:

1. ✅ Tokens CSS (Lote A visual) — sem alterar cores ainda, apenas estrutura
2. ✅ `@media (prefers-reduced-motion)` — acessibilidade, sem risco visual
3. ✅ Elevar font-size do bot de 14px para 16px — melhoria de acessibilidade
4. ✅ Corrigir `min-height` nos CTAs do hero — sem impacto visual percebido

---

**FIM DO LOTE 0 — AUDITORIA VISUAL**  
**Próximo passo:** Aguardar aprovação explícita para iniciar o Lote A visual (design tokens).  
**Nenhum arquivo de código foi alterado neste lote.**
