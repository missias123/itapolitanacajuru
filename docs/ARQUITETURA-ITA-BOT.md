# Arquitetura Recomendada — Ita Bot

> **Status:** Planejamento (Lote 0 — somente leitura)
> Branch: copilot/valores-estao-erraods | Data: 2026-07-25

---

## ÍNDICE

1. [Diagnóstico da Arquitetura Atual](#1-diagnóstico-da-arquitetura-atual)
2. [Mapa de Fontes Oficiais](#2-mapa-de-fontes-oficiais)
3. [Mapa de Dependências dos Arquivos](#3-mapa-de-dependências-dos-arquivos)
4. [Matriz de Intenções](#4-matriz-de-intenções)
5. [Arquitetura Proposta](#5-arquitetura-proposta)
6. [Motor de Roteamento](#6-motor-de-roteamento)
7. [Fluxo de Dados](#7-fluxo-de-dados)
8. [Tratamento de Falhas](#8-tratamento-de-falhas)

---

## 1. DIAGNÓSTICO DA ARQUITETURA ATUAL

### 1.1 Fontes concorrentes (problema P-01)

O bot atual tem **três fontes** respondendo às mesmas perguntas sem prioridade definida:

```
Mensagem do usuário
       ↓
[1] itaBotKnowledge[]     ← array de objetos com keywords[]
       ↓ (se não encontrou)
[2] RESPOSTAS{}           ← objeto com respostas estáticas por chave string
       ↓ (se não encontrou)
[3] FAQs carregados       ← populado assincronamente em RESPOSTAS{}
       ↓ (se não encontrou)
[4] _buscarSabor()        ← busca em sorvetes (ignora contexto de picolé)
       ↓ (se não encontrou)
Fallback genérico
```

**Problema:** `itaBotKnowledge[]` é verificado ANTES de `RESPOSTAS{}`, mas `RESPOSTAS{}` é populado pelos FAQs JSON. Se um FAQ contiver a mesma chave que `itaBotKnowledge`, a versão do `itaBotKnowledge` vence — sem transparência.

### 1.2 Problema do Ovomaltine (P-02, P-03)

```
Usuário: "Quanto custa o picolé de Ovomaltine?"
       ↓
_itabotGetResp() → verifica: l.indexOf('sorvete de') || /\btem\b/.test(l)
       ↓
NÃO ENTRA no branch do _buscarSabor() inicial
       ↓
Verifica itaBotKnowledge[] → sem match para "picole ovomaltine"
       ↓
Verifica RESPOSTAS{} → match em "ovomaltine" → retorna resposta ESTÁTICA
       ↓
RESPOSTAS['ovomaltine'] = '🍦 Sim! Temos sorvete de Ovomaltine...' (resposta de SORVETE)
       ↓
❌ Preço incorreto — usuário perguntou sobre PICOLÉ, bot responde com sorvete
```

### 1.3 Localização do FAQ residual em index.html

O `index.html` contém um objeto `FAQ_BOT` com respostas estáticas **dentro da página**. Este FAQ compete com o `ita-bot-widget.js`. Antes do Lote A, mapear exatamente quais chaves existem em ambos.

---

## 2. MAPA DE FONTES OFICIAIS

| Entidade | Fonte oficial atual | Arquivo | Chave JSON | Status |
|---|---|---|---|---|
| Sabores de sorvete | `dados/produtos.json` | `sorvetes.sabores[]` | ✅ Único |
| Preços de sorvete | `dados/produtos.json` | `sorvetes.precos` / `sorvetes.preços` | ⚠️ Duplicado (com/sem acento) |
| Picolé Especiais preço varejo | `dados/produtos.json` | `picoles.leite_ninho.preco_varejo` | ✅ R$ 4,00 |
| Picolé Especiais preço atacado | `dados/produtos.json` | `picoles.leite_ninho.preco_atacado` | ✅ R$ 3,00 |
| Picolé Especiais preço varejo (acento) | `dados/produtos.json` | `picolés.leite_ninho.preço_varejo` | ⚠️ Duplicado |
| Picolé Especiais preço atacado (acento) | `dados/produtos.json` | `picolés.leite_ninho.preço_atacado` | ⚠️ Duplicado |
| Açaí preços | `dados/produtos.json` | `acai.copos` | ✅ Único |
| Milkshake preços | `dados/produtos.json` | `milkshake.tradicional` | ✅ Único |
| Taças preços | `dados/produtos.json` | `tacas.tradicionais` | ✅ Único |
| Horário de funcionamento | `dados/config.json` | `horarioAbre`, `horarioFecha` + `horarioStatusTexto` | ⚠️ `horarioStatusTexto` é TEXTO FIXO |
| Endereço | `dados/config.json` | `enderecoCompleto` | ✅ Único |
| WhatsApp | `dados/config.json` | `whatsapp` | ✅ Único |
| Instagram | `dados/config.json` | `instagramUrl` | ✅ Único |
| Promoção ativa | `dados/promo.json` | `ativo`, `titulo`, `descricao` | ✅ Único |
| FAQ cardápio | `dados/faq_cardapio.json` | `perguntas[].tags` + `resposta` | ⚠️ Duplica RESPOSTAS{} |
| FAQ encomendas | `dados/faq_encomendas.json` | `perguntas[].tags` + `resposta` | ⚠️ Duplica RESPOSTAS{} |
| FAQ horários | `dados/faq_horarios_localizacao.json` | `perguntas[].tags` + `resposta` | ⚠️ Duplica RESPOSTAS{} |
| FAQ sorteio | `dados/faq_sorteio_promocoes.json` | `perguntas[].tags` + `resposta` | ⚠️ Duplica RESPOSTAS{} |
| Encomendas mínimo | `dados/config.json` | `encomendaMinPicoles` (100 unidades) | ✅ Único |
| Aviso de prazo | `dados/config.json` | `encomendaAviso` | ✅ Único |

### Preços confirmados (NÃO ALTERAR)

| Produto | Varejo | Atacado | Fonte |
|---|---|---|---|
| Picolé Especial — Leite Ninho | R$ 4,00 | R$ 3,00 | `picoles.leite_ninho` e `picolés.leite_ninho` |
| Picolé Especial — Ovomaltine | R$ 4,00 | R$ 3,00 | Mesmo objeto (sabores: Leite Ninho, Ovomaltine) |

---

## 3. MAPA DE DEPENDÊNCIAS DOS ARQUIVOS

### 3.1 `scripts/ita-bot-widget.js`

```
Depende de (leitura):
  ├── dados/produtos.json    → preços sorvetes, açaí, milkshake, taças, picolés
  ├── dados/promo.json       → promoção ativa
  ├── dados/faq_cardapio.json         → popula RESPOSTAS{}
  ├── dados/faq_encomendas.json       → popula RESPOSTAS{}
  ├── dados/faq_horarios_localizacao.json  → popula RESPOSTAS{}
  └── dados/faq_sorteio_promocoes.json    → popula RESPOSTAS{}

Consumido por:
  ├── index.html             → <script defer src="scripts/ita-bot-widget.js">
  ├── encomendas.html        → <script defer src="scripts/ita-bot-widget.js">
  ├── promocao.html          → <script defer src="scripts/ita-bot-widget.js">
  ├── dicas.html             → <script defer src="scripts/ita-bot-widget.js">
  └── sobre.html             → <script defer src="scripts/ita-bot-widget.js">

Expõe globais:
  ├── window.abrirItaBot
  ├── window._itabotAbrirItaBot
  ├── window._itabotFecharChatDialog
  ├── window._itabotBtnInicio
  ├── window._itabotEnviarChat
  ├── window._itabotEnviarSug
  ├── window._itabotClicarChip
  ├── window._itabotInserirKeyword
  └── window._itabotHandleInputFocus
```

### 3.2 `index.html` (chatbot inline legado)

```
Contém (verificar antes do Lote A):
  ├── FAQ_BOT{}              → objeto estático com respostas inline
  ├── RESPOSTAS{}            → objeto estático sobreposto pelo widget
  ├── getResp() ou equivalente → função de matching inline
  └── Possível conflito com ita-bot-widget.js
```

**Antes do Lote A:** Verificar se `index.html` ainda contém um motor de respostas inline.
Se contiver: mapear todas as chaves e comparar com `ita-bot-widget.js` antes de remover.

### 3.3 `dados/produtos.json`

```
Consumido por:
  ├── scripts/ita-bot-widget.js (fetch assíncrono)
  ├── scripts/products.js (carregador de produtos)
  ├── index.html (renderTudo(), carregarPreçosNuvemCardápio())
  ├── encomendas.html (renderização de cardápio de encomendas)
  └── admin-painel.html (edição via admin)

Estruturas duplicadas que NÃO remover sem aprovação:
  ├── "picoles"  → chaves sem acento (consumido por ita-bot-widget.js)
  └── "picolés"  → chaves com acento (consumido por index.html render)
```

### 3.4 Dependências circulares e riscos

| Risco | Arquivo A | Arquivo B | Impacto |
|---|---|---|---|
| Respostas duplicadas | `ita-bot-widget.js` (RESPOSTAS{}) | `faq_*.json` (popula RESPOSTAS{}) | ALTO — sem prioridade |
| Chave `leite_ninho` representa dois sabores | `dados/produtos.json` | `ita-bot-widget.js` | MÉDIO — sem intenção Ovomaltine |
| FAQ_BOT vs ita-bot-widget | `index.html` (inline) | `ita-bot-widget.js` | A VERIFICAR |
| `picoles` vs `picolés` | Ambas as chaves | Products e widget | MÉDIO — manter sincronizadas |

---

## 4. MATRIZ DE INTENÇÕES

### 4.1 Intenções implementadas (funcionais)

| # | Intenção | Keywords principais | Fonte de resposta | Status |
|---|---|---|---|---|
| I-01 | Ver cardápio | cardapio, menu | `_respSorvetes()` (com submenu) | ✅ OK |
| I-02 | Ver sorvetes | sorvete, massa, bola, sabor | `_respSorvetes()` | ✅ OK |
| I-03 | Ver picolés | picol | `_respPicoles()` | ⚠️ Sem Ovomaltine |
| I-04 | Ver açaí | acai, açaí | `_respAcai()` | ✅ OK |
| I-05 | Ver milkshakes | milk, shake | `_respMilkshake()` | ✅ OK |
| I-06 | Ver taças/sobremesas | taca, taça, brownie, fondue | `_respTacas()` | ✅ OK |
| I-07 | Fazer encomenda | encomen, pedido, pedir, festa, caixa, torta | `_respEncomendas()` | ✅ OK |
| I-08 | Promoções | promo, oferta, desconto | `_respPromoAtiva()` | ✅ OK |
| I-09 | Localização/endereço | localizacao, endereco, onde, mapa | RESPOSTAS{} + itaBotKnowledge | ✅ OK |
| I-10 | Horário | horario, funciona, abre, fecha | RESPOSTAS{} + itaBotKnowledge | ⚠️ Texto fixo |
| I-11 | WhatsApp/contato | whatsapp, telefone, contato | RESPOSTAS{} + itaBotKnowledge | ✅ OK |
| I-12 | Atacado | atacado | RESPOSTAS{} | ✅ OK |
| I-13 | Delivery/entrega | delivery, entrega | RESPOSTAS{} | ⚠️ Sem CTA |
| I-14 | Falar com atendente | falar com atendente, humano | itaBotKnowledge | ✅ OK |
| I-15 | Fidelidade | fidelidade, pontos, cadastro | fluxo legado (encerrado) | ⚠️ Fluxo residual |

### 4.2 Intenções ausentes ou com falha (Lote A)

| # | Intenção | Problema | Prioridade Lote A |
|---|---|---|---|
| I-16 | **Picolé de Ovomaltine** | Não tem intenção dedicada — cai no sorvete | CRÍTICO |
| I-17 | **Sorvete de Ovomaltine** | `_buscarSabor()` encontra nos sorvetes, mas não confirma o contexto | ALTO |
| I-18 | **Ovomaltine (ambíguo)** | Pergunta "quanto custa Ovomaltine?" precisa de clarificação | CRÍTICO |
| I-19 | **Preço atacado picolé** | `_respPicoles()` não expõe atacado de forma clara | MÉDIO |
| I-20 | **Aberto agora (dinâmico)** | `horarioStatusTexto` é texto fixo | ALTO |
| I-21 | **Falha de FAQ** | Sem fallback robusto quando fetch falha | ALTO |
| I-22 | **Alergia/alergênicos** | Sem aviso de segurança alimentar | MÉDIO |
| I-23 | **Revenda** | Sem intenção específica | MÉDIO |
| I-24 | **Delivery com CTA** | Responde "não" sem oferecer próximo passo | MÉDIO |

---

## 5. ARQUITETURA PROPOSTA

### 5.1 Princípios

1. **Uma única fonte por dado:** Cada informação tem exatamente uma fonte oficial mapeada.
2. **Uma única camada de classificação:** O roteamento passa por um único fluxo de prioridade.
3. **Intenção específica antes de genérica:** "picolé Ovomaltine" > "Ovomaltine" > "sorvete".
4. **Dados dinâmicos separados de textos:** Preços vêm do JSON; textos explicativos ficam no widget.
5. **Fallback explícito:** Quando não há confiança suficiente, perguntar ou oferecer CTA.
6. **Sem inventar:** Jamais retornar preço ou dado sem verificação de fonte.

### 5.2 Fluxo de roteamento proposto (Lote A)

```
Mensagem do usuário
       ↓
1. Normalizar: remover acentos, caixa, pontuação, espaços extras
       ↓
2. Verificar contexto conversacional (_ctx)
       → se ctx ativo: usar handler de contexto
       ↓
3. Verificar INTENÇÕES ESPECÍFICAS (alta prioridade)
       ├── "picolé de ovomaltine"  → I-16: resposta picolé + preço picolé
       ├── "sorvete de ovomaltine" → I-17: resposta sorvete + preço sorvete
       ├── "ovomaltine" (sozinho)  → I-18: CLARIFICAÇÃO ("picolé ou sorvete?")
       ├── "picolé leite ninho"    → resposta picolé + preço picolé
       ├── "alergia","amendoim","gluten","lactose" → aviso segurança + CTA humano
       └── "delivery","entrega em casa" → resposta + CTA encomenda/localização
       ↓
4. Verificar itaBotKnowledge[] (intenções estruturadas)
       ↓
5. Verificar RESPOSTAS{} (respostas estáticas + FAQs carregados)
       ↓
6. Busca dinâmica em produtos.json (_buscarSabor com contexto)
       ↓
7. Fallback: "Não entendi. Posso ajudar com cardápio, preços, encomendas ou WhatsApp."
```

### 5.3 Regras de prioridade para "Ovomaltine"

```javascript
// Pseudo-código do roteamento proposto (Lote A)

// PRIORIDADE 1 — Picolé Ovomaltine (específico)
if (temPalavra('picol') && temPalavra('ovomaltine')) {
  return resposta_picole_ovomaltine(preco_varejo=4, preco_atacado=3);
}

// PRIORIDADE 2 — Sorvete Ovomaltine (específico)
if (temPalavra('sorvete') && temPalavra('ovomaltine')) {
  return resposta_sorvete_ovomaltine(); // busca em produtos.json
}

// PRIORIDADE 3 — Ovomaltine ambíguo (clarificação)
if (temPalavra('ovomaltine')) {
  return clarificacao("Você quer saber sobre o picolé ou o sorvete de Ovomaltine?");
}
```

---

## 6. MOTOR DE ROTEAMENTO

### 6.1 Normalização (já implementada, manter)

```javascript
function _norm(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
```

### 6.2 Melhorias planejadas para Lote A

| Melhoria | Descrição | Impacto |
|---|---|---|
| Intenção dedicada Ovomaltine picolé | Verificação de `picol` + `ovomaltine` antes do roteamento genérico | CRÍTICO |
| Clarificação para Ovomaltine ambíguo | Retornar pergunta em vez de preço incorreto | CRÍTICO |
| Prioridade explícita de fontes | Documentar em comentário qual fonte é verificada em cada passo | ALTO |
| Fallback de FAQ robusto | Manter respostas mínimas quando fetch falha | ALTO |
| Resposta de alergia com aviso | Template: "confirme com nossa equipe + CTA WhatsApp" | MÉDIO |
| Delivery com CTA completo | "Não fazemos delivery. Quer ver encomendas, localização ou WhatsApp?" | MÉDIO |

### 6.3 O que NÃO mudar no Lote A

- `dados/produtos.json` — preços e produtos preservados.
- `dados/faq_*.json` — conteúdo preservado.
- Estrutura `picoles` / `picolés` — não remover sem aprovação.
- Preços: Picolé Especiais R$ 4,00 varejo / R$ 3,00 atacado.
- Publicação em produção.

---

## 7. FLUXO DE DADOS

### 7.1 Dados carregados na inicialização

```
_itabotCarregarDados() → fetch paralelo:
  ├── dados/produtos.json → _prodData (sorvetes, açaí, milk, taças, picolés, acréscimos)
  └── dados/promo.json    → _promoData (promoção ativa)

FAQs (carregados assincronamente e mesclados em RESPOSTAS{}):
  ├── dados/faq_cardapio.json
  ├── dados/faq_encomendas.json
  ├── dados/faq_horarios_localizacao.json
  └── dados/faq_sorteio_promocoes.json
```

### 7.2 Fallback quando JSON indisponível

**Situação atual (problema P-06):** Se os FAQs falharem, `RESPOSTAS{}` fica com apenas as chaves estáticas definidas no widget. O bot continua funcionando, mas sem as perguntas dos FAQs.

**Situação proposta (Lote A):** Detectar falha de fetch e registrar sem expor ao usuário:

```javascript
fetch(url)
  .then(function(r) { return r.ok ? r.json() : Promise.reject('http-' + r.status); })
  .catch(function(err) {
    console.warn('[ita-bot] FAQ indisponível:', url, err); // sem dados sensíveis
    return null; // base mínima do widget permanece ativa
  })
  .then(function(faq) {
    if (!faq) return; // fallback silencioso para o usuário
    // ... popular RESPOSTAS{}
  });
```

---

## 8. TRATAMENTO DE FALHAS

### 8.1 Matriz de falhas e respostas

| Falha | Comportamento atual | Comportamento proposto |
|---|---|---|
| FAQ JSON indisponível | Bot usa apenas RESPOSTAS{} estático, sem aviso | Mesmo + log técnico sem dados sensíveis |
| FAQ JSON inválido | JSON.parse lança, `catch` retorna `null` | ✅ Já tratado (catch retorna null) |
| produtos.json indisponível | `_prodData = null`, funções usam fallback hardcoded | ✅ Já tratado (fallbacks de texto) |
| Resposta ambígua Ovomaltine | Retorna preço de SORVETE (incorreto) | Retornar clarificação |
| Horário "aberto agora" incorreto | Texto fixo não reflete hora real | Calcular via `horarioAbre`/`horarioFecha` do config.json |

### 8.2 Horário dinâmico (proposta para Lote C)

```javascript
// Usar dados/config.json:
// "horarioAbre": 10
// "horarioFecha": 22

function estaAberto(config) {
  if (!config || config.horarioAbre == null || config.horarioFecha == null) {
    return null; // não calcular sem dados confiáveis
  }
  var agora = new Date();
  var hora = agora.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false
  });
  var h = parseInt(hora, 10);
  return h >= config.horarioAbre && h < config.horarioFecha;
}

// Resposta:
// estaAberto == true  → "Estamos abertos agora — das 10h às 22h."
// estaAberto == false → "No momento estamos fechados. Abrimos às 10h."
// estaAberto == null  → "Nosso horário informado é das 10h às 22h. Confirme pelo WhatsApp."
```

---

## ENTREGÁVEIS DO LOTE 0 CONCLUÍDOS

| Entregável | Status | Arquivo |
|---|---|---|
| Relatório consolidado sem duplicação | ✅ | `RELATORIO.md` |
| Benchmark de 100 sites | ✅ | `docs/BENCHMARK.md` |
| Mapa de fontes oficiais | ✅ | Este arquivo (seção 2) |
| Mapa de dependências | ✅ | Este arquivo (seção 3) |
| Matriz de intenções | ✅ | Este arquivo (seção 4) |
| Arquitetura proposta | ✅ | Este arquivo (seção 5) |
| Motor de roteamento | ✅ | Este arquivo (seção 6) |
| Fluxo de dados | ✅ | Este arquivo (seção 7) |

## PRÓXIMOS PASSOS — AGUARDAM APROVAÇÃO

- [ ] Plano técnico detalhado do Lote A (`docs/PLANO-LOTE-A.md`)
- [ ] Testes automatizados do Lote A
- [ ] Implementação do Lote A (aguarda aprovação explícita)

---

*Documento de arquitetura — não implementar sem aprovação.*
