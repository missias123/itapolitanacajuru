# Admin ↔ Site — Estado Atual da Sincronização

> Documento gerado em 2026-05-05. Atualizar sempre que uma lacuna for corrigida.

---

## Resumo Executivo

| Módulo | Estado | Observação |
|--------|--------|------------|
| Cardápio (preços, categorias) | ✅ Sincronizado | `dados/produtos.json` → index.html |
| Promoção (banner/contador) | ✅ Sincronizado | `dados/config.json` é fonte de verdade |
| Promoção FAB / top bar | ✅ Sincronizado | `config.promocaoAtiva` controla exibição |
| Fidelidade (pontos, prêmios) | ✅ Sincronizado | `dados/config.json` + `dados/fidelidade.json` |
| Chat / assistente | ✅ Sincronizado | `config.json` campos `chat*` |
| Hero (título, frases, strip) | ✅ Sincronizado | `config.json` via `aplicarConfig()` |
| Horário de funcionamento | ✅ Sincronizado | `config.json.horarioAbre/Fecha` |
| WhatsApp / Encomendas | ✅ Sincronizado | `config.json.whatsapp` |
| Dicas e Depoimentos | 🔶 Parcial | Admin salva em `config.json` mas `dicas.html` era 100% estático → **corrigido nesta sprint** |
| Carrossel de imagens | 🔶 Parcial | Admin salva em `config.json.banners[]` mas carrossel não lia → **corrigido nesta sprint** |
| Promoção: dupla fonte | ⚠️ Conflito | `promo.json` e `config.json` têm campos duplicados — **documentado abaixo** |
| Instagram / Maps / CNPJ | ⚠️ Parcial | Campos existem em `config.json` mas links em `dicas.html` eram hardcoded → **corrigido nesta sprint** |
| Schema markup (JSON-LD) | ❌ Estático | Instagram/Maps/CNPJ no schema de `index.html` são hardcoded (risco baixo, SEO only) |

---

## TAREFA 1 — Lacunas confirmadas no código

### 1.1 `dicas.html` — 100% estático antes da correção

**Arquivo:** `dicas.html`
**Estrutura:** `.testimonial-grid` com 5 depoimentos hardcoded + seção de dicas informativas estáticas.
**Salvamento pelo admin:** `admin-painel.html` função `salvarDepoimentos()` (linha ~5349) salva em `dados/config.json` os campos:
- `config.depoimentos[]` — array `{nome, texto, estrelas, foto}`
- `config.depTitulo` — título da seção
- `config.depSubtitulo` — subtítulo
- `config.depDicas[]` — array de dicas em texto livre

**Estado antes:** `dicas.html` não fazia nenhum fetch de `config.json`. Qualquer depoimento salvo pelo admin era ignorado.

### 1.2 `carrossel.html` — 12 imagens fixas antes da correção

**Arquivo:** `carrossel.html` (carregado como `<iframe>` em `index.html`)
**Estrutura:** A segunda implementação no arquivo (`.crs` / custom slider) usava `var TOTAL = 12` hardcoded e 12 `<div class="crs-slide">` fixos.
**Salvamento pelo admin:** `admin-painel.html` função de upload de banner (linha ~2965) faz upload de `images/carrossel/banner-{ts}.webp` e salva em `config.json.banners[]` como `{src, alt, ts}`.
**Estado antes:** `carrossel.html` nunca leu `config.banners`. Uploads pelo admin não apareciam no site.

> **Nota:** O `carrossel.html` contém **duas implementações concatenadas**: uma baseada em Swiper (primeiras ~170 linhas) e uma implementação customizada `.crs`. O iframe em `index.html` carrega o arquivo completo e o browser renderiza o `.crs` como implementação principal. O bloco Swiper existe como backup/legado mas não deve ser removido sem testes.

### 1.3 `promo.json` × `config.json` — campos duplicados (CONFLITO)

**Fonte:** `dados/promo.json` e `dados/config.json`

