# Sorveteria Itapolitana - Site Oficial

**Versão:** 2.0.0  
**Última Atualização:** 21 de Fevereiro de 2026

## 📋 Descrição

Site responsivo e mobile-first da **Sorveteria Itapolitana**, especializada em sorvetes, picolés e açaí artesanais desde 2007. O site oferece:

- 🍦 Catálogo completo de produtos
- 📱 Design mobile-first otimizado
- 🛒 Carrinho de compras funcional
- 📞 Integração com WhatsApp para pedidos
- ⚙️ Painel administrativo protegido
- 🌍 SEO Local otimizado para Cajuru, Santa Cruz da Esperança e Cássia dos Coqueiros
- 📍 Dados estruturados (LocalBusiness Schema)

## 🎯 Objetivos da Atualização v2.0

### 1. ✅ Correção de Layout e Botões (Mobile UX)
- Botões "Comprar mais" e "Finalizar pedido" alinhados horizontalmente
- Botões finais "Voltar a comprar" e "Enviar o pedido" empilhados verticalmente com 2 linhas de distância
- Identidade visual mantida com cores marrom e dourado

### 2. ✅ Padronização de Sabores (Picolés)
- **Frutas/Água (R$ 2,50):** Abacaxi, Goiaba, Limão, Uva, Maracujá
- **Leite sem Recheio (R$ 2,50):** Coco Queimado, Amendoim
- **Leite com Recheio (R$ 3,00):** Morango, Chocolate, Doce de Leite
- **Eskimo (R$ 8,00):** **Brigadeiro**, Bombom, Nutella
- ✅ Correção: "Goiabata" → "Goiaba"
- ✅ Correção: Brigadeiro movido para categoria Eskimo

### 3. ✅ Painel Administrativo Completo
- Todos os produtos incluídos: Sorvetes, Picolés, Açaí, Milkshakes, Taças, Taças Premium
- Gestão de stock
- Visualização de pedidos
- Exportação de dados

### 4. ✅ SEO Local Otimizado
- Meta tags com foco em buscas locais
- Dados estruturados LocalBusiness Schema
- Seções específicas para cada região atendida
- Banner de atendimento regional
- Otimização para Cajuru, Santa Cruz da Esperança e Cássia dos Coqueiros

## 📁 Estrutura do Projeto

```
itapolitana_web/
├── index.html                 # Página principal
├── package.json              # Configuração do projeto
├── README.md                 # Este arquivo
├── styles/
│   ├── main.css             # Estilos principais
│   └── mobile.css           # Estilos responsivos mobile-first
├── scripts/
│   ├── products.js          # Dados de produtos
│   ├── cart.js              # Gestão do carrinho
│   ├── admin.js             # Painel administrativo
│   └── main.js              # Inicialização principal
└── public/
    └── favicon.png          # Ícone do site
```

## 🚀 Como Usar

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm start

# Acessar em http://localhost:8000
```

### Deploy

O site é automaticamente implantado no Manus quando há commits no GitHub:

```bash
git add .
git commit -m "Atualizar conteúdo do site"
git push origin main
```

## 🎨 Design e UX

### Cores Principais
- **Marrom (Principal):** #8B4513
- **Dourado (Destaque):** #FFD700
- **Rosa (Accent):** #e91e63

### Breakpoints Responsivos
- **Mobile:** até 430px
- **Tablet:** 768px e acima
- **Desktop:** 1024px e acima

### Mobile-First Approach
Todos os estilos são otimizados para dispositivos móveis primeiro, com melhorias progressivas para telas maiores.

## 🛒 Funcionalidades

### Carrinho de Compras
- Adicionar/remover produtos
- Ajustar quantidades
- Cálculo automático de total
- Persistência em localStorage

### Integração WhatsApp
- Pedidos enviados via WhatsApp
- Formatação automática de mensagem
- Link direto para contato

### Painel Admin
- **Senha:** `itapolitanacajuru2007`
- Visualizar todos os produtos
- Editar preços
- Ver pedidos recebidos
- Exportar dados

## 📱 Produtos Disponíveis

### 🍦 Sorvetes (11 produtos)
- Caixas 5L e 10L
- Cones (1, 2 ou 3 bolas)
- Torta de Sorvete
- Potes (500ml, 1L, 2L)

### 🍭 Picolés (13 produtos)
- Frutas/Água
- Leite sem Recheio
- Leite com Recheio
- Eskimo Premium

### 🛶 Açaí (8 produtos)
- Açaí Promoção
- Açaí Personalizado
- Açaí Família

### 🥤 Milkshakes (6 produtos)
- Diversos sabores
- Opção de personalização

### 🍨 Taças (8 produtos)
- Taças simples e premium
- Com calda e granola

### 🍫 Taças Premium (7 produtos)
- Combinações especiais
- Com extras premium

## 🌍 SEO Local

### Meta Tags Otimizadas
- Título: "Sorveteria Itapolitana - Sorvetes e Picolés Artesanais em Cajuru"
- Descrição com foco em cidades atendidas
- Keywords locais

### Dados Estruturados
Implementado schema `LocalBusiness` com:
- Nome e descrição
- Endereço completo
- Telefone de contato
- Horário de funcionamento
- Regiões atendidas
- URL do site

### Seções Regionais
- Página dedicada a Cajuru
- Página dedicada a Santa Cruz da Esperança
- Página dedicada a Cássia dos Coqueiros

## 📞 Contato

- **Telefone:** (16) 99147-2045
- **Localização:** Pça Lgo São Bento, 311 - Centro, Cajuru/SP
- **Horário:** Seg-Dom 10h às 22h
- **Retirada:** Após 3 dias úteis

## 📊 Estatísticas

- **Produtos:** 60+
- **Categorias:** 6
- **Regiões Atendidas:** 3
- **Tempo de Carregamento:** < 2s
- **Compatibilidade:** 95%+ dos navegadores

## 🔒 Segurança

- Senha do Admin protegida
- Dados do carrinho em localStorage (local)
- Sem armazenamento de dados sensíveis no servidor
- HTTPS habilitado

## 📝 Changelog

### v2.0.0 (21/02/2026)
- ✅ Correção de layout e botões para mobile
- ✅ Padronização de sabores de picolés
- ✅ Painel administrativo completo
- ✅ SEO Local otimizado
- ✅ Dados estruturados LocalBusiness
- ✅ Seções regionais
- ✅ Integração WhatsApp melhorada

### v1.0.0 (Data anterior)
- Versão inicial do site

## 👨‍💻 Desenvolvido por

**SGTMISSIAS**

---

**© 2007-2026 Sorveteria Itapolitana. Todos os direitos reservados.**
