# Auditoria Admin × Site — Sorveteria Itapolitana Cajuru

> **Documento gerado em:** 2026-05-05  
> **Escopo:** Mapeamento profissional do painel admin (`admin-painel.html`) em relação ao site público.  
> **Metodologia:** Análise estática (somente leitura) de todos os arquivos do repositório. Nenhuma alteração de código foi realizada.

---

## 1. Visão Geral da Arquitetura

### 1.1 Como o Admin se Conecta ao Site

Este repositório usa o **GitHub como "backend-as-a-service"**. O fluxo completo é:

```
ADMIN (admin-painel.html)
  ↓  PUT via GitHub Contents API (autenticado com token do proprietário)
  ↓
dados/ JSON files (main branch — público via GitHub Raw CDN)
  ├── dados/config.json       ← fonte principal (~80% do conteúdo)
  ├── dados/produtos.json     ← cardápio completo (preços, sabores, estoque)
  ├── dados/promo.json        ← promoção/sorteio ativo
  ├── dados/fidelidade.json   ← códigos e configurações do clube
  ├── dados/clientes.json     ← cadastros de clientes
  ├── dados/encomendas.json   ← pedidos de encomenda
  ↓  GET via GitHub Raw (sem autenticação)
SITE (index.html, promocao.html, fidelidade.html, encomendas.html, dicas.html)
```

**Não há build/deploy intermediário.** As edições no admin são refletidas em tempo real no site (latência do CDN do GitHub Raw, geralmente < 5 min com cache-busting `?t=Date.now()`).

### 1.2 Constantes de Configuração

| Constante | Valor |
|-----------|-------|
| `GH_OWNER` | `missias123` |
| `GH_REPO` | `itapolitanacajuru` |
| `GH_BRANCH` | `main` |
| `GH_API` | `https://api.github.com/repos/missias123/itapolitanacajuru/contents/` |
| `GH_RAW` | `https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/` |

### 1.3 Módulos do Admin

O admin é organizado em abas/seções. Cada módulo tem campos editáveis e um botão "Salvar":

| Aba | Seção interna | Arquivo(s) afetado(s) |
|-----|---------------|----------------------|
| Página Inicial | Hero, frases, strip sensorial, carrossel, nav, carrinho | `config.json` |
| Preços | Preços do cardápio | `produtos.json` |
| Promoções | Card promoção ativa (promo.json) | `promo.json` |
| Sorteios Mensais | Campos do sorteio | `promo.json` |
| Títulos do Cardápio | Accordion títulos/subtítulos | `config.json` (campo `titulosCardapio`) |
| Cardápio Clone | Sabores de sorvete/picolés + botões de categoria | `produtos.json` + `config.json` |
| Estoque | Caixas, tortas, picolés (estoque e esgotado) | `produtos.json` |
| Sabores & Complementos | Sabores completos + picolés + acréscimos | `produtos.json` |
| Encomendas | Listagem + troca de status | `encomendas.json` |
| Clientes | Lista + bloqueio + deduplicação | `clientes.json` |
| Fidelidade | Configuração prêmios, códigos, lote | `config.json` + `fidelidade.json` |
| Textos do Site | Hero Fidelidade, textos Promoção, SEO | `config.json` |
| Configurações | WhatsApp, horário, endereço, CNPJ, senha | `config.json` |
| Dicas/Depoimentos | Depoimentos + dicas | `config.json` |
| Fale Conosco | Modal, Chat, FABs | `config.json` |

---

## 2. Mapeamento Campo por Campo — Admin × Site

### 2.1 Módulo: HERO (Página Inicial)

