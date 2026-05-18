# 🔍 AUDITORIA ROBUSTA: Problemas que Impedem a Exibição/Edição do Site no Admin

**Data:** 2026-05-18
**Repositório:** missias123/itapolitanacajuru
**Objetivo:** Identificar todos os problemas que impedem o admin-painel.html de espelhar e permitir a edição completa do site itapolitanacajuru.com.br

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de problemas encontrados** | 9 |
| **🔴 Severidade CRÍTICA** | 0 |
| **🟠 Severidade ALTA** | 2 |
| **🟡 Severidade MÉDIA** | 7 |
| **🟢 Severidade BAIXA** | 0 |
| **Campos na matriz espelho** | 12 |
| **Chaves em config.json** | 82 |
| **Páginas HTML do site** | 13 |
| **Páginas sem seção no admin** | 7 |

---

## 1️⃣ PROBLEMAS DE CONECTIVIDADE E CARREGAMENTO DO ADMIN

### 1.1 ✅ Arquivo admin-painel.html
**Status:** OK
**Verificação:** Arquivo existe e está acessível

### 1.2 ℹ️ Recursos Externos
**CSS:** 0 arquivos externos (CSS inline)
**JS:** 1 arquivo externo
**Observação:** Admin usa CSS e JS inline majoritariamente

### 1.3 🟠 Autenticação

#### ✅ Validação de Senha
- **Status:** OK
- **Detalhes:** Validação SHA-256 presente
- **Localização:** admin-painel.html

#### 🟠 Validação de PAT GitHub
- **Status:** PROBLEMA DETECTADO
- **Severidade:** ALTA
- **Detalhes:** Não encontrada validação explícita de token GitHub
- **Impacto:** Pode permitir tentativas de salvamento sem PAT válido
- **Recomendação:** Implementar validação de formato e permissões do PAT antes de permitir operações de escrita

---

## 2️⃣ PROBLEMAS DE RENDERIZAÇÃO E EXIBIÇÃO DO CONTEÚDO

### 2.1 ✅ Carregamento de config.json
**Status:** OK
**Chaves carregadas:** 82
**Arquivo:** dados/config.json

### 2.2 ✅ Matriz Espelho
**Status:** OK
**Campos mapeados:** 12
**Arquivo:** dados/admin_espelho_matrix.json
**Validação:** Todos os 12 adminIds estão presentes no admin-painel.html

### 2.3 ℹ️ Tratamento de Erros JavaScript
**Status:** Presente
**Observação:** Código possui blocos try/catch e console.error para tratamento básico de erros

---

## 3️⃣ PROBLEMAS DE FUNCIONALIDADE DE EDIÇÃO E SALVAMENTO

### 3.1 ✅ Funções de Salvamento
**Status:** OK
**Funções verificadas:**
- ✅ salvarConfig
- ✅ salvarCardápio
- ✅ salvarDepoimentos
- ✅ salvarProduto
- ✅ salvarPromocaoItem

### 3.2 ✅ Proteção GH_WRITE_ALLOWED
**Status:** OK
**Detalhes:** Verificação presente para proteger operações de escrita sem permissão

---

## 4️⃣ PROBLEMAS DE MAPEAMENTO (admin_espelho_matrix.json)

### 4.1 🟠 ConfigKey Ausente

**Problema:** Campo `promoBadge` na matriz referencia `configKey: "titulo"` que não existe em config.json

| Campo | ConfigKey Esperado | Status em config.json |
|-------|-------------------|----------------------|
| promoBadge | titulo | ❌ AUSENTE |

**Impacto:** O campo promoBadge na matriz espelho aponta para `promo.json` com configKey "titulo", mas deveria apontar para uma chave válida.

**Correção Necessária:**
- Verificar se o arquivo `dados/promo.json` possui a chave "titulo"
- Ou atualizar a matriz para usar a chave correta

### 4.2 🟡 Campos Críticos Não Mapeados

**Problema:** 6 campos essenciais do config.json não estão na matriz espelho

| Campo | Presente em config.json | Presente na Matriz | adminId Esperado |
|-------|------------------------|-------------------|------------------|
| whatsapp | ✅ | ❌ | cfg-whatsapp |
| seoTitulo | ✅ | ❌ | cfg-seo-titulo |
| seoDescricao | ✅ | ❌ | cfg-seo-descricao |
| footerCopy | ✅ | ❌ | cfg-footer-copy |
| horario | ✅ | ❌ | cfg-horario |
| endereco | ✅ | ❌ | cfg-endereco |

