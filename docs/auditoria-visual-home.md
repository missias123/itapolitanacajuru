# Auditoria Visual — HOME (index.html)
> Referência: iFood, Uber Eats, McDonald's Brasil  
> Data: 2026-05-05 (atualizado)  
> Auditor: Copilot Lead UI/UX

---

## 1. Alinhamento

| # | Elemento | Problema | Severidade | Status |
|---|----------|----------|------------|--------|
| A1 | `.header-inner` | CSS base nunca aplicado por typo `..header-inner` (duplo ponto). Sem `max-width`, `margin:0 auto` ou `display:flex` base. | 🔴 Crítico | ✅ Corrigido |
| A2 | `.header-nav` no desktop | `width:auto` + `grid-template-columns:repeat(4,1fr)` — em flex container com `align-items:center`, as colunas `1fr` não têm espaço definido para se distribuir, resultando em tamanhos imprevisíveis | 🟠 Alto | ✅ Corrigido |
| A3 | Logo no header | Centraliza via `@media` mas sem a regra base o comportamento em breakpoints intermediários é indefinido | 🟠 Alto | ✅ Corrigido (via A1) |
| A4 | Carrinho Cortesia cards | HTML idêntico nos 2 cards; sem `min-height` explícita, qualquer variação de conteúdo dinâmico pode causar alturas diferentes | 🟡 Médio | ✅ Corrigido |

---

## 2. Tamanho / Proporção

| # | Elemento | Problema | Severidade | Status |
|---|----------|----------|------------|--------|
| T1 | Botão PROMOÇÃO `.nav-orange` | `border:3px solid #FFFFFF !important` — borda 3× mais espessa que os outros botões (1px semi-transparente). O `!important` vence o `border:none` do inline style, fazendo o botão aparentar maior visualmente | 🔴 Crítico | ✅ Corrigido |
| T2 | `.nav-btn` no desktop | `height:100px` via media query conflita com `min-height:75px` da regra base — deveria usar apenas `height` ou consolidar | 🟡 Médio | ✅ Corrigido |
| T3 | Label "DICAS/DEPOIMENTOS" | Quebra em 2 linhas (`DICAS/` + `DEPOIMENTOS`) enquanto os outros 3 ficam em 1 linha — visualmente desequilibrado. Mitigado com `word-break:break-word` e `line-height:1.1` para quebra harmoniosa | 🟡 Médio | ⚠️ Mitigado |

---

## 3. Cores e Contraste

| # | Elemento | Problema | Severidade | Status |
|---|----------|----------|------------|--------|
| C1 | `.nav-orange` box-shadow | `box-shadow: 0 0 15px rgba(255,255,255,0.6) !important` — brilho branco excessivo no botão PROMOÇÃO cria hierarquia errada | 🟠 Alto | ✅ Corrigido |
| C2 | `.brand-sub` | `color:#7B2D8B` (roxo) sobre fundo vermelho do header — contraste WCAG AA insuficiente. CSS morto atualmente | 🟡 Baixo | ✅ Não renderizado |
| C3 | `.brand-name` | `color:#E8000D` sobre gradiente vermelho — texto quase invisível se renderizado. CSS morto atualmente | 🟡 Baixo | ✅ Não renderizado |
| C4 | `.carrinho-cortesia-label2` | `color:#3E0066` (roxo escuro) sobre fundo branco — contraste adequado (>4.5:1) | ✅ OK | ✅ Sem alteração |
| C5 | Strip sensorial | `color:#F9A825` sobre `background:#C62828` — contraste ~1.85:1, muito abaixo de WCAG AA (4.5:1) para texto pequeno | 🔴 Crítico | ✅ **Corrigido** — mudado para `#fff` (contraste ~5.5:1, passa WCAG AA) |
| C6 | Stats section gradient | `background: linear-gradient(#e91e63, #ff5722)` — pink/laranja não alinhado com paleta da marca (vermelho/azul/dourado) | 🟡 Médio | ✅ **Corrigido** — `#C62828→#E8000D` (vermelho Itapolitana) |