| Campo no Admin | Chave em `config.json` | ID no site (`index.html`) | Sincronizado? | Observações |
|----------------|------------------------|---------------------------|---------------|-------------|
| Título do Hero | `heroTitulo` | `#hero-título` | ✅ Sim | Aplicado via `aplicarConfig()` |
| Subtítulo / Badge | `heroBadge` | `#hero-badge` | ✅ Sim | |
| Descrição do Hero | `heroDescricao` | `#hero-descrição` | ✅ Sim | |
| Frases rotativas | `heroFrases` (array) | `#frase-rotativa` | ✅ Sim | Admin: textarea uma por linha |
| Strip sensorial | `stripSensorial` (array) | `#strip-sensorial` | ✅ Sim | |
| Título da seção Cardápio | `cardapioTitulo` | `.cardápio-h` / `#cardapio-titulo` | ✅ Sim | |
| Subtítulo do Cardápio | `cardapioSubtitulo` | *(não mapeado em `aplicarConfig`)* | ⚠️ Parcial | Campo salvo mas não aplicado no DOM |
| Badge do Cardápio | `cardapioBadge` | *(não mapeado em `aplicarConfig`)* | ⚠️ Parcial | Campo salvo mas não aplicado no DOM |

### 2.2 Módulo: NAVEGAÇÃO (Botões do Menu)

| Campo no Admin | Chave em `config.json` | Seletor no site | Sincronizado? | Observações |
|----------------|------------------------|-----------------|---------------|-------------|
| Texto "ENCOMENDAS" | `navEncomendas` | `a[href="encomendas.html"] .nav-label` | ✅ Sim | |
| Texto "PROMOÇÃO" | `navPromocao` | `#nav-promo-btn .nav-label` | ✅ Sim | |
| Texto "DICAS/DEPOIMENTOS" | `navDicas` | `a[href="dicas.html"] .nav-label` | ✅ Sim | |
| Texto "FIDELIDADE" | `navFidelidade` | `a[href="fidelidade.html"] .nav-label` | ✅ Sim | |

### 2.3 Módulo: CARRINHO PARA EVENTOS

| Campo no Admin | Chave em `config.json` | ID no site | Sincronizado? | Observações |
|----------------|------------------------|------------|---------------|-------------|
| Label 1 do Carrinho | `carrinhoLabel1` | `#carrinho-label1` | ✅ Sim | |
| Label 2 do Carrinho | `carrinhoLabel2` | `#carrinho-label2` | ✅ Sim | |
| Mensagem WhatsApp | `carrinhoWhatsMsg` | Link `wa.me` do carrinho | ✅ Sim | |

### 2.4 Módulo: PREÇOS E CARDÁPIO

| Campo no Admin | Arquivo | Onde aparece no site | Sincronizado? | Observações |
|----------------|---------|----------------------|---------------|-------------|
| Preços sorvetes (casquinha, copão, cascão, cestinha) | `produtos.json` | `index.html` via `carregarPreçosNuvemCardápio()` | ✅ Sim | |
| Preços picolés (varejo/atacado) | `produtos.json` | `index.html` | ✅ Sim | |
| Preços açaí (copos) | `produtos.json` | `index.html` | ✅ Sim | |
| Preços milkshake | `produtos.json` | `index.html` | ✅ Sim | |
| Preços taças | `produtos.json` | `index.html` | ✅ Sim | |
| Preços sobremesas | `produtos.json` | `index.html` | ✅ Sim | |
| Preços caixas encomenda | `produtos.json` | `encomendas.html` via `enc-v2.js` | ✅ Sim | |
| Preços tortas encomenda | `produtos.json` | `encomendas.html` via `enc-v2.js` | ✅ Sim | |
| Sabores de sorvete | `produtos.json` | `index.html` (modal sabores) | ✅ Sim | |
| Sabores picolés | `produtos.json` | `index.html` (modal picolés) | ✅ Sim | |
| Acréscimos | `produtos.json` | `index.html` | ✅ Sim | |
| Estoque (esgotado) | `produtos.json` | `index.html`, `encomendas.html` | ✅ Sim | |
| Títulos dos accordions | `config.json` (`titulosCardapio`) | `index.html` via `aplicarTitulosCardapio()` | ✅ Sim | |
| Botões de categoria (ex: "Ver Combos") | `config.json` (`cardSorvetesBtn`, etc.) | **❌ Nenhum ID mapeado em `aplicarConfig()`** | ❌ Não | Salvo mas nunca lido pelo site |

