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
├──           ← Programa de fidelidade (wizard 5 passos)
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
| `` | Bloco Regulamento Fidelidade (inline) | `aceite-fidelidade-inline`, `btn-aceitar-fidelidade-inline` | ✅ Aprimorado nesta PR |
| `` | Painel Cadastro Novo (`form-novo`) | `inp-nome`, `inp-data-nasc`, `inp-cel-novo`, `btn-cadastrar` | ✅ Adicionado nesta PR |
| `` | Painel Login (`form-login`) | `inp-cel-login`, `inp-login-dia/mes/ano` | — (login, não coleta novos dados) |
| `` | Bloco Regras Estrelas (painel cliente) | `chk-aceita-regras-estrelas` | ✅ Aprimorado nesta PR |
| `` | Inserir Código (painel cliente) | `input-codigo`, `btn-validar` | — (só valida código) |
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

**Classes CSS adicionadas em ``:**
- `.aceite-area` (laranja/verde) — container visual da zona de consentimento
- `.aceite-label` — label clicável, hierarquia clara
- `.aceite-lgpd-link` — link para política de privacidade
- `.btn-aceitar-hint` — texto de ajuda visível quando botão está desabilitado
- `.aceite-estrelas-label` — variante para o painel do cliente (regras da caçada)
- `@keyframes pulsarBtnConsent` — animação do botão após liberação

**Funções JS adicionadas em ``:**
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

## 7. RELATÓRIO LOTE 2.3 — REMEDIAÇÃO FINAL DE SEGURANÇA

**Data:** 2026-07-24 22:26 UTC  
**Branch:** copilot/valores-estao-erraods  
**Status:** Implementação de código concluída. Staging real: BLOQUEADO (sem acesso Cloudflare).

---

### 7.1 URL do Staging

**BLOQUEADO.** O ambiente sandbox não tem acesso à conta Cloudflare para deploy.  
Para configurar o staging, execute os passos abaixo com acesso à conta Cloudflare:

```bash
# 1. Criar namespaces KV de staging (separados de produção)
npx wrangler kv namespace create CLIENTES_KV --env staging
npx wrangler kv namespace create ENCOMENDAS_KV --env staging
npx wrangler kv namespace create RATE_KV --env staging

# 2. Atualizar wrangler.toml com os IDs retornados (staging env)

# 3. Configurar secrets de staging (NUNCA os de produção)
npx wrangler secret put GITHUB_TOKEN --env staging   # Token com escopo repo
npx wrangler secret put SETUP_KEY --env staging      # Chave temporária para gerar hash

# 4. Deploy de staging
npx wrangler deploy --env staging

# 5. Gerar hash PBKDF2 para nova senha de staging
curl -X POST https://<worker-staging-url>/api/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"setup_key":"<SETUP_KEY>","password":"<nova-senha-min-16-chars>"}'
# Retorna: { "ADMIN_HASH": "...", "ADMIN_SALT": "..." }

# 6. Configurar hash como secrets
npx wrangler secret put ADMIN_HASH --env staging
npx wrangler secret put ADMIN_SALT --env staging

# 7. Remover SETUP_KEY e ADMIN_SECRET legado
npx wrangler secret delete SETUP_KEY --env staging
# (manter ADMIN_SECRET em produção até rotação aprovada)
```

**Configuração de staging no wrangler.toml já documentada** — requer substituição dos placeholders KV.  
**URL esperada:** `https://itapolitana-api-staging.<account>.workers.dev`  
**Ambiente do Worker:** `staging`  
**Secrets a configurar (apenas por nome):** `GITHUB_TOKEN`, `ADMIN_HASH`, `ADMIN_SALT`, `SETUP_KEY` (temporário)

---

### 7.2 Código HTTP de Cada Arquivo Privado

**BLOQUEADO em staging real.** Testado apenas em nível de código/configuração.

**Mecanismo de bloqueio configurado no código** (`_redirects`):
| URL | Redirecionamento | HTTP esperado |
|-----|-----------------|---------------|
| `/dados/auth.json` | `/404` | 404 |
| `/dados/clientes.json` | `/404` | 404 |
| `/dados/pedidos.json` | `/404` | 404 |
| `/dados/encomendas.json` | `/404` | 404 |
| `/dados/submissoes_encomendas.json` | `/404` | 404 |
| `/dados/fidelidade.json` | `/404` | 404 |
| `/dados/carrinhos_abandonados.json` | `/404` | 404 |

