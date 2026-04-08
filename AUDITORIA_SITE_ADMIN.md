# AUDITORIA DE PARIDADE — SITE × ADMIN
## Sorveteria Itapolitana Cajuru
**Data:** Abril 2026 | **Versão:** 1.0

---

## 1. MAPA DE SEÇÕES DO SITE

| # | Seção | Localização no site | Status no Admin |
|---|---|---|---|
| 1 | Header / Menu de navegação | Topo fixo | ✅ Editável |
| 2 | Hero (banner principal) | Página inicial | ✅ Editável |
| 3 | Faixa animada (strip) | Abaixo do hero | ✅ Editável |
| 4 | Cardápio — Título e badge | Seção cardápio | ✅ Editável |
| 5 | Cardápio — Accordions (títulos/subtítulos) | Cada categoria | ✅ Editável |
| 6 | Cardápio — Preços | Cada produto | ✅ Editável |
| 7 | Cardápio — Sabores (35 sabores) | Modal/inline | ✅ Editável |
| 8 | Cardápio — Picolés (5 tipos + sabores) | Accordion picolés | ✅ Editável |
| 9 | Cardápio — Açaí (combos + complementos) | Accordion açaí | ✅ Editável |
| 10 | Cardápio — Taças e Taças Premium | Accordions taças | ✅ Editável |
| 11 | Cardápio — Isopores, Sobremesas | Accordions | ✅ Editável |
| 12 | Cardápio — Caixas 5L e 10L (estoque) | Accordion caixas | ✅ Editável |
| 13 | Promoção Especial (banner flutuante) | Botão flutuante | ✅ Editável |
| 14 | Depoimentos / Dicas | Seção depoimentos | ✅ Editável |
| 15 | Fale Conosco (formulário + chat) | Botão flutuante | ✅ Editável |
| 16 | Clube Fidelidade (FAB) | Botão flutuante | ⚠️ Parcial |
| 17 | Horário de funcionamento | Rodapé + chat | ✅ Editável |
| 18 | Localização / Endereço | Rodapé + chat | ✅ Editável |
| 19 | Rodapé (copyright, dev, selos) | Rodapé | ✅ Editável |
| 20 | Selos de segurança (HTTPS, SSL, etc.) | Rodapé | ❌ Sem campo |
| 21 | Chat — Opções de sugestão | Chat overlay | ✅ Editável |
| 22 | Chat — Mensagem inicial | Chat overlay | ✅ Editável |
| 23 | Modal de Promoção (popup) | Popup automático | ✅ Editável |
| 24 | Botão "Carrinho para Eventos" | Hero | ❌ Sem campo |
| 25 | Botão "Clube Itapolitana" (FAB verde) | Fixo na tela | ⚠️ Parcial |
| 26 | Tortas de Sorvete | Accordion | ⚠️ Sem preços editáveis |
| 27 | Picolés para Encomenda | Accordion | ⚠️ Sem preços editáveis |
| 28 | Complementos para Sorvetes | Accordion | ⚠️ Sem lista editável |

---

## 2. ADMIN — HEADER / MENU DE NAVEGAÇÃO

| Campo no Admin | ID | Onde aparece no site | Tipo | Limite |
|---|---|---|---|---|
| Botão Encomendas — Texto | `home-nav-encomendas` | Menu topo — botão azul 🛒 | Texto curto | Máx. 20 caracteres |
| Botão Promoção — Texto | `home-nav-promocao` | Menu topo — botão vermelho 🎉 | Texto curto | Máx. 20 caracteres |
| Botão Dicas/Depoimentos — Texto | `home-nav-dicas` | Menu topo — botão verde ⭐ | Texto curto | Máx. 20 caracteres |
| Botão Fidelidade — Texto | `home-nav-fidelidade` | Menu topo — botão laranja 🎟️ | Texto curto | Máx. 20 caracteres |

**✅ Status: Completo**

---

## 3. ADMIN — SEÇÃO HERO (BANNER PRINCIPAL)

| Campo no Admin | ID | Onde aparece no site | Tipo | Limite |
|---|---|---|---|---|
| Headline principal | `home-título` | Texto grande "O Sorvete que Cajuru Ama de Verdade" | Texto curto | Máx. 60 caracteres |
| Subtítulo do Hero | `home-subtitulo` | Linha pequena acima do título | Texto curto | Máx. 100 caracteres |
| Descrição do Hero | `home-desc` | Parágrafo abaixo do título | Texto longo | Máx. 200 caracteres |
| Botão WhatsApp — Texto | `home-cta-whats` | Botão laranja "Pedir Agora pelo WhatsApp" | Texto curto | Máx. 40 caracteres |
| Botão Cardápio — Texto | `home-cta-cardapio` | Botão "Ver Cardápio Completo" | Texto curto | Máx. 40 caracteres |
| Frases rotativas do carrossel | `home-frases` | Frase que muda automaticamente no topo | Lista (1 por linha) | Máx. 80 caracteres por frase |
| Imagem do Hero / Banner | `home-img` | Imagem de fundo do hero | Imagem | JPG/PNG/WebP, 1200×600px, máx. 500KB |