**Comportamento em `promocao.html`:**
1. `carregarPromoJson()` — faz fetch de `promo.json` e escreve:
   - `promo-h1` ← `pr.headerTitulo`
   - `promo-banner-p` ← `pr.bannerFrase`
   - `promo-badge-el` ← `pr.badge`
   - `promo-titulo-el` ← `pr.título || pr.titulo`
   - `promo-desc-el` ← `pr.descrição || pr.descricao`
   - countdown date ← `pr.dataFim`
   - imagem ← `pr.fotoUrl`

2. `carregarConfigJson()` — faz fetch de `config.json` e **SOBRESCREVE** os mesmos elementos:
   - `promo-h1` ← `cfg.promoH1`
   - `promo-badge-el` ← `cfg.promoBadge`
   - `promo-titulo-el` ← `cfg.promoTituloEl`
   - `promo-desc-el` ← `cfg.promoDescEl`

**Campos EXCLUSIVOS de `promo.json`** (não sobrescritos por config.json):
- `bannerFrase` → `promo-banner-p`
- `fotoUrl` → imagem do card
- `ativo` → flag de promoção ativa (usado apenas por `_buscarDadosPromo` em index.html)

**Conflito atual:**
- `promo.json`: `"ativo": true`
- `config.json`: `"promocaoAtiva": false`
Resultado: em `index.html` a promoção está **desativada** (correto — lê `config.json`). Em `promocao.html`, `promo.json.ativo` é irrelevante (não é lido pela página), mas o estado de "ativo" está divergente entre os dois arquivos.

**Causa:** O admin salva nos dois arquivos via `salvarArquivo(PATHS.promo, ...)` + `salvarArquivo(PATHS.config, ...)`. Em algum momento `config.json` foi atualizado manualmente ou via outro caminho sem atualizar `promo.json`.

**Estratégia de unificação recomendada (não aplicada ainda — requer decisão):**
> Opção A (recomendada): Tornar `config.json` **única fonte de verdade**. Adaptar `carregarPromoJson()` em `promocao.html` para usar campos de `config.json` em vez de `promo.json`. Manter `promo.json` como legado somente para campos sem equivalente em config (`fotoUrl`, `bannerFrase`, `dataFim`).
> Opção B: Deprecar `promo.json`. Mover todos os campos para `config.json` e adaptar o admin para parar de escrever em `promo.json`.

### 1.4 Campos institucionais

| Campo | `config.json` | `index.html` | `dicas.html` | Ação |
|-------|--------------|--------------|--------------|------|
| Instagram (`@`) | ✅ `config.instagram` | JSON-LD schema (hardcoded) | Não aparece como link | Somente schema — baixo risco |
| Instagram URL | ✅ `config.instagramUrl` | JSON-LD schema (hardcoded) | Não aparece como link | Idem |
| Google Maps URL | ✅ `config.googleMaps` | JSON-LD schema (hardcoded) | `href` hardcoded em botão | **Corrigido nesta sprint** — lê de config.json |
| CNPJ | ✅ `config.cnpj` | Não exibido no HTML | Não exibido | Apenas schema — OK |
| Ano de fundação | ✅ `config.fundacao` | Texto "desde 2007" hardcoded em vários lugares | "2007" hardcoded em texto | Mudanças de branding raras — baixo risco |

---

## TAREFA 2 — Solução aplicada: Dicas e Depoimentos

**Arquivo:** `dicas.html`
**Mudança:** Script admin-sync adicionado antes de `</body>` com comentário `// AdminSync: depoimentos a partir do admin, com fallback para conteúdo estático`.

**Lógica:**
1. Fetch de `dados/config.json` com timeout de 4s
2. Se `config.depoimentos[]` existir e tiver ao menos 1 item com texto → renderiza sobre `.testimonial-grid`
3. Se `config.googleMaps` existir → atualiza `href` do botão `.btn-google-reviews`
4. **Fallback:** Qualquer falha de rede, JSON inválido ou array vazio → mantém o conteúdo estático sem alteração

**O que NÃO mudou:** As dicas educacionais (seção `.tips-section`) continuam estáticas — alterar elas dinamicamente é risco alto sem campo dedicado no admin.

---

## TAREFA 3 — Solução aplicada: Carrossel de imagens

