# Itapolitana API — Cloudflare Worker

Backend seguro para armazenamento de dados PII da Sorveteria Itapolitana Cajuru.  
Substitui a gravação direta no GitHub para `clientes.json` e `encomendas.json`.

---

## Pré-requisitos

- Conta no [Cloudflare](https://dash.cloudflare.com) (plano gratuito é suficiente)
- [Node.js 18+](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — instalado via `npm install` neste diretório

---

## 1. Instalar dependências

```bash
cd cloudflare-worker
npm install
```

---

## 2. Autenticar o Wrangler

```bash
npx wrangler login
```

---

## 3. Criar os namespaces KV

```bash
npx wrangler kv namespace create "CLIENTES_KV"
npx wrangler kv namespace create "ENCOMENDAS_KV"
npx wrangler kv namespace create "RATE_KV"
```

Cada comando retornará um `id`. Abra `wrangler.toml` e substitua os `PLACEHOLDER_*_ID` pelos IDs gerados.

---

## 4. Configurar segredos

**Nunca coloque segredos no `wrangler.toml` nem no código.**

```bash
# Setup temporário para gerar hash (somente staging/local)
npx wrangler secret put SETUP_KEY

# Token GitHub com escopo "repo" — para o admin inteiro gravar os JSONs do site
# Gere em: https://github.com/settings/tokens/new?scopes=repo&description=Itapolitana+Worker
npx wrangler secret put GITHUB_TOKEN
```

Depois, gere o hash PBKDF2 no Worker (runtime real) e configure:

```bash
curl -X POST "$WORKER_URL/api/admin/generate-hash" \
  -H "content-type: application/json" \
  -d '{"setup_key":"SEU_SETUP_KEY","password":"SENHA_ADMIN_MUITO_FORTE"}'

# Preferido (formato versionado):
npx wrangler secret put ADMIN_PASSWORD_RECORD

# Compatibilidade legado:
npx wrangler secret put ADMIN_HASH
npx wrangler secret put ADMIN_SALT
```

---

## 5. Configurar a rota do domínio

No `wrangler.toml`, descomente e ajuste a seção `[[routes]]`:

```toml
[[routes]]
pattern   = "api.itapolitanacajuru.com.br/*"
zone_name = "itapolitanacajuru.com.br"
```

No painel do Cloudflare, certifique-se de que o domínio `itapolitanacajuru.com.br` está configurado como zona Cloudflare.

---

## 6. Deploy

```bash
npx wrangler deploy
```

Teste o health check:

```bash
curl https://api.itapolitanacajuru.com.br/api/health
# → {"ok":true,"ts":..., "version":"1.0.0"}
```

---

## 7. Migrar dados existentes

Antes de migrar, **certifique-se de ter backups locais** dos arquivos originais:
- `dados/clientes.json`
- `dados/encomendas.json`
- `dados/vinculos_clientes.json`

Execute o script de migração:

```bash
cd cloudflare-worker/scripts
node migrate-data.cjs \
  --api https://api.itapolitanacajuru.com.br \
  --secret SEU_ADMIN_SECRET \
  --clientes caminho/para/backup/clientes.json \
  --encomendas caminho/para/backup/encomendas.json \
  --vinculos caminho/para/backup/vinculos_clientes.json
```

> Ajuste os caminhos `--clientes`, `--encomendas` e `--vinculos` para onde estão seus backups.

---

## 8. Atualizar o painel admin

No **Painel Administrativo**, o login deve usar o endpoint:

- `POST /api/admin/auth` com `{ "password": "<ADMIN_SECRET>" }`
- retorno: token de sessão temporário (`expiresIn`)
- uso subsequente: header `X-Itap-Session-Token`

Nunca enviar hash de senha ao navegador e nunca persistir `ADMIN_SECRET` no storage.

---

## Endpoints da API

| Método | Rota                          | Acesso  | Descrição                          |
|--------|-------------------------------|---------|-------------------------------------|
| GET    | `/api/health`                 | Público | Health check                        |
| POST   | `/api/clientes`               | Público | Cadastrar cliente no clube          |
| POST   | `/api/clientes/login`         | Público | Login por nome + data nasc + cel    |
| GET    | `/api/clientes`               | Admin   | Listar todos os clientes            |
| GET    | `/api/clientes/:id`           | Admin   | Buscar cliente por ID               |
| PATCH  | `/api/clientes/:id`           | Admin   | Atualizar dados do cliente          |
| DELETE | `/api/clientes/:id`           | Admin   | Remover cliente                     |
| POST   | `/api/admin/auth`             | -       | Trocar senha admin por token de sessão (staging/local) |
| POST   | `/api/admin/session`          | -       | Alias de sessão (compatibilidade) |
| DELETE | `/api/admin/session`          | Admin   | Encerrar sessão atual |
| GET    | `/api/clientes`               | Admin   | Listar todos os clientes            |
| POST   | `/api/clientes`               | Público | Cadastrar novo cliente              |
| POST   | `/api/clientes/login`         | Público | Login do cliente (retorna dados)    |
| GET    | `/api/clientes/:id`           | Admin   | Buscar cliente por ID               |
| PATCH  | `/api/clientes/:id`           | Admin   | Atualizar dados do cliente          |
| DELETE | `/api/clientes/:id`           | Admin   | Remover cliente                     |
| PUT    | `/api/clientes/bulk`          | Admin   | Substituir coleção completa         |
| GET    | `/api/admin/github-file?path=...` | Admin | Ler JSONs do site via Worker        |
| PUT    | `/api/admin/github-file`      | Admin   | Salvar JSONs do site via Worker     |
| POST   | `/api/encomendas`             | Público | Enviar pedido de encomenda          |
| GET    | `/api/encomendas`             | Admin   | Listar todos os pedidos             |
| PATCH  | `/api/encomendas/:id`         | Admin   | Atualizar status/observação         |
| DELETE | `/api/encomendas/:id`         | Admin   | Remover pedido                      |
| PUT    | `/api/encomendas/bulk`        | Admin   | Substituir coleção completa         |
| POST   | `/api/fidelidade/resgatar`    | Público | Resgatar código de fidelidade       |

### Promoção do picolé com randomização automática

- O Worker mantém a campanha de picolé ativa automaticamente.
- Quando não existir campanha válida, ele cria uma nova campanha de 30 dias iniciando no dia atual.
- Cada dia recebe um horário aleatório interno entre **11:00 e 20:00**.
- Os horários ficam apenas no servidor (KV) e não são expostos ao cliente.

### Autenticação admin — fluxo de sessão (recomendado)

O `ADMIN_SECRET` **nunca deve ser armazenado no browser** — apenas usado na tela de login:

1. O admin insere o `ADMIN_SECRET` no campo "Segredo Worker" do `admin-painel.html`
2. O frontend chama `POST /api/admin/session` com `{ "password": "<SENHA_ADMIN>" }`
3. O Worker verifica o segredo e retorna um **token de sessão temporário** (expira em 2h)
4. O frontend armazena apenas o token de sessão em `sessionStorage`
5. Todas as rotas admin usam o header `X-Itap-Session-Token: <token>`, inclusive leituras e gravações dos JSONs do site

**Autenticação direta (scripts/CLI):** header `X-Itap-Admin-Secret: <ADMIN_SECRET>` ainda é aceito apenas para ferramentas técnicas legadas.

---

## Desenvolvimento local

```bash
npx wrangler dev
# Worker disponível em http://localhost:8787
```

### Configuração por ambiente (local / staging / produção)

Não use IDs fictícios no repositório. Crie os namespaces em cada ambiente e aplique os IDs reais apenas no ambiente correspondente.

```bash
# STAGING
npx wrangler kv namespace create CLIENTES_KV --env staging
npx wrangler kv namespace create ENCOMENDAS_KV --env staging
npx wrangler kv namespace create RATE_KV --env staging

# PRODUÇÃO
npx wrangler kv namespace create CLIENTES_KV --env production
npx wrangler kv namespace create ENCOMENDAS_KV --env production
npx wrangler kv namespace create RATE_KV --env production
```

Secrets por ambiente:

```bash
# STAGING
npx wrangler secret put SETUP_KEY --env staging
npx wrangler secret put GITHUB_TOKEN --env staging

# PRODUÇÃO (somente após aprovação)
npx wrangler secret put ADMIN_PASSWORD_RECORD --env production
npx wrangler secret put GITHUB_TOKEN --env production
```

## Validação PBKDF2 antes de deploy

Não assuma suporte de iterações sem teste real no runtime alvo.

### 1) Auto-teste no Worker (local/staging)

```bash
curl -X POST "$WORKER_URL/api/admin/pbkdf2-selftest" \
  -H "content-type: application/json" \
  -d '{"setup_key":"SEU_SETUP_KEY","iterations":600000,"samples":3}'
```

Resposta esperada:
- `ok: true`
- `algorithm: "PBKDF2-HMAC-SHA-256"`
- `iterations: 600000`
- tempos (`timingsMs`, `avgMs`) aceitáveis para login administrativo

Se falhar (`ok: false` / HTTP 500), o runtime não suportou a configuração informada.

### 2) Paridade entre ambientes

Repita o mesmo teste em **local, staging e produção** antes do deploy final para confirmar:
- mesmo comportamento de suporte de iterações;
- mesma faixa de tempo de autenticação;
- ausência de falha silenciosa.

### 3) Se houver limite (ex.: 100.000 iterações)

Não reduza automaticamente sem análise. Documente a limitação e avalie:
- Argon2id ou bcrypt em runtime compatível;
- serviço externo especializado de autenticação;
- reforço de controles (rate limiting, MFA, Cloudflare Access).

### 4) Formato versionado do hash

Formato canônico:

`pbkdf2-sha256$v=1$iter=<iteracoes>$salt=<base64>$hash=<base64>`

Recomendação:
- armazenar em `ADMIN_PASSWORD_RECORD` (secret único);
- manter `ADMIN_HASH` + `ADMIN_SALT` apenas como compatibilidade temporária.

#### Necessidade real de KV

- `RATE_KV`: obrigatório para rate limit e sessão admin com expiração.
- `CLIENTES_KV`: obrigatório para dados de clientes (PII) fora do frontend público.
- `ENCOMENDAS_KV`: obrigatório para pedidos/encomendas fora do frontend público.

Se autenticação for usada isoladamente em ambiente técnico, `RATE_KV` é o mínimo necessário.

---

## Estrutura de KV

### CLIENTES_KV
| Chave                    | Valor                                |
|--------------------------|--------------------------------------|
| `cliente:USR-2026-NNNN`  | JSON completo do cliente             |
| `idx:cel:11999998888`    | `USR-2026-NNNN` (índice por celular) |
| `meta:lista_ids`         | `["USR-2026-0001", ...]`             |
| `meta:contador`          | `"42"` (último número gerado)        |

### ENCOMENDAS_KV
| Chave              | Valor                            |
|--------------------|----------------------------------|
| `enc:ITA-140526-*` | JSON completo do pedido          |
| `idx:lista`        | Array com resumo dos pedidos     |

### RATE_KV
| Chave                 | Valor                                   |
|-----------------------|-----------------------------------------|
| `rl:<ip>:<endpoint>`  | `{"count": N, "window": ms}`            |
| `audit:<ts>:<rand>`   | Log de auditoria (TTL 90 dias)          |