**Impacto:** Estes campos estão editáveis no admin-painel.html mas não são validados pelo admin-espelho-gate.js

**Recomendação:** Adicionar todos os 6 campos à matriz espelho para garantir sincronização Site ↔ Admin

---

## 5️⃣ PROBLEMAS DE COBERTURA GERAL

### 5.1 🟡 Páginas Sem Seção Dedicada no Admin

**Problema:** 7 páginas HTML do site não têm seção correspondente no admin-painel.html

| Página | Seção Esperada | Status |
|--------|----------------|--------|
| promocao.html | sec-promocao | ⚠️ Existe como `sec-promoção` (com ç) |
| dicas.html | sec-dicas | ⚠️ Conteúdo em `sec-depoimentos` |
| sobre.html | sec-sobre | ❌ AUSENTE |
| galeria.html | sec-galeria | ❌ AUSENTE |
| carrossel.html | sec-carrossel | ❌ AUSENTE |
| politica-privacidade.html | sec-politica-privacidade | ❌ AUSENTE |
| offline.html | sec-offline | ❌ AUSENTE |

**Impacto:** Conteúdo destas páginas não pode ser editado visualmente no admin

**Detalhamento:**

#### ⚠️ promocao.html
- Existe seção `sec-promoção` (com ç)
- Permite edição de promoções ativas
- **Status:** PARCIALMENTE COBERTA

#### ⚠️ dicas.html
- Conteúdo gerenciado em `sec-depoimentos`
- Inclui dicas e depoimentos
- **Status:** PARCIALMENTE COBERTA

#### ❌ sobre.html
- **Conteúdo:** Informações institucionais, história, missão, valores
- **Elementos não editáveis:** Textos, imagens, timeline
- **Impacto:** Alto - página institucional importante

#### ❌ galeria.html
- **Conteúdo:** Galeria de fotos dos produtos
- **Elementos não editáveis:** Upload de imagens, legendas, categorias
- **Impacto:** Médio - visual importante para marketing

#### ❌ carrossel.html
- **Conteúdo:** Visualização dos banners do carrossel
- **Elementos não editáveis:** Ordem, imagens, textos dos banners
- **Impacto:** Alto - primeiro contato visual no site
- **Observação:** `config.json` possui `banners: []` vazio

#### ❌ politica-privacidade.html
- **Conteúdo:** Texto legal de política de privacidade
- **Elementos não editáveis:** Todo o texto legal
- **Impacto:** Baixo - alterado raramente

#### ❌ offline.html
- **Conteúdo:** Página de fallback quando offline (PWA)
- **Elementos não editáveis:** Mensagem de offline
- **Impacto:** Muito baixo - página técnica

---

## 📋 ANÁLISE DETALHADA: CAMPOS NO ADMIN vs MATRIZ ESPELHO

### Campos Presentes no Admin mas Ausentes na Matriz

Análise dos IDs encontrados no admin-painel.html que existem mas não estão validados pela matriz:

| adminId | Tipo de Campo | Seção | Prioridade |
|---------|--------------|-------|------------|
| cfg-whatsapp | Input tel | sec-config | 🔴 CRÍTICA |
| cfg-whats-fmt | Input text | sec-config | 🟡 MÉDIA |
| cfg-instagram | Input text | sec-config | 🟡 MÉDIA |
| cfg-instagram-url | Input url | sec-config | 🟡 MÉDIA |
| cfg-endereco | Input text | sec-config | 🟠 ALTA |
| cfg-endereço-completo | Input text | sec-config | 🟡 MÉDIA |
| cfg-horario | Input text | sec-config | 🟠 ALTA |
| cfg-horário-det | Input text | sec-config | 🟡 MÉDIA |
| cfg-seo-titulo | Input text | sec-config | 🔴 CRÍTICA |
| cfg-seo-descricao | Textarea | sec-config | 🔴 CRÍTICA |
| cfg-seo-palavras | Input text | sec-config | 🟠 ALTA |
| cfg-footer-copy | Input text | sec-config | 🟠 ALTA |
| cfg-footer-dev | Input text | sec-config | 🟢 BAIXA |
| home-titulo | Input text | sec-home | ✅ NA MATRIZ |
| home-descricao | Textarea | sec-home | ✅ NA MATRIZ |

