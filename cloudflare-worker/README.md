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
# Segredo admin — use uma senha longa e aleatória (mín. 32 chars)
npx wrangler secret put ADMIN_SECRET

# Token GitHub com escopo "repo" — para marcar códigos de fidelidade como usados
# Gere em: https://github.com/settings/tokens/new?scopes=repo&description=Itapolitana+Worker
npx wrangler secret put GITHUB_TOKEN
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
node migrate-data.js \
  --api https://api.itapolitanacajuru.com.br \
  --secret SEU_ADMIN_SECRET \
  --clientes caminho/para/backup/clientes.json \
  --encomendas caminho/para/backup/encomendas.json \
  --vinculos caminho/para/backup/vinculos_clientes.json
```

> Ajuste os caminhos `--clientes`, `--encomendas` e `--vinculos` para onde estão seus backups.

---

## 8. Atualizar o painel admin

No **Painel Administrativo**, insira o segredo Worker no campo **"Segredo Worker"** da tela de login.  
Este é o mesmo valor definido em `ADMIN_SECRET` (passo 4).

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
| POST   | `/api/admin/session`          | -       | Trocar ADMIN_SECRET por token de sessão |
| GET    | `/api/clientes`               | Admin   | Listar clientes                     |
| POST   | `/api/clientes`               | Público | Cadastrar novo cliente              |
| POST   | `/api/clientes/login`         | Público | Login do cliente (retorna dados)    |
| GET    | `/api/clientes/:id`           | Admin   | Ver cliente                         |
| PATCH  | `/api/clientes/:id`           | Admin   | Atualizar cliente                   |
| DELETE | `/api/clientes/:id`           | Admin   | Remover cliente                     |
| PUT    | `/api/clientes/bulk`          | Admin   | Substituir coleção completa         |
| POST   | `/api/encomendas`             | Público | Enviar pedido de encomenda          |
| GET    | `/api/encomendas`             | Admin   | Listar todos os pedidos             |
| PATCH  | `/api/encomendas/:id`         | Admin   | Atualizar status/observação         |
| DELETE | `/api/encomendas/:id`         | Admin   | Remover pedido                      |
| PUT    | `/api/encomendas/bulk`        | Admin   | Substituir coleção completa         |
| POST   | `/api/fidelidade/resgatar`    | Público | Resgatar código de fidelidade       |

### Autenticação admin — fluxo de sessão (recomendado)

O `ADMIN_SECRET` **nunca deve ser armazenado no browser** — apenas usado na tela de login:

1. O admin insere o `ADMIN_SECRET` no campo "Segredo Worker" do `admin-painel.html`
2. O frontend chama `POST /api/admin/session` com `{ "secret": "<ADMIN_SECRET>" }`
3. O Worker verifica o segredo e retorna um **token de sessão temporário** (expira em 2h)
4. O frontend armazena apenas o token de sessão em `sessionStorage`
5. Todas as rotas admin usam o header `X-Itap-Session-Token: <token>`

**Autenticação direta (scripts/CLI):** header `X-Itap-Admin-Secret: <ADMIN_SECRET>` ainda é aceito para uso em scripts de migração e ferramentas CLI.

---

## Desenvolvimento local

```bash
npx wrangler dev
# Worker disponível em http://localhost:8787
```

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
