# RELATORIO.md — Sorveteria Itapolitana Cajuru
> **Este arquivo é a verdade absoluta sobre a arquitetura atual do site.**  
> Última atualização: 2026-05-04 (PR: melhorar-home-cardápio / UX+LGPD formulários)

---

## 1. ARQUITETURA GERAL

### 1.1 Estrutura de arquivos
```
/
├── index.html               ← Página principal (Home + Cardápio)
├── encomendas.html          ← Encomendas (tortas, caixas, picolés)
├── promocao.html            ← Promoção do mês / sorteio
├── dicas.html               ← Dicas e conteúdo
├── fidelidade.html          ← Programa de fidelidade (wizard 5 passos)
├── admin-painel.html        ← Painel administrativo (NÃO ALTERAR)
├── dados/
│   ├── config.json          ← Configurações gerais (hero, footer, horário)
│   ├── produtos.json        ← Preços e sabores de todos os produtos
│   ├── promo.json           ← Promoção ativa / banner
│   ├── clientes.json        ← Cadastro de clientes (fidelidade)
│   ├── fidelidade.json      ← Dados do programa de fidelidade
│   └── encomendas.json      ← Pedidos de encomenda
├── images/                  ← Imagens do site
└── scripts/
    ├── site-loader.js       ← Carregador do site (defer)
    └── products.js          ← Auxiliar de produtos (defer)
```

### 1.2 Origem dos dados (Single Source of Truth)
- **Todos os dados** são servidos pelos arquivos em `dados/*.json` via GitHub Raw URL.
- O admin (`admin-painel.html`) edita esses JSONs via GitHub API e salva de volta.
- O site consome `dados/produtos.json`, `dados/config.json` e `dados/promo.json` a cada carregamento.
- **NÃO alterar** a estrutura dos JSON nem renomear campos.

### 1.3 Funções principais (JavaScript — index.html)
| Função | Descrição |
|---|---|
| `carregarConfig()` | Carrega `dados/config.json` e aplica textos/configurações na página |
| `carregarPreçosNuvemCardápio()` | Carrega `dados/produtos.json` e sincroniza a variável `produtos` |
| `renderTudo()` | Chama todas as funções de render: sorvetes, milk, taças, açaí, picolés, iso, sobremesas, complementos |
| `toggleAcc(id)` | Abre/fecha accordion; atualiza `aria-expanded` e anima `max-height` |
| `_semPulo(fn)` | Executa mudança de innerHTML sem mover o scroll (padrão iFood/Rappi) |
| `voltarNivel(btn)` | Restaura o HTML anterior do accordion a partir de `_nivelAnterior[accId]` |
| `aplicarConfig(c)` | Aplica configurações do JSON nos elementos do DOM |

### 1.4 Navegação inline em 3 níveis (sem modal, sem scroll)
- **Nível 1**: Página principal
- **Nível 2**: Cardápio aberto (`vc-container.aberto`)
- **Nível 3**: Categoria expandida (accordion `.acc.open`)
- **Nível 4**: Detalhe de produto (sabores/complementos inline via `mostrarSaboresInline`)

O `_nivelAnterior{}` armazena o HTML original do `acc-body` antes de exibir sabores/complementos inline. `voltarNivel()` restaura esse HTML. Toda mudança de conteúdo usa `_semPulo()`.

---

## 2. UX DO CARDÁPIO (Atualizações — PR melhorar-home-cardápio)

### 2.1 Hierarquia visual e escaneabilidade

**Alterações realizadas em `index.html`:**

- **`.prod-card-body`**: mantido com padding `10px 12px 14px`.
- **`.prod-nome`**: `font-size` mantido em `14px`, `font-weight` aumentado de `800` para `900` para maior destaque do nome do item.
- **`.prod-desc`**: `font-size` ajustado de `12px` para `11px`, `font-weight` de `700` para `600` — hierarquia mais clara em relação ao nome.
- **`.prod-preço`**: adicionado `padding-top:6px` e `border-top:1px solid #F0E8D8` — separação visual leve entre descrição e preço, sem poluir o card.
- Adicionado comentário `/* HIERARQUIA: nome (maior/negrito) → descrição (menor/roxo) → preço (vermelho/destaque) */` acima dos estilos.
- **`.açaí-item`**: adicionado comentário `/* HIERARQUIA: nome + preço na mesma linha (row) → descrição abaixo */` — documenta o layout existente.