**Pendência:** Validar com `curl` em staging real após deploy.

---

### 7.3 Resultado no Domínio Customizado / pages.dev / Preview

**BLOQUEADO.** Requer deploy em staging real.  
Verificar: `curl -I https://<staging-url>/dados/auth.json`

---

### 7.4 Lista de Arquivos no Build

Arquivos **privados** presentes no repositório mas bloqueados via `_redirects`:
- `dados/auth.json` — bloqueado → /404
- `dados/clientes.json` — bloqueado → /404
- `dados/pedidos.json` — bloqueado → /404
- `dados/encomendas.json` — bloqueado → /404
- `dados/submissoes_encomendas.json` — bloqueado → /404
- `dados/fidelidade.json` — bloqueado → /404
- `dados/carrinhos_abandonados.json` — bloqueado → /404

**Pendência crítica:** Remover esses arquivos do repositório Git (históricamente contêm PII). Usar apenas KV.

---

### 7.5 Busca por Secrets e Tokens

Scan executado com `runtime-tools-secret_scanning` nos arquivos modificados:  
✅ `cloudflare-worker/src/index.js` — **sem secrets**  
✅ `cloudflare-worker/wrangler.toml` — **sem secrets** (apenas placeholders documentados)  
✅ `admin-painel.html` — **sem secrets**

---

### 7.6 Remoção do PAT do Navegador

**IMPLEMENTADO neste lote:**

| Item | Status |
|------|--------|
| Campo de input de PAT removido do formulário de login | ✅ |
| Modal "Adicionar Token GitHub" removido | ✅ |
| `GITHUB_PAT` variável removida | ✅ |
| `GH_TOKEN_CAN_WRITE` removido | ✅ |
| `getToken()` removido | ✅ |
| `getAuthHeaders()` removido | ✅ |
| `tokenFormatoValido()` removido | ✅ |
| `validarToken()` removido | ✅ |
| `validarCampoToken()` removido | ✅ |
| `preencherTokenSalvoNoLogin()` removido | ✅ |
| `toggleGitHubToken()` removido | ✅ |
| PAT armazenado em sessionStorage | ✅ removido |
| `ghPut()` agora usa Worker (`/api/admin/github-file`) | ✅ |
| `ghPutImagem()` agora usa Worker | ✅ |
| `ghGetRepo()` fallback para GitHub API direta removido | ✅ |
| `workerAdminHeaders()` não envia mais Authorization PAT | ✅ |
| Sorteio: inscritos/edição/exclusão usam Worker session | ✅ |

O navegador **não mais**:
- Solicita PAT ao administrador
- Armazena PAT em sessionStorage ou localStorage
- Envia PAT em requisições para GitHub
- Exibe PAT no DOM

O Worker usa `GITHUB_TOKEN` armazenado como Cloudflare Secret.

---

### 7.7 Mapa de Endpoints Administrativos

| Endpoint | Método | Autenticação | Proteção |
|----------|--------|-------------|----------|
| `/api/admin/auth` | POST | N/A (autentica) | Rate limit: 10/hora |
| `/api/admin/session` | POST | N/A (autentica) | Rate limit: 10/hora |
| `/api/admin/session` | DELETE | Session token | Revoga sessão |
| `/api/admin/generate-hash` | POST | SETUP_KEY | Staging only |
| `/api/admin/github-file` | GET | Session token | isAdmin() |
| `/api/admin/github-file` | PUT | Session token | isAdmin() |
| `/api/clientes` | GET | Session token | isAdmin() |
| `/api/clientes/:id` | GET/PATCH/DELETE | Session token | isAdmin() |
| `/api/clientes/bulk` | PUT | Session token | isAdmin() |
| `/api/encomendas` | GET | Session token | isAdmin() |
| `/api/encomendas/:id` | PATCH/DELETE | Session token | isAdmin() |
| `/api/encomendas/bulk` | PUT | Session token | isAdmin() |
| `/api/admin/sorteio/inscritos` | GET | Session token | isAdmin() |
| `/api/admin/sorteio/inscritos/:id` | PATCH/DELETE | Session token | isAdmin() |