> ⚠️ **ATENÇÃO:** `scripts/products.js` é um arquivo JavaScript **estático e hardcoded** com cópia dos dados de produtos. É carregado por `encomendas.html` como fallback. Se a GitHub API falhar, os dados exibidos no site de encomendas podem ser diferentes dos dados atualizados no admin.

### 2.5 Módulo: PROMOÇÃO / SORTEIO

Esta área tem **duas fontes de dados** (`promo.json` e `config.json`) lidas em sequência por `promocao.html`, o que gera potencial de inconsistência:

| Campo no Admin | Chave salva | Arquivo | ID no site (`promocao.html`) | Sincronizado? | Observações |
|----------------|-------------|---------|------------------------------|---------------|-------------|
| Título da Promoção (campo 1) | `titulo` / `título` | `promo.json` | `#promo-titulo-el` | ✅ Sim | Lido primeiro |
| Descrição | `descricao` / `descrição` | `promo.json` | `#promo-desc-el` | ✅ Sim | |
| Frase do banner laranja | `bannerFrase` | `promo.json` | `#promo-banner-p` | ✅ Sim | |
| Badge | `badge` | `promo.json` | `#promo-badge-el` | ✅ Sim | |
| Botão texto | `btnTexto` | `promo.json` | Botão CTA | ✅ Sim | |
| Link do botão | `link` | `promo.json` | href do CTA | ✅ Sim | |
| Data de encerramento | `dataFim` | `promo.json` | Contador regressivo | ✅ Sim | |
| Foto/imagem | `fotoUrl` | `promo.json` | `#promo-img-banner` | ✅ Sim | |
| Status ativo | `ativo` | `promo.json` | Exibição da página | ✅ Sim | |
| FAB label | `fabLabel` | `promo.json` | `#promo-fab-label` | ✅ Sim | |
| H1 Promoção (campo 2) | `promoH1` | `config.json` | `#promo-h1` | ⚠️ Conflito | Sobrescreve `promo.json` se preenchido |
| Badge Promoção (campo 2) | `promoBadge` | `config.json` | `#promo-badge-el` | ⚠️ Conflito | Sobrescreve `promo.json` se preenchido |
| Título El. (campo 2) | `promoTituloEl` | `config.json` | `#promo-titulo-el` | ⚠️ Conflito | Sobrescreve `promo.json` se preenchido |
| Desc El. (campo 2) | `promoDescEl` | `config.json` | `#promo-desc-el` | ⚠️ Conflito | Sobrescreve `promo.json` se preenchido |
| Promoção ativa (top bar) | `promocaoAtiva` | `config.json` | `#promo-top-bar` em `index.html` | ✅ Sim | Controla a barra superior |
| Título top bar | `promocaoTitulo` | `config.json` | `#ptb-título` em `index.html` | ✅ Sim | |
| Descrição top bar | `promocaoDescricao` | `config.json` | `#ptb-sub` em `index.html` | ✅ Sim | |

> ⚠️ **PONTO FRÁGIL:** Dois formulários no admin podem editar os **mesmos campos** da página `promocao.html` via arquivos diferentes (`promo.json` e `config.json`). O segundo a carregar sobrescreve o primeiro. Atualmente `config.json` sempre vence (carrega por último). Se o admin salvar apenas pelo módulo "Promoções" (que grava em `promo.json`) mas `config.json` tiver valores diferentes, o usuário verá o `config.json` no site.

### 2.6 Módulo: FIDELIDADE