**⚠️ Lacuna:** O botão "🛒 Carrinho para Eventos" não tem campo no Admin.

> **Campo a criar:** `home-cta-carrinho` — Texto do botão "Carrinho para Eventos". Tipo: Texto curto. Máx. 40 caracteres. Observação: "Aparece no hero como terceiro botão de ação."

---

## 4. ADMIN — FAIXA ANIMADA (STRIP)

| Campo no Admin | ID | Onde aparece no site | Tipo | Limite |
|---|---|---|---|---|
| Textos da faixa animada | `home-strip` | Faixa colorida animada abaixo do hero | Lista (1 por linha) | Máx. 30 caracteres por item |

**✅ Status: Completo**

---

## 5. ADMIN — SEÇÃO CARDÁPIO (TÍTULOS E SUBTÍTULOS)

| Campo no Admin | ID | Onde aparece no site | Tipo | Limite |
|---|---|---|---|---|
| Badge do Cardápio | `home-cardápio-badge` | "✨ Feito com amor desde 2007" | Texto curto | Máx. 50 caracteres |
| Título do Cardápio | `home-cardápio-título` | "🍦 Escolha sua Felicidade Hoje" | Texto curto | Máx. 60 caracteres |
| Subtítulo do Cardápio | `home-cardápio-sub` | "Toque numa categoria e descubra sabores irresistíveis" | Texto curto | Máx. 80 caracteres |
| Título — Sorvetes de Massa | `acc-sorvetes-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Sorvetes de Massa | `acc-sorvetes-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Picolés | `acc-picoles-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Picolés | `acc-picoles-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Açaí em Promoção | `acc-açaí-promo-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Açaí em Promoção | `acc-açaí-promo-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Açaí Artesanal | `acc-açaí-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Açaí Artesanal | `acc-açaí-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Milkshakes | `acc-milk-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Milkshakes | `acc-milk-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Taças | `acc-tacas-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Taças | `acc-tacas-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Taças Premium | `acc-tacas-p-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Taças Premium | `acc-tacas-p-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Isopores | `acc-iso-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Isopores | `acc-iso-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Sobremesas | `acc-sobremesas-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Sobremesas | `acc-sobremesas-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Caixas 5L e 10L | `acc-caixas-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Caixas 5L e 10L | `acc-caixas-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Tortas de Sorvete | `acc-torta-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Tortas de Sorvete | `acc-torta-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |
| Título — Picolés para Encomenda | `acc-enc-picoles-titulo` | Cabeçalho do accordion | Texto curto | Máx. 40 caracteres |
| Subtítulo — Picolés para Encomenda | `acc-enc-picoles-sub` | Descrição abaixo do título | Texto curto | Máx. 80 caracteres |

**✅ Status: Completo**

---

## 6. ADMIN — LISTAS DINÂMICAS DE PRODUTOS (CARDÁPIO)

### 6.1 Sorvetes de Massa

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Lista de 35 sabores | `card-sorvetes-sabores` | Lista (1 por linha) | Um sabor por linha. Ex: "Chocolate Belga" | Máx. 30 caracteres por sabor |
| Texto do botão | `card-sorvetes-btn` | Texto curto | Ex: "🍦 Ver 35 Sabores" | Máx. 30 caracteres |
| Descrição do card | `card-sorvetes-desc` | Texto curto | Subtítulo do card de sorvetes | Máx. 80 caracteres |

**⚠️ Lacuna:** Não há campo para **preço por bola** (ex: 1 bola R$ 8,00, 2 bolas R$ 14,00). Esses preços estão nos cards de produto mas não têm campo editável separado dos preços gerais.

---