---

### 7.8 Método Real de Autenticação

**Implementado neste lote:**

**Preferido (PBKDF2-SHA-256):**
- Hash: PBKDF2 com SHA-256, 600.000 iterações, 256 bits de saída
- Salt: 16 bytes aleatórios
- Comparação: timing-safe via HMAC-SHA-256
- Armazenamento: `ADMIN_HASH` + `ADMIN_SALT` como Cloudflare Secrets
- Disponível nativamente no Web Crypto API do Worker

**Fallback legado (remover após migração):**
- Comparação direta via `timingSafeEqual()` com `ADMIN_SECRET`
- Removida a comparação direta não-timing-safe (`secret === env.ADMIN_SECRET`)

**Nota:** Argon2id e bcrypt não foram utilizados pois requerem bibliotecas npm de terceiros que precisam de build e teste explícito no Worker — conforme solicitado, não foram afirmados disponíveis sem comprovação.

---

### 7.9 Método de Sessão

- Sessão: token aleatório de 32 bytes (64 hex chars)
- Armazenamento: `RATE_KV` com TTL de 7200 segundos (2 horas)
- Header: `X-Itap-Session-Token`
- Revogação: `DELETE /api/admin/session` deleta o token do KV
- Expiração: automática por TTL do KV
- Browser: armazena apenas o token de sessão em sessionStorage (nunca a senha)

---

### 7.10 Resultado do Rate Limiting

| Operação | Limite | Janela |
|----------|--------|--------|
| Login admin | 10 tentativas | 1 hora |
| Cadastro cliente | 10 tentativas | 1 hora |
| Login cliente | 20 tentativas | 1 hora |
| Encomenda | 10 tentativas | 1 hora |
| Resgate de código | 10 tentativas | 1 hora |
| Sorteio | 3 tentativas | 30 min |

---

### 7.11 Revogação de Sessão

✅ **Implementado:** `DELETE /api/admin/session` com `X-Itap-Session-Token`  
✅ Sessão expirada automaticamente por TTL (2h)  
✅ Logout local remove token do KV (revogação imediata)  
✅ `invalidarTokenGitHub()` limpa sessão no browser e exibe banner de expiração

---

### 7.12 Testes

**Status dos testes Playwright:**

| Categoria | Aprovados | Falhos | Bloqueados | Motivo bloqueio |
|-----------|-----------|--------|------------|-----------------|
| Páginas básicas | N/A | N/A | ✋ | Sem staging real |
| Admin painel | N/A | N/A | ✋ | Sem staging + TEST_PASSWORD |
| Autenticação | N/A | N/A | ✋ | Sem staging |
| Sessão/logout | N/A | N/A | ✋ | Sem staging |

**Testes corrigidos no Lote 2.2:** Usam `process.env.TEST_PASSWORD` (não leem auth.json).  
**Pendência:** Executar após configurar staging real + definir `TEST_PASSWORD` como secret.

Comando: `cd tests && TEST_PASSWORD=<senha-staging> npx playwright test`

---

### 7.13 Status do Backup

**BLOQUEADO.** Sem acesso externo ao ambiente Cloudflare.  
**Recomendação:** Exportar KV de staging antes de testes destrutivos:
```bash
npx wrangler kv key list --binding CLIENTES_KV --env staging
```

---

### 7.14 Status do Rollback

**BLOQUEADO.** Sem deploy em staging real.  
Em caso de necessidade, reverter via `git revert <commit>` + `wrangler deploy`.

---

### 7.15 Status dos Preços

✅ **PRESERVADOS.**

| Produto | Varejo | Atacado | Localização |
|---------|--------|---------|-------------|
| Picolé Especiais (Leite Ninho / Ovomaltine) | R$ 4,00 | R$ 3,00 | `dados/produtos.json` > `leite_ninho` |
| Picolé Especiais (picolés key) | R$ 4,00 | R$ 3,00 | `dados/produtos.json` > `picolés` > `leite_ninho` |

Nenhum preço foi alterado neste lote.

---

### 7.16 Status dos Produtos e Pedidos