| Campo no Admin | Chave | Arquivo | Onde aparece no site | Sincronizado? | Observações |
|----------------|-------|---------|----------------------|---------------|-------------|
| Nome prêmio Milkshake | `premioMilkshake` | `config.json` + `fidelidade.json.config` | `fidelidade.html` chip | ✅ Sim | Salvo em 2 arquivos |
| Pontos Milkshake | `pontosMilkshake` | `config.json` + `fidelidade.json.config` | `fidelidade.html` chip | ✅ Sim | |
| Nome prêmio Caixa | `premioCaixa` | `config.json` + `fidelidade.json.config` | `fidelidade.html` chip | ✅ Sim | |
| Pontos Caixa | `pontosCaixa` | `config.json` + `fidelidade.json.config` | `fidelidade.html` chip | ✅ Sim | |
| Título Fidelidade | `fidelidadeTitulo` | `config.json` | `fidelidade.html` | ✅ Sim | |
| Descrição Fidelidade | `fidelidadeDescricao` | `config.json` | `fidelidade.html` | ✅ Sim | |
| Hero Título | `fidHeroTitulo` | `config.json` | `#fid-hero-titulo` | ✅ Sim | Prioridade sobre `fidelidade.json` |
| Hero Descrição | `fidHeroDesc` | `config.json` | `#fid-hero-desc` | ✅ Sim | Prioridade sobre `fidelidade.json` |
| Códigos de fidelidade | `códigos` (objeto) | `fidelidade.json` | Validação no `fidelidade.html` | ✅ Sim | |
| Regulamento | Texto hardcoded | `admin-painel.html` | `fidelidade.html` (hardcoded) | ❌ Não | Ver seção 4 |
| Cadastros clientes | `clientes` | `clientes.json` | `fidelidade.html` | ✅ Sim | |

> ⚠️ **PONTO FRÁGIL:** A configuração de prêmios é salva **em dois arquivos** (`config.json` e `fidelidade.json`). Se uma das gravações falhar (race condition ou erro de rede), os dados ficam em estado inconsistente entre os dois arquivos.


| Campo no Admin | Arquivo | Onde aparece no site | Sincronizado? | Observações |
|----------------|---------|----------------------|---------------|-------------|

### 2.8 Módulo: ENCOMENDAS

| Campo no Admin | Arquivo | Onde aparece no site | Sincronizado? | Observações |
|----------------|---------|----------------------|---------------|-------------|
| Lista de pedidos | `encomendas.json` | Admin apenas (não exibido publicamente) | N/A | Gestão interna |
| Status de pedidos | `encomendas.json` | Admin apenas | N/A | |
| Aviso de prazo | `encomendaAviso` | `config.json` | **❌ Não lido em `encomendas.html`** | Salvo mas site ignora |
| Mínimo de picolés | `encomendaMinPicoles` | `config.json` | **❌ Não aplicado em `encomendas.html`** | Salvo mas `enc-v2.js` usa valor hardcoded |

### 2.9 Módulo: CONFIGURAÇÕES GERAIS (INSTITUCIONAL)

| Campo no Admin | Chave | Aplicado no site? | Sincronizado? | Observações |
|----------------|-------|-------------------|---------------|-------------|
| WhatsApp (número) | `whatsapp` | Todos os `wa.me` links | ✅ Sim | |
| WhatsApp formatado | `whatsappFormatado` | Chatbot resposta | ✅ Sim | |
| Endereço (curto) | `endereco` | Chatbot | ✅ Sim | |
| Endereço completo | `enderecoCompleto` | Chatbot | ✅ Sim | |
| Horário texto | `horario` | Chatbot | ✅ Sim | |
| Horário abertura (int) | `horarioAbre` | `window.ITAP_HORA_ABRE` | ✅ Sim | Controla indicador "aberto/fechado" |
| Horário fechamento (int) | `horarioFecha` | `window.ITAP_HORA_FECHA` | ✅ Sim | |
| Google Maps URL | `googleMaps` | **❌ Nenhum ID mapeado em `aplicarConfig()`** | ❌ Não | Salvo mas link hardcoded no rodapé |
| Instagram handle | `instagram` | **❌ Nenhum ID mapeado** | ❌ Não | Link hardcoded no rodapé |
| Instagram URL | `instagramUrl` | **❌ Nenhum ID mapeado** | ❌ Não | Link hardcoded no rodapé |
| Nome da empresa | `nomeEmpresa` | `#brand-name` no footer | ✅ Sim | |
| Slogan | `slogan` | `#brand-sub` no footer | ✅ Sim | |
| Fundação | `fundacao` | **❌ Não mapeado** | ❌ Não | Ano "2007" hardcoded no texto |
| CNPJ | `cnpj` | **❌ Não mapeado** | ❌ Não | Hardcoded em `politica-privacidade.html` |
| Footer horário | `footerHorario` | `#footer-horário` | ✅ Sim | |
| Footer copyright | `footerCopy` | `#footer-copy` | ✅ Sim | |
| Footer dev | `footerDev` | `#footer-dev` | ✅ Sim | |

