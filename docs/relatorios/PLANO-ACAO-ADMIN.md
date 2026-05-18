# 🎯 PLANO DE AÇÃO: Expandir Cobertura Admin ↔ Site

**Objetivo:** Elevar cobertura da matriz espelho de 14.6% para 100%, permitindo edição visual completa do site no admin-painel.html

**Data:** 2026-05-18
**Status:** Aguardando aprovação

---

## 📋 FASE 1: CORREÇÕES IMEDIATAS (Hoje)

### ✅ Tarefa 1.1: Adicionar 6 Campos Críticos à Matriz

**Arquivo:** `dados/admin_espelho_matrix.json`
**Tempo estimado:** 30 minutos
**Prioridade:** 🔴 CRÍTICA

**Campos a adicionar:**

```json
{
  "id": "whatsapp",
  "sourceFile": "dados/config.json",
  "configKey": "whatsapp",
  "adminId": "cfg-whatsapp",
  "targetFile": "index.html",
  "siteNeedle": "data-cfg=\"whatsapp\""
},
{
  "id": "seoTitulo",
  "sourceFile": "dados/config.json",
  "configKey": "seoTitulo",
  "adminId": "cfg-seo-titulo",
  "targetFile": "index.html",
  "siteNeedle": "<title>"
},
{
  "id": "seoDescricao",
  "sourceFile": "dados/config.json",
  "configKey": "seoDescricao",
  "adminId": "cfg-seo-descricao",
  "targetFile": "index.html",
  "siteNeedle": "name=\"description\""
},
{
  "id": "footerCopy",
  "sourceFile": "dados/config.json",
  "configKey": "footerCopy",
  "adminId": "cfg-footer-copy",
  "targetFile": "index.html",
  "siteNeedle": "id=\"footer-copy\""
},
{
  "id": "horario",
  "sourceFile": "dados/config.json",
  "configKey": "horario",
  "adminId": "cfg-horario",
  "targetFile": "index.html",
  "siteNeedle": "data-cfg=\"horario\""
},
{
  "id": "endereco",
  "sourceFile": "dados/config.json",
  "configKey": "endereco",
  "adminId": "cfg-endereco",
  "targetFile": "index.html",
  "siteNeedle": "data-cfg=\"endereco\""
}
```

**Validação:**
```bash
node scripts/admin-espelho-gate.js
```

**Resultado esperado:** ✅ Gate aprovado com 18 campos

---

### ✅ Tarefa 1.2: Corrigir Campo promoBadge

**Investigação necessária:**

1. Ler `dados/promo.json`:
```bash
cat dados/promo.json
```

2. Verificar se existe chave `titulo`

3. Se SIM: Manter matriz como está
   Se NÃO: Atualizar para chave correta (ex: `promoTituloEl` ou `titulo` dentro de objeto)

**Validação:**
```bash
node scripts/admin-espelho-gate.js
```

---

## 📋 FASE 2: EXPANSÃO SEMANAL (Esta Semana)

### ✅ Tarefa 2.1: Criar Seção sobre.html no Admin

**Arquivo:** `admin-painel.html`
**Tempo estimado:** 2 horas
**Prioridade:** 🟠 ALTA

**Estrutura da seção:**

```html
<div class="seção" id="sec-sobre">
  <div class="card">
    <div class="card-header">
      <h2>🏪 Página Sobre - Institucional</h2>
      <button class="btn btn-salvar" onclick="salvarSobre()">💾 Salvar</button>
    </div>
    <div class="card-body">
      <div class="seção-título">📄 Textos da Página</div>
      <div class="campo-edit">
        <label>Título principal</label>
        <input type="text" id="sobre-titulo" maxlength="60" placeholder="Sobre a Itapolitana"/>
      </div>
      <div class="campo-edit">
        <label>Nossa história</label>
        <textarea id="sobre-historia" rows="6" placeholder="Conte a história da sorveteria..."></textarea>
      </div>
      <div class="campo-edit">
        <label>Missão</label>
        <textarea id="sobre-missao" rows="3" placeholder="Nossa missão é..."></textarea>
      </div>
      <div class="campo-edit">
        <label>Visão</label>
        <textarea id="sobre-visao" rows="3" placeholder="Nossa visão é..."></textarea>
      </div>
      <div class="campo-edit">
        <label>Valores</label>
        <textarea id="sobre-valores" rows="4" placeholder="Nossos valores:\n- Qualidade\n- Atendimento..."></textarea>
      </div>

      <div class="seção-título" style="margin-top:20px">🔎 SEO da Página</div>
      <div class="campo-edit">
        <label>Title</label>
        <input type="text" id="sobre-seo-titulo" maxlength="60" placeholder="Sobre | Sorveteria Itapolitana Cajuru"/>
      </div>
      <div class="campo-edit">
        <label>Meta Description</label>
        <textarea id="sobre-seo-desc" rows="2" maxlength="160" placeholder="Conheça a história e valores da Itapolitana..."></textarea>
      </div>

      <div class="btn-row">
        <button class="btn btn-salvar" onclick="salvarSobre()">💾 Salvar Sobre</button>
      </div>
    </div>
  </div>
</div>
```

