# Mapa Completo do Site — Sorveteria Itapolitana Cajuru

> Documento gerado com base na análise real dos arquivos do repositório.  
> URL: https://itapolitanacajuru.com.br  
> Última atualização: 2026

---

## 1. Páginas Públicas HTML

### `index.html` — Página Principal
**Título:** Sorveteria Itapolitana Cajuru – Sorvete Tipo Artesanal e Açaí SP

**Seções principais:**
- Hero banner dinâmico (frases rotativas, badges, CTAs para cardápio e WhatsApp)
- Strip sensorial animado (faixa de texto deslizante)
- Cardápio interativo por abas (Sorvetes, Açaí, Milkshake, Taças, Picolés, Sobremesas, Complementos)
- Modal de sabores de sorvete (38 sabores)
- Modal de complementos do açaí
- Seção de isopores para viagem
- Carrinho para eventos (FAB + link WhatsApp)
- Banner PWA (instalar app)
- Botão flutuante Clube Fidelidade
- Chat Ita Bot (modal de chatbot com RESPOSTAS dinâmicas)
- Modal "Fale Conosco" (formulário → WhatsApp)
- Footer com horário, endereço, links de navegação e Política de Privacidade
- Badge do Ita Bot com bolha de convite

**Funcionalidades JS ativas:**
- `aplicarConfig()` — carrega `dados/config.json` e injeta textos em todo o DOM
- `getResp()` — motor de resposta do Ita Bot (lookup no objeto RESPOSTAS)
- `carregarFaqsItaBot()` — carrega os 5 arquivos FAQ JSON e mescla com RESPOSTAS
- `window.RESPOSTAS` — base de conhecimento do chatbot
- Renderização dinâmica do cardápio a partir de `dados/produtos.json`
- `enviarChat()` / `addMsg()` — chat UI do Ita Bot
- `instalarPWA()` / `dispensarPWA()` — fluxo de instalação do PWA
- `enviarFaleConosco()` — envio de mensagem via link WhatsApp
- `abrirItaBot()` / `fecharChatDialog()` — controle de modais

---

### `` — 
**Título:** Programa de Fidelidade – Sorveteria Itapolitana Cajuru

**Seções principais:**
- Hero banner com chips de prêmios (10 pts = Milkshake 300ml · 30 pts = Caixa 7 Bolas)
- Seção reivindicar estrela (exibida dinamicamente)
- Painel do cliente (pontos, histórico de códigos, estrelas)
- Card "Inserir Código" (validação de cupom)
- Card "Histórico de Códigos"
- Área admin (senha protegida) — painel administrativo do programa
- Regulamento completo (accordion)

**Funcionalidades JS ativas:**
- Sistema de login/cadastro via localStorage + GitHub API
- Validação de cupons (busca em `dados/fidelidade_indice.json`)
- Wizard de captura de estrela (etapas: captura → identificação → confirmação)
- `ehDiaUtilParaCupom()` — verifica se gera cupom (segunda–sexta)
- Sorteio de Natal: 8 vencedores mensais concorrem a Torta de Natal

---

### `encomendas.html` — Encomendas
**Título:** Encomendas – Sorveteria Itapolitana Cajuru | Caixas, Tortas e Picolés

**Seções principais:**
- Hero com título e destaque para festas/eventos
- Cardápio de encomendas (Caixas 5L e 10L, Torta de Sorvete)
- Seletor de sabores por caixa
- Acréscimos (casquinha, cascão, cestinha, cobertura)
- Carrinho de compras (etapas)
- Formulário de dados do cliente
- Resumo do pedido → gera link WhatsApp
- Seções de segurança (SSL, LGPD, mobile-friendly)
- Aviso: prazo mínimo 3 dias úteis + pagamento antecipado

**Funcionalidades JS ativas:**
- `enc-v2.js` — lógica completa do fluxo de encomendas
- Carrega produtos de `dados/produtos.json` (via GitHub raw + localStorage fallback)
- Fluxo por etapas: seleção → sabores → dados → confirmação → pedido WhatsApp
- Admin: salva pedidos em `dados/encomendas.json` via GitHub API

---

### `promocao.html` — Promoção / Sorteio
**Título:** Promoção Especial!

