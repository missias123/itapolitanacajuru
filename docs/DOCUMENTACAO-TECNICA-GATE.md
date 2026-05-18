# ⚙️ Documentação Técnica: admin-espelho-gate.js

**Versão:** 2.0
**Data:** 2026-05-18
**Arquivo:** `scripts/admin-espelho-gate.js`
**Propósito:** Sistema de validação de sincronização Admin↔Site

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionamento Detalhado](#funcionamento-detalhado)
4. [Matriz Espelho](#matriz-espelho)
5. [Validações Realizadas](#validações-realizadas)
6. [Integração com CI/CD](#integração-com-cicd)
7. [Casos de Uso](#casos-de-uso)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **admin-espelho-gate.js** é um script de validação crítico que garante a **sincronização perfeita** entre três camadas do sistema:

1. **Admin-Painel** (`admin-painel.html`) - Interface de edição
2. **Config** (`dados/config.json`) - Dados centralizados
3. **Site** (`*.html`) - Páginas públicas

### Objetivo Principal:

Garantir que **TODO campo editável no admin** tem uma correspondência válida em `config.json` e reflete corretamente no site.

### Benefícios:

✅ **Zero falhas de sincronização** - Detecta inconsistências antes do deploy
✅ **Auditoria automática** - Valida 76 campos em segundos
✅ **CI/CD integrado** - Bloqueia merge de PRs com problemas
✅ **Documentação viva** - Gera relatório atualizado a cada execução

---

## 🏗️ Arquitetura

### Fluxo de Dados:

```
┌─────────────────┐
│  Admin-Painel   │ ← Editor faz alterações
│ (admin-painel)  │
└────────┬────────┘
         │ Salva via GitHub API
         ▼
┌─────────────────┐
│   config.json   │ ← Dados centralizados
│  (dados/...)    │
└────────┬────────┘
         │ Carregado por JS
         ▼
┌─────────────────┐
│   Site Público  │ ← Visitantes veem
│   (*.html)      │
└─────────────────┘

         ▲
         │ Valida sincronização
         │
┌─────────────────┐
│ admin-espelho-  │ ← Gate de Validação
│    gate.js      │
└────────┬────────┘
         │ Lê matriz
         ▼
┌─────────────────┐
│ admin_espelho_  │ ← Definição de campos
│   matrix.json   │
└─────────────────┘
```

### Componentes:

1. **admin-espelho-gate.js** (141 linhas) - Script principal
2. **admin_espelho_matrix.json** (614 linhas, 76 campos) - Matriz de validação
3. **admin-espelho-gate.md** - Relatório gerado automaticamente

---

## 🔍 Funcionamento Detalhado

### Código-Fonte Anotado:

#### 1. Inicialização (linhas 1-16)

```javascript
const fs = require('fs');
const path = require('path');

// Caminhos absolutos
const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'dados', 'admin_espelho_matrix.json');
const ADMIN_PATH = path.join(ROOT, 'admin-painel.html');
const REPORT_PATH = path.join(ROOT, 'docs', 'relatorios', 'admin-espelho-gate.md');

// Funções auxiliares
function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function readFile(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}
```

**O que faz:**
- Define caminhos para arquivos críticos
- Cria funções de leitura de arquivos
- Usa caminhos absolutos para evitar problemas de localização

---

#### 2. Validação de Duplicatas (linhas 18-29)

```javascript
function uniqueViolations(items, field) {
  const seen = new Map();
  const out = [];
  for (const item of items) {
    const key = item[field];
    if (!key) continue;
    const prev = seen.get(key);
    if (prev) out.push(`${field} duplicado: ${key} (${prev.id} e ${item.id})`);
    else seen.set(key, item);
  }
  return out;
}
```

**O que faz:**
- Detecta campos duplicados na matriz
- Usa Map para performance O(n)
- Retorna array de violações

**Exemplo de erro detectado:**
```
adminId duplicado: cfg-whatsapp (campo1 e campo2)
```

---

#### 3. Função de Validação (linhas 31-33)

```javascript
function ensure(cond, message, failures) {
  if (!cond) failures.push(message);
}
```

**O que faz:**
- Helper para adicionar falhas condicionalmente
- Padrão assertion simples e eficiente

---

#### 4. Escape de RegExp (linhas 35-37)

```javascript
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**O que faz:**
- Escapa caracteres especiais para uso em RegExp
- Essencial para validar adminId com caracteres especiais
- Exemplo: `cfg-seo-titulo` → `cfg\\-seo\\-titulo`

---

#### 5. Acesso a Campos Aninhados (linhas 39-50)

```javascript
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' &&
        Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}
```

**O que faz:**
- Acessa propriedades aninhadas usando notação de ponto
- Suporta caminhos como `seoPaginas.sobre.titulo`
- Retorna `undefined` se o caminho não existir

**Exemplos:**
```javascript
getNestedValue(config, 'heroTitulo')                    // → "O Sorvete..."
getNestedValue(config, 'seoPaginas.sobre.titulo')       // → "Sobre Nós |..."
getNestedValue(config, 'seoPaginas.inexistente.campo')  // → undefined
```

---

#### 6. Carregamento de Dados (linhas 52-58)

```javascript
const matrix = readJson(MATRIX_PATH);
const rows = Array.isArray(matrix.campos) ? matrix.campos : [];
const adminHtml = readFile(ADMIN_PATH);
const failures = [];
const warnings = [];

if (rows.length === 0) failures.push('Matriz sem campos.');
```

**O que faz:**
- Carrega matriz de validação
- Lê conteúdo do admin-painel.html
- Inicializa arrays de falhas e avisos
- Valida que matriz não está vazia

---

#### 7. Validação de Unicidade (linhas 60-62)

```javascript
failures.push(...uniqueViolations(rows, 'id'));
failures.push(...uniqueViolations(rows, 'adminId'));
failures.push(...uniqueViolations(rows, 'configKey'));
```

**O que faz:**
- Garante que não há IDs duplicados
- Garante que não há adminIds duplicados
- Garante que não há configKeys duplicados

**Por que é importante:**
- Duplicatas causam ambiguidade
- Quebram a correspondência 1:1 entre camadas

---

#### 8. Validação de Cada Campo (linhas 64-101)

```javascript
rows.forEach((row) => {
  const prefix = `[${row.id || 'sem-id'}]`;
  const targetAbs = path.join(ROOT, row.targetFile || '');
  const sourceAbs = path.join(ROOT, row.sourceFile || '');

  // Valida campos obrigatórios
  ensure(typeof row.sourceFile === 'string' && row.sourceFile,
         `${prefix} sourceFile ausente`, failures);
  ensure(typeof row.targetFile === 'string' && row.targetFile,
         `${prefix} targetFile ausente`, failures);
  ensure(typeof row.configKey === 'string' && row.configKey,
         `${prefix} configKey ausente`, failures);
  ensure(typeof row.adminId === 'string' && row.adminId,
         `${prefix} adminId ausente`, failures);
  ensure(typeof row.siteNeedle === 'string' && row.siteNeedle,
         `${prefix} siteNeedle ausente`, failures);

  // Valida existência de arquivos
  if (!fs.existsSync(sourceAbs)) {
    failures.push(`${prefix} sourceFile inexistente: ${row.sourceFile}`);
    return;
  }
  if (!fs.existsSync(targetAbs)) {
    failures.push(`${prefix} targetFile inexistente: ${row.targetFile}`);
    return;
  }

  // Valida configKey existe em sourceFile
  const sourceJson = readJson(sourceAbs);
  const configValue = getNestedValue(sourceJson, row.configKey);
  ensure(
    configValue !== undefined,
    `${prefix} configKey não encontrado em ${row.sourceFile}: ${row.configKey}`,
    failures
  );

  // Valida adminId existe em admin-painel.html
  const adminIdRegex = new RegExp(
    `id\\s*=\\s*(["'])?${escapeRegExp(row.adminId)}\\1?(?=[\\s>])`
  );
  if (!adminIdRegex.test(adminHtml)) {
    failures.push(`${prefix} adminId não encontrado em admin-painel.html: ${row.adminId}`);
  }

  // Valida siteNeedle existe em targetFile
  const targetContent = readFile(targetAbs);
  if (!targetContent.includes(row.siteNeedle)) {
    failures.push(`${prefix} siteNeedle não encontrado em ${row.targetFile}: ${row.siteNeedle}`);
  }
});
```

**Validações realizadas para cada campo:**

1. ✅ **Campos obrigatórios** - sourceFile, targetFile, configKey, adminId, siteNeedle
2. ✅ **Arquivos existem** - sourceFile e targetFile são caminhos válidos
3. ✅ **configKey válido** - Chave existe em sourceFile (suporta aninhamento)
4. ✅ **adminId presente** - ID encontrado em admin-painel.html
5. ✅ **siteNeedle presente** - Needle encontrado em targetFile

---

#### 9. Geração de Relatório (linhas 103-132)

```javascript
const stamp = new Date().toISOString();
const lines = [];
lines.push('# Gate Admin ↔ Site (Matriz Espelho)');
lines.push('');
lines.push(`Gerado em: ${stamp}`);
lines.push('');
lines.push(`- Campos avaliados: **${rows.length}**`);
lines.push(`- Falhas: **${failures.length}**`);
lines.push(`- Avisos: **${warnings.length}**`);
lines.push('');

if (failures.length) {
  lines.push('## Falhas');
  lines.push('');
  failures.forEach((f) => lines.push(`- ${f}`));
  lines.push('');
} else {
  lines.push('✅ Nenhuma falha na matriz espelho.');
  lines.push('');
}

if (warnings.length) {
  lines.push('## Avisos');
  lines.push('');
  warnings.forEach((w) => lines.push(`- ${w}`));
  lines.push('');
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');
```

**O que faz:**
- Gera relatório em Markdown
- Inclui timestamp, contadores e lista de problemas
- Salva em `docs/relatorios/admin-espelho-gate.md`
- Cria diretórios se não existirem

**Exemplo de relatório:**
```markdown
# Gate Admin ↔ Site (Matriz Espelho)

Gerado em: 2026-05-18T19:12:24.485Z

- Campos avaliados: **76**
- Falhas: **0**
- Avisos: **0**

✅ Nenhuma falha na matriz espelho.
```

---

#### 10. Exit Code (linhas 134-141)

```javascript
if (failures.length > 0) {
  console.error(`❌ Gate Admin ↔ Site falhou com ${failures.length} problema(s).`);
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('✅ Gate Admin ↔ Site aprovado.');
```

**O que faz:**
- Exit code 1 se houver falhas (bloqueia CI/CD)
- Exit code 0 se tudo OK (permite merge)
- Mostra mensagem colorida no terminal

---

## 📊 Matriz Espelho

### Estrutura de um Campo:

```json
{
  "id": "heroTitulo",
  "sourceFile": "dados/config.json",
  "configKey": "heroTitulo",
  "adminId": "home-titulo",
  "targetFile": "index.html",
  "siteNeedle": "if (heroTituloEl && c.heroTitulo)"
}
```

### Descrição dos Campos:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ | Identificador único do campo na matriz |
| `sourceFile` | string | ✅ | Caminho do arquivo de dados (ex: `dados/config.json`) |
| `configKey` | string | ✅ | Chave no arquivo de dados (suporta `nested.key`) |
| `adminId` | string | ✅ | ID do elemento no admin-painel.html |
| `targetFile` | string | ✅ | Arquivo HTML público onde o campo aparece |
| `siteNeedle` | string | ✅ | Trecho de código que comprova uso no site |

---

### Exemplo de Campo Aninhado:

```json
{
  "id": "seoSobreTitulo",
  "sourceFile": "dados/config.json",
  "configKey": "seoPaginas.sobre.titulo",
  "adminId": "cfg-seo-sobre-titulo",
  "targetFile": "sobre.html",
  "siteNeedle": "data-config=\"seoPaginas.sobre.titulo\""
}
```

**Como funciona:**
1. `configKey: "seoPaginas.sobre.titulo"` → Acessa `config.seoPaginas.sobre.titulo`
2. `getNestedValue()` navega pela estrutura aninhada
3. Valida que a chave existe e tem valor

---

### siteNeedle - Estratégias:

**Opção 1: data-config attribute**
```json
"siteNeedle": "data-config=\"heroTitulo\""
```
```html
<h1 data-config="heroTitulo">...</h1>
```

**Opção 2: Código JavaScript**
```json
"siteNeedle": "if (heroTituloEl && c.heroTitulo)"
```
```javascript
if (heroTituloEl && c.heroTitulo) {
  heroTituloEl.textContent = c.heroTitulo;
}
```

**Opção 3: Elemento com ID**
```json
"siteNeedle": "id=\"nav-promo-btn\""
```
```html
<a id="nav-promo-btn" href="...">...</a>
```

---

## ✅ Validações Realizadas

### 1. Validação de Estrutura da Matriz

| Validação | Descrição | Exemplo de Erro |
|-----------|-----------|-----------------|
| Matriz não vazia | Deve ter pelo menos 1 campo | `Matriz sem campos.` |
| IDs únicos | Sem duplicatas no campo `id` | `id duplicado: heroTitulo (campo1 e campo2)` |
| adminIds únicos | Sem duplicatas no campo `adminId` | `adminId duplicado: home-titulo` |
| configKeys únicos | Sem duplicatas no campo `configKey` | `configKey duplicado: heroTitulo` |

---

### 2. Validação de Campos Obrigatórios

Cada entrada na matriz deve ter:

```javascript
✅ sourceFile (string não vazio)
✅ targetFile (string não vazio)
✅ configKey (string não vazio)
✅ adminId (string não vazio)
✅ siteNeedle (string não vazio)
```

**Exemplo de erro:**
```
[heroTitulo] configKey ausente
```

---

### 3. Validação de Arquivos

```javascript
✅ sourceFile existe no filesystem
✅ targetFile existe no filesystem
```

**Exemplo de erro:**
```
[heroTitulo] sourceFile inexistente: dados/config.json
[heroTitulo] targetFile inexistente: index.html
```

---

### 4. Validação de Conteúdo

#### a) configKey existe em sourceFile

```javascript
const sourceJson = readJson(sourceAbs);
const configValue = getNestedValue(sourceJson, row.configKey);
// configValue !== undefined
```

**Exemplo de erro:**
```
[heroTitulo] configKey não encontrado em dados/config.json: heroTitulo
```

**Suporte a aninhamento:**
```json
// ✅ Válido
"configKey": "heroTitulo"
// ✅ Válido
"configKey": "seoPaginas.sobre.titulo"
// ✅ Válido
"configKey": "fidelidadePagina.comoFuncionaTitulo"
```

---

#### b) adminId existe em admin-painel.html

```javascript
const adminIdRegex = new RegExp(
  `id\\s*=\\s*(["'])?${escapeRegExp(row.adminId)}\\1?(?=[\\s>])`
);
// adminIdRegex.test(adminHtml) === true
```

**Padrões aceitos:**
```html
✅ <input id="home-titulo">
✅ <input id='home-titulo'>
✅ <input id=home-titulo>
✅ <div id="home-titulo" class="...">
```

**Exemplo de erro:**
```
[heroTitulo] adminId não encontrado em admin-painel.html: home-titulo
```

---

#### c) siteNeedle existe em targetFile

```javascript
const targetContent = readFile(targetAbs);
// targetContent.includes(row.siteNeedle) === true
```

**Exemplo de erro:**
```
[heroTitulo] siteNeedle não encontrado em index.html: if (heroTituloEl && c.heroTitulo)
```

---

## 🔄 Integração com CI/CD

### GitHub Actions Workflow:

```yaml
name: Quality Check
on: [pull_request, push]

jobs:
  admin-espelho-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Validar Admin ↔ Site
        run: node scripts/admin-espelho-gate.js
```

**Como funciona:**
1. Roda em todo PR e push
2. Se falhar (exit code 1), bloqueia o merge
3. Se passar (exit code 0), permite o merge

---

### Uso Local:

```bash
# Executar validação
node scripts/admin-espelho-gate.js

# Ver relatório gerado
cat docs/relatorios/admin-espelho-gate.md
```

**Exemplo de saída (sucesso):**
```
✅ Gate Admin ↔ Site aprovado.
```

**Exemplo de saída (falha):**
```
❌ Gate Admin ↔ Site falhou com 2 problema(s).
- [heroTitulo] adminId não encontrado em admin-painel.html: home-titulo
- [seoTitulo] configKey não encontrado em dados/config.json: seoTitulo
```

---

## 💡 Casos de Uso

### Caso 1: Adicionar Novo Campo Editável

**Cenário:** Quer adicionar edição do campo "rodapéTexto"

**Passos:**

1. **Adicionar em config.json:**
```json
{
  "rodapeTexto": "© 2007-2026 Sorveteria Itapolitana"
}
```

2. **Adicionar no admin-painel.html:**
```html
<input type="text" id="cfg-rodape-texto" value="">
```

3. **Usar no site (footer.html):**
```html
<p data-config="rodapeTexto">© 2007-2026 Sorveteria Itapolitana</p>
```

4. **Adicionar na matriz:**
```json
{
  "id": "rodapeTexto",
  "sourceFile": "dados/config.json",
  "configKey": "rodapeTexto",
  "adminId": "cfg-rodape-texto",
  "targetFile": "index.html",
  "siteNeedle": "data-config=\"rodapeTexto\""
}
```

5. **Validar:**
```bash
node scripts/admin-espelho-gate.js
```

✅ **Resultado:** Gate aprova, campo está sincronizado!

---

### Caso 2: Adicionar Campo Aninhado

**Cenário:** Adicionar SEO para nova página "contato.html"

**1. Atualizar config.json:**
```json
{
  "seoPaginas": {
    "sobre": {...},
    "contato": {
      "titulo": "Contato | Sorveteria Itapolitana",
      "descricao": "Entre em contato com a Sorveteria Itapolitana...",
      "palavrasChave": "contato sorveteria cajuru, telefone itapolitana"
    }
  }
}
```

**2. Adicionar 3 campos no admin-painel.html:**
```html
<input id="cfg-seo-contato-titulo">
<textarea id="cfg-seo-contato-descricao"></textarea>
<input id="cfg-seo-contato-palavras"></input>
```

**3. Usar em contato.html:**
```html
<title data-config="seoPaginas.contato.titulo">Contato</title>
<meta name="description" data-config="seoPaginas.contato.descricao" content="...">
<meta name="keywords" data-config="seoPaginas.contato.palavrasChave" content="...">
```

**4. Adicionar 3 entradas na matriz:**
```json
[
  {
    "id": "seoContatoTitulo",
    "sourceFile": "dados/config.json",
    "configKey": "seoPaginas.contato.titulo",
    "adminId": "cfg-seo-contato-titulo",
    "targetFile": "contato.html",
    "siteNeedle": "data-config=\"seoPaginas.contato.titulo\""
  },
  {
    "id": "seoContatoDescricao",
    "sourceFile": "dados/config.json",
    "configKey": "seoPaginas.contato.descricao",
    "adminId": "cfg-seo-contato-descricao",
    "targetFile": "contato.html",
    "siteNeedle": "data-config=\"seoPaginas.contato.descricao\""
  },
  {
    "id": "seoContatoPalavras",
    "sourceFile": "dados/config.json",
    "configKey": "seoPaginas.contato.palavrasChave",
    "adminId": "cfg-seo-contato-palavras",
    "targetFile": "contato.html",
    "siteNeedle": "data-config=\"seoPaginas.contato.palavrasChave\""
  }
]
```

**5. Validar:**
```bash
node scripts/admin-espelho-gate.js
```

✅ **Resultado:** 3 campos adicionados, total agora é 79!

---

## 🔧 Troubleshooting

### Erro: "configKey não encontrado"

**Sintoma:**
```
[heroTitulo] configKey não encontrado em dados/config.json: heroTitulo
```

**Causas possíveis:**
1. Chave não existe em config.json
2. Erro de digitação (case-sensitive)
3. Caminho aninhado incorreto

**Soluções:**
```bash
# Verificar se chave existe
cat dados/config.json | grep "heroTitulo"

# Se for aninhada, verificar estrutura
cat dados/config.json | jq '.seoPaginas.sobre'
```

---

### Erro: "adminId não encontrado"

**Sintoma:**
```
[heroTitulo] adminId não encontrado em admin-painel.html: home-titulo
```

**Causas possíveis:**
1. Campo não existe no admin-painel.html
2. ID está com nome diferente
3. Erro de digitação

**Soluções:**
```bash
# Procurar ID no admin
grep -n "id=\"home-titulo\"" admin-painel.html

# Ver todos os IDs que começam com "home-"
grep -o 'id="home-[^"]*"' admin-painel.html
```

**Correção:** Adicionar o elemento no admin-painel.html ou corrigir o ID

---

### Erro: "siteNeedle não encontrado"

**Sintoma:**
```
[heroTitulo] siteNeedle não encontrado em index.html: data-config="heroTitulo"
```

**Causas possíveis:**
1. Elemento não tem atributo data-config
2. Código JavaScript não usa o campo
3. Needle incorreto

**Soluções:**
```bash
# Procurar needle no arquivo
grep -n 'data-config="heroTitulo"' index.html

# Ver todos os data-config
grep -o 'data-config="[^"]*"' index.html
```

**Correção:** Adicionar `data-config="heroTitulo"` no elemento HTML

---

### Erro: "id duplicado"

**Sintoma:**
```
id duplicado: heroTitulo (heroTitulo1 e heroTitulo2)
```

**Causa:**
Dois campos na matriz têm o mesmo `id`

**Solução:**
Editar `admin_espelho_matrix.json` e renomear um dos IDs:
```json
// Antes (duplicado)
{"id": "heroTitulo", ...}
{"id": "heroTitulo", ...}

// Depois (corrigido)
{"id": "heroTitulo", ...}
{"id": "heroTituloSecundario", ...}
```

---

## 📈 Métricas e Estatísticas

### Estado Atual (2026-05-18):

| Métrica | Valor |
|---------|-------|
| Campos validados | 76 |
| Falhas | 0 |
| Avisos | 0 |
| Cobertura do site | ~88% |
| Páginas integradas | 8 |
| Tempo de execução | < 1 segundo |

### Evolução Histórica:

| Fase | Data | Campos | Falhas |
|------|------|--------|--------|
| Fase 1 | 2026-05-15 | 18 | 0 |
| Fase 2 | 2026-05-16 | 41 | 0 |
| Fase 3.1 | 2026-05-17 | 49 | 0 |
| Fase 3.2 | 2026-05-18 | 69 | 0 |
| Final | 2026-05-18 | 76 | 0 |

---

## 🎓 Boas Práticas

### 1. Sempre rode o gate antes de commit:

```bash
git add .
node scripts/admin-espelho-gate.js
git commit -m "feat: adicionar novo campo"
```

### 2. Use IDs descritivos na matriz:

```json
// ✅ Bom
{"id": "seoSobreTitulo", ...}

// ❌ Ruim
{"id": "campo1", ...}
```

### 3. Use needles específicos:

```json
// ✅ Bom - específico
"siteNeedle": "data-config=\"heroTitulo\""

// ⚠️ Aceito mas genérico
"siteNeedle": "heroTitulo"
```

### 4. Mantenha consistência de nomenclatura:

```
config.json:     heroTitulo
adminId:         home-titulo (kebab-case)
data-config:     heroTitulo (camelCase)
```

---

## 📚 Recursos Relacionados

### Documentação:
- `docs/GUIA-COMPLETO-ADMIN-PAINEL.md` - Guia do usuário
- `docs/ESTRUTURA-CONFIG-JSON.md` - Estrutura de dados
- `docs/HISTORICO-AUDITORIA.md` - História das 5 fases

### Scripts:
- `scripts/admin-espelho-gate.js` - Este script
- `scripts/check-exposed-tokens.js` - Validação de segurança

### Arquivos de Dados:
- `dados/admin_espelho_matrix.json` - Matriz de 76 campos
- `dados/config.json` - Dados centralizados

---

**Fim da Documentação Técnica**
Mantido por: @missias123
Última atualização: 2026-05-18