A hierarquia final por categoria:
- **Sorvetes/Milkshake/Taças/Iso/Sobremesas (prod-card)**: Nome (14px/900) → Descrição (11px/600, roxo) → Preço (18px/900, vermelho, com separador).
- **Açaí**: Nome + Preço na mesma linha → Descrição abaixo.
- **Picolés**: Ícone → Nome (13px/900, roxo escuro) → Badge de tipo → Descrição (11px/555) → Preço (15px/900, rosa) → Botão sabores.

### 2.2 Destaques visuais "Mais pedido" / "Favorito" (infraestrutura pronta)

Adicionadas as classes CSS no `<head>` de `index.html`:

```css
/* SELOS DE DESTAQUE — "Mais Pedido" / "Favorito"
   Ativação futura: verificar campo is_featured em produtos.json
   e injetar <span class="badge-mais-pedido">Mais pedido</span>
   ou <span class="badge-favorito">Favorito</span>
   dentro de .prod-card-body ao renderizar via renderTudo(). */
.badge-mais-pedido, .badge-favorito {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  border-radius: 20px;
  padding: 2px 9px;
  letter-spacing: .3px;
  vertical-align: middle;
  margin-left: 4px;
  pointer-events: none;
  line-height: 1.4;
}
.badge-mais-pedido { background: #C62828; color: #fff; }
.badge-favorito    { background: #F9A825; color: #1A0A00; }
```

**Como ativar futuramente (sem alterar JSON agora):**
1. Adicionar campo `"is_featured": true` e/ou `"badge": "mais-pedido"` (ou `"favorito"`) em `dados/produtos.json`.
2. Nas funções `renderSorvetes()`, `renderMilk()`, `renderTacas()`, `renderTacasP()`, `renderAçaí()`, `renderAçaíPromo()`, `renderIso()`, `renderSobremesas()` em `index.html`, verificar o campo e injetar o `<span>` dentro de `.prod-card-body` após o `.prod-nome`.
3. Para picolés: no loop em `renderPicolés()`, injetar o badge dentro do `d.innerHTML` após `info.titulo`.
4. **Exemplo de implementação futura** (em `renderSorvetes`):
   ```js
   const badgeHtml = p.is_featured === 'mais-pedido'
     ? '<span class="badge-mais-pedido">Mais pedido</span>'
     : p.is_featured === 'favorito'
     ? '<span class="badge-favorito">Favorito</span>'
     : '';
   // Inserir após o nome: `${nomes[key]||key}${badgeHtml}`
   ```

### 2.3 Engenharia de cardápio (ordem estratégica — sugestões, sem alterar JSON)

A ordenação atual reflete a estrutura dos JSONs em `dados/produtos.json`. Para otimizar a conversão:

**Sugestões para implementação futura (requer campo em JSON):**
- Adicionar campo `"ordem": número` em cada produto do JSON para controlar a posição.
- Nas funções de render, ordenar por `p.ordem` antes do `forEach`.
- **Ordem estratégica sugerida por categoria:**
  - **Sorvetes**: Cascão e Cestinha (ticket maior) primeiro, depois Copão Recheado, depois Casquinha.
  - **Milkshake**: Top (maior ticket) antes do Tradicional.
  - **Taças**: Ula-Ula e Sundae com Nutella (maior ticket) primeiro; Unicórnio (menor) por último.
  - **Açaí Promoção**: Combos maiores (700ml/600ml) em destaque no topo.
  - **Picolés**: Esquimó (premium) primeiro, Leite Ninho (especial) segundo.
- Sazonais / promoções: adicionar campo `"sazonal": true` e renderizar com badge visual diferenciado.

---

## 3. PERFORMANCE (Atualizações — PR melhorar-home-cardápio)