**Seções principais:**
- Título e descrição do sorteio (dinâmicos via `dados/promo.json`)
- Aviso: a partir de maio/2026, cadastro apenas pelo site
- Regulamento (10 sorteios em 2026, março–dezembro, 1 caixa 5L por mês)
- Formulário de cadastro (nome, telefone)
- Botão "Ver no Instagram"

**Funcionalidades JS ativas:**
- Carrega `dados/promo.json` para textos dinâmicos
- Cadastro de participantes via localStorage + potencial integração GitHub API
- Geração de ID único por participante (USR-2026-XXXX)

---

### `dicas.html` — Dicas e Depoimentos
**Título:** Depoimentos e Dicas Essenciais – Sorveteria Itapolitana Cajuru/SP

**Seções principais:**
- Depoimentos de clientes (cards dinâmicos)
- Dicas para festas: quanto sorvete comprar, como conservar, quais sabores escolher
- Dicas para eventos com carrinho de picolé
- Script admin-sync integrado

**Funcionalidades JS ativas:**
- Carrega conteúdo de depoimentos e dicas do admin
- admin-sync para sincronização de conteúdo dinâmico

---

### `carrossel.html` — Carrossel de Banners
**Título:** (Banner carousel page)

**Seções principais:**
- Carrossel de banners promocionais
- Gerenciamento de imagens/banners para o site

**Funcionalidades JS ativas:**
- admin-sync para banners dinâmicos
- Carrega banners de `dados/promo_banner.webp` e configurações do admin

---

### `galeria.html` — Galeria de Fotos
**Título:** Fotos da Sorveteria Itapolitana Cajuru – Sorvetes e Açaí

**Seções principais:**
- Grid de fotos dos produtos e da sorveteria
- Imagens das pastas `fotos/` e `imagens/`

**Funcionalidades JS ativas:**
- Lazy loading de imagens
- Lightbox/visualização de fotos

---

### `politica-privacidade.html` — Política de Privacidade
**Título:** Política de Privacidade – Sorveteria Itapolitana Cajuru

**Seções principais:**
- Texto completo da política de privacidade (LGPD)
- Informações sobre coleta de dados (, Sorteio)
- Direitos do titular
- Contato do responsável

**Funcionalidades JS ativas:**
- Página estática, sem JS complexo

---

### `offline.html` — Página Offline (PWA)
**Título:** Sorveteria Itapolitana - Modo Offline

**Seções principais:**
- Mensagem amigável de sem conexão
- Botão para tentar reconectar
- Identidade visual da marca

**Funcionalidades JS ativas:**
- Servida pelo Service Worker (`sw.js`) quando offline

---

### `admin-painel.html` — Painel Administrativo
**Título:** Painel Admin – Sorveteria Itapolitana Cajuru

**Seções principais:**
- Login admin (senha hash SHA-256)
- Gerenciamento de config.json (horário, endereço, textos)
- Gerenciamento de produtos.json (preços, sabores, estoque)
- Gerenciamento de promo.json (promoções ativas)
- Gerenciamento de fidelidade (pontos, clientes, cupons)
- Gerenciamento de encomendas
- Editor de banners/carrossel

**Funcionalidades JS ativas:**
- Autenticação por senha (hash comparado com `config.senhaAdmin`)
- Salva alterações via GitHub API (token armazenado em localStorage)
- CRUD completo dos arquivos JSON do site

---

## 2. Scripts JS (`scripts/`)

**Usado em:** ``

### `products.js`
**O que faz:** Define o objeto `produtos` como constante JavaScript com todos os dados do cardápio (sorvetes, picolés, açaí, milkshake, taças, sobremesas, caixas, isopores, acréscimos). Serve como fallback/cache local dos dados de `dados/produtos.json`.  
**Usado em:** `index.html` (importado inline), `encomendas.html`

### `quality-guard.js`
**O que faz:** Monitor de qualidade em tempo real. Registra erros de JavaScript, Core Web Vitals (LCP, CLS, FID/INP), erros de Service Worker, recursos 404 e performance de carregamento. Persiste métricas em localStorage (`itap_quality_guard`).  
**Usado em:** `index.html`, ``, páginas principais