**Adicionar ao menu de navegação:**
```html
<button onclick="irPara('sobre')">🏪 Sobre</button>
```

**Criar função salvarSobre():**
```javascript
async function salvarSobre() {
  if (!GH_WRITE_ALLOWED()) return;

  const dados = {
    sobreTitulo: document.getElementById('sobre-titulo').value,
    sobreHistoria: document.getElementById('sobre-historia').value,
    sobreMissao: document.getElementById('sobre-missao').value,
    sobreVisao: document.getElementById('sobre-visao').value,
    sobreValores: document.getElementById('sobre-valores').value,
    sobreSeoTitulo: document.getElementById('sobre-seo-titulo').value,
    sobreSeoDesc: document.getElementById('sobre-seo-desc').value
  };

  await atualizarConfig(dados);
  toast('✅ Página Sobre salva!');
}
```

**Adicionar à matriz espelho:** 7 novos campos

---

### ✅ Tarefa 2.2: Criar Seção carrossel.html no Admin

**Arquivo:** `admin-painel.html`
**Tempo estimado:** 3 horas
**Prioridade:** 🟠 ALTA

**Nota:** config.json possui `banners: []` vazio. Precisa ser implementado!

**Estrutura:**

```html
<div class="seção" id="sec-carrossel">
  <div class="card">
    <div class="card-header">
      <h2>🎠 Carrossel de Banners</h2>
      <button class="btn btn-salvar" onclick="salvarCarrossel()">💾 Salvar</button>
    </div>
    <div class="card-body">
      <div class="seção-título">🖼️ Banners do Carrossel</div>
      <div class="hint">Ordem de exibição = ordem na lista. Clique e arraste para reordenar.</div>

      <div id="banners-lista"></div>

      <div class="btn-row" style="margin-top:12px">
        <button class="btn btn-verde" onclick="adicionarBanner()">➕ Adicionar Banner</button>
      </div>

      <div class="btn-row">
        <button class="btn btn-salvar" onclick="salvarCarrossel()">💾 Salvar Carrossel</button>
      </div>
    </div>
  </div>
</div>
```

**Estrutura do banner:**
```javascript
{
  id: 'banner-001',
  imagem: 'dados/promo_banner.webp',
  alt: 'Promoção de Sorvetes',
  link: 'promocao.html',
  ordem: 1,
  ativo: true
}
```

---

### ✅ Tarefa 2.3: Expandir Matriz para 50 Campos

**Meta:** 50 campos (61% de cobertura)

**Campos prioritários a adicionar:**

**Grupo: Contato e Redes Sociais** (5 campos)
- whatsappFormatado
- instagram
- instagramUrl
- enderecoCompleto
- horarioDetalhado

**Grupo: SEO** (6 campos)
- seoPalavrasChave
- seoTitulo (páginas: fidelidade, encomendas, dicas)
- seoDescricao (páginas: fidelidade, encomendas, dicas)

**Grupo: Hero e CTA** (8 campos)
- heroSubtitulo
- heroBadge
- heroCta
- heroCtaWhats
- stripSensorial (array)

**Grupo: Cardápio** (15 campos)
- cardapioSubtitulo
- cardapioBadge
- modalSaboresTitulo
- modalSaboresSub
- modalPicoleTitulo
- modalAcaiTitulo
- modalAcaiSub

**Grupo: Fidelidade** (5 campos)
- fidelidadeTitulo
- fidelidadeDescricao
- pontosMilkshake
- pontosCaixa
- premioMilkshake

**Grupo: Chat e Modais** (11 campos)
- chatHdrTitulo
- chatHdrSub
- chatMsgInicio
- clubeFabTexto
- faleBtnTexto
- faleLabelMsg
- faleModalSub

---

## 📋 FASE 3: CONSOLIDAÇÃO MENSAL (Este Mês)

### ✅ Tarefa 3.1: Implementar Validação de PAT GitHub