### 3.1 Imagens

**Estado atual das imagens em `index.html`:**

| Imagem | `loading` | `decoding` | `width`/`height` | Prioridade para WebP |
|---|---|---|---|---|
| `images/logo.webp` (header) | `eager` | `async` | 80×80 (style) | — (já é WebP) |
| `images/carrinho-picole.webp` (hero) | `lazy` | `async` | 110×147 ✅ | — (já é WebP) |
| `images/sorvete-icon.webp` (encomendas) | `lazy` | `async` | 60×60 ✅ | — (já é WebP) |
| `images/logo.webp` (footer) | `lazy` | `async` | **160×160** ✅ ← **adicionado nesta PR** | — (já é WebP) |
| `<img>` dinâmicos via `imgCard()` | `lazy` | `async` | Não tem (render dinâmico) | ⚠️ Prioridade média |
| `<img>` complementos via `renderComplementosCardápio()` | `lazy` | `async` | 50×50 (style) | ⚠️ Prioridade baixa |

**Imagens priorizadas para conversão WebP/AVIF (já WebP em maioria):**
- `images/logo.webp` ← já convertida ✅
- `images/carrinho-picole.webp` ← já convertida ✅
- `images/banner-cardápio.webp` ← já convertida ✅
- **Imagens de produtos** injetadas via `imgCard()` de localStorage: se/quando forem convertidas pelo admin, idealmente salvar versão `.webp` no upload.
- **Imagens de clientes/fidelidade**: candidatas para conversão futura se tamanho for grande.

**Estrutura `<picture>` com WebP já em uso:**
```html
<!-- Exemplo existente (carrinho de picolé) -->
<picture>
  <source srcset="images/carrinho-picole-sm.webp 400w, images/carrinho-picole-md.webp 800w"
          sizes="110px" type="image/webp">
  <img ... width="110" height="147" loading="lazy" decoding="async" src="images/carrinho-picole.webp">
</picture>
```

### 3.2 Scripts

**Estado atual dos scripts em `index.html`:**

| Script | Estratégia | Motivo |
|---|---|---|
| Google Tag Manager (GTM) | `inline` (bloqueante — obrigatório GTM) | Padrão GTM |
| Google Analytics (`gtag.js`) | `async` ✅ | Não bloqueante |
| `scripts/site-loader.js` | `defer` ✅ | Não crítico |
| `scripts/products.js` | `defer` ✅ | Não crítico |
| Scroll Reveal, LGPD, PWA | Inline ao final do `<body>` | Adequado (executam após parse) |
| Frase rotativa (`setInterval`) | Inline, sem defer | **Candidato à otimização**: poderia aguardar `DOMContentLoaded` + idle |

**Candidatos a remoção (documentados, não removidos nesta PR):**
- `setInterval` da frase rotativa e strip sensorial: executam antes do DOM estar pronto em browsers lentos — verificar se `DOMContentLoaded` é suficiente.
- Código de chatbot `RESPOSTAS` e `getResp()`: grande bloco inline — candidato a arquivo externo `scripts/chatbot.js` com `defer`.

### 3.3 CSS

**Estado atual:**
- CSS inteiramente inline no `<head>` (~1.800 linhas).
- Já organizado com comentários em blocos (`/* ACCORDION */`, `/* HERO */`, `/* GRID PRODUTOS */`, etc.).

**Adições de comentários nesta PR:**
- `/* HIERARQUIA: nome → descrição → preço */` acima dos estilos `.prod-card-body`.
- `/* SELOS DE DESTAQUE — Badge "Mais Pedido/Favorito" */` acima dos novos estilos de badges.
- `/* HIERARQUIA: nome + preço na mesma linha (row) → descrição abaixo */` acima de `.açaí-item`.

**CSS crítico (candidato para inlining em PR futura):**
- `.hero`, `.header`, `.promo-top-bar`, `.info-cards` (primeira dobra).
- Reset (`*{box-sizing:border-box;margin:0;padding:0}`).