### 2.10 Módulo: SEO

| Campo no Admin | Chave | Aplicado no site? | Sincronizado? | Observações |
|----------------|-------|-------------------|---------------|-------------|
| Título SEO | `seoTitulo` | **❌ `<title>` hardcoded** | ❌ Não | JS não atualiza `document.title` |
| Descrição SEO | `seoDescricao` | **❌ `<meta name="description">` hardcoded** | ❌ Não | JS não atualiza meta tags |
| Palavras-chave | `seoPalavrasChave` | **❌ `<meta name="keywords">` hardcoded** | ❌ Não | |

> ⚠️ **NOTA:** Meta tags SEO são hardcoded no HTML. Alterações no admin não têm efeito nos rastreadores de SEO (Googlebot), apenas no conteúdo visível ao usuário.

### 2.11 Módulo: CHAT / MODAL FALE CONOSCO

| Campo no Admin | Chave | ID no site | Sincronizado? |
|----------------|-------|------------|---------------|
| FAB texto | `chatFabTexto` | `#chat-fab-texto` | ✅ Sim |
| Chat header título | `chatHdrTitulo` | `#chat-hdr-titulo` | ✅ Sim |
| Chat header sub | `chatHdrSub` | `#chat-hdr-sub` | ✅ Sim |
| Mensagem de início | `chatMsgInicio` | `#chat-msg-inicio` | ✅ Sim |
| Sugestões (1–6) | `chatSugestoes` | `#chat-sug-1` a `#chat-sug-6` | ✅ Sim |
| Modal título | `faleModalTitulo` | `#fale-modal-titulo` | ✅ Sim |
| Modal sub | `faleModalSub` | `#fale-modal-sub` | ✅ Sim |
| Label nome | `faleLabelNome` | `#fale-label-nome` | ✅ Sim |
| Label mensagem | `faleLabelMsg` | `#fale-label-msg` | ✅ Sim |
| Botão texto | `faleBtnTexto` | `#fale-btn-texto` | ✅ Sim |
| FAB Clube | `clubeFabTexto` | `#clube-fab-texto` (não confirmado) | ⚠️ Verificar |
| FAB Promoção label | `promoFabLabel` | `#promo-fab-label` | ✅ Sim |

### 2.12 Módulo: DICAS E DEPOIMENTOS

| Campo no Admin | Chave | Onde aparece no site | Sincronizado? | Observações |
|----------------|-------|----------------------|---------------|-------------|
| Título da seção | `depTitulo` | `dicas.html` | **❌ Não** | `dicas.html` não lê `config.json` |
| Subtítulo | `depSubtitulo` | `dicas.html` | **❌ Não** | `dicas.html` é 100% estático |
| Dicas (array) | `depDicas` | `dicas.html` | **❌ Não** | `dicas.html` não faz fetch dinâmico |
| Depoimentos (array) | `depoimentos` | `dicas.html` | **❌ Não** | Depoimentos hardcoded em `dicas.html` |
| Fotos depoimentos | `images/depoimentos/` | `dicas.html` | **❌ Não** | Imagens são enviadas mas não exibidas |

> 🔴 **LACUNA CRÍTICA:** O módulo inteiro de "Dicas e Depoimentos" no admin salva dados em `config.json`, mas `dicas.html` **não faz nenhuma chamada dinâmica**. Tudo que é editado nesse módulo fica salvo na nuvem mas **nunca aparece no site público**.