**Arquivo:** `admin-painel.html`
**Tempo estimado:** 1 hora
**Prioridade:** 🟠 ALTA

**Adicionar função de validação:**

```javascript
async function validarPATGitHub(pat) {
  if (!pat || pat.length < 20) {
    return { valido: false, erro: 'PAT muito curto ou vazio' };
  }

  if (!pat.startsWith('ghp_') && !pat.startsWith('github_pat_')) {
    return { valido: false, erro: 'Formato de PAT inválido' };
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return { valido: false, erro: 'PAT inválido ou expirado' };
    }

    const user = await response.json();

    // Verificar permissões do PAT
    const scopes = response.headers.get('X-OAuth-Scopes');
    if (!scopes || !scopes.includes('repo')) {
      return {
        valido: false,
        erro: 'PAT sem permissão "repo". Configure em GitHub Settings.'
      };
    }

    return {
      valido: true,
      usuario: user.login,
      scopes: scopes
    };
  } catch (err) {
    return { valido: false, erro: 'Erro ao validar PAT: ' + err.message };
  }
}
```

**Integrar no login:**

```javascript
async function fazerLogin() {
  const pat = document.getElementById('pat-github').value.trim();

  if (pat) {
    const validacao = await validarPATGitHub(pat);
    if (!validacao.valido) {
      toast(`❌ ${validacao.erro}`, 'error');
      return;
    }
    toast(`✅ PAT válido. Usuário: ${validacao.usuario}`);
    GITHUB_PAT = pat;
  }

  // Continuar com login...
}
```

---

### ✅ Tarefa 3.2: Criar Seção galeria.html

**Arquivo:** `admin-painel.html`
**Tempo estimado:** 2 horas
**Prioridade:** 🟡 MÉDIA

Similar à estrutura de carrossel, mas para fotos de produtos.

---

### ✅ Tarefa 3.3: Atingir 80% de Cobertura (66 campos)

**Meta:** Adicionar mais 16 campos além dos 50 da Fase 2

---

## 📋 FASE 4: AUTOMAÇÃO E QUALIDADE (Futuro)

### ✅ Tarefa 4.1: Script de Detecção Automática de Campos

Criar script que:
1. Lê todos os IDs no admin-painel.html
2. Lê todos os campos na matriz
3. Identifica divergências
4. Gera relatório de campos não mapeados

### ✅ Tarefa 4.2: Preview em Tempo Real

Implementar iframe com preview do site mostrando mudanças antes de salvar.

### ✅ Tarefa 4.3: Histórico de Alterações

Mostrar últimos commits do GitHub diretamente no admin.

---

## 📊 MÉTRICAS DE PROGRESSO

| Fase | Campos | Cobertura | Prazo |
|------|--------|-----------|-------|
| **Atual** | 12 | 14.6% | - |
| **Fase 1** | 18 | 22.0% | Hoje |
| **Fase 2** | 50 | 61.0% | 1 semana |
| **Fase 3** | 66 | 80.5% | 1 mês |
| **Fase 4** | 82 | 100% | Futuro |

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após cada fase, executar:

```bash
# 1. Validar matriz espelho
node scripts/admin-espelho-gate.js

# 2. Executar auditoria
node scripts/auditoria-robusta-admin.js

# 3. Verificar ESLint
npm run lint

# 4. Rodar testes
npm test

# 5. Build local
# (não aplicável - site estático)
```

---

## 📝 NOTAS IMPORTANTES

1. **Não quebrar funcionalidade existente**: Adicionar campos, não remover
2. **Testar cada adição**: Validar que campo salva e carrega corretamente
3. **Documentar mudanças**: Atualizar README.md com novos campos
4. **Commits incrementais**: Um commit por grupo de campos relacionados
5. **Manter nomenclatura consistente**: IDs seguem padrão `cfg-*`, `home-*`, etc.

---

## 🎯 RESULTADO ESPERADO

Ao final da Fase 3:
- ✅ 80% de cobertura da matriz espelho (66+ campos)
- ✅ Validação de PAT implementada
- ✅ Principais páginas (sobre, carrossel, galeria) editáveis
- ✅ Sincronização Site ↔ Admin garantida para 66 campos críticos
- ✅ Admin permite edição visual de 80% do conteúdo do site

---

**Responsável:** Time de desenvolvimento
**Aprovação necessária:** @missias123
**Status:** 🟡 Aguardando aprovação para iniciar

---

**Fim do Plano de Ação**
Gerado em: 2026-05-18
Baseado em: docs/relatorios/AUDITORIA-ROBUSTA-ADMIN.md
