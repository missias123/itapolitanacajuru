# 🧠 MEMÓRIA DO SISTEMA — SORVETERIA ITAPOLITANA CAJURU
> Última atualização: Abril 2026
> Repositório: https://github.com/missias123/itapolitanacajuru
> Site: https://missias123.github.io/itapolitanacajuru/

---

## 📌 REGRAS PERMANENTES (NUNCA VIOLAR)

1. **"artesanal" NUNCA sozinho** — sempre "tipo artesanal"
2. **Zero erros de português** — validador automático roda antes de cada commit
3. **CSS/JS sem acentos em nomes técnicos** — `createElement`, `Date`, `translateY`, `grid-template-columns`
4. **Site e Admin são clones idênticos** — sincronizador bidirecional verifica antes de cada commit
5. **Sabores são objetos `{nome, esgotado}`** — sempre usar `s.nome` ao renderizar, nunca `s` diretamente

---

## 🌐 PÁGINAS DO SITE

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `index.html` | 2707 | Página principal — cardápio, carrossel, chat, botões de navegação |
| `encomendas.html` | 1579 | Encomendas de caixas, tortas, picolés — modal de sabores |
| `fidelidade.html` | 2055 | Clube de Fidelidade + Sorteios Mensais |
| `promocao.html` | 460 | Promoção ativa com timer |
| `admin-painel.html` | 2735 | Painel administrativo completo |

---

## 🎟️ CLUBE DE FIDELIDADE

- **Compras acima de R$ 30,00** ganham cupom com código
- **10 pontos** = Milkshake 300ml GRÁTIS
- **30 pontos** = Caixa 7 Bolas GRÁTIS
- Cadastro feito pelo **site** (formulário)
- Código do cupom inserido pelo cliente após login
- **Validade dos códigos:**
  - Lote 1 (gerados antes de 01/05/2025): **60 dias**
  - Novos códigos (a partir de 01/05/2025): **30 dias**

---

## 🎁 SORTEIOS MENSAIS

- A partir de **1º de maio**
- Cidades: **Cajuru**, **Santa Cruz da Esperança**, **Cássia dos Coqueiros**
- Prêmio: **1 caixa de sorvete tipo artesanal de 5 litros** por mês
- Cadastro: mesmo cadastro do Clube de Fidelidade + confirmação pelo **WhatsApp**
- Após logar na conta, cliente clica em "Quero participar dos sorteios" → WhatsApp abre com mensagem pronta
- **Sorteio realizado por IA**, gravado em vídeo e publicado nas redes sociais
- **Para retirar o prêmio:** comparecer pessoalmente com **documento de identidade** + **celular cadastrado** no dia agendado
- **Quem não tiver o número e nome cadastrado na agenda da sorveteria no dia do sorteio não terá direito ao prêmio**

---

## 📜 REGULAMENTOS

### Regulamento do Clube de Fidelidade
- Aparece **oculto** por padrão
- Só abre ao clicar no botão "📜 Ver Regulamento"
- Cliente marca "Estou ciente" → formulário de cadastro abre
- 8 cláusulas incluindo: participação (mín. 14 anos), retirada com documento + celular, fraudes = cancelamento, críticas infundadas = bloqueio

### Regulamento dos Sorteios Mensais
- Mesmo fluxo: oculto → botão → aceite → formulário
- Inclui: sorteio por IA com vídeo publicado nas redes sociais

---

## ⚠️ SISTEMA ANTI-FRAUDE

- **Aviso vermelho pulsante** na página de fidelidade
- Texto: "Números que tentarem usar códigos inválidos, códigos de terceiros ou burlar o sistema serão bloqueados e excluídos definitivamente da promoção"
- **Regras automáticas:**
  - Regra 1-5: validação básica do código
  - Regra 6: 1 código por dispositivo por hora (fingerprint)
  - Regra 7: bloqueia WhatsApp duplicado
  - Regra 8: log detalhado local (timestamp + código + motivo + fingerprint)
  - Regra 9: bloqueio automático após 5 fraudes (salvo no clientes.json)

---

## 🛒 ENCOMENDAS

### Produtos disponíveis
| Produto | Detalhes |
|---------|----------|
| Caixa 5L – 2 Sabores | R$ 100,00 |
| Caixa 5L – 3 Sabores | R$ 115,00 |
| Caixa 10L – 2 Sabores | R$ 150,00 |
| Caixa 10L – 3 Sabores | R$ 165,00 |
| Tortas de Sorvete | Vários tamanhos |
| Picolés (atacado) | Frutas/Água, Cremosos, Especiais |

