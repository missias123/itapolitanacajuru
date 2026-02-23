# Itapolitana Cajuru — Configuração de Domínio Personalizado

## Status: DNS Configurado ✅

**Data de configuração:** 23/02/2026

---

## Configurações Realizadas

### 1. DNS no Registro.br ✅

Registros configurados na zona DNS do domínio `itapolitanacajuru.com.br`:

| Tipo  | Nome                          | Dados                  |
|-------|-------------------------------|------------------------|
| A     | itapolitanacajuru.com.br      | 185.199.108.153        |
| A     | itapolitanacajuru.com.br      | 185.199.109.153        |
| A     | itapolitanacajuru.com.br      | 185.199.110.153        |
| A     | itapolitanacajuru.com.br      | 185.199.111.153        |
| CNAME | www.itapolitanacajuru.com.br  | missias123.github.io   |

### 2. Arquivo CNAME no GitHub ✅

Arquivo `CNAME` adicionado ao repositório com conteúdo:
```
itapolitanacajuru.com.br
```

### 3. GitHub Pages ✅

- **Repositório:** https://github.com/missias123/itapolitanacajuru
- **Branch:** main
- **Domínio personalizado:** itapolitanacajuru.com.br
- **Status:** Built (funcionando)
- **HTTPS:** Pendente de ativação (aguardar propagação DNS)

---

## Próximos Passos

1. Aguardar propagação DNS completa (pode levar até 24h, mas geralmente 30min-2h)
2. Acessar https://github.com/missias123/itapolitanacajuru/settings/pages
3. Ativar "Enforce HTTPS" após o DNS propagar
4. Testar acesso em: http://itapolitanacajuru.com.br e https://itapolitanacajuru.com.br

---

## Credenciais de Acesso

- **Registro.br:** CPF 126.763.468-57 / Código VAMCO188
- **GitHub:** missias123
- **Domínio válido até:** 23/02/2029

---

## Estrutura do Site

| Arquivo               | Descrição                                      |
|-----------------------|------------------------------------------------|
| index.html            | Cardápio principal com 36 sabores              |
| encomendas.html       | Página de encomendas com carrinho              |
| gerenciar/caixas.html | Painel admin - Caixas de sorvete               |
| gerenciar/tortas.html | Painel admin - Tortas de sorvete               |
| gerenciar/acrescimos.html | Painel admin - Acréscimos (100 slots)      |
| scripts/enc-v2.js     | JavaScript principal do carrinho               |
| styles/encomendas.css | CSS com neuromarketing e animações             |
| sitemap.xml           | SEO sitemap                                    |
| robots.txt            | Bloqueia /gerenciar/ do Google                 |
| manifest.json         | PWA manifest                                   |

---

## Funcionalidades Implementadas

- ✅ Cardápio com 36 sabores de sorvete
- ✅ 4 categorias de encomendas: Caixas, Tortas, Picolés, Acréscimos
- ✅ Carrinho de compras com finalização via WhatsApp
- ✅ 3 painéis administrativos (localStorage)
- ✅ Acordeão (apenas uma seção aberta por vez)
- ✅ Widget de clima para Cajuru/SP
- ✅ Elementos de neuromarketing (cores, frases, gatilhos)
- ✅ SEO completo (Open Graph, Schema.org, sitemap)
- ✅ Responsivo para mobile
- ✅ Domínio personalizado itapolitanacajuru.com.br