### 6.2 Picolés (5 tipos)

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Sabores — Picolé de Fruta | `card-picoles-fruta` | Lista (1 por linha) | Sabores de picolé de fruta/água | Máx. 25 caracteres por sabor |
| Sabores — Picolé de Leite | `card-picoles-leite` | Lista (1 por linha) | Sabores de picolé de leite | Máx. 25 caracteres por sabor |
| Sabores — Picolé Recheado | `card-picoles-recheado` | Lista (1 por linha) | Sabores de picolé recheado | Máx. 25 caracteres por sabor |
| Sabores — Picolé Ninho | `card-picoles-ninho` | Lista (1 por linha) | Sabores de picolé de Ninho | Máx. 25 caracteres por sabor |
| Sabores — Picolé Esquimó | `card-picoles-esquimo` | Lista (1 por linha) | Sabores de picolé Esquimó | Máx. 25 caracteres por sabor |
| Texto do botão | `card-picoles-btn` | Texto curto | Texto do botão de sabores | Máx. 30 caracteres |

**⚠️ Lacuna:** Não há campo para **preço por tipo de picolé** (ex: Fruta R$ 4,00, Leite R$ 5,00, etc.).

---

### 6.3 Açaí em Promoção

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Combos em promoção | `card-açaí-promo-combos` | Lista (1 por linha) | Ex: "400ml - R$ 10,00" | Máx. 30 caracteres por combo |
| Texto do botão | `card-açaí-promo-btn` | Texto curto | Texto do botão de combos | Máx. 30 caracteres |

---

### 6.4 Açaí Artesanal

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Tamanhos e preços | `card-açaí-tamanhos` | Lista (1 por linha) | Ex: "300ml - R$ 12,00" | Máx. 30 caracteres por linha |
| Complementos | `card-açaí-complementos` | Lista (1 por linha) | Um complemento por linha | Máx. 25 caracteres por item |
| Texto do botão | `card-açaí-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

### 6.5 Milkshakes

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Sabores | `card-milk-sabores` | Lista (1 por linha) | Um sabor por linha | Máx. 30 caracteres por sabor |
| Tamanhos e preços | `card-milk-tamanhos` | Lista (1 por linha) | Ex: "Tradicional 400ml - R$ 18,00" | Máx. 40 caracteres por linha |
| Texto do botão | `card-milk-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

### 6.6 Taças Tradicionais

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Lista de taças | `card-tacas-lista` | Lista (1 por linha) | Ex: "Colegial - 2 bolas - R$ 20,00" | Máx. 50 caracteres por linha |
| Texto do botão | `card-tacas-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

### 6.7 Taças Premium

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Lista de taças premium | `card-tacas-p-lista` | Lista (1 por linha) | Ex: "Prestígio - R$ 35,00" | Máx. 50 caracteres por linha |
| Texto do botão | `card-tacas-p-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

