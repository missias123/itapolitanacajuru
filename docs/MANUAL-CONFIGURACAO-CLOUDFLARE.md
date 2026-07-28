# Manual de Configuração — Cloudflare para itapolitanacajuru.com.br

> **Para quem é este manual?**  
> Este guia explica, passo a passo, como configurar o site da Sorveteria Itapolitana Cajuru
> no Cloudflare — incluindo DNS do domínio, hospedagem das páginas (Pages) e a API (Worker).  
> Siga cada etapa em ordem. Não pule passos.

---

## Visão Geral da Arquitetura

```
Visitante
   │
   ▼
Cloudflare DNS / Proxy
   │
   ├─► itapolitanacajuru.com.br  ──► GitHub Pages (ou Cloudflare Pages)
   │                                   (arquivos HTML, CSS, JS, imagens)
   │
   └─► api.itapolitanacajuru.com.br ──► Cloudflare Worker (itapolitana-api)
                                         └─► KV Namespaces (banco de dados)
```

---

## Pré-requisitos

Antes de começar, você precisa ter:

- [ ] Conta gratuita no [Cloudflare](https://dash.cloudflare.com) — crie em dash.cloudflare.com
- [ ] Acesso ao painel do registrador do domínio `itapolitanacajuru.com.br`  
      (onde você comprou o domínio — ex.: Registro.br, GoDaddy, Namecheap)
- [ ] [Node.js 18+](https://nodejs.org/) instalado no computador
- [ ] Git instalado no computador
- [ ] Clone do repositório: `git clone https://github.com/missias123/itapolitanacajuru`

---

## PARTE 1 — Adicionar o domínio ao Cloudflare

### Passo 1.1 — Criar conta e adicionar o site

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) e faça login.
2. Clique em **"Add a Site"** (Adicionar um site).
3. Digite `itapolitanacajuru.com.br` e clique em **"Add Site"**.
4. Escolha o plano **Free** (Gratuito) e clique em **"Continue"**.
5. O Cloudflare irá escanear os registros DNS existentes — clique em **"Continue"**.

### Passo 1.2 — Atualizar os nameservers no registrador

Após adicionar o site, o Cloudflare mostrará **dois nameservers** (ex.: `nora.ns.cloudflare.com`).

1. Copie os dois nameservers mostrados pelo Cloudflare.
2. Acesse o painel do seu registrador de domínio (ex.: Registro.br em [registro.br](https://registro.br)).
3. Localize o domínio `itapolitanacajuru.com.br`.
4. Substitua os nameservers atuais pelos fornecidos pelo Cloudflare.
5. Salve as alterações.

> ⏳ A propagação pode levar até **24 horas**. O Cloudflare enviará um e-mail quando o domínio estiver ativo.

---

## PARTE 2 — Configurar o DNS do site (GitHub Pages)

O site estático está hospedado no **GitHub Pages**. Configure os registros DNS no painel do Cloudflare.

### Passo 2.1 — Adicionar registros DNS para o site principal

No painel do Cloudflare, vá em **DNS → Records** e adicione:

| Tipo  | Nome (Host)    | Valor (Target)                        | Proxy |
|-------|----------------|---------------------------------------|-------|
| CNAME | `@`            | `missias123.github.io`                | ✅ Ativado (laranja) |
| CNAME | `www`          | `missias123.github.io`                | ✅ Ativado (laranja) |
| CNAME | `api`          | `itapolitana-api.SEU-SUBDOMINIO.workers.dev` | ✅ Ativado (laranja) |

> ⚠️ **Para o registro `@` (raiz):** O Cloudflare converte automaticamente CNAME raiz em registro A/AAAA (CNAME Flattening). Isso é normal.

> ℹ️ O valor do `api` será preenchido após o deploy do Worker (Parte 4).

### Passo 2.2 — Configurar HTTPS automático

1. No painel Cloudflare, vá em **SSL/TLS → Overview**.
2. Selecione o modo **"Full"** (recomendado) ou **"Flexible"** se o GitHub Pages não tiver HTTPS configurado.
3. Em **SSL/TLS → Edge Certificates**, ative:
   - **"Always Use HTTPS"** → ON
   - **"Automatic HTTPS Rewrites"** → ON

---

## PARTE 3 — Configurar o GitHub Pages

### Passo 3.1 — Ativar Pages no repositório

1. Acesse o repositório no GitHub.
2. Clique em **Settings → Pages**.
3. Em **"Source"**, selecione o branch `main` e pasta `/ (root)`.
4. Em **"Custom domain"**, digite `itapolitanacajuru.com.br` e clique **"Save"**.
5. Aguarde o GitHub verificar o domínio (pode demorar alguns minutos).

> O arquivo `CNAME` na raiz do repositório já contém o domínio correto.

---

## PARTE 4 — Configurar e fazer deploy do Worker (API)

O Worker é a API do site. Ele processa cadastros, encomendas e autenticação admin.

### Passo 4.1 — Instalar as dependências

Abra o terminal na pasta do projeto:

```bash
cd cloudflare-worker
npm install
```

### Passo 4.2 — Autenticar o Wrangler

```bash
npx wrangler login
```

Uma janela do navegador abrirá para você fazer login na sua conta Cloudflare. Autorize o acesso.

### Passo 4.3 — Criar os bancos de dados KV

Execute um por um (cada comando retorna um ID — **anote esses IDs**):

```bash
npx wrangler kv namespace create "CLIENTES_KV"
npx wrangler kv namespace create "ENCOMENDAS_KV"
npx wrangler kv namespace create "RATE_KV"
```

Saída esperada (exemplo):
```
✅ Successfully created namespace CLIENTES_KV
{ id: "abc123def456..." }
```

### Passo 4.4 — Atualizar o arquivo wrangler.toml

Abra o arquivo `cloudflare-worker/wrangler.toml` e substitua **cada** `PLACEHOLDER_*_ID` pelo ID real gerado no passo anterior:

```toml
[[kv_namespaces]]
binding    = "CLIENTES_KV"
id         = "abc123def456..."   # ← cole o ID real aqui
preview_id = "abc123def456..."   # ← mesmo ID

[[kv_namespaces]]
binding    = "ENCOMENDAS_KV"
id         = "xyz789ghi012..."   # ← cole o ID real aqui
preview_id = "xyz789ghi012..."

[[kv_namespaces]]
binding    = "RATE_KV"
id         = "jkl345mno678..."   # ← cole o ID real aqui
preview_id = "jkl345mno678..."
```

> ⚠️ **Nunca coloque senhas ou tokens neste arquivo.** Somente IDs de namespaces KV.

### Passo 4.5 — Configurar os segredos (senhas e tokens)

Execute cada comando e insira o valor quando solicitado:

```bash
# Token do GitHub (escopo "repo") — para o admin salvar arquivos do site
# Gere em: https://github.com/settings/tokens/new?scopes=repo
npx wrangler secret put GITHUB_TOKEN

# Chave de setup temporária (use qualquer texto forte — ex.: "setup-2024-xyz")
npx wrangler secret put SETUP_KEY
```

### Passo 4.6 — Fazer o primeiro deploy

```bash
npx wrangler deploy
```

Saída esperada:
```
✅ Deployed itapolitana-api
   https://itapolitana-api.SEU-USUARIO.workers.dev
```

### Passo 4.7 — Gerar a senha de administrador com segurança

Agora que o Worker está rodando, gere o hash seguro da senha admin:

```bash
# Substitua YOUR_SETUP_KEY e SENHA_ADMIN_FORTE pelos valores reais
curl -X POST "https://itapolitana-api.SEU-USUARIO.workers.dev/api/admin/generate-hash" \
  -H "content-type: application/json" \
  -d '{"setup_key":"YOUR_SETUP_KEY","password":"SENHA_ADMIN_FORTE"}'
```

Resposta (exemplo):
```json
{
  "record": "pbkdf2-sha256$v=1$iter=600000$salt=ABC...=$hash=XYZ...="
}
```

Copie o valor do campo `record` e configure como secret:

```bash
npx wrangler secret put ADMIN_PASSWORD_RECORD
# Cole o valor copiado quando solicitado
```

### Passo 4.8 — Ativar a rota personalizada do domínio

No arquivo `cloudflare-worker/wrangler.toml`, descomente e ajuste a seção de rotas:

```toml
[[routes]]
pattern   = "api.itapolitanacajuru.com.br/*"
zone_name = "itapolitanacajuru.com.br"
```

Faça o deploy novamente:

```bash
npx wrangler deploy
```

### Passo 4.9 — Testar se o Worker está funcionando

```bash
curl https://api.itapolitanacajuru.com.br/api/health
```

Resposta esperada:
```json
{ "ok": true, "ts": 1234567890, "version": "1.0.0" }
```

---

## PARTE 5 — Configurar regras de segurança no Cloudflare

### Passo 5.1 — Configurar cabeçalhos de segurança

O arquivo `_headers` na raiz do repositório já define os cabeçalhos necessários.  
Confirme que o deploy inclui este arquivo.

### Passo 5.2 — Ativar proteção básica

No painel Cloudflare, vá em **Security → Settings** e configure:

| Configuração               | Valor recomendado |
|----------------------------|-------------------|
| Security Level             | Medium            |
| Browser Integrity Check    | ON                |
| Hotlink Protection         | ON                |

### Passo 5.3 — Configurar regra de firewall para o admin

Para proteger o painel administrativo (`/admin/*`), vá em **Security → WAF → Custom Rules** e crie uma regra (opcional mas recomendado):

- **Expression:** `http.request.uri.path contains "/admin"` e `ip.src ne SEU_IP`
- **Action:** Challenge (CAPTCHA)

---

## PARTE 6 — Verificação final (Checklist)

Execute cada item e marque como concluído:

- [ ] `curl https://itapolitanacajuru.com.br` retorna o HTML do site (HTTP 200)
- [ ] `curl https://www.itapolitanacajuru.com.br` redireciona para o domínio principal
- [ ] `curl https://api.itapolitanacajuru.com.br/api/health` retorna `{"ok":true,...}`
- [ ] HTTPS ativo: o cadeado aparece no navegador
- [ ] O formulário de encomenda funciona no site
- [ ] Login no painel admin (`/admin-painel.html`) funciona com a nova senha
- [ ] O formulário da promoção funciona (se a promoção estiver ativa)

---

## Solução de Problemas Comuns

### "DNS não propagou ainda"
Aguarde até 24 horas. Use [whatsmydns.net](https://www.whatsmydns.net) para verificar a propagação.

### "Worker retorna 1101 - Script not found"
O deploy não foi realizado. Execute `npx wrangler deploy` novamente.

### "Erro 526 - Invalid SSL Certificate"
No Cloudflare, mude SSL/TLS para **"Flexible"** temporariamente enquanto o certificado do GitHub Pages é emitido.

### "PLACEHOLDER ainda presente no wrangler.toml"
O Worker tem validação automática. Substitua todos os `PLACEHOLDER_*` pelos IDs reais antes do deploy.

### "Admin não consegue fazer login"
Refaça o Passo 4.7 para regenerar o hash de senha. Confirme que `ADMIN_PASSWORD_RECORD` foi configurado com `npx wrangler secret put`.

---

## Referências

- [Documentação do Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentação do Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [GitHub Pages com domínio personalizado](https://docs.github.com/pt/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Registro.br — Alterar nameservers](https://registro.br/ajuda/category/dns/)
- README detalhado do Worker: [`cloudflare-worker/README.md`](../cloudflare-worker/README.md)
