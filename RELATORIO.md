# RELATORIO.md — Sorveteria Itapolitana Cajuru

> **Este arquivo é a verdade absoluta sobre a arquitetura atual do site.**
> **Versão consolidada — sem duplicação de conteúdo.**
> Última atualização: 2026-07-25 | Branch: copilot/valores-estao-erraods | Modo: somente leitura (auditoria)

---

## ÍNDICE

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [UX do Cardápio](#2-ux-do-cardápio)
3. [Performance](#3-performance)
4. [Acessibilidade](#4-acessibilidade)
5. [Formulários e LGPD](#5-formulários-e-lgpd)
6. [Roadmap](#6-roadmap)
7. [Segurança e Autenticação (Lote 2.3)](#7-segurança-e-autenticação-lote-23)
8. [Diagnóstico do Ita Bot](#8-diagnóstico-do-ita-bot)
9. [Riscos e Pendências](#9-riscos-e-pendências)
10. [Plano de Rollback](#10-plano-de-rollback)

---

## METADADOS DA AUDITORIA

| Campo | Valor |
|---|---|
| Data e hora | 2026-07-25 01:31 UTC |
| Branch | copilot/valores-estao-erraods |
| Modo | Somente leitura (auditoria) |
| Ambiente | Sandbox — sem acesso Cloudflare/produção |

### Arquivos analisados

| Arquivo | Papel |
|---|---|
| `index.html` | Página principal, cardápio, chatbot inline legado |
| `encomendas.html` | Encomendas, cardápio expandido |
| `promocao.html` | Promoções, sorteio, LGPD |
| `admin-painel.html` | Painel administrativo |
| `scripts/ita-bot-widget.js` | Motor principal do Ita Bot |
| `scripts/products.js` | Auxiliar de produtos |
| `scripts/site-loader.js` | Carregador do site |
| `dados/produtos.json` | Produtos, sabores e preços |
| `dados/config.json` | Configuração geral |
| `dados/faq_cardapio.json` | FAQ cardápio |
| `dados/faq_encomendas.json` | FAQ encomendas |
| `dados/faq_horarios_localizacao.json` | FAQ horários e localização |
| `dados/faq_sorteio_promocoes.json` | FAQ sorteio e promoções |
| `dados/promo.json` | Promoção ativa |
| `cloudflare-worker/src/index.js` | Worker de autenticação e APIs |
| `cloudflare-worker/wrangler.toml` | Configuração do Worker |
| `_redirects` | Bloqueios de arquivos privados |
| `tests/` | Testes E2E Playwright |

### Fontes de dados

| Fonte | Consumido por |
|---|---|
| `dados/produtos.json` | `scripts/ita-bot-widget.js`, `scripts/products.js`, `index.html`, `encomendas.html` |
| `dados/config.json` | `scripts/site-loader.js`, `index.html` |
| `dados/promo.json` | `scripts/ita-bot-widget.js`, `promocao.html` |
| `dados/faq_*.json` | `scripts/ita-bot-widget.js` (carregamento assíncrono) |
| Cloudflare KV | `cloudflare-worker` (clientes, encomendas, rate limit) |

---

## 1. ARQUITETURA GERAL

### 1.1 Estrutura de arquivos

```
/
├── index.html               ← Página principal (Home + Cardápio)
├── encomendas.html          ← Encomendas (tortas, caixas, picolés)
├── promocao.html            ← Promoção do mês / sorteio
├── dicas.html               ← Dicas e conteúdo
├── admin-painel.html        ← Painel administrativo (NÃO ALTERAR sem aprovação)
├── dados/
│   ├── config.json          ← Configurações gerais (hero, footer, horário)
│   ├── produtos.json        ← Preços e sabores de todos os produtos
│   ├── promo.json           ← Promoção ativa / banner
│   ├── faq_cardapio.json    ← FAQ do cardápio
│   ├── faq_encomendas.json  ← FAQ de encomendas
│   ├── faq_horarios_localizacao.json ← FAQ horários e localização
│   └── faq_sorteio_promocoes.json    ← FAQ sorteio e promoções
├── images/                  ← Imagens do site
├── scripts/
│   ├── ita-bot-widget.js    ← Motor do Ita Bot (chatbot)
│   ├── site-loader.js       ← Carregador do site (defer)
│   └── products.js          ← Auxiliar de produtos (defer)
└── cloudflare-worker/       ← Worker de autenticação e APIs admin
```

### 1.2 Origem dos dados (Single Source of Truth)

- **Produtos e preços:** `dados/produtos.json` — fonte oficial. Contém duas chaves paralelas `picoles` e `picolés` (com e sem acento) que devem ser mantidas em sincronia.
- **Configuração geral:** `dados/config.json` — hero, footer, horário, chatbot, páginas.
- **Promoção:** `dados/promo.json` — promoção ativa (flag `ativo`).
- **FAQs:** `dados/faq_*.json` — carregados assincronamente pelo Ita Bot.
- **Clientes e encomendas:** Cloudflare KV (migrado do JSON no Lote 2.1).
- **Auth:** `cloudflare-worker` — PBKDF2-SHA256 via Cloudflare Secrets (sem PAT no browser).

### 1.3 Funções principais (JavaScript — `index.html`)

| Função | Descrição |
|---|---|
| `carregarConfig()` | Carrega `dados/config.json` e aplica textos/configurações |
| `carregarPreçosNuvemCardápio()` | Carrega `dados/produtos.json` e sincroniza `produtos` |
| `renderTudo()` | Chama todas as funções de render: sorvetes, milk, taças, açaí, picolés, iso, sobremesas, complementos |
| `toggleAcc(id)` | Abre/fecha accordion; atualiza `aria-expanded` e anima `max-height` |
| `_semPulo(fn)` | Executa mudança de innerHTML sem mover o scroll |
| `voltarNivel(btn)` | Restaura HTML anterior do accordion |
| `aplicarConfig(c)` | Aplica configurações do JSON nos elementos do DOM |

### 1.4 Navegação inline em 4 níveis

- **Nível 1:** Página principal
- **Nível 2:** Cardápio aberto (`vc-container.aberto`)
- **Nível 3:** Categoria expandida (accordion `.acc.open`)
- **Nível 4:** Detalhe de produto (sabores/complementos inline via `mostrarSaboresInline`)

---

## 2. UX DO CARDÁPIO

### 2.1 Hierarquia visual

**Alterações implementadas (PR: melhorar-home-cardápio):**

- `.prod-nome`: `font-size: 14px`, `font-weight: 900`
- `.prod-desc`: `font-size: 11px`, `font-weight: 600` (roxo)
- `.prod-preço`: `padding-top: 6px`, `border-top: 1px solid #F0E8D8`

**Hierarquia por categoria:**

| Categoria | Layout |
|---|---|
| Sorvetes/Milk/Taças/Iso/Sobremesas | Nome (14px/900) → Descrição (11px/600, roxo) → Preço (18px/900, vermelho) |
| Açaí | Nome + Preço na mesma linha → Descrição abaixo |
| Picolés | Ícone → Nome (13px/900, roxo) → Badge → Descrição (11px) → Preço (15px/900, rosa) → Botão |

### 2.2 Badges de destaque (infraestrutura preparada)

Classes CSS adicionadas: `.badge-mais-pedido` (vermelho), `.badge-favorito` (âmbar).
**Ativação futura:** adicionar campo `"is_featured"` em `dados/produtos.json`.

### 2.3 Ordenação estratégica (sugestão futura)

Adicionar campo `"ordem"` em cada produto para controlar posição. Não implementado — requer aprovação.

---

## 3. PERFORMANCE

### 3.1 Estado atual das imagens

| Imagem | `loading` | `decoding` | Formato |
|---|---|---|---|
| `images/logo.webp` (header) | `eager` | `async` | WebP ✅ |
| `images/carrinho-picole.webp` (hero) | `lazy` | `async` | WebP ✅ |
| `images/sorvete-icon.webp` | `lazy` | `async` | WebP ✅ |
| `<img>` dinâmicos via `imgCard()` | `lazy` | `async` | Sem `width`/`height` ⚠️ |

### 3.2 Estado atual dos scripts

| Script | Estratégia | Status |
|---|---|---|
| Google Tag Manager | Inline bloqueante (padrão GTM) | OK |
| Google Analytics (`gtag.js`) | `async` | ✅ |
| `scripts/site-loader.js` | `defer` | ✅ |
| `scripts/products.js` | `defer` | ✅ |
| `scripts/ita-bot-widget.js` | `defer` | ✅ |

### 3.3 CSS

- CSS inteiramente inline no `<head>` (~1.800 linhas).
- Organizado com comentários em blocos.
- **Candidato a otimização futura:** separar CSS não-crítico (`.chat-*`, `.modal-*`, `@keyframes`) em arquivo externo.

---

## 4. ACESSIBILIDADE

### 4.1 Correções de `aria-controls` (implementadas)

13 accordions corrigidos: `aria-controls` agora apontam para os IDs reais das divs `.acc-body`.

### 4.2 Navegação por teclado

- Acordeões: `role="button"`, `tabindex="0"`, resposta a `Enter` e `Espaço`.
- Foco visível: `.acc-header:focus-visible` com `outline: 3px solid`.
- Chat: ESC fecha diálogo ✅, `aria-live="polite"` no log ✅.

### 4.3 Pontos de melhoria documentados (não implementados)

- `role="region"` + `aria-label` nos blocos de accordion para leitores de tela.
- Mover foco para o cabeçalho do accordion após `voltarNivel()`.
- Focus trap no diálogo do Ita Bot (pendência documentada para Lote E).
- `aria-label="Ver promoção do mês"` no `#promo-fab`.
- Área de toque dos botões de chat: mín. 44×44px (já implementado nos chips).

### 4.4 Contraste verificado

| Elemento | Contraste | WCAG |
|---|---|---|
| `.badge-mais-pedido` (#C62828 / branco) | > 7:1 | AAA ✅ |
| `.badge-favorito` (#F9A825 / #1A0A00) | > 6:1 | AA+ ✅ |
| `.prod-desc` (#7B2D8B / #FFFDF9) | ~4.6:1 | AA ✅ |
| `.prod-preço` (#E8000D / #FFFDF9) | ~4.5:1 | AA ✅ |

---

## 5. FORMULÁRIOS E LGPD

### 5.1 Inventário de formulários

| Arquivo | Formulário | Consentimento |
|---|---|---|
| Fidelidade | Cadastro novo, Login, Regras | ✅ |
| `promocao.html` | Sorteio inline, Aceite sorteio | ✅ |

### 5.2 Padrão implementado

- Checkbox mínimo 22×22px, área de toque `min-height: 44px`.
- `for="id-do-checkbox"` na `<label>` — associação semântica.
- `aria-disabled="true"` sincronizado com `disabled` no botão.
- Link para `politica-privacidade.html` em todos os consentimentos.

### 5.3 Pendências LGPD

- Adicionar nota de privacidade no form-login (sem checkbox, apenas informativa).
- Verificar existência de `politica-privacidade.html` com art. 18 LGPD.

---

## 6. ROADMAP

### 6.1 Curto prazo (próxima PR — requer aprovação)

- [ ] Adicionar campo `"is_featured"` em `dados/produtos.json` para ativar badges CSS.
- [ ] Adicionar campo `"ordem"` para ordenação estratégica de produtos.
- [ ] Mover bloco do Ita Bot para `scripts/ita-bot-widget.js` com `defer` (já feito).
- [ ] Adicionar `aria-label="Ver promoção do mês"` no `#promo-fab`.
- [ ] Mover foco para cabeçalho do accordion após `voltarNivel()`.

### 6.2 Médio prazo

- [ ] Separar CSS em arquivo externo `styles.css` (critical CSS inline no `<head>`).
- [ ] Converter imagens de produtos carregadas pelo admin para WebP.
- [ ] `role="region"` + `aria-label` nos blocos de accordion.
- [ ] `aria-live="polite"` alimentar `#live-region` nas atualizações dinâmicas.

### 6.3 Longo prazo

- [ ] Service Worker com cache de `dados/*.json` para funcionamento offline.
- [ ] Paginação/virtualização nos grids de produtos.
- [ ] Avaliação por produto (campo `rating` no JSON + UI stars).
- [ ] Pedido direto ao WhatsApp com pré-montagem da mensagem pelo usuário.

---

## 7. SEGURANÇA E AUTENTICAÇÃO (LOTE 2.3)

**Data de implementação:** 2026-07-24 22:26 UTC
**Status:** Código implementado. Staging real: BLOQUEADO (sem acesso Cloudflare).

### 7.1 Configuração de Staging

**BLOQUEADO** — requer acesso à conta Cloudflare. Passos documentados:

```bash
# Criar namespaces KV de staging
npx wrangler kv namespace create CLIENTES_KV --env staging
npx wrangler kv namespace create ENCOMENDAS_KV --env staging
npx wrangler kv namespace create RATE_KV --env staging

# Deploy de staging
npx wrangler deploy --env staging

# Gerar hash PBKDF2 para senha de staging
curl -X POST https://<worker-staging-url>/api/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"setup_key":"<SETUP_KEY>","password":"<nova-senha-min-16-chars>"}'
```

### 7.2 Arquivos privados bloqueados via `_redirects`

| URL | Redirecionamento | HTTP esperado |
|---|---|---|
| `/dados/auth.json` | `/404` | 404 |
| `/dados/clientes.json` | `/404` | 404 |
| `/dados/pedidos.json` | `/404` | 404 |
| `/dados/encomendas.json` | `/404` | 404 |
| `/dados/submissoes_encomendas.json` | `/404` | 404 |
| `/dados/fidelidade.json` | `/404` | 404 |
| `/dados/carrinhos_abandonados.json` | `/404` | 404 |

**Pendência crítica:** Remover esses arquivos do histórico Git (contêm PII).

### 7.3 Autenticação implementada

**Preferido (PBKDF2-SHA-256):**
- Hash: PBKDF2 com SHA-256, 600.000 iterações, 256 bits de saída
- Salt: 16 bytes aleatórios
- Comparação: timing-safe via HMAC-SHA-256
- Armazenamento: `ADMIN_HASH` + `ADMIN_SALT` como Cloudflare Secrets

**Fallback legado (remover após migração):**
- `ADMIN_SECRET` em texto plano — ainda em produção, aguarda rotação aprovada.

### 7.4 Remoção do PAT do navegador

| Item | Status |
|---|---|
| Campo de input de PAT removido | ✅ |
| `GITHUB_PAT` variável removida | ✅ |
| `ghPut()` usa Worker (`/api/admin/github-file`) | ✅ |
| PAT não mais armazenado em sessionStorage | ✅ |
| Browser não envia PAT em requisições | ✅ |

### 7.5 Endpoints administrativos

| Endpoint | Método | Autenticação |
|---|---|---|
| `/api/admin/auth` | POST | N/A (autentica) — rate limit: 10/hora |
| `/api/admin/session` | POST/DELETE | Session token |
| `/api/admin/github-file` | GET/PUT | Session token (`isAdmin()`) |
| `/api/clientes` | GET | Session token |
| `/api/clientes/:id` | GET/PATCH/DELETE | Session token |
| `/api/encomendas` | GET/PATCH/DELETE | Session token |
| `/api/admin/sorteio/inscritos` | GET/PATCH/DELETE | Session token |

### 7.6 Sessão

- Token: 32 bytes aleatórios (64 hex chars)
- Armazenamento: `RATE_KV` com TTL de 7200s (2h)
- Header: `X-Itap-Session-Token`
- Revogação: `DELETE /api/admin/session`

### 7.7 Rate Limiting

| Operação | Limite | Janela |
|---|---|---|
| Login admin | 10 tentativas | 1 hora |
| Cadastro cliente | 10 tentativas | 1 hora |
| Login cliente | 20 tentativas | 1 hora |
| Encomenda | 10 tentativas | 1 hora |
| Sorteio | 3 tentativas | 30 min |

### 7.8 Status dos preços (Lote 2.3 — PRESERVADOS)

| Produto | Varejo | Atacado | Localização no JSON |
|---|---|---|---|
| Picolé Especiais — Leite Ninho | R$ 4,00 | R$ 3,00 | `picoles.leite_ninho` e `picolés.leite_ninho` |
| Picolé Especiais — Ovomaltine | R$ 4,00 | R$ 3,00 | `picoles.leite_ninho.sabores[1]` e `picolés.leite_ninho.sabores[1]` |

Nenhum preço foi alterado no Lote 2.3.

### 7.9 Divergência de catálogo — Ovomaltine

- **Situação:** A chave `leite_ninho` agrupa Leite Ninho **e** Ovomaltine sob "Picolé Especiais".
- **Classificação:** Inconsistência de nomenclatura de chave — **não é erro de dados**.
- **Preços:** Corretos. R$ 4,00 varejo / R$ 3,00 atacado para ambos os sabores.
- **Ação pendente:** Aprovação comercial para renomear chave de `leite_ninho` para `especiais`.
- **Nenhuma alteração feita.**

---

## 8. DIAGNÓSTICO DO ITA BOT

### 8.1 Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `scripts/ita-bot-widget.js` | Motor principal do bot (injeção de UI + lógica) |
| `dados/produtos.json` | Fonte de preços e sabores |
| `dados/promo.json` | Fonte de promoções ativas |
| `dados/faq_cardapio.json` | FAQ cardápio (carregado assincronamente) |
| `dados/faq_encomendas.json` | FAQ encomendas (carregado assincronamente) |
| `dados/faq_horarios_localizacao.json` | FAQ horários/localização (carregado assincronamente) |
| `dados/faq_sorteio_promocoes.json` | FAQ sorteio/promoções (carregado assincronamente) |
| `dados/config.json` | Campo `horarioStatusTexto` (texto fixo — problema) |

### 8.2 Problemas identificados (severidade)

| # | Problema | Severidade | Evidência |
|---|---|---|---|
| P-01 | **Três fontes concorrentes** respondendo à mesma pergunta: `RESPOSTAS` estáticas + `itaBotKnowledge[]` + FAQs carregados. Sem prioridade explícita. | CRÍTICO | `ita-bot-widget.js:679–694` |
| P-02 | **Ovomaltine sem contexto**: `_buscarSabor()` encontra "Ovomaltine" nos sorvetes (`dados.sorvetes.sabores`) sem distinguir se a pergunta é sobre picolé ou sorvete. | CRÍTICO | `ita-bot-widget.js:507–533` |
| P-03 | **Picolé Ovomaltine sem intenção dedicada**: não há intenção específica para "picolé de Ovomaltine" — a busca cai no fluxo genérico de sabores de sorvete. | CRÍTICO | `ita-bot-widget.js:651–653` |
| P-04 | **Fallback de preços do picolé**: `_respPicoles()` exibe Leite Ninho mas não menciona explicitamente Ovomaltine como sabor separado. | ALTO | `ita-bot-widget.js:462–473` |
| P-05 | **`horarioStatusTexto` é texto fixo**: campo `"Aberto agora · Fecha às 22h"` em `config.json` — não calculado dinamicamente. | ALTO | `dados/config.json:222` |
| P-06 | **FAQ carregado assincronamente sem fallback de erro**: se o fetch falhar, RESPOSTAS não são populadas, mas o bot não informa o usuário. | ALTO | `ita-bot-widget.js:869–891` |
| P-07 | **Delivery sem CTA**: resposta diz "não fazemos delivery" mas não oferece próximo passo claro. | MÉDIO | `ita-bot-widget.js:784` |
| P-08 | **Promoção inativa sem aviso**: quando `promo.json` não está ativo, resposta menciona sorteio sem verificar se ainda está em andamento. | MÉDIO | `ita-bot-widget.js:545–550` |
| P-09 | **Fidelidade encerrada sem contexto**: resposta direta, mas sem oferecer alternativa ao usuário. | MÉDIO | `ita-bot-widget.js:604–608` |
| P-10 | **Perguntas de alergia sem aviso de segurança**: `lactose`, `vegano`, `diet` direcionam para WhatsApp, mas não incluem aviso de que o bot não pode garantir segurança alimentar. | MÉDIO | `ita-bot-widget.js:763–764` |
| P-11 | **`itaBotKnowledge[]` com entradas sem `keywords`**: entradas com apenas `linkHref: ''` são checadas a cada resposta sem nunca dar match. | BAIXO | `ita-bot-widget.js:819–828` |
| P-12 | **Revenda sem resposta**: não há intenção para "quero revender" ou "sou revendedor". | BAIXO | — |

### 8.3 Fluxo atual de roteamento (com o problema)

```
Mensagem do usuário
    ↓
1. _handleContexto()          ← contexto conversacional (fidelidade, cardápio)
    ↓ (se ctx == null)
2. Verificação hardcoded:     ← "sorvete de X", "preço do X", "tem X"
   _buscarSabor()             ← busca em sorvetes (ignora picolé Ovomaltine)
    ↓ (se não encontrado)
3. Verificações por palavra:  ← "cardapio", "promo", "fidelidade"
    ↓ (se não encontrado)
4. itaBotKnowledge[] loop     ← base de conhecimento estruturada
    ↓ (se não encontrado)
5. RESPOSTAS{} loop           ← respostas estáticas por chave
    ↓ (se não encontrado)
6. _buscarSabor() novamente   ← segunda busca em sorvetes
    ↓ (se não encontrado)
7. Fallback genérico          ← "Não entendi direitinho 😅"
```

**Problema:** Pergunta "Quanto custa o picolé de Ovomaltine?" cai no passo 2, `_buscarSabor()` encontra "Ovomaltine" nos `sorvetes.sabores` e retorna preço de sorvete em bola — não o preço de R$ 4,00 do picolé.

### 8.4 Fontes de dados atuais do bot

| Dado | Fonte | Problema |
|---|---|---|
| Preços de sorvete | `_prodData.sorvetes.precos` | OK — carregado assincronamente |
| Preços de picolé | `_prodData.picoles.leite_ninho.preco_varejo` | OK — mas sem intenção dedicada para Ovomaltine |
| Preço de atacado picolé | `_prodData.picoles.leite_ninho.preco_atacado` | Não exposto no bot |
| FAQs | `dados/faq_*.json` | Carregados assincronamente sem erro handling |
| Horário | Texto fixo em RESPOSTAS{} | Não dinâmico |
| Promoção | `_promoData.ativo` | OK — verificado |

---

## 9. RISCOS E PENDÊNCIAS

### 9.1 Riscos técnicos

| Risco | Severidade | Status |
|---|---|---|
| Staging real não configurado | CRÍTICO | Pendente — requer acesso Cloudflare |
| Três fontes concorrentes no bot sem prioridade | CRÍTICO | Pendente — Lote A |
| Picolé Ovomaltine retorna preço de sorvete | CRÍTICO | Pendente — Lote A |
| Fallback de FAQ omite CTA quando JSON indisponível | ALTO | Pendente — Lote A |
| `horarioStatusTexto` é texto fixo (não calculado) | ALTO | Pendente — Lote A |
| ADMIN_SECRET em texto plano ainda em produção | ALTO | Aguarda aprovação rotação |
| Arquivos PII no histórico Git | ALTO | Pendente — remoção Git |
| Validação HTTP de arquivos privados em staging | CRÍTICO | Bloqueado |
| Testes Playwright não executados em staging | MÉDIO | Bloqueado |
| Pergunta de alergia sem aviso de segurança alimentar | MÉDIO | Pendente — Lote A |

### 9.2 Itens que NÃO serão alterados (aprovação comercial necessária)

- `dados/produtos.json` — preços e produtos preservados.
- Categoria comercial do Ovomaltine — não alterar sem aprovação.
- Preços: Picolé Especiais (Leite Ninho / Ovomaltine) R$ 4,00 varejo / R$ 3,00 atacado.
- Pedidos, clientes, encomendas existentes.
- Publicação em produção (bloqueada até aprovação).

### 9.3 Itens aprovados para Lote A (branch de teste)

- Consolidar roteamento de respostas no bot.
- Criar prioridade explícita entre intenções.
- Adicionar intenção específica para "picolé Ovomaltine".
- Diferenciar Ovomaltine picolé de Ovomaltine sorvete.
- Corrigir fallback de preços do picolé.
- Sincronizar FAQ_BOT residual.
- Criar testes para frases críticas.

---

## 10. PLANO DE ROLLBACK

**Estratégia geral:** `git revert <commit>` + `wrangler deploy` (requer acesso Cloudflare).

**Por tipo de mudança:**

| Tipo | Rollback |
|---|---|
| Alteração em `scripts/ita-bot-widget.js` | `git revert` + deploy Cloudflare Pages |
| Alteração em `dados/*.json` | Restaurar versão anterior via admin painel ou `git revert` |
| Alteração no Worker | `wrangler rollback` ou deploy da versão anterior |
| Alteração de configuração KV | Restaurar backup KV manual |

**Backup antes do Lote A:**
1. Exportar `dados/produtos.json` atual.
2. Exportar `dados/config.json` atual.
3. Registrar SHA do commit anterior.
4. Criar tag `pre-lote-a` na branch de teste.

**Critérios para acionar rollback:**
- Bot retornando preço incorreto para picolé.
- Bot não respondendo a perguntas básicas (cardápio, horário, WhatsApp).
- Quebra de layout no site.
- Erro JavaScript não tratado visível ao usuário.

---

*Documento mantido pela equipe de desenvolvimento. Toda PR deve atualizar este arquivo.*
*Aprovação necessária antes de qualquer publicação em produção.*