**Total estimado de campos não mapeados:** ~70+ campos editáveis no admin

---

## 🎯 CAMPOS CRÍTICOS QUE DEVEM SER ADICIONADOS À MATRIZ

### Prioridade 🔴 CRÍTICA (Impacto Imediato no Site)

1. **whatsapp** (cfg-whatsapp)
   - Usado em TODOS os botões de contato
   - Quebra funcionalidade se incorreto

2. **seoTitulo** (cfg-seo-titulo)
   - Tag `<title>` do site
   - Essencial para SEO e compartilhamento

3. **seoDescricao** (cfg-seo-descricao)
   - Meta description
   - Essencial para SEO

### Prioridade 🟠 ALTA (Impacto Significativo)

4. **endereco** (cfg-endereco)
   - Exibido no hero e footer
   - Informação de contato primária

5. **horario** (cfg-horario)
   - Horário de funcionamento
   - Info crucial para clientes

6. **footerCopy** (cfg-footer-copy)
   - Copyright do rodapé
   - Aparece em todas as páginas

7. **seoPalavrasChave** (cfg-seo-palavras)
   - Keywords para SEO
   - Importante para buscas

---

## 🔧 ANÁLISE DE CAUSAS RAIZ

### Por que apenas 12 campos estão na matriz?

**Hipótese 1: Implementação Incremental**
- A matriz foi criada recentemente (baseado no código)
- Apenas campos prioritários foram mapeados inicialmente
- Faltou expansão para cobrir todos os campos

**Hipótese 2: Falta de Automação**
- Mapeamento manual campo a campo
- Processo trabalhoso e sujeito a esquecimento
- Sem script para detectar campos não mapeados

**Hipótese 3: Evolução do Admin**
- Admin foi expandido com novos campos
- Matriz não foi atualizada simultaneamente
- Dessincronia entre desenvolvimento e validação

### Por que 7 páginas não têm seção no admin?

**Análise:**
- Admin focou nas páginas dinâmicas (home, produtos, promoções)
- Páginas estáticas (sobre, política) foram deixadas para depois
- Falta planejamento de cobertura completa

---

## 📝 RECOMENDAÇÕES PRIORITÁRIAS

### 🔴 Imediatas (Próximas 24h)

1. **Adicionar 6 campos críticos à matriz espelho**
   - whatsapp, seoTitulo, seoDescricao, footerCopy, horario, endereco
   - Arquivo: `dados/admin_espelho_matrix.json`
   - Evita inconsistências Site ↔ Admin

2. **Corrigir campo promoBadge na matriz**
   - Verificar arquivo `dados/promo.json`
   - Atualizar configKey se necessário

### 🟠 Curto Prazo (Próxima Semana)

3. **Criar seções no admin para páginas ausentes**
   - Prioridade: sobre.html (institucional)
   - Prioridade: carrossel.html (visual importante)
   - Baixa prioridade: politica-privacidade.html, offline.html

4. **Expandir matriz espelho progressivamente**
   - Meta: 50+ campos na primeira expansão
   - Meta final: 100% dos campos editáveis mapeados

5. **Implementar validação de PAT GitHub**
   - Verificar formato do token
   - Validar permissões antes de permitir edição

### 🟡 Médio Prazo (Próximo Mês)

6. **Criar script de auditoria automática**
   - Detectar campos no admin sem entrada na matriz
   - Detectar campos na matriz sem adminId correspondente
   - Rodar em CI/CD

7. **Implementar preview em tempo real**
   - Mostrar como ficará no site antes de salvar
   - Reduzir erros de edição

8. **Melhorar feedback visual**
   - Loading indicators
   - Confirmações de salvamento
   - Alertas de sincronização

---

## 🧪 CENÁRIOS DE TESTE RECOMENDADOS

### Teste 1: Login sem PAT
- **Ação:** Fazer login apenas com senha
- **Resultado Esperado:** Acesso read-only
- **Resultado Atual:** ✅ Funciona