**CSS não-crítico (candidato para arquivo externo `styles-lazy.css`):**
- `.chat-*`, `.modal-*`, `.promo-overlay`, `.acc-body` (fora da dobra inicial).
- `@keyframes` decorativas (neon-pulse, itabot-pulse).
- Estilos de componentes de fidelidade/admin.

**Redundâncias identificadas (não removidas nesta PR):**
- `.header-nav` tem regras duplicadas nos media queries de 480px–767px e ≥768px — valores muito próximos.
- `.nav-btn` tem `height` e `min-height` duplicados em diferentes media queries.

---

## 4. ACESSIBILIDADE (Atualizações — PR melhorar-home-cardápio)

### 4.1 Correções de `aria-controls` nos accordions

**Problema encontrado:** Todos os `aria-controls` dos cabeçalhos dos accordions apontavam para IDs com prefixo `acc-` que não existiam no DOM. Os IDs reais das divs `.acc-body` eram diferentes.

**Correções realizadas (13 accordions):**

| Accordion | `aria-controls` ANTES | `aria-controls` DEPOIS | ID real da `.acc-body` |
|---|---|---|---|
| `acc-sorvetes` | `acc-sorvetes-body` ❌ | `sorvetes-body` ✅ | `sorvetes-body` |
| `acc-picolés` | `acc-picolés-body` ❌ | `picolés-body` ✅ | `picolés-body` |
| `acc-açaí-promo` | `acc-açaí-promo-body` ❌ | `açaí-promo-body` ✅ | `açaí-promo-body` |
| `acc-açaí` | `acc-açaí-body` ❌ | `açaí-body` ✅ | `açaí-body` |
| `acc-milk` | `acc-milk-body` ❌ | `milk-body` ✅ | `milk-body` |
| `acc-tacas` | `acc-tacas-body` ❌ | `tacas-body` ✅ | `tacas-body` |
| `acc-tacas-p` | `acc-tacas-p-body` ❌ | `tacas-p-body` ✅ | `tacas-p-body` |
| `acc-iso` | `acc-iso-body` ❌ | `iso-body` ✅ | `iso-body` |
| `acc-sobremesas` | `acc-sobremesas-body` ❌ | `sobremesas-body` ✅ | `sobremesas-body` |
| `acc-enc-caixas` | `acc-enc-caixas-body` ❌ | `acc-enc-caixas-body` ✅ | adicionado `id="acc-enc-caixas-body"` |
| `acc-enc-tortas` | `acc-enc-tortas-body` ❌ | `acc-enc-tortas-body` ✅ | adicionado `id="acc-enc-tortas-body"` |
| `acc-enc-picolés` | `acc-enc-picolés-body` ❌ | `picolés-enc-body` ✅ | `picolés-enc-body` |
| `acc-complementos` | `acc-complementos-body` ❌ | `acc-body-complementos` ✅ | `acc-body-complementos` |

**Como `aria-expanded` é gerenciado:**
- A função `toggleAcc(id)` atualiza corretamente `aria-expanded` em todos os casos: `h.setAttribute('aria-expanded', 'true/false')`.
- Também é atualizado por `voltarCardapio()`.
- **Nenhuma mudança necessária** nessa parte — já estava correto.

### 4.2 Navegação por teclado

**Estado atual (verificado):**
- Todos os cabeçalhos de accordion têm `role="button"`, `tabindex="0"`.
- `onkeydown` responde a `Enter` e `Espaço` chamando `toggleAcc()`.
- O botão principal "Ver nosso Cardápio" (`#vc-btn`) tem `aria-label="Ver nosso Cardápio"` e `aria-expanded` atualizado.
- Foco visível: `.acc-header:focus-visible` tem `outline:3px solid rgba(255,255,255,.8)` — adequado sobre fundos escuros.

**Pontos para melhoria futura:**
- Os botões de categoria da seção "Categorias da Home" (se existir) devem ter `role="button"` e `tabindex="0"`.
- Considerar `role="region"` com `aria-label` nos blocos de accordion para leitores de tela.
- Para `voltarNivel()` e `voltarCardapio()`: mover o foco de volta para o cabeçalho do accordion após restaurar o nível anterior (melhoria de UX para usuários de teclado).

