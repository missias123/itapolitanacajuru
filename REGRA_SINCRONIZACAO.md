# ⚖️ LEI PERMANENTE — SINCRONIZAÇÃO BIDIRECIONAL
## Sorveteria Itapolitana Cajuru

---

## 🔒 LEI IMUTÁVEL (PARA TODO O RESTO DO TEMPO)

> ### **O ADMIN É O CLONE DO SITE.**
> ### **O SITE É O CLONE DO ADMIN.**
>
> Qualquer campo, botão, texto, preço ou configuração que existir no site
> **DEVE** existir no Admin com o mesmo valor, editável, em tempo real.
>
> Qualquer campo criado no Admin **DEVE** refletir imediatamente no site.
>
> **Esta lei não tem exceção. Esta lei não tem prazo de validade.**
> **Desenvolvedor: SgtMissiascacarato — 04/04/2026**

---

---

## 🔑 PRINCÍPIO FUNDAMENTAL

> **Tudo que existe no site DEVE existir no Admin.**
> **Tudo que é criado no Admin DEVE refletir no site.**
> **Sem exceção. Sem campo orphão. Sem dado hardcoded.**

---

## 📐 ARQUITETURA: SINGLE SOURCE OF TRUTH

```
┌─────────────────────────────────────────────────────────┐
│                  ÚNICA FONTE DE VERDADE                  │
│                                                          │
│   dados/config.json   ←→   dados/produtos.json          │
│         ↑                         ↑                      │
│         │                         │                      │
│   (textos, config,           (todos os preços,           │
│    WhatsApp, horário,         sabores, estoque)          │
│    pontos, frases)                                       │
└─────────────────────────────────────────────────────────┘
         ↑                              ↑
         │ lê                           │ lê
         │                              │
┌────────┴──────────┐       ┌───────────┴──────────┐
│   SITE (público)  │       │  ADMIN (privado)      │
│                   │       │                       │
│  index.html       │  ↔    │  admin-painel.html    │
│  encomendas.html  │       │  (controla TUDO)      │
│  fidelidade.html  │       │                       │
│  promocao.html    │       │  Admin salva →        │
└───────────────────┘       │  GitHub atualiza →    │
                            │  Site reflete         │
                            └───────────────────────┘
```

---

## 📋 MAPA COMPLETO DE SINCRONIZAÇÃO

### 🏠 PÁGINA INICIAL (index.html) ↔ Admin → Seção "Home"

| Campo no Site | ID no Admin | Campo no config.json |
|---|---|---|
| Título hero | `home-titulo` | `heroTitulo` |
| Subtítulo hero | `home-subtitulo` | `heroSubtitulo` |
| Badge do hero | `home-badge` | `heroBadge` |
| Descrição hero | `home-descricao` | `heroDescricao` |
| Botão CTA | `home-cta` | `heroCta` |
| Botão WhatsApp | `home-cta-whats` | `heroCtaWhats` |
| Frases rotativas | `home-frases` | `heroFrases[]` |
| Strip sensorial | `home-strip` | `stripSensorial[]` |
| Título cardápio | `home-cardapio-titulo` | `cardapioTitulo` |
| Subtítulo cardápio | `home-cardapio-sub` | `cardapioSubtitulo` |
| Badge cardápio | `home-cardapio-badge` | `cardapioBadge` |
| Horário no footer | `home-footer-horario` | `footerHorario` |
| Copyright | `home-footer-copy` | `footerCopy` |

### 💰 PREÇOS (encomendas.html + index.html) ↔ Admin → Seção "Preços"

| Categoria | Campo no config | Arquivo |
|---|---|---|
| Sorvetes (casquinha, copo, cascão, cestinha) | `sorvetes.precos` | `produtos.json` |
| Milkshake (tradicional, top, ovomaltine) | `milkshake` | `produtos.json` |
| Taças (tradicionais, sujas) | `tacas` | `produtos.json` |
| Açaí (copos, complementos) | `acai` | `produtos.json` |
| Picolés (varejo e atacado por tipo) | `picoles` | `produtos.json` |
| Sobremesas | `sobremesas` | `produtos.json` |
| Caixas de viagem | `caixas_viagem` | `produtos.json` |
| Isopores | `isopores_viagem` | `produtos.json` |

### 🎉 PROMOÇÃO (promocao.html) ↔ Admin → Seção "Promoção"