### 6.8 Isopores de Viagem

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Lista de isopores | `card-iso-lista` | Lista (1 por linha) | Ex: "Isopore 2L - R$ 25,00" | Máx. 40 caracteres por linha |
| Texto do botão | `card-iso-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

### 6.9 Sobremesas Geladas

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Lista de sobremesas | `card-sobremesas-lista` | Lista (1 por linha) | Ex: "Fondue de Chocolate - R$ 28,00" | Máx. 50 caracteres por linha |
| Texto do botão | `card-sobremesas-btn` | Texto curto | Texto do botão | Máx. 30 caracteres |

---

## 7. ADMIN — ESTOQUE (CAIXAS DE SORVETE)

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Estoque — Caixa 5L (2 sabores) | `caixa_5l_2s` | Número | Quantidade disponível. Zero = Esgotado | 0 a 9999 |
| Estoque — Caixa 5L (3 sabores) | `caixa_5l_3s` | Número | Quantidade disponível. Zero = Esgotado | 0 a 9999 |
| Estoque — Caixa 10L (2 sabores) | `caixa_10l_2s` | Número | Quantidade disponível. Zero = Esgotado | 0 a 9999 |
| Estoque — Caixa 10L (3 sabores) | `caixa_10l_3s` | Número | Quantidade disponível. Zero = Esgotado | 0 a 9999 |

**✅ Status: Completo**

---

## 8. ADMIN — PROMOÇÃO ESPECIAL

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Promoção ativa (toggle) | `promo-ativo` | Booleano | Liga/desliga o banner de promoção no site | — |
| Título da promoção | `promo-título` | Texto curto | Título em destaque no banner | Máx. 80 caracteres |
| Descrição | `promo-descrição` | Texto longo | Descrição detalhada da promoção | Máx. 300 caracteres |
| Texto do botão | `promo-btn` | Texto curto | Ex: "Ver no Instagram" | Máx. 30 caracteres |
| Link do botão | `promo-link` | URL | Link para a promoção completa | URL válida |
| Data de encerramento | `promo-datafim` | Data/hora | Deixe em branco para promoção sem prazo | Formato: DD/MM/AAAA HH:MM |
| Texto do FAB (botão flutuante) | `promo-fab` | Texto curto | Texto curto e impactante no canto inferior direito | Máx. 15 caracteres |
| Imagem da promoção | `promo-img-input` | Imagem | Foto do produto ou arte da promoção | JPG/PNG/WebP, 800×400px, máx. 300KB |

**✅ Status: Completo**

---

## 9. ADMIN — DEPOIMENTOS E DICAS

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Título da seção | `dep-titulo` | Texto curto | Ex: "O que nossos clientes dizem" | Máx. 60 caracteres |
| Subtítulo | `dep-subtitulo` | Texto curto | Frase de apoio abaixo do título | Máx. 100 caracteres |
| Dicas do dia | `dep-dicas` | Lista (1 por linha) | Dicas sobre sabores e produtos | Máx. 120 caracteres por dica |

**⚠️ Lacuna:** Não há campo para **depoimentos de clientes** (nome + texto do depoimento). Atualmente apenas "dicas" são editáveis.

> **Campo a criar:** Lista dinâmica de depoimentos com:
> - `dep-nome` — Nome do cliente (Máx. 30 caracteres)
> - `dep-texto` — Texto do depoimento (Máx. 150 caracteres)
> - `dep-ativo` — Mostrar/ocultar (checkbox)

---

## 10. ADMIN — FALE CONOSCO / CHAT

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Título do formulário | `fc-titulo` | Texto curto | Título do painel "Fale Conosco" | Máx. 40 caracteres |
| Subtítulo | `fc-subtitulo` | Texto curto | Frase de apoio | Máx. 80 caracteres |
| Mensagem de sucesso | `fc-msg-sucesso` | Texto curto | Mensagem após envio do formulário | Máx. 80 caracteres |
| WhatsApp (número) | `fc-whatsapp` | Telefone | Número com DDD e código do país | Ex: 5516996062046 |
| E-mail de contato | `fc-email` | E-mail | E-mail de contato da sorveteria | Formato: email@dominio.com |
| Endereço | `fc-endereco` | Texto curto | Endereço completo da sorveteria | Máx. 100 caracteres |
| Horário de funcionamento | `fc-horario` | Texto curto | Ex: "Todos os dias: 10h às 22h" | Máx. 60 caracteres |
| Mensagem inicial do chat | `fc-chat-inicio` | Texto longo | Primeira mensagem do assistente | Máx. 150 caracteres |
| Opções de sugestão do chat | `fc-chat-opcoes` | Lista (1 por linha) | Botões de sugestão rápida | Máx. 25 caracteres por opção; máx. 6 opções |
| Mensagem fora do horário | `fc-chat-fora` | Texto curto | Mensagem quando a loja está fechada | Máx. 100 caracteres |

**✅ Status: Completo**

---

## 11. ADMIN — CONFIGURAÇÕES GERAIS

| Campo | ID | Tipo | Instrução | Limite |
|---|---|---|---|---|
| Nome da empresa | `cfg-nome-empresa` | Texto curto | Nome oficial da sorveteria | Máx. 50 caracteres |
| Slogan | `cfg-slogan` | Texto curto | Slogan principal | Máx. 60 caracteres |
| Ano de fundação | `cfg-fundação` | Número | Ano de abertura da sorveteria | 4 dígitos (ex: 2007) |
| CNPJ | `cfg-CNPJ` | Texto | CNPJ no formato XX.XXX.XXX/XXXX-XX | Máx. 18 caracteres |
| Horário detalhado | `cfg-horário-det` | Texto curto | Ex: "Segunda a Domingo: 10h às 22h" | Máx. 60 caracteres |
| Horário no rodapé | `cfg-footer-horário` | Texto longo | Texto completo do horário no rodapé | Máx. 100 caracteres |
| Copyright do rodapé | `cfg-footer-copy` | Texto curto | Ex: "2007–2026 Sorveteria Itapolitana · Cajuru/SP" | Máx. 80 caracteres |
| Desenvolvido por | `cfg-footer-dev` | Texto curto | Crédito do desenvolvedor | Máx. 40 caracteres |
| Nova senha do Admin | `cfg-nova-senha` | Senha | Nova senha de acesso ao painel | Mín. 8 caracteres |
| Confirmar nova senha | `cfg-conf-senha` | Senha | Repetir a nova senha | Deve ser idêntica à anterior |

**✅ Status: Completo**

---

## 12. LACUNAS — ITENS VISÍVEIS NO SITE SEM CAMPO NO ADMIN

A tabela abaixo lista todos os elementos visíveis no site que **não têm campo correspondente no Admin** e precisam ser criados:

| # | Elemento visível no site | Onde aparece | Campo a criar | Seção do Admin |
|---|---|---|---|---|
| 1 | Botão "🛒 Carrinho para Eventos" | Hero — terceiro botão | `home-cta-carrinho` (texto + link) | ADMIN — Home |
| 2 | Texto "Toque para consultar" abaixo do botão carrinho | Hero | `home-cta-carrinho-sub` | ADMIN — Home |
| 3 | Preços individuais dos picolés por tipo | Accordion Picolés | `card-picoles-precos` (lista por tipo) | ADMIN — Cardápio |
| 4 | Preços das Tortas de Sorvete | Accordion Tortas | `card-tortas-lista` (nome + preço) | ADMIN — Cardápio |
| 5 | Preços dos Picolés para Encomenda | Accordion Picolés Encomenda | `card-enc-picoles-lista` (tipo + preço + mín.) | ADMIN — Cardápio |
| 6 | Lista de Complementos para Sorvetes | Accordion Complementos | `card-complementos-lista` (nome + preço) | ADMIN — Cardápio |
| 7 | Depoimentos de clientes (nome + texto) | Seção Depoimentos | Lista dinâmica `dep-depoimentos[]` | ADMIN — Depoimentos |
| 8 | Textos dos selos de segurança (HTTPS, SSL, etc.) | Rodapé | `cfg-selos[]` (texto de cada selo) | ADMIN — Config |
| 9 | Texto do FAB "🍦 Clube Itapolitana" | Botão flutuante verde | `clube-fab-texto` | ADMIN — Fidelidade |
| 10 | Texto do FAB "💬 Fale Conosco" | Botão flutuante | `fc-fab-texto` | ADMIN — Fale Conosco |
| 11 | Mensagem de instrução do modal de sabores | Modal "35 Sabores" | `modal-sabores-sub` | ADMIN — Cardápio |
| 12 | Título do modal de sabores | Modal "35 Sabores" | `modal-sabores-titulo` | ADMIN — Cardápio |
| 13 | Mensagem do modal de complementos do açaí | Modal Complementos | `modal-comp-titulo` e `modal-comp-sub` | ADMIN — Cardápio |
| 14 | Imagens dos produtos (fotos por categoria) | Cards de produto | Upload por categoria | ADMIN — Cardápio |
| 15 | Texto do botão "← Voltar ao Início do Cardápio" | Dentro de cada accordion | `btn-voltar-texto` | ADMIN — Cardápio |

---

## 13. CAMPOS ESPECIAIS — IMAGENS E BANNERS

Para cada imagem ou banner, o Admin deve informar:

| Imagem | Dimensão recomendada | Proporção | Tamanho máx. | Formato |
|---|---|---|---|---|
| Banner Hero | 1200 × 600 px | 2:1 | 500 KB | JPG, PNG, WebP |
| Imagem da Promoção | 800 × 400 px | 2:1 | 300 KB | JPG, PNG, WebP |
| Foto de produto (card) | 800 × 800 px | 1:1 | 300 KB | JPG, PNG, WebP |
| Logo da sorveteria | 400 × 400 px | 1:1 | 100 KB | PNG (fundo transparente) |
| Imagem de taça premium | 600 × 800 px | 3:4 | 300 KB | JPG, PNG, WebP |

> **Dica para todas as imagens:** Use fotos reais da loja e produtos, bem iluminadas. Evite textos dentro das imagens — use os campos de texto do Admin para isso.

---

## 14. RESUMO EXECUTIVO

| Categoria | Total de campos | Existentes no Admin | Lacunas |
|---|---|---|---|
| Header / Menu | 4 | 4 | 0 |
| Hero | 7 | 6 | 1 (botão carrinho) |
| Faixa animada | 1 | 1 | 0 |
| Cardápio — Títulos | 26 | 26 | 0 |
| Cardápio — Listas | 18 | 15 | 3 (tortas, enc. picolés, complementos) |
| Estoque | 4 | 4 | 0 |
| Promoção | 8 | 8 | 0 |
| Depoimentos | 5 | 3 | 2 (lista de depoimentos) |
| Fale Conosco / Chat | 10 | 10 | 0 |
| Configurações | 10 | 10 | 0 |
| Imagens | 5 | 2 | 3 (fotos de produto, logo, taças) |
| **TOTAL** | **98** | **89** | **9 lacunas críticas** |

---

*Documento gerado automaticamente pela auditoria de paridade Site × Admin — Sorveteria Itapolitana Cajuru.*