### 35 Sabores de Sorvete
Abacaxi ao Vinho, Abacaxi Suíço, Algodão Doce (Blue Ice), Amarena, Ameixa, Banana com Nutella, Bis e Trufa, Cereja Trufada, Chocolate, Chocolate com Café, Coco Queimado, Creme Paris, Croquer, Doce de Leite, Ferrero Rocher, Flocos, Kinder Ovo, Leite Condensado, Leite Ninho, Leite Ninho Folheado, Leite Ninho com Oreo, Limão, Limão Suíço, Menta com Chocolate, Milho Verde, Morango Trufado, Mousse de Maracujá, Mousse de Uva, Nozes, Nutella, Ovomaltine, Pistache, Prestígio, Sensação, Torta de Chocolate

---

## ⚙️ PAINEL ADMIN — SEÇÕES

| ID da Seção | Nome | Função |
|-------------|------|--------|
| `sec-dashboard` | Dashboard | Visão geral — contadores, alertas |
| `sec-home` | Home | Editar textos hero do site |
| `sec-preços` | Preços | Editar preços dos produtos |
| `sec-promoção` | Promoção | Gerenciar promoção ativa |
| `sec-encomendas` | Encomendas | Gerenciar produtos de encomenda |
| `sec-sabores` | Sabores | Gerenciar lista de sabores + esgotados |
| `sec-estoque` | Estoque | Controle de estoque |
| `sec-participantes` | Participantes | Lista unificada Fidelidade + Sorteios (busca, filtro, CSV) |
| `sec-clientes` | Clientes | Cadastros do Clube de Fidelidade |
| `sec-fidelidade` | Fidelidade | Validar cupons, ver pontos, resgates |
| `sec-config` | Configurações | WhatsApp, endereço, horário |

---

## 👥 SEÇÃO PARTICIPANTES (ADMIN)

- **Tabela unificada** — Clube de Fidelidade + Sorteios Mensais
- **Contadores:** Total Geral, Clube Fidelidade (laranja), Sorteios (verde), Ambos (roxo)
- **Busca** por nome ou celular em tempo real
- **Filtro** por tipo: Fidelidade / Sorteio / Ambos
- **Paginação** de 50 por página — suporta 10.000+ registros
- **Exportar CSV** com data no nome
- **Copiar Lista** para área de transferência

---

## 📱 RESPONSIVIDADE

| Aparelho | Layout dos botões (index.html) |
|----------|-------------------------------|
| Mobile (< 480px) | Logo em cima + 4 botões em grade 2×2 |
| Tablet (480–767px) | Logo à esquerda + botões 2×2 |
| Desktop (≥ 768px) | Logo à esquerda + 4 botões em linha horizontal |

---

## 🗂️ ARQUIVOS IMPORTANTES

| Arquivo | Função |
|---------|--------|
| `dados/clientes.json` | Cadastros dos clientes do Clube de Fidelidade |
| `dados/produtos.json` | Preços e sabores dos produtos |
| `dados/config.json` | Configurações gerais (WhatsApp, horário, endereço) |
| `dados/fidelidade.json` | Códigos de cupom e pontos |
| `dados/promo.json` | Dados da promoção ativa |
| `scripts/products.js` | Lista de produtos e sabores (carregado no index.html) |
| `scripts/enc-v2.js` | Lógica do sistema de encomendas |
| `scripts/site-loader.js` | Carregador geral do site |
| `scripts/validador-portugues.py` | Validador automático de português + CSS/JS |
| `scripts/sincronizador.py` | Sincronizador bidirecional Site ↔ Admin |
| `.git/hooks/pre-commit` | Hook que roda validador + sincronizador antes de cada commit |

---

## 🔧 ERROS CONHECIDOS E CORRIGIDOS

| Erro | Causa | Correção |
|------|-------|---------|
| `[object Object]` nos sabores | `SABORES_SORVETE` é lista de objetos, código usava `${s}` | Usar `typeof s === 'object' ? s.nome : s` |
| Layout empilhado nos botões | `grid-templaté-columns` (acento indevido) | Validador automático corrige |
| Sabores não apareciam | `creatéElement` (acento indevido) | Validador automático corrige |
| Datas incorretas | `Daté()` / `getDaté()` | Validador automático corrige |
| Animações quebradas | `translatéY`, `rotaté()` | Validador automático corrige |

---

## 🌐 LINKS

- **Site:** https://itapolitanacajuru.com.br
- **GitHub Pages:** https://missias123.github.io/itapolitanacajuru/
- **Fidelidade:** https://missias123.github.io/itapolitanacajuru/fidelidade.html
- **Encomendas:** https://missias123.github.io/itapolitanacajuru/encomendas.html
- **Admin:** https://missias123.github.io/itapolitanacajuru/admin-painel.html
- **Repositório:** https://github.com/missias123/itapolitanacajuru
