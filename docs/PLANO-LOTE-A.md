# Plano Técnico — Lote A

> **Status:** Aguardando aprovação — NÃO IMPLEMENTAR SEM CONFIRMAÇÃO EXPLÍCITA
> Branch: copilot/valores-estao-erraods | Data: 2026-07-25

---

## ÍNDICE

1. [Escopo aprovado do Lote A](#1-escopo-aprovado-do-lote-a)
2. [Mapa de arquivos afetados](#2-mapa-de-arquivos-afetados)
3. [Mapa de dependências por alteração](#3-mapa-de-dependências-por-alteração)
4. [Mudanças planejadas — descrição técnica](#4-mudanças-planejadas--descrição-técnica)
5. [Diff planejado — pseudocódigo](#5-diff-planejado--pseudocódigo)
6. [Testes automatizados planejados](#6-testes-automatizados-planejados)
7. [Testes manuais obrigatórios](#7-testes-manuais-obrigatórios)
8. [Plano de rollback](#8-plano-de-rollback)
9. [Critérios de aprovação do Lote A](#9-critérios-de-aprovação-do-lote-a)

---

## 1. ESCOPO APROVADO DO LOTE A

✅ Autorizado:
- Consolidar o roteamento de respostas em um único fluxo com prioridade explícita.
- Criar intenção específica para "picolé Ovomaltine".
- Diferenciar "picolé de Ovomaltine" de "sorvete de Ovomaltine".
- Corrigir fallback de preços do picolé quando JSON não carrega.
- Remover ou sincronizar o FAQ_BOT residual (somente após mapear consumidores).
- Criar testes automatizados para as frases críticas antes de alterar o código.

❌ NÃO autorizado no Lote A:
- Alterar `dados/produtos.json`.
- Alterar preços.
- Alterar pedidos, clientes ou dados comerciais.
- Publicar em produção.
- Iniciar Lotes B, C, D, E ou F.
- Alterar a arquitetura definitiva sem relatório.

---

## 2. MAPA DE ARQUIVOS AFETADOS

| Arquivo | Tipo de alteração | Risco | Aprovação prévia |
|---|---|---|---|
| `scripts/ita-bot-widget.js` | Modificar `_itabotGetResp()` — adicionar intenções de Ovomaltine | MÉDIO | Este plano |
| `scripts/ita-bot-widget.js` | Adicionar fallback de picolé quando `_prodData` é null | BAIXO | Este plano |
| `scripts/ita-bot-widget.js` | Adicionar tratamento de erro nos fetch de FAQ | BAIXO | Este plano |
| `index.html` | **VERIFICAR APENAS** se contém FAQ_BOT residual — não alterar ainda | N/A | Depende do mapa |
| `tests/e2e/06-itabot.spec.js` | Adicionar casos de teste Ovomaltine, picolé, atacado, FAQ | BAIXO | Próprio |

**Arquivos que NÃO serão tocados:**
- `dados/produtos.json`
- `dados/promo.json`
- `dados/faq_*.json`
- `dados/config.json`
- `cloudflare-worker/`
- `encomendas.html`
- Qualquer arquivo de pedidos, clientes ou autenticação

---

## 3. MAPA DE DEPENDÊNCIAS POR ALTERAÇÃO

### 3.1 Intenção Ovomaltine (A-01)

```
scripts/ita-bot-widget.js
  └── _itabotGetResp(msg)         ← ALTERAR: adicionar branch antes do roteamento genérico
       ├── l.indexOf('picol') + l.indexOf('ovomaltine')  → NOVO: resposta picolé específica
       ├── l.indexOf('sorvete') + l.indexOf('ovomaltine') → NOVO: busca em sorvetes
       └── l.indexOf('ovomaltine') sozinho               → NOVO: clarificação
```

**Impacto:** Apenas `_itabotGetResp()` e os hardcoded `RESPOSTAS{}` existentes.
**Dependências externas:** `_prodData.picoles.leite_ninho` (produtos.json) — leitura apenas.
**Não quebra:** Nenhuma função existente é removida; apenas adicionados casos antes do fluxo atual.

### 3.2 Fallback de preço do picolé quando JSON não carrega (A-02)

```
scripts/ita-bot-widget.js
  └── _respPicoles()              ← ALTERAR: verificar _prodData com fallback explícito
       ├── if _prodData → usar dados do JSON
       └── if !_prodData → usar valores hardcoded dos preços aprovados
                           (Especiais: R$4,00 varejo / R$3,00 atacado)
```

**Impacto:** Apenas `_respPicoles()`. Fallback usa os preços aprovados, nunca inventados.

### 3.3 Fallback robusto de FAQ (A-03)

```
scripts/ita-bot-widget.js
  └── _itabotCarregarDados()      ← ALTERAR: adicionar log de erro sem dados sensíveis
       └── .catch(function(err) {
             console.warn('[ita-bot] FAQ indisponível:', arquivo, err.toString());
             return null;         // base mínima permanece
           })
```

**Impacto:** Apenas o bloco `.catch()` de cada fetch de FAQ. Sem impacto no comportamento normal.

### 3.4 FAQ_BOT residual no index.html (A-04 — PASSO PRÉVIO)

**Antes de qualquer alteração no index.html**, auditar:

```bash
grep -n "FAQ_BOT\|getResp\|responder\|function bot" index.html
```

Se encontrado:
1. Listar todas as chaves do `FAQ_BOT` em `index.html`.
2. Comparar com as chaves do `RESPOSTAS{}` em `ita-bot-widget.js`.
3. Identificar chaves duplicadas e chaves exclusivas.
4. Apresentar resultado ao usuário.
5. **Aguardar aprovação** antes de remover qualquer chave.

---

## 4. MUDANÇAS PLANEJADAS — DESCRIÇÃO TÉCNICA

### 4.1 A-01 — Intenção picolé de Ovomaltine

**Local:** `_itabotGetResp()` em `scripts/ita-bot-widget.js`
**Posição:** Antes da verificação de `itaBotKnowledge[]`

**Lógica:**
1. Normalizar a mensagem (já feito via `_norm()`).
2. Se contém `picol` E `ovomaltine`:
   - Retornar resposta de picolé Ovomaltine com preços corretos (R$4,00 / R$3,00).
3. Se contém `sorvete` E `ovomaltine`:
   - Buscar em `_prodData.sorvetes.sabores` e retornar preço de sorvete.
4. Se contém `ovomaltine` sem especificação:
   - Retornar pergunta de clarificação.
   - Definir contexto `_ctx` para aguardar resposta.

**Preços a usar (nunca alterar):**
- Picolé Especial Ovomaltine varejo: R$ 4,00
- Picolé Especial Ovomaltine atacado: R$ 3,00

### 4.2 A-02 — Fallback de picolé sem JSON

**Local:** `_respPicoles()` em `scripts/ita-bot-widget.js`

**Lógica:**
- Verificar se `_prodData` está disponível.
- Se não estiver: usar valores hardcoded aprovados como fallback.
- Adicionar CTA para WhatsApp com aviso de confirmação.

### 4.3 A-03 — Log de falha de FAQ sem dados sensíveis

**Local:** `_itabotCarregarDados()` — cada `.catch()` dos FAQs

**Lógica:**
- Adicionar `console.warn('[ita-bot] FAQ indisponível: ' + nomeArquivo)`.
- Não expor URL completa, tokens, dados de usuário ou stack trace com dados sensíveis.
- Retornar `null` para manter o fluxo normal de fallback.

---

## 5. DIFF PLANEJADO — PSEUDOCÓDIGO

### 5.1 A-01 em `_itabotGetResp()`

```javascript
// ANTES (linha aprox. 683):
function _itabotGetResp(msg) {
  var l = _norm(msg);
  // [verificação de contexto]
  // [itaBotKnowledge loop]
  // [RESPOSTAS loop]
  // [_buscarSabor]
  // [fallback]
}

// DEPOIS — adicionar ANTES do loop itaBotKnowledge:

  // ── PRIORIDADE ALTA: Ovomaltine (específico antes de genérico) ──
  var temPicol      = l.indexOf('picol')      !== -1;
  var temOvomaltine = l.indexOf('ovomaltine') !== -1;
  var temSorvete    = l.indexOf('sorvete')    !== -1 || l.indexOf('massa') !== -1;

  if (temOvomaltine) {
    if (temPicol) {
      // I-16: Picolé de Ovomaltine — preços corretos do Lote A
      return {
        texto: '🍦 O picolé especial de Ovomaltine custa R$\u00a04,00 no varejo e R$\u00a03,00 no atacado/encomendas.',
        sugs: ['Ver todos os picolés', 'Fazer encomenda', 'Falar no WhatsApp']
      };
    }
    if (temSorvete) {
      // I-17: Sorvete de Ovomaltine — busca no JSON
      var respSorveteOvo = _buscarSaborEspecifico('ovomaltine', 'sorvete');
      if (respSorveteOvo) return respSorveteOvo;
    }
    // I-18: Ovomaltine ambíguo — clarificação
    _ctx = 'clarificacao_ovomaltine';
    return {
      texto: 'Temos Ovomaltine no picolé e no sorvete! Você quer saber o preço de qual?',
      sugs: ['Picolé de Ovomaltine', 'Sorvete de Ovomaltine']
    };
  }
```

### 5.2 A-02 em `_respPicoles()`

```javascript
// ANTES:
function _respPicoles() {
  var p = _prodData && (_prodData.picoles || _prodData['picolés']);
  if (!p) return { texto: '🍦 Temos picolés especiais...' };
  // ...
}

// DEPOIS — fallback com preços aprovados:
function _respPicoles() {
  var p = _prodData && (_prodData.picoles || _prodData['picolés']);
  if (!p) {
    return {
      texto: '🍦 Temos picolés especiais, incluindo Leite Ninho e Ovomaltine, entre outros. ' +
             'O preço dos especiais é R$\u00a04,00 no varejo e R$\u00a03,00 no atacado/encomendas. ' +
             'Para o cardápio completo, consulte nosso WhatsApp.',
      sugs: ['Fazer encomenda', 'Falar no WhatsApp', 'Ver cardápio']
    };
  }
  // ... resto da função com dados do JSON
}
```

### 5.3 A-03 — Log de FAQ

```javascript
// ANTES (.catch em faq):
.catch(function () { return null; })

// DEPOIS:
.catch(function (err) {
  console.warn('[ita-bot] FAQ indisponível: ' + arquivo + ' — ' + (err && err.toString ? err.toString() : 'erro'));
  return null;
})
```

---

## 6. TESTES AUTOMATIZADOS PLANEJADOS

### 6.1 Casos a adicionar em `tests/e2e/06-itabot.spec.js`

| # | Entrada | Intenção esperada | Resposta esperada | Fonte |
|---|---|---|---|---|
| T-01 | "Quanto custa o picolé de Ovomaltine?" | I-16 picolé Ovomaltine | Contém "R$ 4,00" e "R$ 3,00" | `ita-bot-widget.js` (fallback) |
| T-02 | "quanto custa picole ovomaltine" | I-16 (sem acento, minúsculo) | Contém "4,00" e "3,00" | `ita-bot-widget.js` |
| T-03 | "Tem picolé de Ovomaltine?" | I-16 picolé Ovomaltine | Contém "Ovomaltine" e preço | `ita-bot-widget.js` |
| T-04 | "Quanto custa o Ovomaltine?" | I-18 clarificação | Contém "picolé" OU "sorvete" como opção | `ita-bot-widget.js` |
| T-05 | "Ovomaltine no atacado?" | I-16 ou I-18 | Contém "3,00" OU clarificação | `ita-bot-widget.js` |
| T-06 | "Quero encomendar Ovomaltine." | I-16 ou I-07 | Menciona encomenda ou preço atacado | `ita-bot-widget.js` |
| T-07 | "Quanto custa o picolé de Leite Ninho?" | Picolé Leite Ninho | Contém "4,00" e "3,00" | `dados/produtos.json` |
| T-08 | "Vocês fazem delivery?" | I-13 delivery | Contém "não" e CTA (encomenda/localização/WhatsApp) | `ita-bot-widget.js` |
| T-09 | "Sou alérgico" | I-22 alergia | Contém aviso de segurança e CTA WhatsApp | `ita-bot-widget.js` |
| T-10 | "Tem glúten?" | I-22 alergia/ingredientes | Contém aviso de segurança e CTA | `ita-bot-widget.js` |
| T-11 | "Onde fica?" | I-09 localização | Contém endereço ou link para mapa | `dados/config.json` |
| T-12 | "Está aberto agora?" | I-10 horário | Contém horário (10h e 22h) | `dados/config.json` |
| T-13 | "Tem atacado?" | I-12 atacado | Contém referência a atacado/encomenda | `ita-bot-widget.js` |
| T-14 | "Quero falar com alguém" | I-14 atendente | Contém link WhatsApp | `dados/config.json` |
| T-15 | "xyzfoo123 blabla inexistente" | I-45 fallback | Resposta de fallback + CTA | `ita-bot-widget.js` |
| T-16 | "picole ovomaltne" (erro ortográfico) | I-16 ou I-18 | Reconhece Ovomaltine | `ita-bot-widget.js` |
| T-17 | "PICOLÉ DE OVOMALTINE" (maiúsculas) | I-16 picolé | Contém "4,00" | `ita-bot-widget.js` |

### 6.2 Estrutura proposta para os novos testes

```javascript
test.describe('Ita Bot — Intenções críticas Lote A', () => {

  async function enviarMensagem(page, texto) {
    const input = page.locator('#duvidas-pergunta');
    await input.fill(texto);
    await input.press('Enter');
    await page.waitForTimeout(1200);
    return page.locator('#duvidas-resposta').textContent();
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookies_aceitos', 'true');
    });
    await page.goto('/');
    await page.waitForTimeout(1200);
    const botBtn = page.locator('.ita-bot-duvidas-btn, #ita-bot-trigger').first();
    await botBtn.click();
    await page.waitForTimeout(600);
  });

  // T-01
  test('picolé de Ovomaltine retorna preço correto R$4,00 / R$3,00', async ({ page }) => {
    const resposta = await enviarMensagem(page, 'Quanto custa o picolé de Ovomaltine?');
    expect(resposta).toMatch(/4[,.]00/);
    expect(resposta).toMatch(/3[,.]00/);
  });

  // T-04
  test('Ovomaltine ambíguo retorna clarificação', async ({ page }) => {
    const resposta = await enviarMensagem(page, 'Quanto custa o Ovomaltine?');
    expect(resposta.toLowerCase()).toMatch(/picol|sorvete/);
  });

  // T-08
  test('delivery retorna negativa com CTA', async ({ page }) => {
    const resposta = await enviarMensagem(page, 'Vocês fazem delivery?');
    expect(resposta.toLowerCase()).toMatch(/encomend|whatsapp|retirar|localiza/);
  });

  // T-15
  test('pergunta desconhecida retorna fallback com CTA', async ({ page }) => {
    const resposta = await enviarMensagem(page, 'xyzfoo123 blabla inexistente');
    expect(resposta.toLowerCase()).toMatch(/cardapio|encomen|whatsapp|ajud/);
  });

});
```

---

## 7. TESTES MANUAIS OBRIGATÓRIOS

### 7.1 Antes de aprovar o Lote A

| # | Cenário | Dispositivo | Resultado esperado |
|---|---|---|---|
| M-01 | "picolé de Ovomaltine" no celular Android | Android real | Preço correto + campo visível acima do teclado |
| M-02 | "sorvete de Ovomaltine" no celular iOS | iPhone real | Preço de sorvete correto |
| M-03 | "Ovomaltine" sem contexto | Celular | Pergunta de clarificação |
| M-04 | FAQ indisponível (simular offline) | Desktop | Bot funciona com fallback; sem erro na tela |
| M-05 | Segunda pergunta sem fechar teclado | iOS/Android | Input visível; teclado aberto |
| M-06 | Rotação de tela durante chat | Celular | Sem salto de layout; input visível |

---

## 8. PLANO DE ROLLBACK

### 8.1 Antes do Lote A

- [ ] Verificar que a branch `copilot/valores-estao-erraods` está atualizada.
- [ ] Confirmar o hash do último commit antes das alterações do Lote A.
- [ ] Não alterar `dados/produtos.json` nem nenhum arquivo de dados.

### 8.2 Durante o Lote A

- Cada mudança em um commit separado e atômico.
- Mensagem de commit: `lote-a: [A-01] intenção picolé Ovomaltine`.
- Não agrupar A-01, A-02, A-03 em um único commit.

### 8.3 Rollback de emergência

```bash
# Ver commits do Lote A:
git log --oneline -10

# Reverter o último commit do Lote A:
git revert HEAD

# Ou reverter um commit específico:
git revert <hash-do-commit>

# Em caso de múltiplos commits do Lote A:
git revert HEAD~3..HEAD
```

### 8.4 O que NÃO faz parte do rollback

- `dados/produtos.json` — não será alterado, portanto não precisa de rollback.
- `dados/faq_*.json` — não serão alterados.
- Produção — não será publicada.

---

## 9. CRITÉRIOS DE APROVAÇÃO DO LOTE A

### 9.1 Aprovado quando:

- [ ] Todos os 17 testes automatizados passam.
- [ ] T-01: "picolé de Ovomaltine" → R$ 4,00 varejo / R$ 3,00 atacado.
- [ ] T-04: "Ovomaltine" sem contexto → clarificação.
- [ ] T-08: "delivery" → resposta negativa com CTA.
- [ ] T-15: pergunta desconhecida → fallback com CTA.
- [ ] Sem regressão nos testes existentes em `06-itabot.spec.js`.
- [ ] Campo de digitação visível acima do teclado no celular.
- [ ] Sem erros de JavaScript no console.
- [ ] Sem preços inventados.
- [ ] Sem alteração em `dados/produtos.json`.

### 9.2 Bloqueado quando:

- [ ] Qualquer teste de Ovomaltine falha.
- [ ] Preço incorreto é retornado.
- [ ] Bot quebra quando FAQ indisponível.
- [ ] Há alteração em `dados/produtos.json` ou preços.
- [ ] Campo de digitação fica atrás do teclado.
- [ ] Publicação em produção realizada.

---

*Lote A aguarda aprovação explícita antes da implementação.*