✅ **Preservados.** Nenhuma alteração em produtos, pedidos, clientes ou encomendas.

---

### 7.17 Divergência de Catálogo — Ovomaltine

**Investigação realizada:**

- **Chave JSON:** `leite_ninho` (tanto em `picoles` quanto em `picolés`)
- **Nome do produto:** "Picolé Especiais"
- **Sabores:** `["Leite Ninho", "Ovomaltine"]`
- **Preços:** R$ 4,00 varejo, R$ 3,00 atacado ✅
- **ID/SKU/slug:** Não há campo explícito — chave é `leite_ninho`

**Divergência identificada:**  
A chave `leite_ninho` agrupa os sabores Leite Ninho **e** Ovomaltine sob o nome "Picolé Especiais".  
O Ovomaltine não é um produto separado — é um **sabor** dentro da categoria `leite_ninho`.  
O relatório anterior afirmou que "Ovomaltine está incluso na categoria leite_ninho" — isso está **correto estruturalmente**: ambos os sabores compõem a mesma categoria de preço "Picolé Especiais".

**Classificação:** Inconsistência de nomenclatura de chave (chave `leite_ninho` representa "Picolé Especiais" com múltiplos sabores). **Não é um erro de dados.** O Ovomaltine não está indevidamente dentro da estrutura — faz parte do mesmo tier de preço.

**Status:** Registrado como **divergência de nomenclatura de chave** (não de dados).  
**Ação necessária:** Aprovação comercial para renomear a chave de `leite_ninho` para `especiais` (ou manter como está).  
**Nenhuma alteração feita.**

---

### 7.18 Riscos Restantes

| Risco | Severidade | Status |
|-------|-----------|--------|
| Staging real não configurado | CRÍTICO | Pendente — requer acesso Cloudflare |
| Validação HTTP em staging | CRÍTICO | Bloqueado |
| Credencial de staging não rotacionada | ALTO | Requer deploy staging |
| ADMIN_SECRET (texto plano) ainda em produção | ALTO | Aguarda aprovação para rotação |
| Arquivos PII no Git (histórico) | ALTO | Pendente — remover dados/clientes.json etc. |
| Testes Playwright não executados | MÉDIO | Bloqueado por falta de staging |
| Backup KV não verificado | MÉDIO | Bloqueado por falta de acesso |

---

### 7.19 Pendências para Produção

1. Configurar staging real e validar HTTP blocking
2. Executar Playwright com TEST_PASSWORD em staging
3. Validar PBKDF2 no Worker de staging
4. Rotacionar credencial de staging (via `/api/admin/generate-hash`)
5. Somente após aprovação de staging: rotacionar produção
6. Remover ADMIN_SECRET legado após PBKDF2 confirmado
7. Remover dados PII do histórico Git (dados/clientes.json, pedidos.json, etc.)
8. Aprovação comercial para divergência de chave `leite_ninho`/`especiais`

---

### 7.20 Critérios do Lote 2.3 — Status

| Critério | Status |
|---------|--------|
| Staging real disponível | ❌ Bloqueado |
| Arquivos privados bloqueados por HTTP | ⚠️ Código ok, staging não testado |
| Nenhum arquivo privado no build | ⚠️ Arquivos existem mas bloqueados via _redirects |
| PAT removido do navegador | ✅ Implementado |
| Operações administrativas via Worker | ✅ Implementado |
| Auth segura (PBKDF2) implementada | ✅ Código pronto, aguarda deploy |
| Credencial de staging rotacionada | ❌ Requer staging real |
| Revogação de sessão | ✅ Implementado |
| Testes de login/logout/auth executados | ❌ Bloqueado por staging |
| Playwright desbloqueado | ❌ Requer staging + TEST_PASSWORD |
| Backup validado | ❌ Sem acesso KV |
| Preços preservados | ✅ |
| Produtos/pedidos preservados | ✅ |
| Divergência Ovomaltine esclarecida | ✅ Registrada como nomenclatura de chave |
| Rollback testado | ❌ Requer staging |

**Lote 2.3 NÃO APROVADO para produção.** Aguarda staging real, validação HTTP e testes.

---


*Documento mantido pela equipe de desenvolvimento. Toda PR deve atualizar este arquivo.*