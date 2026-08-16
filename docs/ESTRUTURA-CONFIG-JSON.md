# 📊 Estrutura Completa do config.json

**Versão:** 2.0
**Data:** 2026-05-18
**Total de Campos:** 76 campos validados

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Campos por Categoria](#campos-por-categoria)
3. [Estrutura Detalhada](#estrutura-detalhada)
4. [Campos Aninhados](#campos-aninhados)
5. [Validações e Formatos](#validações-e-formatos)
6. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O arquivo `dados/config.json` é o **coração do sistema** de gerenciamento de conteúdo. Todas as edições feitas no admin-painel são salvas neste arquivo, e todos os textos do site são carregados a partir dele.

### Estatísticas:

- **Total de campos validados:** 76
- **Campos de nível raiz:** 60
- **Campos aninhados (seoPaginas):** 21 (7 páginas × 3 campos)
- **Arrays:** 4 (heroFrases, stripSensorial, chatSugestoes, cidades)
- **Objetos aninhados:** 10 (seoPaginas, sobrePagina, fidelidadePagina, etc.)

---

## 🗂️ Campos por Categoria

### 1. Informações de Contato (8 campos)

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| `whatsapp` | string | "5516996062046" | Número WhatsApp (formato internacional) |
| `whatsappFormatado` | string | "(16) 99606-2046" | Número formatado para exibição |
| `instagram` | string | "@sorveteriaitapolitanacajuru" | Username do Instagram |
| `instagramUrl` | string | "https://www.instagram.com/..." | URL completa do perfil |
| `endereco` | string | "Cajuru - SP" | Endereço resumido |
| `enderecoCompleto` | string | "Sorveteria Itapolitana · Cajuru/SP" | Endereço completo |
| `googleMaps` | string | "https://www.google.com/maps/..." | Link do Google Maps |
| `horario` | string | "Todos os dias: 10h às 22h" | Horário de funcionamento |

---

### 2. Dados Institucionais (7 campos)

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| `nomeEmpresa` | string | "Sorveteria & Açaiteria Itapolitana Cajuru" | Nome oficial |
| `slogan` | string | "Sorvete Cremoso Tipo Artesanal desde 2007" | Slogan da marca |
| `cnpj` | string | "08.922.044/0001-80" | CNPJ da empresa |
| `fundacao` | string | "2007" | Ano de fundação |
| `numSabores` | number | 35 | Quantidade de sabores |
| `cidades` | array | ["Cajuru", "Santa Cruz da Esperança"] | Cidades atendidas |
| `horarioDetalhado` | string | "Segunda a Domingo: 10h às 22h" | Horário detalhado |

---

### 3. SEO - Página Principal (3 campos)

| Campo | Tipo | Max Chars | Descrição |
|-------|------|-----------|-----------|
| `seoTitulo` | string | 60 | Tag `<title>` da página inicial |
| `seoDescricao` | string | 160 | Meta description da página inicial |
| `seoPalavrasChave` | string | - | Keywords separadas por vírgula |

**Exemplo:**
```json
{
  "seoTitulo": "Sorveteria Itapolitana Cajuru – Sorvete Tipo Artesanal, Açaí e Picolés | Desde 2007",
  "seoDescricao": "Sorveteria Itapolitana em Cajuru/SP: sorvete tipo artesanal cremoso, açaí, picolés...",
  "seoPalavrasChave": "sorveteria Cajuru, sorvete tipo artesanal Cajuru, açaí Cajuru"
}
```

---

### 4. SEO - Por Página (21 campos = 7 páginas × 3)

Estrutura aninhada em `seoPaginas`:

```json
{
  "seoPaginas": {
    "sobre": {
      "titulo": "Sobre Nós | Sorveteria Itapolitana Cajuru",
      "descricao": "Conheça a história da Sorveteria Itapolitana...",
      "palavrasChave": "sobre sorveteria cajuru, história itapolitana"
    },
    "carrossel": { ... },
    "galeria": { ... },
    "encomendas": { ... },
    "fidelidade": { ... },
    "promocao": { ... },
    "dicas": { ... }
  }
}
```

**Páginas com SEO dedicado:**
1. sobre.html
2. carrossel-vitrine.html
3. galeria.html
4. encomendas.html
5. 
6. promocao.html
7. dicas.html

---

### 5. Hero - Página Inicial (7 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `heroTitulo` | string | Título principal do hero |
| `heroSubtitulo` | string | Subtítulo com destaque |
| `heroBadge` | string | Badge informativo |
| `heroDescricao` | string | Descrição detalhada |
| `heroCta` | string | Texto do botão primário |
| `heroCtaWhats` | string | Texto do botão WhatsApp |
| `heroFrases` | array[8] | Frases rotativas |

**Exemplo de heroFrases:**
```json
"heroFrases": [
  "🍦 \"O sorvete mais cremoso de Cajuru, desde 2007!\"",
  "🍨 \"38 Sabores tipo artesanal que encantam na primeira colherada\"",
  "🍭 \"Açaí, milkshake, taças e sobremesas geladas — tudo aqui!\""
]
```

---

### 6. Strip Sensorial (1 campo)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `stripSensorial` | array[3] | Faixas animadas com informações |

```json
"stripSensorial": [
  "🍦 Cremoso · Cremoso · Leite Puro · Feito com Amor · 38 Sabores · Desde 2007 · tipo artesanal · 🍦",
  "🍨 Sorvete de Massa · Picolés Recheados · Açaí Premium · Tortas · Milkshakes · Taças · 🍨",
  "🎂 Encomende sua Torta de Sorvete · Caixas 5L e 10L · Picolés Atacado · Acréscimos · 🎂"
]
```

---

### 7. Cardápio (3 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cardapioTitulo` | string | Título da seção cardápio |
| `cardapioSubtitulo` | string | Subtítulo explicativo |
| `cardapioBadge` | string | Badge da seção |

---

### 8. Navegação (4 campos)

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| `navEncomendas` | string | "ENCOMENDAS" | Link do menu |
| `navPromocao` | string | "PROMOÇÃO" | Link do menu |
| `navDicas` | string | "DICAS/DEPOIMENTOS" | Link do menu |
| `navFidelidade` | string | "" | Link do menu |

---

### 9. Chatbot (8 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `chatFabTexto` | string | Texto do botão flutuante |
| `clubeFabTexto` | string | Texto alternativo do botão |
| `chatHdrTitulo` | string | Título do header do chat |
| `chatHdrSub` | string | Subtítulo do header |
| `chatMsgInicio` | string | Mensagem inicial do bot |
| `chatSugestoes` | array | Sugestões de perguntas rápidas |
| `faleBtnTexto` | string | Texto do botão enviar |
| `faleModalTitulo` | string | Título do modal |

```json
"chatSugestoes": [
  "Horário",
  "Como encomendar",
  "Sabores",
  "Preços",
  "Localização",
  "Picolés"
]
```

---

### 10. Programa de Fidelidade (10 campos)

#### Campos Principais (4):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `fidelidadeTitulo` | string | Título geral do programa |
| `fidelidadeDescricao` | string | Descrição resumida |
| `fidHeroTitulo` | string | Título do hero da página |
| `fidHeroDesc` | string | Descrição do hero |

#### Sistema de Pontos (4):

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| `pontosMilkshake` | number | 10 | Pontos para milkshake |
| `pontosCaixa` | number | 30 | Pontos para caixa |
| `premioMilkshake` | string | "Cacão uma bola 01 Sabor" | Descrição do prêmio |
| `premioCaixa` | string | "Uma Cx com 12 Picolés de Fruta/Água" | Descrição do prêmio |

#### Página Fidelidade (objeto aninhado - 8 campos):

```json
"fidelidadePagina": {
  "comoFuncionaTitulo": "Como funciona",
  "acaoTitulo": "Quero participar do ",
  "btnCadastro": "Quero participar do ",
  "btnLogin": "Já sou cadastrado / Digitar código",
  "regrasTitulo": "Regras do ",
  "btnAceitarRegras": "Li e aceito as regras do ",
  "regulamentoTitulo": "Regras completas do programa",
  "regulamentoSummary": "📜 Ler regulamento completo do "
}
```

---

### 11. Promoções (8 campos)

#### Campos Principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `promoBadge` | string | Badge de destaque |
| `promoTitle` | string | Título genérico |
| `promoH1` | string | Título principal (H1) |
| `promoTituloEl` | string | Título alternativo |
| `promoDesc` | string | Descrição da promoção |
| `promoDescEl` | string | Descrição para cadastro |
| `promoFabLabel` | string | Label do botão flutuante |

#### Página Promoção (objeto aninhado - 6 campos):

```json
"promocaoPagina": {
  "tituloH1": "🍨 Todo mês sorteamos 1 caixa de sorvete!",
  "heroDescricao": "Cadastre-se no site e concorra...",
  "comoParticiparTitulo": "Como Participar do Sorteio",
  "btnCadastrar": "Quero Participar do Sorteio",
  "sorteiosTitulo": "🏆 Histórico de Sorteios",
  "premioMensal": "1 caixa de 5 litros de sorvete do sabor escolhido"
}
```

---

### 12. Dicas e Depoimentos (5 campos)

Objeto aninhado `dicasPagina`:

```json
"dicasPagina": {
  "tituloH1": "💡 Dicas e Depoimentos",
  "heroDescricao": "Aprenda dicas incríveis e veja o que nossos clientes dizem",
  "dicasSecaoTitulo": "💡 Dicas Especiais da Itapolitana",
  "dicasIntro": "Confira nossas dicas...",
  "depoimentosSecaoTitulo": "⭐ O Que Nossos Clientes Dizem"
}
```

---

### 13. Sobre Nós (9 campos)

Objeto aninhado `sobrePagina`:

```json
"sobrePagina": {
  "heroTitulo": "Nossa História",
  "heroDescricao": "Desde 2007 levando felicidade em forma de sorvete",
  "historiaTitulo": "📖 Como Tudo Começou",
  "historiaParagrafo1": "Em 2007, nasceu em Cajuru...",
  "historiaParagrafo2": "Ao longo dos anos, expandimos...",
  "missaoTitulo": "🎯 Nossa Missão",
  "missaoTexto": "Proporcionar momentos de felicidade...",
  "visaoTitulo": "🔭 Nossa Visão",
  "visaoTexto": "Ser reconhecida como a melhor sorveteria...",
  "valoresTitulo": "💎 Nossos Valores",
  "valoresLista": ["Qualidade acima de tudo", "Atendimento acolhedor", "Inovação constante"],
  "diferencialTitulo": "⭐ Nosso Diferencial",
  "diferencialTexto": "O que nos torna especiais é..."
}
```

---

### 14. Encomendas (2 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `encomendaAviso` | string | Aviso sobre prazo de encomendas |
| `encomendaMinPicoles` | number | Quantidade mínima de picolés |

```json
{
  "encomendaAviso": "Encomendas para entrega têm prazo mínimo de 03 dias úteis após confirmação via WhatsApp e mediante pagamento antecipado.",
  "encomendaMinPicoles": 100
}
```

---

### 15. Rodapé (3 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `footerHorario` | string | Horário no rodapé (com quebra de linha \n) |
| `footerCopy` | string | Texto de copyright |
| `footerDev` | string | Crédito do desenvolvedor |

---

### 16. Outros Campos (8 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `horarioAbre` | number | Hora de abertura (10) |
| `horarioFecha` | number | Hora de fechamento (22) |
| `carrinhoLabel1` | string | Label do carrinho de eventos |
| `carrinhoLabel2` | string | Sublabel do carrinho |
| `carrinhoWhatsMsg` | string | Mensagem padrão WhatsApp |
| `modalSaboresTitulo` | string | Título do modal de sabores |
| `modalAcaiTitulo` | string | Título do modal de açaí |
| `modalPicoleTitulo` | string | Título do modal de picolés |

---

## 🔍 Estrutura Detalhada

### Hierarquia Completa:

```
config.json (raiz)
├── Campos Simples (60)
│   ├── whatsapp
│   ├── whatsappFormatado
│   ├── endereco
│   ├── enderecoCompleto
│   ├── horario
│   ├── horarioDetalhado
│   ├── instagram
│   ├── instagramUrl
│   ├── cnpj
│   ├── nomeEmpresa
│   ├── slogan
│   ├── fundacao
│   ├── numSabores
│   ├── googleMaps
│   ├── heroTitulo
│   ├── heroSubtitulo
│   ├── heroBadge
│   ├── heroDescricao
│   ├── heroCta
│   ├── heroCtaWhats
│   ├── cardapioTitulo
│   ├── cardapioSubtitulo
│   ├── cardapioBadge
│   ├── footerHorario
│   ├── footerCopy
│   ├── footerDev
│   ├── horarioAbre
│   ├── horarioFecha
│   ├── pontosMilkshake
│   ├── pontosCaixa
│   ├── premioMilkshake
│   ├── premioCaixa
│   ├── fidelidadeTitulo
│   ├── fidelidadeDescricao
│   ├── encomendaAviso
│   ├── encomendaMinPicoles
│   ├── seoTitulo
│   ├── seoDescricao
│   ├── seoPalavrasChave
│   ├── navEncomendas
│   ├── navPromocao
│   ├── navDicas
│   ├── navFidelidade
│   ├── carrinhoLabel1
│   ├── carrinhoLabel2
│   ├── carrinhoWhatsMsg
│   ├── chatFabTexto
│   ├── chatHdrTitulo
│   ├── chatHdrSub
│   ├── chatMsgInicio
│   ├── clubeFabTexto
│   ├── faleBtnTexto
│   ├── faleLabelMsg
│   ├── faleLabelNome
│   ├── faleModalSub
│   ├── faleModalTitulo
│   ├── fidHeroDesc
│   ├── fidHeroTitulo
│   ├── modalAcaiSub
│   ├── modalAcaiTitulo
│   ├── modalPicoleSub
│   └── modalPicoleTitulo
│
├── Arrays (4)
│   ├── heroFrases [8 itens]
│   ├── stripSensorial [3 itens]
│   ├── chatSugestoes [6 itens]
│   └── cidades [3 itens]
│
└── Objetos Aninhados (10)
    ├── seoPaginas
    │   ├── sobre {titulo, descricao, palavrasChave}
    │   ├── carrossel {titulo, descricao, palavrasChave}
    │   ├── galeria {titulo, descricao, palavrasChave}
    │   ├── encomendas {titulo, descricao, palavrasChave}
    │   ├── fidelidade {titulo, descricao, palavrasChave}
    │   ├── promocao {titulo, descricao, palavrasChave}
    │   └── dicas {titulo, descricao, palavrasChave}
    │
    ├── sobrePagina {9 campos}
    ├── fidelidadePagina {8 campos}
    ├── promocaoPagina {6 campos}
    ├── dicasPagina {5 campos}
    ├── encomendarPagina {campos de encomendas}
    └── galeriaPagina {campos de galeria}
```

---

## 🔐 Validações e Formatos

### 1. WhatsApp

**Formato Esperado:**
- `whatsapp`: Apenas números, formato internacional
- Regex: `^55\d{10,11}$`
- Exemplo válido: `"5516996062046"`
- Exemplo inválido: `"(16) 99606-2046"` (use whatsappFormatado para isso)

**Uso no site:**
```javascript
const linkWhats = `https://wa.me/${config.whatsapp}?text=Olá!`;
```

---

### 2. SEO - Títulos e Descrições

**Limites Recomendados:**

| Campo | Min | Ideal | Max |
|-------|-----|-------|-----|
| Título (title) | 30 | 50-60 | 70 |
| Descrição (description) | 120 | 150-160 | 200 |
| Palavras-chave | - | 5-10 | 20 |

**Exemplo de bom SEO:**
```json
{
  "seoTitulo": "Sorveteria Itapolitana Cajuru – Sorvete Tipo Artesanal | Desde 2007",
  "seoDescricao": "Sorveteria Itapolitana em Cajuru/SP: sorvete tipo artesanal cremoso com 38 Sabores, açaí, picolés e tortas geladas. Encomendas para festas. Desde 2007!",
  "seoPalavrasChave": "sorveteria cajuru, sorvete tipo artesanal, açaí cajuru, picolé cajuru, torta sorvete"
}
```

**Checklist de SEO:**
- ✅ Inclui palavra-chave principal no início
- ✅ Menciona localização (Cajuru)
- ✅ Inclui diferencial (desde 2007, 38 Sabores)
- ✅ Tom atrativo mas não exagerado
- ✅ Sem CAPS LOCK ou excesso de emojis

---

### 3. URLs e Links

**Formato Esperado:**

```json
{
  "instagramUrl": "https://www.instagram.com/sorveteriaitapolitanacajuru",
  "googleMaps": "https://www.google.com/maps/place/..."
}
```

**Validação:**
- Deve começar com `http://` ou `https://`
- Sem espaços
- URL válida e acessível

---

### 4. Horários

**Formatos Aceitos:**

```json
{
  "horario": "Todos os dias: 10h às 22h",
  "horarioDetalhado": "Segunda a Domingo: 10h às 22h",
  "horarioAbre": 10,
  "horarioFecha": 22,
  "footerHorario": "Todos os dias: 10h às 22h\nSegunda a Domingo"
}
```

**Nota:** `footerHorario` aceita `\n` para quebra de linha.

---

### 5. Arrays

**heroFrases - 8 elementos:**
```json
"heroFrases": [
  "🍦 \"Frase 1\"",
  "🍨 \"Frase 2\"",
  ...
]
```

**Regras:**
- Sempre 8 frases (sistema espera exatamente 8)
- Começar com emoji relacionado
- Entre aspas duplas o texto da frase
- Máximo 80 caracteres por frase

**stripSensorial - 3 elementos:**
```json
"stripSensorial": [
  "🍦 Item 1 · Item 2 · Item 3 · 🍦",
  "🍨 Item 1 · Item 2 · Item 3 · 🍨",
  "🎂 Item 1 · Item 2 · Item 3 · 🎂"
]
```

**Regras:**
- Sempre 3 strips
- Separar itens com ` · ` (espaço + ponto médio + espaço)
- Emoji no início e fim
- Conteúdo relacionado a produtos/serviços

---

## 💡 Exemplos de Uso

### Como acessar campos simples:

**JavaScript:**
```javascript
const config = await fetch('/dados/config.json').then(r => r.json());

// Usar campo simples
document.title = config.seoTitulo;
document.getElementById('hero-title').textContent = config.heroTitulo;
```

---

### Como acessar campos aninhados:

**JavaScript:**
```javascript
// SEO de uma página específica
const seoSobre = config.seoPaginas.sobre;
document.title = seoSobre.titulo;
document.querySelector('meta[name="description"]').content = seoSobre.descricao;

// Campos da página de fidelidade
const fidPage = config.fidelidadePagina;
document.getElementById('como-funciona').textContent = fidPage.comoFuncionaTitulo;
```

---

### Como iterar sobre arrays:

**JavaScript:**
```javascript
// Exibir frases rotativas
config.heroFrases.forEach((frase, index) => {
  console.log(`Frase ${index + 1}: ${frase}`);
});

// Criar botões de sugestão do chat
config.chatSugestoes.forEach(sugestao => {
  const btn = document.createElement('button');
  btn.textContent = sugestao;
  chatContainer.appendChild(btn);
});
```

---

### Como usar no admin-painel:

**HTML:**
```html
<!-- Campo simples -->
<input type="text" id="cfg-seo-titulo" value="">

<!-- Campo aninhado -->
<input type="text" id="cfg-seo-sobre-titulo" value="">

<!-- JavaScript para carregar -->
<script>
  async function carregarConfig() {
    const config = await fetch('/dados/config.json').then(r => r.json());

    // Campo simples
    document.getElementById('cfg-seo-titulo').value = config.seoTitulo;

    // Campo aninhado
    document.getElementById('cfg-seo-sobre-titulo').value = config.seoPaginas.sobre.titulo;
  }
</script>
```

---

## 🔄 Sistema de Sincronização

### data-config Attributes:

Cada campo em config.json tem um atributo correspondente no HTML:

**Campo Simples:**
```html
<h1 data-config="heroTitulo">O Sorvete que Cajuru Ama</h1>
```

**Campo Aninhado:**
```html
<title data-config="seoPaginas.sobre.titulo">Sobre Nós | Sorveteria</title>
```

### getNestedValue():

O sistema usa uma função especial para acessar campos aninhados:

```javascript
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Uso:
const titulo = getNestedValue(config, 'seoPaginas.sobre.titulo');
// Retorna: "Sobre Nós | Sorveteria Itapolitana Cajuru"
```

---

## 📋 Checklist de Validação

Antes de salvar alterações em config.json, verifique:

### Estrutura:
- ✅ JSON válido (use JSONLint para validar)
- ✅ Todas as chaves entre aspas duplas
- ✅ Valores string entre aspas duplas
- ✅ Números sem aspas
- ✅ Arrays com colchetes `[]`
- ✅ Objetos com chaves `{}`
- ✅ Vírgulas entre elementos (mas não no último)

### Conteúdo:
- ✅ Campos obrigatórios preenchidos
- ✅ WhatsApp no formato correto
- ✅ URLs válidas e acessíveis
- ✅ SEO dentro dos limites de caracteres
- ✅ Arrays com quantidade correta de elementos
- ✅ Sem caracteres especiais problemáticos

### Sincronização:
- ✅ Todos os campos têm `data-config` correspondente
- ✅ AdminId existe no admin-painel.html
- ✅ Gate admin-espelho-gate.js passa (0 falhas)

---

## 🚨 Campos Críticos

**Não delete ou renomeie estes campos sem revisar o código:**

### Essenciais para Funcionamento:
1. `whatsapp` - Usado em TODOS os botões de contato
2. `seoTitulo` - Tag `<title>` do site
3. `heroTitulo` - Título principal da home
4. `navEncomendas`, `navPromocao`, `navDicas`, `navFidelidade` - Navegação

### Essenciais para SEO:
1. `seoTitulo`, `seoDescricao`, `seoPalavrasChave`
2. Todos os campos em `seoPaginas.*`

### Essenciais para Contato:
1. `whatsapp`, `whatsappFormatado`
2. `instagram`, `instagramUrl`
3. `endereco`, `enderecoCompleto`
4. `horario`, `horarioDetalhado`

---

## 📊 Resumo Estatístico

### Por Tipo de Dado:

| Tipo | Quantidade | % |
|------|------------|---|
| String | 65 | 85.5% |
| Number | 4 | 5.3% |
| Array | 4 | 5.3% |
| Object | 10 | 13.2% |

### Por Finalidade:

| Finalidade | Campos | % |
|------------|--------|---|
| SEO | 24 | 31.6% |
| Conteúdo Textual | 28 | 36.8% |
| Configuração | 12 | 15.8% |
| Navegação/UI | 12 | 15.8% |

---

**Fim da Documentação**
Mantido por: @missias123
Última atualização: 2026-05-18
