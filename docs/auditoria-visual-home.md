# Auditoria Visual — HOME (index.html)
> Referência: iFood, Uber Eats, McDonald's Brasil  
> Data: 2026-05-05  
> Auditor: Copilot Lead UI/UX

---

## 1. Alinhamento

| # | Elemento | Problema | Severidade |
|---|----------|----------|------------|
| A1 | `.header-inner` | CSS base nunca aplicado por typo `..header-inner` (duplo ponto). Sem `max-width`, `margin:0 auto` ou `display:flex` base. | 🔴 Crítico |
| A2 | `.header-nav` no desktop | `width:auto` + `grid-template-columns:repeat(4,1fr)` — em flex container com `align-items:center`, as colunas `1fr` não têm espaço definido para se distribuir, resultando em tamanhos imprevisíveis | 🟠 Alto |
| A3 | Logo no header | Centraliza via `@media` mas sem a regra base o comportamento em breakpoints intermediários é indefinido | 🟠 Alto |
| A4 | Carrinho Cortesia cards | HTML idêntico nos 2 cards; sem `min-height` explícita, qualquer variação de conteúdo dinâmico pode causar alturas diferentes | 🟡 Médio |

---

## 2. Tamanho / Proporção

| # | Elemento | Problema | Severidade |
|---|----------|----------|------------|
| T1 | Botão PROMOÇÃO `.nav-orange` | `border:3px solid #FFFFFF !important` — borda 3× mais espessa que os outros botões (1px semi-transparente). O `!important` vence o `border:none` do inline style, fazendo o botão aparentar maior visualmente | 🔴 Crítico |
| T2 | `.nav-btn` no desktop | `height:100px` via media query conflita com `min-height:75px` da regra base — deveria usar apenas `height` ou consolidar | 🟡 Médio |
| T3 | Label "DICAS/DEPOIMENTOS" | Quebra em 2 linhas (`DICAS/` + `DEPOIMENTOS`) enquanto os outros 3 ficam em 1 linha — visualmente desequilibrado | 🟡 Médio |

---

## 3. Cores e Contraste

| # | Elemento | Problema | Severidade |
|---|----------|----------|------------|
| C1 | `.nav-orange` box-shadow | `box-shadow: 0 0 15px rgba(255,255,255,0.6) !important` — brilho branco excessivo no botão PROMOÇÃO cria hierarquia errada: o PROMOÇÃO parece o CTA principal quando ENCOMENDAS deveria ter destaque equivalente | 🟠 Alto |
| C2 | `.brand-sub` | `color:#7B2D8B` (roxo) sobre fundo vermelho do header — contraste WCAG AA insuficiente (estimado ~1.8:1). Obs: elemento não renderizado no HTML atual, é CSS morto | 🟡 Baixo |
| C3 | `.brand-name` | `color:#E8000D` sobre gradiente vermelho `#E8000D–#C62828` — texo quase invisível se renderizado. CSS morto atualmente | 🟡 Baixo |
| C4 | `.carrinho-cortesia-label2` | `color:#3E0066` (roxo escuro) sobre fundo branco — contraste adequado (>4.5:1), sem problemas | ✅ OK |
| C5 | Strip sensorial | `color:#F9A825` sobre `background:#C62828` — contraste ~3.8:1, passável mas abaixo do ideal WCAG AA (4.5:1) para texto pequeno | 🟡 Médio |

---

## 4. Tipografia

| # | Elemento | Problema | Severidade |
|---|----------|----------|------------|
| F1 | CSS malformado linha 264 | `};margin-top:10px;}` — CSS parse error após fechamento do `@media`. Browsers ignoram graciosamente mas contamina o parser | 🟠 Alto |
| F2 | `.nav-label` font-size | `clamp(13px,3.5vw,15px)` — no desktop (1366px) fica em 15px. Suficiente para todos os labels exceto o DICAS/DEPOIMENTOS que fica em 2 linhas | 🟡 Médio |
| F3 | `.frase-sensorial` | `white-space:nowrap` + `text-overflow:ellipsis` — texto longo pode ser truncado sem o usuário perceber | 🟡 Médio |

---

## 5. Decisões de Design tomadas

### 5.1 Normalização dos 4 botões do topo
- **Problema**: PROMOÇÃO tinha `border:3px solid #FFFFFF !important` que "saltava" visualmente em relação aos outros 3 botões
- **Decisão**: Remover o `!important` e padronizar todos os `.nav-*` com `border:2px solid rgba(255,255,255,0.35)` — sutil, consistente, mantém a distinção de cor sem diferença estrutural
- **Referência**: iFood usa mesma borda/tamanho em todos os botões de categoria no topo

### 5.2 Regra base `.header-inner`
- **Problema**: typo `..header-inner` tornava a regra inválida; layout dependia 100% de media queries
- **Decisão**: Corrigir o typo. Isso restabelece `max-width:960px; margin:0 auto; display:flex; flex-direction:column; align-items:center` como base, com as media queries sobrescrevendo conforme necessário

### 5.3 Grid do `.header-nav` no desktop
- **Problema**: `width:auto` + colunas `1fr` dentro de flex container com `align-items:center` = colunas sem largura de referência
- **Decisão**: `width:100%` para que as colunas `1fr` tenham espaço distribuível, limitado pelo `max-width:820px` herdado

### 5.4 Carrinhos Cortesia
- **Problema**: Sem `min-height` explícita nos cards
- **Decisão**: Adicionar `min-height:220px` e `justify-content:space-between` para garantir altura uniforme e espaçamento interno consistente nos 2 cards

### 5.5 CSS malformado
- **Problema**: linha `};margin-top:10px;}` causa parse error
- **Decisão**: Remover o fragmento inválido

---

## 6. Guia de Teste (breakpoints)

Ao abrir o site nos breakpoints abaixo, observe:

| Largura | O que checar |
|---------|-------------|
| **360px** | Logo + 2×2 botões lado a lado, sem overflow horizontal |
| **768px** | 4 botões em linha, todos mesma altura |
| **1024px** | 4 botões centralizados, logo acima centralizada |
| **1366px** | Logo central, 4 botões uniformes abaixo, sem botão PROMOÇÃO com borda extra |

---

## 7. Arquivos modificados

- `index.html` — CSS inline (linhas ~249–274, ~524–644) e HTML dos botões (linhas ~1892–1897)
- `docs/auditoria-visual-home.md` — este arquivo
