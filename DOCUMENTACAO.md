# Documentação Técnica — Sorveteria Itapolitana Cajuru

> **Versão:** 2.0 — Atualizado em 11/04/2026  
> **URL:** [itapolitanacajuru.com.br](https://itapolitanacajuru.com.br)  
> **Repositório:** [github.com/missias123/itapolitanacajuru](https://github.com/missias123/itapolitanacajuru)

---

## 1. Visão Geral da Arquitetura

O site é uma aplicação **estática hospedada no GitHub Pages** com domínio personalizado `itapolitanacajuru.com.br`. Não há backend — todos os dados dinâmicos são armazenados em arquivos JSON no próprio repositório e atualizados via **GitHub API** diretamente do painel administrativo.

```
itapolitanacajuru/
├── index.html              # Página principal
├── encomendas.html         # Formulário de encomendas
├── fidelidade.html         # Programa de fidelidade
├── promocao.html           # Promoções e sorteio
├── dicas.html              # Depoimentos e dicas
├── admin-painel.html       # Painel administrativo (protegido por senha)
├── dados/
│   ├── config.json         # Configurações gerais do site
│   ├── promo.json          # Dados da promoção atual
│   ├── fidelidade.json     # Configurações do programa de fidelidade
│   ├── clientes.json       # Cadastro de clientes do sorteio
│   └── depoimentos.json    # Depoimentos dos clientes
├── images/                 # Imagens em formato WebP
├── css/
│   ├── design-system.min.css
│   └── estilo-encomendas.min.css
├── scripts/
│   ├── site-loader.js      # Carregamento dinâmico de dados JSON
│   ├── products.js         # Cardápio e produtos
│   └── enc-v2.js           # Lógica de encomendas
├── sitemap.xml
├── robots.txt
├── manifest.json           # PWA manifest
└── converte-imagens.sh     # Script de conversão WebP automática
```

---

## 2. Painel Administrativo

**URL:** `/admin-painel.html`  
**Proteção:** Senha configurada na variável `SENHA_ADMIN` no código JS.

### Abas disponíveis

| Aba | Função | Arquivo JSON salvo |
|---|---|---|
| **Home** | Editar textos e banner da página inicial | `config.json` |
| **Cardápio** | Gerenciar produtos, preços e fotos | `config.json` |
| **Promoção** | Editar promoção, upload de imagem, data de encerramento | `promo.json` |
| **Fidelidade** | Configurar pontos, prêmios e textos do programa | `fidelidade.json` |
| **Depoimentos** | Adicionar/editar depoimentos de clientes | `depoimentos.json` |
| **Participantes** | Ver, copiar e exportar lista de inscritos no sorteio | `clientes.json` (leitura) |
| **Estoque** | Controlar disponibilidade dos produtos | `config.json` |

### Botões de cópia na aba Participantes

- **Copiar Todos os Dados** — formato completo com nº, nome, WhatsApp, data, tipo, pontos e status
- **Copiar Só Sorteio** — apenas inscritos no sorteio, numerados 001 a N
- **Lista Simples** — nome, WhatsApp e tipo
- **Exportar CSV** — planilha com BOM UTF-8, abre direto no Excel

---

## 3. Fluxo de Dados

```
Admin edita campo
       ↓
Validação no frontend (maxlength, formato)
       ↓
GitHub API PUT /contents/{path}
       ↓
Arquivo JSON atualizado no repositório
       ↓
GitHub Pages serve o arquivo atualizado
       ↓
site-loader.js carrega o JSON no frontend
       ↓
DOM atualizado dinamicamente
```

---

## 4. SEO Técnico

### Schema Markup implementado

| Tipo | Página | Propósito |
|---|---|---|
| `IceCreamShop` (LocalBusiness) | index.html | Aparece no Google Maps e Knowledge Panel |
| `Product` × 3 | index.html | Rich snippets de produto com avaliação |
| `AggregateRating` | index.html | Estrelas nos resultados de busca |
| `Review` | index.html | Depoimento de cliente |
| `FAQPage` | index.html | Perguntas frequentes nos resultados |
| `BreadcrumbList` | index.html | Navegação estruturada |
| `WebSite` | index.html | Identidade do site para o Google |

### Meta tags por página

| Página | title | meta description | canonical | og:tags |
|---|---|---|---|---|
| index.html | ✅ | ✅ | ✅ | ✅ |
| encomendas.html | ✅ | ✅ | — | — |
| fidelidade.html | ✅ | ✅ | — | — |
| promocao.html | ✅ | ✅ | — | — |
| dicas.html | ✅ | ✅ | — | — |

---

## 5. Performance (Core Web Vitals)

### Otimizações implementadas

- **Imagens:** 100% em formato WebP (economia média de 94% vs. PNG/JPG)
- **Lazy loading:** `loading="lazy"` em todas as imagens
- **Scripts:** `defer` em `site-loader.js`, `products.js` e `enc-v2.js`
- **CSS crítico:** inline no `<head>` para FCP rápido
- **Fontes:** `font-display: swap` via parâmetro `&display=swap` na URL do Google Fonts
- **Preconnect:** `<link rel="preconnect">` para fonts.googleapis.com e fonts.gstatic.com
- **DNS prefetch:** para api.github.com e raw.githubusercontent.com

### Regra de conversão WebP automática

Todo arquivo PNG/JPG/JPEG adicionado ao projeto é convertido automaticamente:

```bash
# Converter manualmente
./converte-imagens.sh

# Forçar reconversão de todas
./converte-imagens.sh --force
```

O **Git hook pre-commit** converte automaticamente qualquer imagem adicionada via `git add`.

---

## 6. Monitoramento

### Google Tag Manager

- **ID:** `GTM-K7L8M9N`
- **Presente em:** todas as páginas públicas (index, encomendas, fidelidade, promocao, dicas)
- **Configurar GA4:** No GTM, criar tag GA4 com ID `G-XXXXXXXXXX` (substituir pelo ID real do Google Analytics)

### Google Search Console

1. Acessar [search.google.com/search-console](https://search.google.com/search-console)
2. Adicionar propriedade `itapolitanacajuru.com.br`
3. Verificar via DNS TXT ou arquivo HTML
4. Enviar sitemap: `https://itapolitanacajuru.com.br/sitemap.xml`

---

## 7. Acessibilidade (WCAG 2.1 AA)

- **Skip-link:** "Pular para o conteúdo principal" — visível ao navegar por teclado
- **lang="pt-BR":** definido na tag `<html>`
- **alt text:** presente em todas as imagens
- **aria-label:** em todos os botões de fechar modais e botões de ação sem texto
- **Semântica:** `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`

---

## 8. Segurança

| Cabeçalho HTTP | Valor | Propósito |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Força HTTPS |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla referrer |
| `Content-Security-Policy` | Configurado | Restringe fontes de conteúdo |

---

## 9. Regras do Projeto (Engenharia Sênior)

1. **Toda imagem deve ser WebP** — usar `converte-imagens.sh` ou o Git hook automático
2. **Todo campo de upload deve mostrar especificações** — dimensões, tamanho máximo e formatos aceitos
3. **Nenhum script pode bloquear renderização** — usar `defer` ou `async` em todos os `<script src="...">`
4. **Nenhum texto hardcoded** — todos os textos editáveis devem vir dos JSONs em `dados/`
5. **Validação no frontend** — maxlength, contadores de caracteres em tempo real
6. **Sem bugs do validador de português** — verificar: `preçonnect`, `Aténdemos`, `toLocaleDatéString`, `aggregatéRating`, `GeoCoordinatés`
7. **Commits descritivos** — mensagem clara do que foi alterado e por quê

---

## 10. Contato e Suporte

- **Proprietário:** Missias (Sorveteria Itapolitana Cajuru)
- **Instagram:** [@sorveteriaitapolitanacajuru](https://www.instagram.com/sorveteriaitapolitanacajuru/)
- **WhatsApp:** (16) 99606-2046
- **Endereço:** R. Cel. Manoel Caetano, 311 – Pça Largo São Bento, Cajuru/SP
