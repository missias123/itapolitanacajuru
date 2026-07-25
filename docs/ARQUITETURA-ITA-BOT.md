# Arquitetura Ita Bot — Validação Pré-Lote A

> Status: planejamento validado com ajustes obrigatórios
> Data: 2026-07-25

---

## 1) ESTRATÉGIA ÚNICA DE ROTEAMENTO (CONFIRMADA)

Fluxo único obrigatório:
1. Normalização da mensagem.
2. Identificação de intenções críticas e específicas.
3. Consulta de fontes oficiais na ordem de prioridade definida.
4. Fallback controlado.
5. Pergunta de esclarecimento quando houver ambiguidade.

Sem múltiplos roteadores concorrentes para a mesma decisão.

---

## 2) MAPA DE FONTES OFICIAIS

| Dado | Fonte oficial |
|---|---|
| Produtos | `dados/produtos.json` |
| Preços | `dados/produtos.json` |
| Horários | `dados/config.json` |
| Promoções | `dados/promo.json` |
| Localização | `dados/config.json` |
| WhatsApp | `dados/config.json` |

Regras:
- não criar fontes paralelas para os mesmos dados;
- manter leitura consistente para evitar conflito entre respostas.

---

## 3) PRIORIDADE DE INTENÇÕES

Prioridade operacional:
1. Intenções específicas de produto/preço (inclui Ovomaltine).
2. Intenções de operação (delivery, encomenda, revenda, festa).
3. Intenções de segurança alimentar (alergia).
4. Intenções institucionais (horário, localização, atendimento humano).
5. Fallback com opções de continuidade.

Ambiguidade obrigatória:
- “Ovomaltine” sem contexto deve gerar pergunta de esclarecimento (picolé ou sorvete).

---

## 4) MAPA DE DEPENDÊNCIAS

| Arquivo | Dependências de leitura |
|---|---|
| `scripts/ita-bot-widget.js` | `dados/produtos.json`, `dados/promo.json`, `dados/config.json`, `dados/faq_*.json` |
| `index.html` | carrega `scripts/ita-bot-widget.js` |
| `encomendas.html` | carrega `scripts/ita-bot-widget.js` |
| `promocao.html` | carrega `scripts/ita-bot-widget.js` |
| `dicas.html` | carrega `scripts/ita-bot-widget.js` |
| `sobre.html` | carrega `scripts/ita-bot-widget.js` |

---

## 5) MATRIZ DE INTENÇÕES CRÍTICAS (PRÉ-LOTE A)

| Intenção | Resultado esperado |
|---|---|
| Picolé de Leite Ninho | resposta com preço de picolé especial |
| Picolé de Ovomaltine | resposta com preço de picolé especial |
| Sorvete de Ovomaltine | resposta de sorvete, sem confundir com picolé |
| Preço de varejo | resposta objetiva |
| Preço de atacado | resposta objetiva |
| Delivery | política atual + alternativa (retirada/encomenda/WhatsApp) |
| Encomenda | fluxo e CTA claros |
| Revenda | encaminhamento correto |
| Festa | encaminhamento correto |
| Alergia | aviso de segurança + atendimento humano |
| Horário | informação confiável |
| Localização | informação confiável |
| Atendimento humano | CTA direto para WhatsApp |

Preço a preservar:
- Picolé Especial varejo: **R$ 4,00**
- Picolé Especial atacado/encomendas: **R$ 3,00**

---

## 6) MATRIZ DE TESTES OBRIGATÓRIOS

Casos obrigatórios:
1. Picolé de Leite Ninho
2. Picolé de Ovomaltine
3. Sorvete de Ovomaltine
4. Preço de varejo
5. Preço de atacado
6. Delivery
7. Encomenda
8. Revenda
9. Festa
10. Alergia
11. Horário
12. Localização
13. Atendimento humano

Observação de validação:
- correção de teclado mobile: validado em código/local; validação em dispositivo real (Android/Chrome e iPhone/Safari, retrato/paisagem) ainda deve ser formalmente comprovada.

---

## 7) DECISÃO DE CONTROLE

Antes de implementar Lote A:
- confirmar classificação da alteração mobile;
- manter bloqueio de produção;
- implementar e testar somente em branch de teste após aprovação explícita.