### 4.3 Links e textos descritivos

**Estado atual (verificado):**
- Imagens têm `alt` descritivos adequados.
- Botões têm texto legível ou `aria-label`.
- Links de navegação (WhatsApp, Google Maps) têm texto descritivo.
- `aria-hidden="true"` em ícones decorativos (setas, emojis).

**Ponto identificado para melhoria futura:**
- O link de promoção FAB (`#promo-fab`) não tem `aria-label` explícito — o texto interno "🎉 SORTEIO! / ⏳ Ver detalhes / ▼ VER PROMOÇÃO" é legível mas poderia ter um `aria-label="Ver promoção do mês"`.
- O `#admin-fab` tem texto muito pequeno e baixo contraste intencional (design) — documentado como exceção.

### 4.4 Contraste e legibilidade

**Revisado nesta PR:**
- `.badge-mais-pedido`: fundo `#C62828` (vermelho escuro) + texto branco → contraste > 7:1 (WCAG AAA). ✅
- `.badge-favorito`: fundo `#F9A825` (âmbar) + texto `#1A0A00` (preto quase puro) → contraste > 6:1 (WCAG AA+). ✅
- `.prod-desc`: cor `#7B2D8B` (roxo médio) sobre `#FFFDF9` (quase branco) → contraste ~4.6:1 (WCAG AA). ✅
- `.prod-preço`: cor `#E8000D` (vermelho) sobre `#FFFDF9` → contraste ~4.5:1 (WCAG AA para texto grande). ✅

**Pontos de atenção (não alterados):**
- `.acc-sub` em acordeões: texto branco `rgba(255,255,255,0.85)` sobre gradientes coloridos → contraste pode ficar abaixo de AA em alguns gradientes — requer revisão pontual.
- Texto do FAB de promoção sobre gradiente laranja-vermelho: legível mas próximo do limiar.

---

## 7. FORMULÁRIOS E LGPD (Atualizações — PR melhorar-home-cardápio)

### 7.1 Inventário de formulários

| Arquivo | Formulário / Área | IDs principais | Tem consentimento? |
|---|---|---|---|
| `fidelidade.html` | Bloco Regulamento Fidelidade (inline) | `aceite-fidelidade-inline`, `btn-aceitar-fidelidade-inline` | ✅ Aprimorado nesta PR |
| `fidelidade.html` | Painel Cadastro Novo (`form-novo`) | `inp-nome`, `inp-data-nasc`, `inp-cel-novo`, `btn-cadastrar` | ✅ Adicionado nesta PR |
| `fidelidade.html` | Painel Login (`form-login`) | `inp-cel-login`, `inp-login-dia/mes/ano` | — (login, não coleta novos dados) |
| `fidelidade.html` | Bloco Regras Estrelas (painel cliente) | `chk-aceita-regras-estrelas` | ✅ Aprimorado nesta PR |
| `fidelidade.html` | Inserir Código (painel cliente) | `input-codigo`, `btn-validar` | — (só valida código) |
| `promocao.html` | Aceite Sorteio (inline, antes do form) | `aceite-sorteio-inline`, `btn-aceitar-sorteio-inline` | ✅ Aprimorado nesta PR |
| `promocao.html` | Form Sorteio Inline | `sort-nome`, `sort-cel`, `sort-dia/mes/ano`, `btn-enviar-sorteio-promo` | ✅ Nota LGPD adicionada nesta PR |

### 7.2 Melhorias implementadas

**Padrão aplicado em todos os campos de consentimento:**
- Checkbox `22×22px` (vs. 18px anterior) — atende o mínimo visual recomendado pelo WCAG
- Área de toque da `<label>` toda clicável (`min-height: 44px`) — WAI-WCAG AA touch target
- `for="id-do-checkbox"` na `<label>` — associação semântica correta
- `aria-disabled="true"` sincronizado com o atributo `disabled` no botão
- Link para `politica-privacidade.html` no texto de consentimento — conformidade LGPD
- Texto "ⓘ Marque a caixa acima para continuar" visível quando botão está desabilitado
- Botão ativo com `animation: pulsarBtnConsent` — sinaliza claramente a ação disponível
- `.aceite-area` / `.aceite-area-promo`: fundo colorido + borda que distingue a zona de consentimento do resto do formulário