### `auto-healer.js`
**O que faz:** Detecta e corrige automaticamente erros de carregamento de recursos bloqueados por CSP ou problemas de rede. Recarrega recursos com fallback alternativo.  
**Usado em:** páginas principais como script de proteção

### `auto-fixer.js`
**O que faz:** Ferramenta de diagnóstico e autocorreção automática. Inspirado em práticas de Google, iFood, Nubank e Amazon. Detecta inconsistências de DOM e corrige automaticamente.  
**Usado em:** ambiente de desenvolvimento / diagnóstico

### `auto-repair.js`
**O que faz:** Script Node.js (CLI) para detecção automática de erros de JavaScript no código-fonte. Roda no ambiente de build/CI para verificar integridade dos arquivos.  
**Usado em:** ambiente de desenvolvimento / CI pipeline

### `site-loader.js`
**O que faz:** "Single Source of Truth" — carrega `dados/config.json` e injeta todos os textos configuráveis em todas as páginas do site. Garante consistência de dados entre admin e site público.  
**Usado em:** todas as páginas HTML (via `<script>`)

### `enc-v2.js`
**O que faz:** Lógica completa do fluxo de encomendas. Carrega `dados/produtos.json` (via GitHub raw ou localStorage), gerencia o carrinho (seleção de produtos, sabores, acréscimos), formulário de dados do cliente e geração do link de pedido via WhatsApp. Salva pedidos em `dados/encomendas.json` via GitHub API.  
**Usado em:** `encomendas.html`

---

## 3. Dados JSON (`dados/`)

| Arquivo | Conteúdo | Lê | Escreve |
|---|---|---|---|
| `config.json` | Configurações gerais: WhatsApp, endereço, horário, textos do site, credencial admin (hash), configurações de promoção, fidelidade | Todas as páginas (via `site-loader.js`) | `admin-painel.html` |
| `produtos.json` | Cardápio completo: sabores de sorvete, preços por apresentação, picolés (tipos/preços/sabores), açaí (copos/preços/complementos), milkshake, taças, sobremesas, caixas de viagem, isopores, acréscimos, caixas e tortas de encomenda | `index.html`, `encomendas.html`, `enc-v2.js` | `admin-painel.html` |
| `promo.json` | Promoção ativa: título, descrição, botão, link, data fim, label FAB, foto, status ativo/inativo | `promocao.html`, `index.html` | `admin-painel.html` |
| `encomendas.json` | Registro de pedidos de encomenda realizados pelo site: dados do cliente, itens, sabores, valor | `admin-painel.html` | `enc-v2.js` (via GitHub API) |
| `clientes.json` | Cadastro de clientes do : nome, telefone, pontos | ``, `admin-painel.html` | `` (via GitHub API) |
| `fidelidade.json` | Estado do programa de fidelidade: ciclo atual, configurações de estrelas, ranking | `` | `admin-painel.html`, `` |
| `fidelidade_indice.json` | Índice rápido de todos os códigos de cupom (hash → mês/ano/status) para validação eficiente | `` | `admin-painel.html` |
| `fidelidade_metadata.json` | Metadados do sistema de fidelidade: versão, meses disponíveis, total de códigos/usados | `` | `admin-painel.html` |
| `fidelidade_2026_05.json` … `fidelidade_2026_12.json` | Shards mensais do programa de fidelidade (8 arquivos). Cada um contém os dados de pontuação/estrelas do mês correspondente | `` | ``, `admin-painel.html` |
| `vinculos_clientes.json` | Vínculos entre identificadores de clientes (telefone ↔ ID interno) | `` | `` |
| `faq_horarios_localizacao.json` | FAQs sobre horário, endereço, cidades, contato, delivery, pagamento | `index.html` (via loader ItaBot) | — |
| `faq_cardapio.json` | FAQs sobre cardápio: sabores, açaí, picolés, milkshake, taças, sobremesas, dietas | `index.html` (via loader ItaBot) | — |
| `faq_encomendas.json` | FAQs sobre encomendas: prazo, caixas, torta, atacado, carrinho, entrega | `index.html` (via loader ItaBot) | — |
| `faq_sorteio_promocoes.json` | FAQs sobre sorteio mensal e promoções 2026 | `index.html` (via loader ItaBot) | — |

