# CHANGELOG — Sorveteria Itapolitana Cajuru

---

## 📅 22/02/2026 — Dia do Site

### 🎉 Página de Promoção (`/promocao.html`)
- Criada página de promoção completa com foto grande, título, texto, relógio regressivo e link de redirecionamento
- Adicionada barra de promoção clicável no topo do site (`index.html`)
- Admin de promoção (`/gerenciar/promocao.html`) atualizado com campos: foto, título, texto, link e data do countdown

### 🛋️ Encomendas no Cardápio (`index.html`)
- Adicionados 3 accordions coloridos no final do cardápio:
  - 🟣 **Sorvetes em Caixa 5 e 10 Litros** (roxo)
  - 🔴 **Tortas de Sorvete** (rosa/vermelho)
  - 🟠 **Picolés para Encomenda** (laranja)
- Ao clicar em cada accordion, abre a seção correspondente em `encomendas.html`
- Adicionado accordion vermelho **🍪 Complementos para Sorvetes** no final do cardápio

### 🛒 Carrinho de Encomendas (`encomendas.html`)
- Adicionado botão vermelho **"🛒 Continuar Comprando"** no carrinho (etapa 1)
- Botão "Continuar → Meus Dados" renomeado para **"✅ Quero Finalizar o Pedido"**
- Ao fechar qualquer modal, o scroll da página é restaurado corretamente (página não trava mais)

### 🍪 Complementos para Sorvetes (`encomendas.html`)
- Adicionado botão vermelho grande **"🍪 COMPLEMENTOS PARA SORVETES"** dentro da seção de Sorvete em Caixa
- Ao clicar, expande e mostra os 5 complementos com foto, nome, preço e botões **+** / **−**:
  - Canudinho Wafer — R$ 0,25/un. — Estoque: 100
  - Casquinhas — R$ 0,25/un. — Estoque: 100
  - Cascão — R$ 1,00/un. — Estoque: 100
  - Cestinha — R$ 1,00/un. — Estoque: 100
  - Cobertura 1.3L — R$ 40,00/un. — Estoque: 100
- Adicionado botão verde **"✅ ADICIONAR COMPLEMENTOS AO CARRINHO"** que aparece ao selecionar itens
- Complementos integrados ao carrinho, total e mensagem WhatsApp

### 🛠️ Admin (`/gerenciar/index.html`)
- Adicionada seção **🍪 Complementos de Encomenda** com:
  - Upload de foto para cada complemento
  - Campo editável de Nome, Preço e Estoque
  - Botão **❌ Esgotar / ✅ Reativar** para cada item
- Adicionado campo de upload de foto para complementos do Açaí Artesanal (Frutas, Cremes, Guloseimas, Chocolates)

### 🗣️ Frase do Hero (`index.html`)
- Alterada para: **"O Sorvete Mais Cremoso e Amado de Cajuru e Região"**

### 💾 Backup
- Snapshot completo do site salvo em `backups/2026-02-22/`
- Arquivos incluídos: `index.html`, `encomendas.html`, `promocao.html`, `gerenciar/`, `scripts/`, `styles/`, `images/`, `img/`

---

> Para restaurar o site ao estado de 22/02/2026, copie os arquivos da pasta `backups/2026-02-22/` para a raiz do repositório.