**Arquivo:** `carrossel.html`
**Mudanças:**
1. `var TOTAL = 12` → `var TOTAL = window._crsTotal = document.querySelectorAll('#crsTrack .crs-slide').length || 12` — TOTAL dinâmico lido do DOM
2. Dentro de `ir(n)`: `TOTAL = window._crsTotal || TOTAL` — permite atualização externa
3. Adicionado `window._crsControls = {ir, reiniciar, pararTimer, iniciarTimer}` — exposição controlada dos controles
4. Script admin-sync adicionado após o IIFE

**Lógica do admin-sync:**
1. Fetch de `dados/config.json` com timeout de 3s
2. Se `config.banners[]` existir e tiver ao menos 1 item com `src` válido:
   - Substitui o `innerHTML` do `#crsTrack` com os slides do admin
   - Atualiza `window._crsTotal`
   - Recria os dots no `#crsDots`
   - Reinicia o slider na posição 0
3. **Fallback:** Se fetch falhar, array ausente/vazio, ou src inválido → mantém as 12 imagens hardcoded sem nenhuma alteração visual

**Status atual do `config.banners`:** Campo não existe no `dados/config.json` atual → o fallback (12 imagens) sempre será exibido até que o admin faça o primeiro upload de banner. Isso é o comportamento correto e seguro.

---

## TAREFA 4 — Promoção: estratégia de unificação (documentada, não aplicada)

**Decisão de não aplicar código:** A mudança exigiria refatorar a ordem de fetch em `promocao.html` e alinhar campos entre `promo.json` e `config.json`. Qualquer erro quebraria a página de promoção. Requer validação manual.

**Próximos passos recomendados:**
1. Decidir se `promo.json` deve ser deprecado (Opção B) ou mantido com campos exclusivos (Opção A).
2. Se Opção A: em `promocao.html`, trocar a lógica para sequência serial em vez de paralela: `config.json` primeiro → `promo.json` apenas para campos ausentes.
3. Se Opção B: migrar todos os campos de `promo.json` para `config.json` e atualizar o admin para parar de escrever em `promo.json`.
4. Corrigir o estado atual (`promo.json.ativo: true` + `config.json.promocaoAtiva: false`) salvando ambos pelo admin.

---

## TAREFA 5 — Campos institucionais (documentação + correção Maps)

**Corrigido:** Link do Google Maps em `dicas.html` — era hardcoded `https://maps.app.goo.gl/t9jjF1pqwZTWKvDJA`, agora lê de `config.googleMaps` via admin-sync script (mesma fetch de TAREFA 2).

**Não corrigido (risco alto ou mudança desnecessária):**
- Schema markup JSON-LD em `index.html` (linhas ~115, ~1654-1658): Instagram/Maps/CNPJ hardcoded. São apenas dados de SEO/structured data, não links visíveis ao usuário. Risco de mudança > benefício.
- `"desde 2007"` em textos do hero: aparece em múltiplos lugares hardcoded. Para mudar, precisaria de IDs específicos em cada texto e update em `aplicarConfig()`. Criar campo `config.anoFundacao` e iterar sobre os textos seria invasivo.

**Futuro campo sugerido no admin:** `config.anoFundacao` (atualmente `config.fundacao` já existe e o admin o salva). O site poderia usá-lo para substituir "2007" nos textos onde tiver IDs.

---

## Resultado: Aumento de Sincronização

| Fase | % Sincronizado | O que mudou |
|------|---------------|-------------|
| Antes desta sprint | ~65% | Cardápio, promoção, fidelidade, chat, hero, horário, WhatsApp |
| Após esta sprint | ~80% | + Depoimentos dinâmicos, + carrossel pronto para banners admin, + Maps link dinâmico |
| Potencial futuro | ~90% | + Unificação promo.json×config.json, + schema markup dinâmico, + textos institucionais |

---

## Pontos que ainda dependem de decisão

1. **Unificação promo.json × config.json** — Opção A ou B (ver TAREFA 4)
2. **Schema markup dinâmico** — Valor para SEO vs. complexidade
3. **Textos "desde 2007"** — Mudar requer criação de IDs específicos e update em `aplicarConfig()`
4. **Dicas educacionais** (`dicas.html` seção `.tips-section`) — Precisaria de campos de texto rico no admin
5. **`carrossel.html` — duas implementações concatenadas** — Limpar o arquivo separando as duas versões corretamente
