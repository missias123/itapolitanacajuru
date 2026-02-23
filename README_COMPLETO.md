# 🍦 Itapolitana Cajuru — Documentação Completa do Projeto

**Sorveteria Itapolitana Cajuru — Site de Encomendas Online**

---

## 🌐 Acesso ao Site

| URL | Status |
|-----|--------|
| https://itapolitanacajuru.com.br | ✅ Domínio principal |
| https://www.itapolitanacajuru.com.br | ✅ Com www |
| https://missias123.github.io/itapolitanacajuru/ | ✅ GitHub Pages (backup) |

---

## 📋 Informações do Projeto

| Item | Detalhe |
|------|---------|
| **Domínio** | itapolitanacajuru.com.br |
| **Validade domínio** | 23/02/2029 |
| **Hospedagem** | GitHub Pages (GRATUITO) |
| **Repositório** | https://github.com/missias123/itapolitanacajuru |
| **Registro.br** | CPF 126.763.468-57 / Código VAMCO188 |
| **Endereço** | R. Cel. Manoel Caetano, 311 – Praça Largo São Bento, Cajuru/SP |

---

## 🗂️ Estrutura de Arquivos

```
/
├── index.html              → Cardápio principal (36 sabores)
├── encomendas.html         → Página de encomendas + carrinho
├── promocao.html           → Página de promoções
├── CNAME                   → Domínio personalizado (GitHub Pages)
├── sitemap.xml             → SEO - mapa do site
├── robots.txt              → SEO - bloqueia /gerenciar/ do Google
├── manifest.json           → PWA manifest
├── gerenciar/
│   ├── caixas.html         → Admin: Caixas de sorvete
│   ├── tortas.html         → Admin: Tortas de sorvete
│   └── acrescimos.html     → Admin: Acréscimos (100 slots)
├── scripts/
│   └── enc-v2.js           → JavaScript principal do carrinho
├── styles/
│   └── encomendas.css      → CSS com neuromarketing
├── images/                 → Imagens do site
└── img/                    → Imagens adicionais
```

---

## ⚙️ Configuração DNS (Registro.br)

Registros configurados em 23/02/2026:

| Tipo  | Nome                         | Dados                |
|-------|------------------------------|----------------------|
| A     | itapolitanacajuru.com.br     | 185.199.108.153      |
| A     | itapolitanacajuru.com.br     | 185.199.109.153      |
| A     | itapolitanacajuru.com.br     | 185.199.110.153      |
| A     | itapolitanacajuru.com.br     | 185.199.111.153      |
| CNAME | www.itapolitanacajuru.com.br | missias123.github.io |

---

## 🛒 Funcionalidades

- **Cardápio:** 36 sabores de sorvete com fotos e descrições
- **Encomendas:** 4 categorias (Caixas, Tortas, Picolés, Acréscimos)
- **Carrinho:** Adicionar produtos, ajustar quantidades, finalizar pedido
- **WhatsApp:** Pedido enviado automaticamente formatado via WhatsApp
- **Admin:** 3 painéis para gerenciar produtos (localStorage)
- **Acordeão:** Uma seção aberta por vez na página de encomendas
- **Clima:** Widget de temperatura para Cajuru/SP
- **Neuromarketing:** Cores, frases rotativas, gatilhos psicológicos
- **SEO:** Open Graph, Schema.org, sitemap, robots.txt
- **Mobile:** Totalmente responsivo

---

## 🔧 Painéis Administrativos

Acesse em: `https://itapolitanacajuru.com.br/gerenciar/`

| Painel | URL |
|--------|-----|
| Caixas | /gerenciar/caixas.html |
| Tortas | /gerenciar/tortas.html |
| Acréscimos | /gerenciar/acrescimos.html |

> **Nota:** Os painéis usam `localStorage` do navegador. Os dados ficam salvos no dispositivo onde foram editados.

---

## 📱 Chaves localStorage

| Chave | Conteúdo |
|-------|----------|
| `itap_caixas` | Produtos das caixas |
| `itap_tortas` | Produtos das tortas |
| `itap_picoles` | Produtos dos picolés |
| `itap_acrescimos` | Produtos dos acréscimos |

---

## 🚀 Como Atualizar o Site

1. Editar os arquivos localmente
2. Fazer commit e push para o GitHub:
```bash
git add .
git commit -m "Descrição da atualização"
git push origin main
```
3. O GitHub Pages atualiza automaticamente em ~2 minutos

---

## 📞 Contato / WhatsApp

O número do WhatsApp para receber pedidos está configurado no arquivo `scripts/enc-v2.js`.

---

*Documentação gerada em 23/02/2026*