---

## 4. Tipografia

| # | Elemento | Problema | Severidade | Status |
|---|----------|----------|------------|--------|
| F1 | CSS malformado | `};margin-top:10px;}` — CSS parse error após fechamento do `@media` | 🟠 Alto | ✅ Corrigido |
| F2 | `.nav-label` font-size | `clamp(13px,3.5vw,15px)` — DICAS/DEPOIMENTOS fica em 2 linhas | 🟡 Médio | ⚠️ Aceito (texto quebra harmoniosamente) |
| F3 | `.frase-sensorial` | `white-space:nowrap` + `text-overflow:ellipsis` — texto longo pode ser truncado | 🟡 Médio | ⚠️ Aceito (textos são controlados via JS) |

---

## 5. Consistência de Botões do Topo

| # | Elemento | Problema | Status |
|---|----------|----------|--------|
| B1 | FIDELIDADE sem classe de cor | Botão FIDELIDADE usava `class="nav-btn"` sem classe de cor, enquanto outros 3 têm `.nav-purple`, `.nav-orange`, `.nav-green` | ✅ **Corrigido** — adicionado `nav-yellow` |
| B2 | `.nav-label` no FIDELIDADE | Sem `style="color:#fff;"` explícito na `.nav-label`, diferente dos outros 3 | ✅ **Corrigido** — adicionado `style="color:#fff;"` |

---

## 6. Mini Design System de Botões (implementado)

Hierarquia de CTAs alinhada com padrões iFood / McDonald's:

### Botões Primários (ação principal)
| Classe | Cor | Uso |
|--------|-----|-----|
| `.vc-btn` | laranja→vermelho | "Ver nosso Cardápio" — CTA principal da HOME |
| `.btn-sabores` | vermelho | "Ver Sabores" — ação dentro do cardápio |
| `.promo-btn` | dourado | "Ver Promoção Completa" — modal de promoção |

### Botões Secundários (navegação e apoio)
| Classe | Cor | Uso |
|--------|-----|-----|
| `.btn-voltar-inicio` | azul royal | Voltar ao início do cardápio |
| `.enc-link-btn` | azul royal | Links de encomenda |
| `.btn-comp` | âmbar | Ver complementos do açaí |

### Botões de Topo (header — 4 navigação)
| Classe | Cor | Destino |
|--------|-----|---------|
| `.nav-purple` | azul royal | Encomendas |
| `.nav-orange` | vermelho | Promoção |
| `.nav-green` | verde | Dicas/Depoimentos |
| `.nav-yellow` | laranja | Fidelidade |

**Regras comuns a todos os botões:**
- `min-height: 44–48px` (área de toque Apple/Google)
- `font-weight: 900` + `text-shadow` para legibilidade em fundos coloridos
- `border-radius: 50px` (pill shape — padrão grandes apps de comida)
- `:hover` com `translateY(-2px) scale(1.03)` — feedback visual imediato

---

## 7. Guia de Teste (breakpoints)

Ao abrir o site nos breakpoints abaixo, observe:

| Largura | O que checar |
|---------|-------------|
| **360px** | Logo + 2×2 botões lado a lado, sem overflow horizontal |
| **768px** | 4 botões em linha, todos mesma altura |
| **1024px** | 4 botões centralizados, logo acima centralizada |
| **1366px** | Logo central, 4 botões uniformes abaixo, strip sensorial com texto branco legível |

---

## 8. Arquivos modificados

- `index.html` — CSS inline: strip sensorial contraste, stats section cor, design system botões, preconnect Google Fonts, noscript fallback; HTML: botão FIDELIDADE (`nav-yellow` class + `nav-label` color)
- `docs/auditoria-visual-home.md` — este arquivo (atualizado com novas correções)
