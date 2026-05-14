# 🍦 Sorveteria Itapolitana Cajuru — Site PWA

> Site oficial da Sorveteria Itapolitana em Cajuru/SP.  
> PWA (Progressive Web App) com cardápio digital, encomendas via WhatsApp, clube de fidelidade e painel administrativo.

🌐 **URL de produção:** [https://itapolitanacajuru.com.br](https://itapolitanacajuru.com.br)  
📦 **Hospedagem:** GitHub Pages (branch `main`, domínio customizado via CNAME)

### ✅ Compromisso de Qualidade Contínua (baseline `v1.0-quality-94`)

> A partir da tag **v1.0-quality-94**, este repositório segue uma política de qualidade contínua: todos os PRs são checados automaticamente quanto a código, performance, SEO, segurança e responsividade. Qualquer regressão relevante impede o merge até correção. A branch `main` deve permanecer, no mínimo, com **score ≥ 90/100**, **zero erros críticos** e **zero alertas CodeQL**.

---

## 📋 Sumário

- [Visão Geral do Projeto](#-visão-geral-do-projeto)
- [Fluxo de Publicação Profissional](#-fluxo-de-publicação-profissional)
- [Autenticação Estável: SSH ou PAT](#-autenticação-estável-ssh-ou-pat)
- [Quando o Copilot Avisar que o Token Expirou](#-quando-o-copilot-avisar-que-o-token-expirou)
- [Pipelines CI/CD — GitHub Actions](#-pipelines-cicd--github-actions)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Regras de Ouro — O que NÃO alterar](#-regras-de-ouro--o-que-não-alterar)

---

## 🏠 Visão Geral do Projeto

| Página | Descrição |
|--------|-----------|
| `index.html` | Home + Cardápio Digital inline |
| `encomendas.html` | Encomendas (tortas, caixas, picolés) |
| `promocao.html` | Promoção do mês / sorteio |
| `fidelidade.html` | Clube de fidelidade (wizard 5 passos) |
| `dicas.html` | Dicas e conteúdo editorial |
| `admin-painel.html` | Painel administrativo (acesso restrito) |

**Dados:** todos os JSONs em `dados/` são a fonte única de verdade. O admin os edita via GitHub API.

---

## 🚀 Fluxo de Publicação Profissional

```
┌─────────────────────────────────────────────────────────┐
│  FLUXO RECOMENDADO (independente do Copilot)            │
│                                                         │
│  1. Copilot escreve código e cria commits locais        │
│  2. Você verifica: git log --oneline                    │
│  3. Você publica: git push  (com SUA credencial)        │
│  4. GitHub Actions valida: ESLint + HTMLHint + JSON     │
│  5. GitHub Pages serve o site automaticamente           │
└─────────────────────────────────────────────────────────┘
```

### Princípio fundamental

> **O Copilot é um assistente de código — não o responsável pelo push.**  
> O `git push` **SEMPRE** deve usar a sua credencial (SSH ou PAT), não o token interno do Copilot.

O token do Copilot é **efêmero** (expira por sessão) e de escopo limitado.  
A sua credencial pessoal é **estável** e permanente.

---

## 🔐 Autenticação Estável: SSH ou PAT

Escolha **uma** das duas opções abaixo. SSH é mais seguro e recomendado.

---

### Opção A — SSH (recomendado)

#### 1. Gerar chave SSH (se ainda não tiver)

```bash
# Gera chave Ed25519 (mais segura e moderna)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Aceite o caminho padrão (~/.ssh/id_ed25519) e defina uma senha forte
# Verifique que foi criada:
ls -la ~/.ssh/id_ed25519*
```

#### 2. Adicionar a chave ao GitHub

```bash
# Copie a chave pública
cat ~/.ssh/id_ed25519.pub
```

1. Acesse [github.com/settings/keys](https://github.com/settings/keys)
2. Clique em **New SSH key**
3. Título: `Meu PC — Itapolitana` (ou qualquer nome)
4. Cole o conteúdo de `~/.ssh/id_ed25519.pub`
5. Clique em **Add SSH key**

#### 3. Configurar o remote para usar SSH

```bash
# Verificar remote atual
git remote -v
# Saída esperada: origin  https://github.com/missias123/itapolitanacajuru (fetch)

# Trocar para SSH
git remote set-url origin git@github.com:missias123/itapolitanacajuru.git

# Confirmar a troca
git remote -v
# Saída esperada: origin  git@github.com:missias123/itapolitanacajuru.git (fetch)
```

#### 4. Testar a conexão

```bash
ssh -T git@github.com
# Saída esperada: Hi missias123! You've successfully authenticated...
```

#### 5. Fazer push

```bash
git push origin main
# ou, para uma branch específica:
git push origin copilot/nome-da-branch
```

---

### Opção B — Personal Access Token (PAT)

Use quando não quiser configurar SSH (ex.: em computadores compartilhados ou CI/CD).

#### 1. Criar o PAT no GitHub

1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em **Generate new token (classic)**
3. Nome: `Itapolitana Push Token`
4. Expiração: **No expiration** (ou 1 ano)
5. Escopos necessários: apenas **`repo`** (leitura + escrita no repositório)
6. Clique em **Generate token**
7. **Copie o token agora** — ele não será exibido novamente

#### 2. Salvar o PAT no git credential store

```bash
# Configurar git para armazenar credenciais
git config --global credential.helper store

# Fazer um push qualquer — o git vai pedir usuário e senha
git push origin main
# Usuário: missias123
# Senha: COLE_SEU_PAT_AQUI   (não a senha do GitHub, mas o PAT)

# A partir daí, o PAT fica salvo e os próximos pushes são automáticos
```

#### 3. Alternativa — PAT direto na URL (não recomendado em máquinas compartilhadas)

```bash
git remote set-url origin https://SEU_PAT@github.com/missias123/itapolitanacajuru.git
```

---

## ⚠️ Quando o Copilot Avisar que o Token Expirou

Se você ver a mensagem:

> *"Os commits estão prontos localmente, mas o token de acesso expirou..."*

**Não precisa reautorizar o Copilot.** Basta executar no seu terminal:

```bash
# 1. Ver o estado local
git status
git log --oneline -5

# 2. Publicar com a SUA credencial (SSH ou PAT)
git push origin <nome-da-branch>

# Exemplo:
git push origin copilot/improve-html-ux-duvidas-screen
```

Os commits do Copilot ficam no repositório local e são publicados normalmente com o seu push.

---

## 🤖 Pipelines CI/CD — GitHub Actions

O repositório possui **6 workflows** automáticos. Todos rodam quando há push para `main`:

| Workflow | Arquivo | O que faz |
|----------|---------|-----------|
| 🔍 Quality Check | `quality-check.yml` | ESLint (JS) + HTMLHint (HTML) + verifica tokens expostos + valida JSONs |
| 🚀 Auto-Repair | `auto-repair.yml` | Detecta erros de JS e aplica correções automáticas no `main` |
| 🔦 Lighthouse Audit | `lighthouse-audit.yml` | Roda Lighthouse nos 3 pages principais; falha se score < 50 |
| 🎭 E2E Tests | `e2e-tests.yml` | Testes Playwright de ponta a ponta |
| 🔐 CodeQL Security Scan | `codeql.yml` | Segurança estática (SAST) para JavaScript/TypeScript |
| 🐛 Issue on Failure | `create-issue-on-failure.yml` | Cria issue automática quando outro workflow falha |

### Deploy automático (GitHub Pages)

Não há workflow de deploy separado — o GitHub Pages serve diretamente da branch `main`.  
O fluxo completo é:

```
git push origin main
    ↓
GitHub Pages detecta o push
    ↓
Serve os arquivos estáticos (sem build — site puro HTML/CSS/JS)
    ↓
Site disponível em https://itapolitanacajuru.com.br em ~30 segundos
```

### Rodar os checks localmente antes do push

```bash
# Lint JS
npx eslint@8 scripts/*.js

# Lint HTML
npx htmlhint@1 index.html fidelidade.html encomendas.html promocao.html \
  carrossel.html dicas.html offline.html --config .htmlhintrc

# Validar JSONs
node -e "JSON.parse(require('fs').readFileSync('dados/config.json','utf8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('dados/produtos.json','utf8')); console.log('OK')"
```

---

## 🗂️ Arquitetura do Projeto

```
/
├── index.html               ← Home + Cardápio Digital inline
├── encomendas.html          ← Cardápio de encomendas + carrinho WhatsApp
├── promocao.html            ← Promoção do mês / sorteio mensal
├── fidelidade.html          ← Clube de fidelidade (wizard 5 passos)
├── dicas.html               ← Conteúdo editorial
├── admin-painel.html        ← Painel admin (⚠️ NÃO ALTERAR)
├── sw.js                    ← Service Worker PWA (⚠️ NÃO ALTERAR)
├── manifest.json            ← PWA manifest (⚠️ NÃO ALTERAR)
├── css/
│   ├── itap-shared.css      ← Estilos compartilhados: header, tabs, footer
│   └── ...
├── scripts/
│   ├── ita-bot-widget.js    ← Ita Bot (chatbot de dúvidas)
│   ├── itap-fidelidade.js   ← Lógica do clube de fidelidade
│   ├── itap-promo.js        ← Lógica do sorteio/promoção
│   ├── products.js          ← Aux. de produtos (defer)
│   ├── enc-v2.js            ← Fluxo de encomendas (defer)
│   ├── motor-estrelas-v2.js ← Motor de estrelas (fidelidade)
│   └── quality-guard.js     ← Guarda de qualidade (⚠️ NÃO ALTERAR)
├── dados/
│   ├── config.json          ← Config geral (hero, footer, horário)
│   ├── produtos.json        ← Preços e sabores
│   ├── promo.json           ← Promoção ativa
│   ├── clientes.json        ← Cadastro de clientes
│   ├── fidelidade.json      ← Dados do programa de fidelidade
│   └── encomendas.json      ← Pedidos de encomenda
├── .github/workflows/       ← CI/CD (5 workflows)
└── RELATORIO.md             ← Documentação técnica detalhada
```

---

## 🔑 Acesso ao Painel Administrativo

**URL:** `https://itapolitanacajuru.com.br/admin-painel.html`

### Fluxo de login real

O admin usa **dois fatores independentes**: senha do painel e token GitHub para escrita.

```
1. Abrir admin-painel.html no navegador
2. Informar a senha do administrador
   └── A senha é verificada localmente via hash SHA-256 (definida em dados/config.json)
3. (Opcional) Informar o GitHub Personal Access Token (PAT)
   └── Formatos aceitos: github_pat_… (≥80 chars), ghp_… (≥40), gho_/ghu_/ghs_… (≥40)
   └── Sem token válido → acesso em modo SOMENTE LEITURA
4. Com token válido → acesso completo (leitura + escrita no GitHub API)
```

### Modos de operação

| Modo | Condição | O que está disponível |
|------|----------|-----------------------|
| **Leitura** | Senha correta + sem token ou token inválido | Consulta de dados, visualização de clientes/fidelidade/promoções |
| **Escrita** | Senha correta + token GitHub válido | Todas as operações (editar, salvar, publicar) |

### Como criar / renovar o token GitHub (PAT)

1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em **"Generate new token (classic)"**
3. Marque o escopo **`repo`** (leitura e escrita no repositório)
4. Copie o token gerado (começa com `github_pat_` ou `ghp_`)
5. Cole no campo "Token GitHub" na tela de login do admin
6. O token é salvo no `localStorage` do navegador para sessões futuras

> **Atenção:** o token é sensível. Nunca compartilhe ou inclua em código-fonte.

---

## 🚫 Regras de Ouro — O que NÃO alterar

| Arquivo | Motivo |
|---------|--------|
| `sw.js` | Service Worker — alterações quebram o cache do PWA para todos os usuários |
| `manifest.json` | Instalação do PWA — alterar campos quebra o ícone/nome no celular |
| `scripts/quality-guard.js` | Guarda de qualidade CI — não alterar |
| `dados/*.json` (estrutura) | Estrutura dos campos é consumida por HTML + admin + GitHub Actions |

---

## 👨‍💻 Contribuindo

1. Crie uma branch a partir de `main`: `git checkout -b minha-feature`
2. Faça seus commits: `git commit -m "feat: descrição"`
3. Rode os checks locais (ver seção acima)
4. Faça push **com sua credencial**: `git push origin minha-feature`
5. Abra um Pull Request para `main`
6. Aguarde os checks do GitHub Actions passarem
7. Merge → GitHub Pages publica automaticamente

---

*Documentação mantida pela equipe técnica da Sorveteria Itapolitana Cajuru.*  
*Para dúvidas técnicas, consulte também o [RELATORIO.md](RELATORIO.md).*