### Teste 2: Salvar sem PAT válido
- **Ação:** Tentar salvar alteração sem PAT ou com PAT inválido
- **Resultado Esperado:** Mensagem de erro clara
- **Resultado Atual:** ⚠️ Verificar comportamento

### Teste 3: Editar campo não mapeado
- **Ação:** Editar `cfg-whatsapp` e salvar
- **Resultado Esperado:** Alteração reflete no site
- **Resultado Atual:** ⚠️ Funciona mas não validado pelo gate

### Teste 4: Matriz com erro
- **Ação:** Remover adminId de um campo e rodar gate
- **Resultado Esperado:** Gate falha com erro claro
- **Resultado Atual:** ✅ Funciona (validado)

---

## 📊 MÉTRICAS DE COBERTURA

### Cobertura Atual da Matriz Espelho

```
Campos na matriz:     12
Campos em config:     82
Cobertura:            14.6%
```

### Meta de Cobertura

```
Meta Fase 1 (imediata):    22% (18 campos)  [+6 críticos]
Meta Fase 2 (semana 1):    50% (41 campos)  [+23 importantes]
Meta Fase 3 (mês 1):       80% (66 campos)  [+25 restantes]
Meta Fase 4 (futuro):     100% (82 campos)  [todos]
```

### Cobertura de Páginas

```
Páginas com seção no admin:  6 / 13  (46%)
Páginas totalmente editáveis: 3 / 13  (23%)
```

---

## 🚨 RISCOS IDENTIFICADOS

### 🔴 RISCO ALTO

**R1: Inconsistência Site ↔ Admin**
- **Descrição:** Campos editados no admin podem não refletir no site se não estiverem em config.json corretamente
- **Probabilidade:** Média
- **Impacto:** Alto
- **Mitigação:** Expandir matriz espelho, adicionar validações

**R2: Quebra de WhatsApp**
- **Descrição:** Campo `whatsapp` não está na matriz, edição incorreta quebra todos os botões de contato
- **Probabilidade:** Baixa
- **Impacto:** Crítico
- **Mitigação:** Adicionar à matriz imediatamente

### 🟡 RISCO MÉDIO

**R3: SEO Comprometido**
- **Descrição:** Campos de SEO não validados podem conter erros que prejudicam ranqueamento
- **Probabilidade:** Média
- **Impacto:** Médio
- **Mitigação:** Adicionar validação de comprimento e formato

**R4: Páginas Desatualizadas**
- **Descrição:** Páginas sem seção no admin ficam com conteúdo desatualizado
- **Probabilidade:** Alta
- **Impacto:** Baixo a Médio
- **Mitigação:** Criar seções para páginas principais

---

## 📎 ANEXOS

### Arquivo da Auditoria
**Relatório JSON:** `docs/relatorios/auditoria-robusta-admin.json`
**Timestamp:** 2026-05-18T17:00:17.904Z

### Scripts Relacionados
- `scripts/admin-espelho-gate.js` - Validação da matriz espelho
- `scripts/auditoria-robusta-admin.js` - Esta auditoria (novo)
- `scripts/check-exposed-tokens.js` - Verificação de tokens expostos

### Arquivos de Dados
- `dados/admin_espelho_matrix.json` - Matriz Site ↔ Admin (12 campos)
- `dados/config.json` - Configuração global (82 chaves)
- `dados/content_map.json` - Mapeamento de conteúdo

---

## ✅ CONCLUSÃO

A auditoria identificou **9 problemas** que limitam a capacidade do admin-painel.html de espelhar completamente o site:

1. ✅ **Estrutura base está sólida** - Admin existe, carrega dados, possui autenticação
2. ⚠️ **Matriz espelho muito limitada** - Apenas 12 de 82+ campos mapeados (14.6%)
3. ⚠️ **Cobertura de páginas incompleta** - 7 páginas sem seção dedicada
4. 🟠 **2 problemas de severidade ALTA** - PAT validation e configKey ausente
5. 🟡 **7 problemas de severidade MÉDIA** - Campos não mapeados e páginas ausentes

**Próximo Passo Recomendado:** Adicionar os 6 campos críticos à matriz espelho para elevar a cobertura de 14.6% para 22% e garantir que elementos essenciais (WhatsApp, SEO, Footer) sejam validados.

---

**Fim do Relatório**
Gerado automaticamente por: `scripts/auditoria-robusta-admin.js`