### 2.13 Módulo: CARROSSEL DE IMAGENS

| Campo no Admin | Onde é salvo | Onde aparece no site | Sincronizado? | Observações |
|----------------|-------------|----------------------|---------------|-------------|
| Upload de novo banner | `images/carrossel/banner-{ts}.webp` + `config.json` | `carrossel.html` | **❌ Não** | `carrossel.html` tem `<img>` hardcoded (12 imagens fixas) |
| Alt text do banner | `config.json` | `carrossel.html` | **❌ Não** | `carrossel.html` não lê `config.json` |

> ⚠️ **PONTO FRÁGIL:** Admin envia imagem ao GitHub e salva referência em `config.json`, mas `carrossel.html` renderiza apenas as 12 imagens `v3_b*.webp` hardcoded. Novas imagens enviadas pelo admin ficam no servidor mas **nunca aparecem no carrossel público**.

### 2.14 Módulo: MODAIS DO CARDÁPIO

| Campo no Admin | Chave | ID no site | Sincronizado? |
|----------------|-------|------------|---------------|
| Modal Sabores Título | `modalSaboresTitulo` | `#ms-título` | ✅ Sim |
| Modal Sabores Sub | `modalSaboresSub` | `#ms-sub` | ✅ Sim |
| Modal Picolé Título | `modalPicoleTitulo` | `#mp-título` | ✅ Sim |
| Modal Açaí Título | `modalAçaíTitulo` | `#modal-comp-titulo` | ✅ Sim |
| Modal Açaí Sub | `modalAçaíSub` | `#modal-comp-sub` | ✅ Sim |

---

## 3. Fluxo de Sincronização — Análise dos Pontos Frágeis

### 3.1 Diagrama do Fluxo

```
Admin edita campo → clica "Salvar"
  → ghGet(path) para obter SHA atual
  → ghPut(path, novos_dados, sha) via GitHub API
  → GitHub armazena nova versão em main/
  → Site faz fetch(GH_RAW + path + '?t=Date.now()')
  → Aplica dados no DOM via JS
```

### 3.2 Pontos Frágeis Identificados

| # | Ponto | Risco | Impacto |
|---|-------|-------|---------|
| 1 | `scripts/products.js` hardcoded | Se GitHub API falhar, encomendas.html cai para dados estáticos desatualizados | Alto |
| 2 | Campos promoção em 2 arquivos (`promo.json` + `config.json`) | Admin pode salvar em um e não no outro → site exibe valor errado | Alto |
| 3 | Config de prêmios em 2 arquivos (`config.json` + `fidelidade.json.config`) | Race condition ou falha parcial → prêmios errados no site | Médio |
| 4 | Carrossel hardcoded em `carrossel.html` | Upload pelo admin nunca aparece no carrossel público | Alto |
| 5 | `dicas.html` sem fetch dinâmico | Módulo inteiro de depoimentos do admin é inoperante no site | Alto |
| 6 | SEO meta tags hardcoded | Mudanças de SEO no admin não afetam rastreadores | Médio |
| 7 | `encomendaAviso` e `encomendaMinPicoles` ignorados | `encomendas.html` usa valores hardcoded; admin não controla esses campos | Médio |
| 8 | `googleMaps`, `instagram`, `fundacao`, `cnpj` salvos mas nunca lidos | Links sociais/institucionais são estáticos; admin não tem efeito | Baixo |
| 9 | Campos `cardSorvetesBtn` etc. salvos mas nunca aplicados | Botões de categoria no site são hardcoded; admin não tem efeito | Baixo |
| 10 | Token GitHub armazenado em `localStorage` | Token exposto se o dispositivo do admin for comprometido | Segurança |

### 3.3 Análise do Ponto 1 — `scripts/products.js` Estático

