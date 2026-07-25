# Runbook Operacional de Staging — Itapolitana Cajuru

**Versão:** 1.0  
**Status:** Preparação local — deploy de staging aguarda aprovação e acesso à conta Cloudflare  
**Produção:** BLOQUEADA — este runbook não autoriza deploy em produção  

---

## AVISO DE SEGURANÇA

> ⛔ **Nenhuma etapa deste runbook deve ser executada em produção.**  
> ⛔ **Nenhum secret de produção deve ser utilizado em staging.**  
> ⛔ **Nenhum dado real de cliente deve ser carregado em staging.**  
> ✅ Qualquer deploy — mesmo de staging — requer aprovação humana explícita do proprietário.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Criação dos Namespaces KV](#2-criação-dos-namespaces-kv)
3. [Configuração de Secrets](#3-configuração-de-secrets)
4. [Deploy de Staging](#4-deploy-de-staging)
5. [Testes HTTP](#5-testes-http)
6. [Self-test PBKDF2](#6-self-test-pbkdf2)
7. [Testes Playwright](#7-testes-playwright)
8. [Teste Comercial](#8-teste-comercial)
9. [migrate-data.cjs em Staging](#9-migrate-datacjs-em-staging)
10. [Checklist de Aborto](#10-checklist-de-aborto)
11. [Plano de Rollback](#11-plano-de-rollback)
12. [Relatório Final](#12-relatório-final)

---

## 1. Pré-requisitos

### 1.1 Acesso

- [ ] Acesso autorizado à conta Cloudflare do proprietário
- [ ] `CLOUDFLARE_API_TOKEN` configurado **localmente** (nunca compartilhar no terminal)
- [ ] Wrangler instalado: `npx wrangler --version` (esperado: 3.x ou superior)
- [ ] Node.js compatível: `node --version` (esperado: 18 ou superior)
- [ ] Branch correta verificada: `git branch --show-current`

### 1.2 Ambiente

- [ ] Conta ou projeto Cloudflare **separado** de produção (quando possível)
- [ ] Domínio ou subdomínio de staging definido (ex.: `staging.itapolitanacajuru.com.br` ou Workers preview URL)
- [ ] Credenciais administrativas **exclusivas** de staging (nunca reutilizar produção)
- [ ] Dados **sintéticos** preparados (nenhum dado real de cliente)
- [ ] Backup auditável criado antes de qualquer deploy

### 1.3 Verificações antes de começar

```bash
# Confirmar branch de trabalho
git branch --show-current
git status --short
git log --oneline -n 5

# Confirmar que nenhum secret está no repositório
git grep -i "password\|secret\|token\|api_key" -- '*.json' '*.js' '*.html' | grep -v test | grep -v node_modules

# Confirmar que wrangler.toml usa PLACEHOLDER (não IDs reais de produção)
grep "PLACEHOLDER" cloudflare-worker/wrangler.toml
```

**PARAR** se `git grep` revelar secrets reais no código.

---

## 2. Criação dos Namespaces KV

> Executar somente após aprovação do proprietário e com credenciais de staging.

### 2.1 Namespaces necessários

| Binding | Uso |
|---------|-----|
| `CLIENTES_KV` | Dados de clientes (sintéticos em staging) |
| `ENCOMENDAS_KV` | Dados de encomendas (sintéticos em staging) |
| `RATE_KV` | Sessões e rate limiting |

### 2.2 Criar namespaces de staging

```bash
# Executar a partir de cloudflare-worker/
cd cloudflare-worker

# Criar namespace de clientes (staging)
npx wrangler kv namespace create CLIENTES_KV --env staging

# Criar namespace de encomendas (staging)
npx wrangler kv namespace create ENCOMENDAS_KV --env staging

# Criar namespace de rate limit / sessões (staging)
npx wrangler kv namespace create RATE_KV --env staging
```

Cada comando retorna um **ID único**. Anotar esses IDs.

### 2.3 Configurar IDs no wrangler.toml

Substituir os `PLACEHOLDER_*_KV_ID` na seção `[env.staging]` do `wrangler.toml` pelos IDs retornados.

> ⚠️ Substituir **somente** os valores dentro de `[env.staging]`.  
> ⚠️ Nunca alterar `[env.production]` nesta etapa.  
> ⚠️ Nunca commitar IDs reais se forem considerados sensíveis — usar variáveis de CI/CD.

### 2.4 Verificar

```bash
# Verificar que não restam PLACEHOLDERs na seção staging
grep -A 20 "\[env.staging\]" cloudflare-worker/wrangler.toml | grep PLACEHOLDER
# Resultado esperado: nenhuma linha
```

---

## 3. Configuração de Secrets

> Secrets são configurados via Wrangler e **nunca** devem aparecer no código, logs, terminal compartilhado ou repositório.

### 3.1 Secrets obrigatórios

| Secret | Descrição |
|--------|-----------|
| `ADMIN_PASSWORD_RECORD` | Hash PBKDF2 da senha administrativa de staging |
| `SETUP_KEY` | Chave de setup exclusiva de staging |
| `GITHUB_TOKEN` | Token GitHub com escopo mínimo (se ainda necessário) |

### 3.2 Gerar o ADMIN_PASSWORD_RECORD de staging

```bash
# 1. Iniciar Worker localmente (somente para gerar o hash)
cd cloudflare-worker
npx wrangler dev --env local

# 2. Em outro terminal, chamar o endpoint de geração (com SETUP_KEY local)
#    Substituir <SETUP_KEY_LOCAL> e <SENHA_STAGING> por valores escolhidos pelo proprietário
curl -s -X POST http://localhost:8787/api/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"setup_key":"<SETUP_KEY_LOCAL>","password":"<SENHA_STAGING>"}'

# 3. A resposta contém ADMIN_PASSWORD_RECORD no formato:
#    pbkdf2-sha256$v=1$iter=600000$salt=...$hash=...
#    Anotar esse valor — ele será o secret de staging
```

> ⚠️ Nunca registrar `ADMIN_PASSWORD_RECORD`, senha ou SETUP_KEY em logs ou terminais visíveis.

### 3.3 Configurar secrets no ambiente staging

```bash
cd cloudflare-worker

# Configurar cada secret individualmente (o Wrangler pede o valor interativamente)
npx wrangler secret put ADMIN_PASSWORD_RECORD --env staging
npx wrangler secret put SETUP_KEY --env staging
npx wrangler secret put GITHUB_TOKEN --env staging   # somente se necessário
```

### 3.4 Verificar secrets configurados

```bash
npx wrangler secret list --env staging
# Deve listar os nomes dos secrets sem mostrar os valores
```

### 3.5 Regras de secrets

- [ ] Nenhum secret de produção foi reutilizado
- [ ] Nenhum secret foi commitado no repositório
- [ ] Nenhum secret está em `.env` público, `wrangler.toml`, HTML ou JavaScript
- [ ] Secrets de staging serão rotacionados após os testes
- [ ] Secrets temporários serão removidos após a conclusão

---

## 4. Deploy de Staging

### 4.1 Pré-validações obrigatórias

```bash
# A partir de cloudflare-worker/
cd cloudflare-worker

# Executar suite de testes Node.js
npm test
# Esperado: todos os testes passando (0 falhas)

# Verificar sintaxe do Worker
node --check src/index.js

# Verificar que dados/auth.json não existe
ls ../dados/auth.json 2>/dev/null && echo "ERRO: auth.json existe" || echo "OK: auth.json ausente"

# Scanner de secrets nos arquivos modificados
git diff --name-only HEAD | xargs -I{} sh -c 'echo "=== {} ===" && grep -iE "(password|secret|token|api_key|hash)" "{}" 2>/dev/null | grep -v "#\|//\|test\|fake\|placeholder\|exemplo" || echo "limpo"'

# Confirmar diff
git diff --stat
```

**PARAR** se `npm test` reportar falhas.  
**PARAR** se o scanner revelar secrets reais.  
**PARAR** se `auth.json` existir no diretório `dados/`.

### 4.2 Verificar wrangler.toml antes do deploy

```bash
# Confirmar que ENVIRONMENT está correto para staging
grep -A 5 "\[env.staging.vars\]" cloudflare-worker/wrangler.toml
# Esperado: ENVIRONMENT = "staging"

# Confirmar que não há IDs de produção na seção staging
# (Os IDs de staging devem ser diferentes dos de produção)
```

### 4.3 Executar deploy de staging

```bash
cd cloudflare-worker

# Deploy SOMENTE no ambiente staging
npx wrangler deploy --env staging

# NÃO executar: npx wrangler deploy (sem --env staging) — isso faria deploy em produção
```

> ⛔ **PARAR imediatamente** se o comando indicar `production` ou omitir `staging`.

### 4.4 Registrar após o deploy

Preencher e guardar:

```
Data/hora:          ____________________
Branch:             ____________________
Commit (git rev-parse HEAD): ____________________
URL de staging:     ____________________
Versão do Worker:   ____________________
ID da implantação:  ____________________
Executado por:      ____________________
```

### 4.5 Verificar deploy

```bash
# Substituir <STAGING_URL> pela URL retornada pelo deploy
curl -s https://<STAGING_URL>/api/health | python3 -m json.tool
# Esperado: {"ok":true,"environment":"staging",...}
```

**PARAR** se `environment` retornar `production`.

---

## 5. Testes HTTP

> Todos os testes abaixo devem ser executados contra a URL de staging.  
> Nunca registrar senhas, tokens, hashes ou dados pessoais.

### 5.1 Formato de registro

Para cada teste, registrar somente:

| Campo | Exemplo |
|-------|---------|
| Endpoint | `GET /api/health` |
| Método | `GET` |
| Condição | `sem autenticação` |
| HTTP esperado | `200` |
| HTTP obtido | `___` |
| Resultado | `Aprovado / Falho / Bloqueado` |

### 5.2 Health check

```bash
BASE="https://<STAGING_URL>"

# GET /api/health — deve retornar 200
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health"
# Esperado: 200

# Verificar que environment é "staging"
curl -s "$BASE/api/health" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['environment']=='staging', f'ERRO: environment={d[\"environment\"]}'; print('OK: environment=staging')"
```

### 5.3 Arquivos privados

```bash
# Cada arquivo deve retornar 401, 403 ou 404 — NUNCA 200
PRIVATE_FILES=(
  "/dados/auth.json"
  "/dados/clientes.json"
  "/dados/pedidos.json"
  "/dados/encomendas.json"
  "/dados/submissoes_encomendas.json"
  "/dados/fidelidade.json"
  "/dados/carrinhos_abandonados.json"
)

for f in "${PRIVATE_FILES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$f")
  if [ "$code" = "200" ]; then
    echo "❌ BLOQUEADOR: $f retornou 200"
  else
    echo "✅ $f → $code"
  fi
done
```

> ⚠️ **Qualquer resposta 200 bloqueia aprovação**, mesmo que o arquivo esteja vazio.

### 5.4 Autenticação

```bash
# Login com senha incorreta — deve retornar 401
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/session" \
  -H "Content-Type: application/json" \
  -d '{"password":"senha-incorreta-teste"}'
# Esperado: 401

# Login com senha vazia — deve retornar 400 ou 401
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/session" \
  -H "Content-Type: application/json" \
  -d '{"password":""}'
# Esperado: 400 ou 401

# Corpo JSON inválido — deve retornar 400
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/session" \
  -H "Content-Type: application/json" \
  -d 'nao-e-json'
# Esperado: 400

# Login com senha correta (substituir <SENHA_STAGING> por variável de ambiente)
# NUNCA colocar a senha diretamente no terminal compartilhado
TOKEN=$(curl -s -X POST "$BASE/api/admin/session" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$STAGING_ADMIN_PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
# TOKEN deve ser não-vazio
echo "Token obtido: ${#TOKEN} caracteres"  # Exibir tamanho, nunca o valor
```

### 5.5 Endpoints administrativos protegidos

```bash
# Sem autenticação — deve retornar 401
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/github-file?path=README.md"
# Esperado: 401

# Token inválido — deve retornar 401
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/github-file?path=README.md" \
  -H "Authorization: ******"
# Esperado: 401

# Método inválido — deve retornar 404 ou 405
curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/admin/session"
# Esperado: 404

# Rota inexistente — deve retornar 404
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/rota-inexistente-xyz"
# Esperado: 404
```

### 5.6 Logout e revogação de sessão

```bash
# Logout (DELETE /api/admin/session)
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/admin/session" \
  -H "Authorization: ******"
# Esperado: 200

# Reutilizar token após logout — deve retornar 401
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/github-file?path=README.md" \
  -H "Authorization: ******"
# Esperado: 401
```

### 5.7 Rate limiting

```bash
# Enviar múltiplas requisições de login com senha incorreta
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/session" \
    -H "Content-Type: application/json" \
    -d '{"password":"tentativa-errada"}')
  echo "Tentativa $i: $code"
done
# Esperado: 401 ou 429 após algumas tentativas
```

---

## 6. Self-test PBKDF2

> Este teste valida o algoritmo **no runtime real do Cloudflare Worker**.  
> O resultado do Node.js local **não** substitui este teste.

### 6.1 Executar self-test

```bash
# Substituir <SETUP_KEY_STAGING> por variável de ambiente
curl -s -X POST "$BASE/api/admin/pbkdf2-selftest" \
  -H "Content-Type: application/json" \
  -d "{\"setup_key\":\"$SETUP_KEY_STAGING\",\"iterations\":600000,\"samples\":3}" \
  | python3 -m json.tool
```

### 6.2 Registrar resultado

| Campo | Valor obtido |
|-------|-------------|
| Ambiente | `staging` |
| Algoritmo | _(copiar da resposta — esperado: `PBKDF2-HMAC-SHA-256`)_ |
| Iterações | _(esperado: 600000)_ |
| Amostras | `3` |
| Tempo mínimo (ms) | ___ |
| Tempo médio (ms) | ___ |
| Tempo máximo (ms) | ___ |
| Timeout ocorreu? | `Sim / Não` |
| Erro intermitente? | `Sim / Não` |
| Resultado | `Aprovado / Falho / Bloqueado` |

### 6.3 Critérios de aprovação

- [ ] Algoritmo: `PBKDF2-HMAC-SHA-256`
- [ ] Iterações: 600.000
- [ ] Salt aleatório (diferente entre chamadas)
- [ ] Tempo máximo aceitável (sem timeout do Worker)
- [ ] Sem erros intermitentes em 3 amostras
- [ ] Resultado consistente com o Node.js local

### 6.4 Se o PBKDF2 falhar no Worker

- Interromper validação
- **Não reduzir iterações sem análise e aprovação**
- Documentar o erro (sem dados sensíveis)
- Avaliar alternativa criptográfica compatível
- Aguardar aprovação explícita antes de modificar o algoritmo

---

## 7. Testes Playwright

### 7.1 Configurar variáveis

```bash
# Configurar somente em ambiente local de execução dos testes
# Nunca colocar valores no repositório ou em arquivos rastreados pelo git
export BASE_URL="https://<STAGING_URL>"
export TEST_PASSWORD="$STAGING_ADMIN_PASSWORD"  # a partir de variável de ambiente

# A partir da pasta tests/
cd tests
npm ci
```

### 7.2 Executar suites

```bash
# Suite completa
npx playwright test

# Somente testes públicos
npx playwright test --grep "público|public|cardápio|encomenda|carrinho"

# Somente testes administrativos
npx playwright test --grep "admin|login|logout|sessão"
```

### 7.3 Classificar cada teste

Para cada teste, classificar como:

| Status | Descrição |
|--------|-----------|
| ✅ Aprovado | Passou sem erros |
| ❌ Falhou | Comportamento inesperado |
| 🔒 Bloqueado | Dependência não disponível |
| ⏭ Não executado | Fora do escopo desta fase |
| 🔧 Falha de infra | Problema de ambiente, não do código |

> ⚠️ **Testes bloqueados não contam como aprovados.**

### 7.4 Testes obrigatórios

- [ ] Páginas públicas carregam
- [ ] Navegação funciona
- [ ] Cardápio exibe produtos e preços corretos
- [ ] Encomendas funcionam
- [ ] Carrinho funciona
- [ ] Login administrativo
- [ ] Logout
- [ ] Sessão expira corretamente
- [ ] Token revogado é rejeitado
- [ ] Rate limiting ativo
- [ ] Endpoint protegido sem auth retorna erro
- [ ] Upload de imagem (se aplicável)
- [ ] PAT ausente no navegador e no localStorage

---

## 8. Teste Comercial

> Usar exclusivamente dados sintéticos. Não finalizar pedidos reais.

### 8.1 Preços a confirmar

| Produto | Contexto | Preço esperado |
|---------|----------|---------------|
| Picolé Especial de Leite Ninho | Cardápio (varejo) | R$ 4,00 |
| Picolé Especial de Leite Ninho | Encomendas (atacado) | R$ 3,00 |
| Picolé Especial de Ovomaltine | Cardápio (varejo) | R$ 4,00 |
| Picolé Especial de Ovomaltine | Encomendas (atacado) | R$ 3,00 |

### 8.2 Verificações

- [ ] Preço unitário correto no cardápio
- [ ] Preço unitário correto em encomendas
- [ ] Subtotal calculado corretamente
- [ ] Total calculado corretamente
- [ ] Carrinho exibe valores corretos
- [ ] Mensagem de WhatsApp contém valores corretos
- [ ] Separação entre varejo e atacado está correta
- [ ] Outros produtos não foram alterados

### 8.3 Arquivos que NÃO devem ser alterados

```
dados/produtos.json
dados/config.json
dados/promo.json
dados/promocoes.json
```

Verificar:

```bash
git diff -- dados/produtos.json dados/config.json dados/promo.json dados/promocoes.json
# Esperado: nenhuma linha alterada
```

---

## 9. migrate-data.cjs em Staging

### 9.1 Sequência segura obrigatória

Executar **na ordem exata**:

```bash
cd cloudflare-worker

# Passo 1: Validar branch
git branch --show-current
# Deve ser branch de staging/teste, não main/produção

# Passo 2: Validar ambiente (verificar que NODE_ENV não está como production)
echo "NODE_ENV=${NODE_ENV:-não definido}"
echo "ENVIRONMENT=${ENVIRONMENT:-não definido}"

# Passo 3: Criar backup (fora do diretório público)
BACKUP_DIR="/tmp/migrate-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
# Copiar apenas schemas e estruturas — nunca dados reais
cp scripts/migrate-data.cjs "$BACKUP_DIR/"
echo "Backup criado em: $BACKUP_DIR"

# Passo 4: Dry-run com dados sintéticos
node scripts/migrate-data.cjs \
  --environment=staging \
  --dry-run \
  --api "https://<STAGING_URL>" \
  --secret "$STAGING_ADMIN_SECRET" \
  --clientes caminho/para/dados-sinteticos/clientes.json \
  --encomendas caminho/para/dados-sinteticos/encomendas.json

# Passo 5: Revisar as contagens impressas pelo dry-run
# O dry-run mostra: clientes a migrar, encomendas a migrar, ambiente, data/hora
# Verificar que os números estão corretos

# Passo 6: Confirmar ausência de PII indevida
# O dry-run imprime campos PII detectados (apenas nomes de campos, nunca valores)
# Confirmar que os dados são sintéticos

# Passo 7: Execução real (somente após aprovação explícita)
# Usar --confirm-staging para pular prompt interativo em staging
node scripts/migrate-data.cjs \
  --environment=staging \
  --confirm-staging \
  --api "https://<STAGING_URL>" \
  --secret "$STAGING_ADMIN_SECRET" \
  --clientes caminho/para/dados-sinteticos/clientes.json \
  --encomendas caminho/para/dados-sinteticos/encomendas.json

# Passo 8: Validar resultado no painel admin de staging

# Passo 9: Executar testes para confirmar que nada quebrou
npm test
```

### 9.2 Flags de segurança do script

| Flag | Comportamento |
|------|--------------|
| `--environment=staging` | Permite execução em staging |
| `--environment=local` | Permite execução local |
| `--environment=production` | **Bloqueia imediatamente** |
| `--dry-run` | Simula sem gravar nada |
| `--confirm-staging` | Pula prompt interativo (somente em staging) |

### 9.3 Checklist de aprovação do migrate-data.cjs

- [ ] Script possui `--dry-run` ✅
- [ ] Script bloqueia `--environment=production` ✅
- [ ] Script bloqueia `NODE_ENV=production` ✅
- [ ] Script bloqueia URL de produção conhecida ✅
- [ ] Script valida schema dos dados ✅
- [ ] Script detecta PII (nome do campo + contagem, nunca valor) ✅
- [ ] Script detecta duplicatas ✅
- [ ] Script não imprime secrets ou hashes ✅
- [ ] Script foi testado somente com dados sintéticos
- [ ] Dry-run executado antes de qualquer escrita real

---

## 10. Checklist de Aborto

**Interromper imediatamente se ocorrer:**

- [ ] ❌ Arquivo privado retornando HTTP 200
- [ ] ❌ Secret visível no frontend, logs ou terminal
- [ ] ❌ PAT visível no navegador (localStorage, sessionStorage, URL)
- [ ] ❌ Endpoint administrativo sem proteção (responde 200 sem auth)
- [ ] ❌ PBKDF2 incompatível no runtime do Worker (timeout, erro, iterações erradas)
- [ ] ❌ Teste de login falhando em staging
- [ ] ❌ `environment` retornando `production` em staging
- [ ] ❌ KV de produção detectado ou vinculado ao staging
- [ ] ❌ Backup não restaurável
- [ ] ❌ Rollback indisponível
- [ ] ❌ Preço divergente do esperado
- [ ] ❌ Registro duplicado detectado
- [ ] ❌ Erro parcial de migração sem rollback documentado
- [ ] ❌ Dados reais de cliente detectados em staging
- [ ] ❌ `npm test` com falhas
- [ ] ❌ Ambiguidade entre staging e produção em qualquer etapa

---

## 11. Plano de Rollback

### 11.1 Rollback do Worker (staging)

```bash
# Identificar commits disponíveis
git log --oneline -n 10

# Identificar o commit exato a reverter (nunca usar HEAD~N sem verificar)
git show <COMMIT_HASH> --stat

# Criar branch de teste para verificar o rollback
git checkout -b rollback-teste-<data>

# Reverter commit específico
git revert <COMMIT_HASH> --no-edit

# Executar testes após reversão
cd cloudflare-worker && npm test

# Se os testes passarem, fazer deploy do rollback em staging
# npx wrangler deploy --env staging

# Confirmar resultado
curl -s https://<STAGING_URL>/api/health
```

> ⚠️ **Nunca usar `git revert HEAD --no-edit` sem confirmar qual commit será revertido.**  
> ⚠️ Sempre identificar o hash exato e listar os arquivos afetados antes de reverter.

### 11.2 Rollback de KV (staging)

Não existe rollback automático de KV. Para reverter dados:

1. Verificar backup criado antes da migração
2. Re-executar `migrate-data.cjs --dry-run` com os dados do backup
3. Confirmar contagens
4. Executar com `--confirm-staging` somente após verificação

### 11.3 Checklist de rollback

- [ ] Commit exato identificado (`git log --oneline`)
- [ ] Arquivos afetados listados (`git show <HASH> --stat`)
- [ ] Commits posteriores verificados (não existe trabalho dependente)
- [ ] Backup do estado atual criado
- [ ] Rollback simulado em branch separada
- [ ] Testes executados após a reversão
- [ ] Nenhuma lógica comercial afetada confirmada

---

## 12. Relatório Final

Após concluir todas as fases, preencher e entregar ao proprietário:

```
RELATÓRIO DE VALIDAÇÃO DE STAGING
===================================

1. URL de staging:           ____________________
2. Branch:                   ____________________
3. Commit implantado:        ____________________
4. ID da implantação:        ____________________
5. KV utilizado (binding):   ____________________
6. Data/hora:                ____________________

TESTES DE ARQUIVOS PRIVADOS
-----------------------------
(Listar cada arquivo e o código HTTP obtido — apenas códigos, sem conteúdo)

SELF-TEST PBKDF2
-----------------
Ambiente:    staging
Algoritmo:   ____________________
Iterações:   ____________________
Amostras:    ____________________
Tempo mín:   ____________________
Tempo méd:   ____________________
Tempo máx:   ____________________
Resultado:   Aprovado / Falho / Bloqueado

TESTES DE AUTENTICAÇÃO
-----------------------
Login correto:         Aprovado / Falho
Login incorreto:       Aprovado / Falho
Sessão expirada:       Aprovado / Falho
Logout:                Aprovado / Falho
Reutilização pós-logout: Aprovado / Falho
Rate limit:            Aprovado / Falho

TESTES DE ENDPOINTS
--------------------
(Listar endpoint, condição, HTTP esperado, HTTP obtido, resultado)

TESTES PLAYWRIGHT
------------------
(Listar cada teste com status: Aprovado / Falhou / Bloqueado / Não executado)

TESTES COMERCIAIS
------------------
Leite Ninho varejo R$4,00:    Aprovado / Falho
Leite Ninho atacado R$3,00:   Aprovado / Falho
Ovomaltine varejo R$4,00:     Aprovado / Falho
Ovomaltine atacado R$3,00:    Aprovado / Falho

STATUS GERAL
-------------
PAT no navegador:      Ausente / Presente (BLOQUEADOR)
Secrets no frontend:   Ausente / Presente (BLOQUEADOR)
Backup restaurável:    Sim / Não
Rollback testado:      Sim / Não

FALHAS ENCONTRADAS
-------------------
(Listar cada falha com severidade e impacto)

CORREÇÕES REALIZADAS
---------------------
(Listar correções com commit hash)

PENDÊNCIAS
-----------
(Listar pendências e responsável)

RISCOS RESTANTES
-----------------
(Listar riscos conhecidos)

RECOMENDAÇÃO
-------------
[ ] APROVAR promoção para produção
[ ] BLOQUEAR — pendências críticas listadas acima

Assinatura do responsável: ____________________
Data: ____________________
```

---

> **Após entregar o relatório, aguardar aprovação humana explícita antes de qualquer ação em produção.**  
> **Não promover para produção automaticamente.**