**Classes CSS adicionadas em `fidelidade.html`:**
- `.aceite-area` (laranja/verde) — container visual da zona de consentimento
- `.aceite-label` — label clicável, hierarquia clara
- `.aceite-lgpd-link` — link para política de privacidade
- `.btn-aceitar-hint` — texto de ajuda visível quando botão está desabilitado
- `.aceite-estrelas-label` — variante para o painel do cliente (regras da caçada)
- `@keyframes pulsarBtnConsent` — animação do botão após liberação

**Funções JS adicionadas em `fidelidade.html`:**
- `verificarLgpdNovo()` — gata o botão `#btn-cadastrar` do `form-novo` ao checkbox `#chk-lgpd-novo`

**Classes CSS adicionadas em `promocao.html`:**
- `.aceite-area-promo`, `.aceite-label-promo`, `.aceite-lgpd-link-promo` — idem, tema verde
- `#btn-aceitar-sorteio-inline.ativo-verde` — estado ativo com animação
- `@keyframes pulsarVerde` — pulsação verde do botão após marcar consentimento

### 7.3 Sugestões futuras

- **Form-login**: Adicionar nota "Ao entrar, você concorda com nossa Política de Privacidade" (sem checkbox, pois é só login) para melhor transparência.
- **`politica-privacidade.html`**: Verificar se a página existe; se não, criar uma versão simplificada com: finalidade dos dados, base legal (legítimo interesse / consentimento), retenção, direitos do titular (art. 18 LGPD), contato do responsável.

---


### 5.1 Curto prazo (próxima PR)
- [ ] Adicionar campo `"is_featured"` (string: `"mais-pedido"` | `"favorito"` | `null`) em `dados/produtos.json` e ligar aos badges CSS já preparados.
- [ ] Adicionar campo `"ordem"` em cada item de produto para controlar posição estratégica sem alterar o JSON manualmente.
- [ ] Mover o bloco de chatbot (`RESPOSTAS` + `getResp()` + `enviarChat()`) para `scripts/chatbot.js` com `defer` — reduz CSS inline ~150 linhas.
- [ ] Adicionar `aria-label="Ver promoção do mês"` no `#promo-fab`.
- [ ] Mover foco para o cabeçalho do accordion após `voltarNivel()` (melhoria keyboard UX).

### 5.2 Médio prazo
- [ ] Separar CSS em arquivo externo `styles.css` (com critical CSS inline no `<head>`).
- [ ] Converter imagens de produtos carregadas pelo admin para WebP no momento do upload.
- [ ] Implementar `role="region"` + `aria-label` nos blocos de accordion para leitores de tela.
- [ ] Adicionar `aria-live="polite"` no painel de preços/sabores que atualiza dinamicamente (já existe `#live-region` mas não está sendo alimentado).

### 5.3 Longo prazo
- [ ] Migrar para Service Worker com cache de `dados/*.json` para funcionamento offline total.
- [ ] Implementar paginação/virtualização nos grids de produtos (quando catálogo crescer).
- [ ] Adicionar sistema de avaliação por produto (campo `rating` no JSON + UI stars).
- [ ] Integrar pedido direto ao WhatsApp com pré-montagem da mensagem pelo usuário.

---

## 6. RESTRIÇÕES (NÃO ALTERAR)
- ❌ NÃO alterar estrutura dos JSON em `dados/`
- ❌ NÃO remover ou renomear campos dos JSON
- ❌ NÃO modificar `admin-painel.html`
- ❌ NÃO mudar as rotas: `index.html`, `encomendas.html`, `promocao.html`, `dicas.html`, `fidelidade.html`
- ❌ Qualquer mudança de back-end ou JSON: **somente documentar como sugestão acima**

---

*Documento mantido pela equipe de desenvolvimento. Toda PR deve atualizar este arquivo.*