---

## 4. Funcionalidades Principais

### Programa Fidelidade ()
- **Como funciona:** cliente compra acima de R$ 30,00 de segunda a sexta → recebe cupom físico com código único → insere na página de Fidelidade → ganha 1 ponto
- **Prêmios:** 10 pontos = 1 bola de sorvete (Cascão) · 30 pontos = 1 caixa com 12 picolés de fruta/água
- **Cupons válidos:** apenas para compras de segunda a sexta-feira (feriados não contam)
- **Início:** 01/05/2026
- **Participantes:** mínimo 14 anos
- **Dados:** `dados/clientes.json`, `dados/fidelidade_indice.json`, `dados/fidelidade_2026_XX.json`

- **Meta:** 5 estrelas = vencedor mensal
- **Prêmio (vencedor único mensal):** escolhe entre Açaí Promocional 400ml · Milkshake · 5 Picolés Recheados
- **Bônus anual:** os vencedores mensais (até 8 no ano) participam do Sorteio de Natal — Torta de Natal 3 Sabores

### Sorteio Mensal
- **Prêmio:** 1 caixa de 5 litros de sorvete por mês
- **Período:** março a dezembro de 2026 (10 sorteios, 10 caixas)
- **Data do sorteio:** dia 01 de cada mês
- **Como participar:** cadastro exclusivamente pelo site (página Promoção) a partir de maio/2026
- **Custo:** gratuito
- **Dados:** `dados/promo.json`

### Ita Bot (Chatbot)
- **Localização:** modal em `index.html`, botão FAB "💬 Fale Conosco"
- **Funcionamento:** `getResp()` normaliza o texto do usuário e busca no objeto `window.RESPOSTAS` (lookup por substring)
- **Base de conhecimento:** objeto `RESPOSTAS` inline (horário, sabores, preços, encomendas, fidelidade, etc.) + 5 arquivos FAQ JSON carregados assincronamente
- **Fallback:** link para WhatsApp `(16) 99606-2046` quando não encontra resposta
- **Sugestões:** chips de atalho com temas principais

### PWA (Progressive Web App)
- **`manifest.json`:** define nome, ícones, cores, modo standalone para instalação como app
- **`sw.js`:** Service Worker com cache de recursos estáticos e fallback para `offline.html` quando sem conexão
- **Instalação:** banner automático após 3s (se não dispensado) com `localStorage.pwa_dispensado`

### Admin (`admin-painel.html`)
- Acesso por senha (hash SHA-256 em `dados/config.json`)
- Gerencia todos os JSONs via GitHub API (token em localStorage)
- CRUD de produtos, config, promo, fidelidade, encomendas
- **NÃO é acessível publicamente** — requer senha admin

### LGPD / Privacidade
- Página dedicada `politica-privacidade.html`
- Dados coletados: nome e telefone (Fidelidade e Sorteio)
- Uso: exclusivo para o programa de fidelidade e sorteio mensal
- Link no rodapé de todas as páginas

---

## 5. Seção AdminSync

| Módulo | Fonte JSON | Páginas | Sincronismo |
|---|---|---|---|
| Configurações gerais (textos, horário, endereço) | `dados/config.json` | Todas (via site-loader.js) | ✅ Completo |
| Cardápio (preços, sabores, estoque) | `dados/produtos.json` | `index.html`, `encomendas.html` | ✅ Completo |
| Promoção ativa / Sorteio | `dados/promo.json` | `promocao.html`, `index.html` | ✅ Completo |
| Encomendas recebidas | `dados/encomendas.json` | `admin-painel.html` | ✅ Completo |
| Clientes fidelidade | `dados/clientes.json` | `` | ✅ Completo |
| Cupons de fidelidade | `dados/fidelidade_indice.json`, `dados/fidelidade_2026_XX.json` | `` | ✅ Completo |
| Banners / Carrossel | `dados/promo_banner.webp` + config | `carrossel.html`, `index.html` | ⚠️ Parcial |
| FAQs do Ita Bot | `dados/faq_*.json` | `index.html` (async loader) | ✅ Completo |
| Dicas e Depoimentos | admin-sync | `dicas.html` | ⚠️ Parcial |
