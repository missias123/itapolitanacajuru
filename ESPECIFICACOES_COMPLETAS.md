# 🌟 ESPECIFICAÇÕES COMPLETAS — SISTEMA DE ESTRELA DOURADA ITAPOLITANA CAJURU

**Data de Criação:** 16/04/2026  
**Status:** EM IMPLEMENTAÇÃO  
**Responsável:** Manus Agent

---

## 📋 ÍNDICE

1. [Regra Absoluta](#regra-absoluta)
2. [Sistema de Horários](#sistema-de-horários)
3. [Duração e Expiração](#duração-e-expiração)
4. [Validação de Códigos](#validação-de-códigos)
5. [Geração Automática](#geração-automática)
6. [Painel Admin](#painel-admin)
7. [Segurança](#segurança)
8. [Fluxo Completo](#fluxo-completo)

---

## 🔴 REGRA ABSOLUTA

### Alteração só é "feita" quando está publicada ao vivo

**Fluxo obrigatório após qualquer modificação:**

```
1. Editar arquivo local
2. Auditar JS: cd /home/ubuntu/repo_ita && python3 auditar.py
3. git add <arquivo> && git commit -m "descrição" && git push origin main
4. Aguardar ~90s e verificar ao vivo no browser
```

**NUNCA encerrar uma tarefa sem confirmar no browser que a mudança está visível no site.**

---

## 🕐 SISTEMA DE HORÁRIOS

### Regra Principal: NUNCA REPETIR NADA DURANTE O ANO TODO

| Aspecto | Especificação |
|---------|---------------|
| **Período** | 365 dias (01/01 a 31/12) |
| **Horários** | 365 horários aleatórios e ÚNICOS |
| **Repetição** | ZERO repetição durante todo o ano |
| **Geração** | Automática apenas no dia 01/01 |
| **Próximos Anos** | Novos 365 horários gerados no 01/01 seguinte |

### Geração de Horários

- **Algoritmo:** Gerar 365 horários aleatórios (HH:MM) sem repetição
- **Formato:** `"00:00"` a `"23:59"`
- **Armazenamento:** `estrelas_ciclo.json` → `horariosDia`
- **Estrutura:**
  ```json
  {
    "horariosDia": {
      "2026-01-01": {"hora": "14:32", "status": "disponivel", "capturadoPor": null},
      "2026-01-02": {"hora": "08:15", "status": "disponivel", "capturadoPor": null},
      ...
    }
  }
  ```

---

## ⏱️ DURAÇÃO E EXPIRAÇÃO

### Quando a Estrela Aparece

| Evento | Ação |
|--------|------|
| **Horário Agendado** | Estrela aparece no site (banner + botão "Reivindicar") |
| **Contagem Regressiva** | Banner mostra "02:00" → "01:59" → ... → "00:00" |
| **Após 2 minutos** | Estrela desaparece automaticamente |
| **Cliente não consegue** | Capturar após os 2 minutos |

### Validação de Expiração

```javascript
// Na fidelidade.html - função processarTokenEstrela()
if (estrela.horaAparicao) {
  const aparicao = new Date(estrela.horaAparicao);
  const agora = new Date();
  const tempoDecorrido = (agora - aparicao) / 1000; // segundos
  if (tempoDecorrido > 120) { // 2 minutos = 120 segundos
    console.warn('⏰ Estrela expirou!');
    return false; // Rejeita captura
  }
}
```

---

## 🔐 VALIDAÇÃO DE CÓDIGOS

### Regra: Reconhecer, Avisar e Dar Baixa

| Cenário | Ação |
|---------|------|
| **Código válido (1ª vez)** | ✅ Aceita, ganha 1 ponto, marca como "usado" |
| **Código já usado (2ª vez)** | ❌ Rejeita com mensagem "Código já foi utilizado" |
| **Código inexistente** | ❌ Rejeita com mensagem "Código inválido" |
| **Registro de Tentativas** | 📝 Sistema registra tentativas de fraude |

### Implementação

```javascript
// Na fidelidade.html - função validarCodigo()
async function validarCodigo(codigo) {
  // 1. Verificar se código existe
  if (!codigosGerados.includes(codigo)) {
    alert('❌ Código inválido');
    return false;
  }
  
  // 2. Verificar se já foi usado
  if (codigosUsados.includes(codigo)) {
    alert('⚠️ Este código já foi utilizado');
    // Registrar tentativa de fraude
    registrarTentativaFraude(codigo, clienteAtual.cel);
    return false;
  }
  
  // 3. Marcar como usado
  codigosUsados.push(codigo);
  clienteAtual.pontos += 1;
  
  // 4. Salvar no GitHub
  await salvarDados();
  
  return true;
}
```

---

## 🤖 GERAÇÃO AUTOMÁTICA

### Geração de Códigos: Ilimitada

| Aspecto | Especificação |
|---------|---------------|
| **Limite** | NENHUM — gerar quantos quiser |
| **Quantidade** | Você clica "Gerar" e escolhe quantos (100, 200, 500, etc.) |
| **Validação** | Sistema reconhece apenas os gerados naquela leva |
| **Baixa** | Automática quando cliente valida o código |

### Geração de Horários: Automática no 01/01

| Evento | Ação |
|--------|------|
| **01/01 00:00** | Sistema detecta mudança de ano |
| **Geração** | Cria 365 novos horários aleatórios e únicos |
| **Zera Histórico** | Limpa todas as capturas do ano anterior |
| **Novo Ciclo** | Começa o novo ciclo de 365 dias |

### Script de Geração

```python
# gerar_horarios_aleatorios.py
def gerar_horarios_ano(ano):
  horarios = set()
  while len(horarios) < 365:
    hora = random.randint(0, 23)
    minuto = random.randint(0, 59)
    horarios.add(f"{hora:02d}:{minuto:02d}")
  
  resultado = {}
  for dia in range(1, 366):
    data = f"{ano}-{mes:02d}-{dia:02d}"
    resultado[data] = {
      "hora": horarios[dia-1],
      "status": "disponivel"
    }
  
  return resultado
```

---

## 📊 PAINEL ADMIN

### Aba: Configuração da Estrela do Dia

#### Tabela 1: Histórico de Capturas (Verde)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| **Data** | date | 14/04/2026 |
| **Horário Aparição** | time | 12:06 |
| **Capturado Por** | text | Nome do cliente |
| **Celular** | tel | Número WhatsApp |
| **Capturado Em** | datetime | 14/04/2026, 12:06:45 |
| **Ações** | buttons | 🗑️ Excluir |

**Botão 🗑️ Excluir:** Remove o registro de captura completamente (nome some da tabela).

#### Tabela 2: Cronograma de Aparição (Laranja)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| **Data** | date | 14/04/2026 |
| **Horário** | time | 12:06 |
| **Status** | badge | 🟡 Disponível / ✅ Capturada |
| **Capturado Por** | text | Nome do cliente (se capturada) |
| **Ações** | buttons | 🔄 Resetar / 🗑️ Deletar |

**Botão 🔄 Resetar:** Volta o status para "Disponível" (cliente pode capturar novamente).  
**Botão 🗑️ Deletar:** Remove a estrela do dia completamente.

#### Botões Globais

| Botão | Ação |
|-------|------|
| **🚨 BOTÃO DE PÂNICO** | Desativa a estrela de HOJE imediatamente |
| **🔄 Atualizar Agora** | Recarrega dados do GitHub em tempo real |

---

## 🛡️ SEGURANÇA

### Proteção Anti-Robô

- **Botão "Reivindicar Estrela":** Cliente deve clicar fisicamente (não automático)
- **Atraso Aleatório:** 500ms a 2s antes de processar a captura
- **Validação de Clique:** Sistema verifica se foi clique humano

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Nota:** Regras públicas são necessárias para o site funcionar sem login. Dados de fidelidade não são sensíveis (não contêm informações bancárias).

### Proteção contra Fraude

- **Tentativas de Código Duplicado:** Registradas e alertadas
- **Tentativas de Código Inexistente:** Registradas
- **Histórico de Fraudes:** Visível no painel admin
- **Exclusão Permanente:** Cliente que fraudar é excluído do programa

---

## 🔄 FLUXO COMPLETO

### Dia 01/01 (Início do Ano)

```
1. Sistema detecta 01/01 00:00
2. Gera 365 horários aleatórios e únicos
3. Zera histórico de capturas do ano anterior
4. Salva no estrelas_ciclo.json
5. Novo ciclo começa
```

### Cada Dia do Ano (01/01 a 31/12)

```
1. Horário agendado chega (ex: 14:32)
2. Estrela aparece no site
3. Banner mostra "02:00" com contador regressivo
4. Cliente tem 2 minutos para clicar "Reivindicar"
5. Se clicar: captura é registrada, nome aparece no painel admin
6. Se não clicar: após 2 minutos, estrela some
7. Próxima estrela aparece no dia seguinte em horário diferente
```

### Validação de Código

```
1. Cliente clica "Inserir Código"
2. Digita o código do cupom
3. Sistema verifica:
   - Código existe? ✅ Sim → Continua
   - Código já foi usado? ❌ Sim → Rejeita com aviso
   - Código é válido? ✅ Sim → Aceita, ganha 1 ponto
4. Marca código como "usado" no banco de dados
5. Atualiza pontos do cliente
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Gerar 365 horários aleatórios e únicos para 2026
- [ ] Implementar lógica de expiração de 2 minutos na fidelidade.html
- [ ] Adicionar botão 🗑️ Excluir na tabela de histórico (painel admin)
- [ ] Adicionar botão 🔄 Atualizar Agora na aba de Estrela Dourada
- [ ] Implementar validação de códigos (duplicado, inexistente)
- [ ] Registrar tentativas de fraude
- [ ] Implementar geração automática de horários no 01/01
- [ ] Testar fluxo completo ao vivo
- [ ] Publicar no GitHub Pages
- [ ] Confirmar no browser

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar tudo** conforme este documento
2. **Auditar JS** antes de publicar
3. **Publicar no GitHub**
4. **Testar ao vivo** por 2 minutos
5. **Confirmar funcionamento** no painel admin
6. **Documentar** qualquer desvio

---

**Última Atualização:** 16/04/2026 às 23:59  
**Próxima Revisão:** Após implementação completa