`encomendas.html` carrega:
1. `scripts/products.js` → objeto `window.produtos` (estático, hardcoded)
2. `scripts/enc-v2.js` → tenta `fetch(dados/produtos.json)` via GitHub Raw

Se o fetch de `enc-v2.js` tiver sucesso, os dados do JSON sobrescrevem os do `products.js`. Mas se falhar (rede offline, CDN lento, rate limit), o site de encomendas usa os dados de `products.js`, que podem ter preços/sabores desatualizados em relação ao que o admin salvou.

### 3.4 Análise do Ponto 2 — Duplicidade Promoção

`promocao.html` executa duas funções em sequência:
1. `carregarPromoJson()` → lê `promo.json` → aplica `titulo`, `descrição`, `badge`, `bannerFrase`
2. `carregarConfigJson()` → lê `config.json` → aplica `promoH1`, `promoBadge`, `promoTituloEl`, `promoDescEl`

A segunda sobrescreve a primeira nos mesmos elementos DOM. O admin tem **dois formulários diferentes** para editar esses campos:
- "Promoções" → salva em `promo.json`
- "Textos do Site → Promoção" → salva em `config.json`

Se o proprietário editar apenas um, o outro pode sobrescrever no site.

---

## 4. Auditoria de Editabilidade — O que NÃO é Editável pelo Admin

### 4.1 Conteúdo "Essencial que Seja Editável" (mas hoje está fixo)

| Conteúdo | Onde está fixo | Por que é essencial |
|----------|---------------|---------------------|
| Depoimentos de clientes | `dicas.html` (HTML hardcoded) | Precisam ser atualizados quando chegar novos depoimentos; admin já tem o formulário mas não conecta ao site |
| Dicas da sorveteria | `dicas.html` (HTML hardcoded) | Conteúdo de marketing editável é importante para promoções sazonais |
| Imagens do carrossel | `carrossel.html` (12 `<img>` hardcoded) | Admin já tem upload mas não conecta ao HTML do carrossel |
| Regulamento do Clube de Fidelidade | `fidelidade.html` (hardcoded no JS/HTML) | Regras podem mudar; hoje impossível alterar sem deploy manual |
| Texto do aviso de encomendas | `encomendas.html` (hardcoded "03 dias úteis") | Prazo pode variar em datas comemorativas/alta demanda |
| Mínimo de picolés na encomenda | `encomendas.html` / `enc-v2.js` (hardcoded `100`) | Regra de negócio que pode mudar; `config.json` tem o campo mas não é lido |
| Meta título e descrição SEO | `index.html` `<title>` e `<meta>` (hardcoded) | Campanhas e sazonalidade exigem ajustes de SEO sem deploy |
| Links do rodapé (Instagram, Maps) | `index.html` rodapé (hardcoded) | Se mudar o perfil do Instagram ou endereço do Maps, exige deploy |

### 4.2 Conteúdo "Ok Ser Fixo"

| Conteúdo | Justificativa |
|----------|--------------|
| CNPJ | Dado legal imutável da empresa |
| Textos legais de `politica-privacidade.html` | Exige revisão jurídica, não deve ser editável livremente |
| Estrutura do layout e CSS | Design da marca, não conteúdo |
| Código do Service Worker (`sw.js`) | Infraestrutura técnica |
| Schema.org JSON-LD (`schema-markup-expanded.json`) | Dado técnico/SEO que requer validação |

---

## 5. Scripts de Auditoria — Somente Leitura

Um script de comparação foi criado em `scripts/tests-admin-sync/audit-admin-site.js`.

**Características:**
- Somente leitura: faz apenas `fetch` de `config.json`, `produtos.json` e `promo.json`
- Não escreve em nenhum arquivo de produção
- Pode ser executado localmente com `node scripts/tests-admin-sync/audit-admin-site.js`
- Verifica campos críticos que devem estar presentes e preenchidos

---

## 6. Resumo Executivo

### É o admin hoje um "espelho" do site?