| Campo no Site | ID no Admin | Campo no config.json |
|---|---|---|
| Ativa/Inativa | `promo-ativa` | `promocaoAtiva` |
| Título | `promo-titulo` | `promocaoTitulo` |
| Descrição | `promo-descricao` | `promocaoDescricao` |
| Texto do botão | `promo-btn` | `promocaoBotao` |
| Link do botão | `promo-link` | `promocaoLink` |
| Data fim | `promo-datafim` | `promocaoDataFim` |
| Botão flutuante (FAB) | `promo-fab` | `promocaoFab` |

### 🎟️ FIDELIDADE (fidelidade.html) ↔ Admin → Seção "Configurações"

| Campo no Site | ID no Admin | Campo no config.json |
|---|---|---|
| Pontos para Milkshake | `cfg-pts-milk` | `pontosMilkshake` |
| Pontos para Caixa | `cfg-pts-caixa` | `pontosCaixa` |
| Nome prêmio Milkshake | `cfg-premio-milk` | `premioMilkshake` |
| Nome prêmio Caixa | `cfg-premio-caixa` | `premioCaixa` |

### ⚙️ CONFIGURAÇÕES GERAIS ↔ Admin → Seção "Configurações"

| Campo no Site | ID no Admin | Campo no config.json |
|---|---|---|
| WhatsApp (todos os links) | `cfg-whats` | `whatsapp` |
| Endereço | `cfg-endereco` | `endereco` |
| Horário | `cfg-horario` | `horario` |
| Instagram | `cfg-instagram` | `instagram` |
| Nome da empresa | `cfg-nome` | `nomeEmpresa` |
| Slogan | `cfg-slogan` | `slogan` |

---

## ⚡ FLUXO DE SINCRONIZAÇÃO

### Admin → Site (ao salvar)
```
1. Admin preenche campo
2. Clica "Salvar"
3. Admin lê o config.json atual do GitHub (GET)
4. Mescla as alterações
5. Salva o config.json no GitHub (PUT)
6. Site carrega o config.json do GitHub no DOMContentLoaded
7. site-loader.js injeta os valores em todos os elementos
8. Site atualizado ✅
```

### Site → Admin (ao abrir o admin)
```
1. Admin faz login
2. Admin carrega o config.json do GitHub
3. Preenche TODOS os campos com os valores atuais do site
4. Admin mostra exatamente o que está no site ✅
```

---

## 🚫 PROIBIÇÕES (nunca fazer)

1. ❌ **NUNCA** colocar texto, preço ou número hardcoded em HTML
2. ❌ **NUNCA** criar um campo no site sem criar o correspondente no Admin
3. ❌ **NUNCA** criar um campo no Admin sem que ele salve no config.json/produtos.json
4. ❌ **NUNCA** criar dois arquivos que controlam a mesma coisa
5. ❌ **NUNCA** duplicar funções de carregamento ou salvamento
6. ❌ **NUNCA** fazer push sem backup (tag git antes de cada mudança grande)

---

## ✅ OBRIGAÇÕES (sempre fazer)

1. ✅ Todo novo campo no site → adicionar ao config.json + criar campo no Admin
2. ✅ Todo novo campo no Admin → garantir que o site lê e aplica
3. ✅ Antes de qualquer mudança grande → criar tag git de backup
4. ✅ Após salvar no Admin → site deve refletir em menos de 60 segundos
5. ✅ O Admin deve sempre carregar os valores atuais do site ao abrir
6. ✅ Manter o site online durante todas as alterações

---

## 🛠️ ARQUIVOS DO SISTEMA

| Arquivo | Função |
|---|---|
| `dados/config.json` | Fonte de verdade de textos e configurações |
| `dados/produtos.json` | Fonte de verdade de preços e estoque |
| `dados/clientes.json` | Base de clientes do programa de fidelidade |
| `dados/fidelidade.json` | Códigos e configuração do programa de fidelidade |
| `dados/promo.json` | Dados da promoção ativa |
| `dados/encomendas.json` | Registro de encomendas recebidas |
| `scripts/site-loader.js` | Módulo central: carrega config e injeta no site |
| `scripts/products.js` | Dados de produtos (lidos do produtos.json) |
| `scripts/enc-v2.js` | Lógica de encomendas (lê WhatsApp do config) |
| `admin-painel.html` | Painel de controle total do site |

---

## 📅 Criado em: 04/04/2026
## 👤 Desenvolvedor: SgtMissiascacarato
## 🏪 Cliente: Sorveteria Itapolitana Cajuru
## 🔒 CNPJ: 08.922.044/0001-80

---

> **Esta regra é lei. Qualquer alteração no código deve respeitar este documento.**