**Parcialmente.** Para os fluxos principais (preços, textos do hero, promoção ativa, fidelidade, chat), a sincronização funciona bem. O fluxo admin → GitHub Raw → site está bem implementado.

**Porém existem 4 módulos onde o admin não tem efeito real no site:**
1. Dicas e Depoimentos (dicas.html é estático)
2. Carrossel de imagens (carrossel.html tem fotos hardcoded)
3. SEO meta tags (não atualizadas por JS)
4. Configurações institucionais (Instagram, Maps, CNPJ — hardcoded)

### Quão perto estamos de "tudo editável e sincronizado"?

Estimativa: **~65% sincronizado**. Os fluxos críticos de negócio (cardápio, preços, promoção, fidelidade, encomendas) funcionam. As lacunas estão principalmente em conteúdo editorial (depoimentos, carrossel, SEO) e pequenos campos institucionais.

---

## 7. Os 3 Principais Pontos a Atacar (para chegar ao nível de grandes sites)

### 🥇 Prioridade 1 — Conectar `dicas.html` ao admin

**Problema:** O módulo mais rico do admin (depoimentos + dicas) não tem nenhum efeito no site.

**Solução segura:** Adicionar no `dicas.html` um bloco `<script>` que faça `fetch('dados/config.json')` e preencha depoimentos/dicas nos elementos existentes. **Risco: BAIXO** — `dicas.html` é totalmente estático e não tem dependências críticas de negócio.

**Referência:** O mesmo padrão já está funcionando em `index.html` com `aplicarConfig()`.

---

### 🥈 Prioridade 2 — Tornar o carrossel dinâmico

**Problema:** Admin tem upload de banners funcional, mas `carrossel.html` renderiza apenas 12 imagens hardcoded e nunca lê a lista de banners do `config.json`.

**Solução segura:** Modificar `carrossel.html` para:
1. Fazer `fetch('dados/config.json')` ao carregar
2. Se `config.carrossel` existir (array de `{src, alt}`), renderizar dinamicamente
3. Fallback: se fetch falhar, manter as 12 imagens hardcoded atuais

**Risco: MÉDIO** — Exige modificar `carrossel.html` com cuidado para não quebrar o carrossel atual. Precisa testar o fallback.

---

### 🥉 Prioridade 3 — Unificar fontes de dados da Promoção

**Problema:** `promo.json` e `config.json` têm campos duplicados para a mesma página (`promocao.html`), com risco de inconsistência.

**Solução segura:** Consolidar tudo em `promo.json` como fonte única para `promocao.html`. Remover os campos `promoH1`, `promoBadge`, `promoTituloEl`, `promoDescEl` de `config.json` (ou mantê-los mas fazer `salvarPromoção()` sincronizá-los automaticamente como faz `salvarConfigFidelidade()`).

**Risco: MÉDIO** — Exige testar cuidadosamente para não apagar campos existentes em produção. Deve ser feito com `// TODO: confirmar regra com o proprietário` antes da implementação.

---

## Apêndice — Mapa de Arquivos JSON e seus Consumidores

| Arquivo | Salvo pelo Admin? | Lido pelo Site | Lido onde |
|---------|-------------------|---------------|-----------|
| `dados/config.json` | ✅ (vários módulos) | ✅ | `index.html`, `fidelidade.html`, `promocao.html` |
| `dados/produtos.json` | ✅ (Preços, Cardápio, Sabores, Estoque) | ✅ | `index.html`, `enc-v2.js` (encomendas) |
| `dados/promo.json` | ✅ (Promoções, Sorteios) | ✅ | `index.html` (card promo), `promocao.html` |
| `dados/fidelidade.json` | ✅ (Fidelidade, códigos) | ✅ | `fidelidade.html` |
| `dados/clientes.json` | ✅ (Clientes) | ✅ | `fidelidade.html` |
| `dados/encomendas.json` | ✅ (Encomendas - status) | Escrito por | `enc-v2.js` (clientes fazem pedidos) |
| `scripts/products.js` | ❌ (arquivo estático) | Fallback | `encomendas.html` |
