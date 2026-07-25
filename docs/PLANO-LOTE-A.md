# Plano Técnico — Lote A (Pré-implementação)

> Status: autorizado apenas para preparação em branch de teste após aprovação explícita
> Data: 2026-07-25

---

## 1) GATES OBRIGATÓRIOS ANTES DE IMPLEMENTAR

1. Classificar corretamente a alteração mobile em `scripts/ita-bot-widget.js`.
2. Corrigir benchmark para ondas relevantes (sem ranking inventado).
3. Resolver pendência de `AggregateRating` e `Review`.
4. Confirmar mapa de fontes oficiais.
5. Confirmar mapa de dependências.
6. Definir testes críticos antes da alteração.

---

## 2) LISTA DE ARQUIVOS DO LOTE A

### 2.1 Arquivos previstos para alteração (após aprovação)
- `scripts/ita-bot-widget.js`
- `tests/e2e/06-itabot.spec.js`

### 2.2 Arquivos de apoio documental
- `RELATORIO.md`
- `docs/ARQUITETURA-ITA-BOT.md`
- `docs/PLANO-SEO.md`
- `docs/BENCHMARK.md`

### 2.3 Fora de escopo no Lote A
- `dados/produtos.json`
- arquivos de pedidos/clientes
- `cloudflare-worker/*`
- dados administrativos

---

## 3) TESTES QUE SERÃO CRIADOS/EXECUTADOS

### 3.1 Testes funcionais críticos do bot
- picolé de leite ninho
- picolé de ovomaltine
- sorvete de ovomaltine
- pergunta ambígua “ovomaltine”
- preço varejo/atacado
- delivery
- encomenda
- revenda
- festa
- alergia
- horário
- localização
- atendimento humano

### 3.2 Testes de UX mobile obrigatórios
- campo visível com teclado aberto
- texto e cursor visíveis
- botão enviar acessível
- última mensagem não escondida
- sem salto excessivo
- sem rolagem horizontal
- sem perda de foco
- Android/Chrome
- iPhone/Safari
- retrato e paisagem

Se não houver dispositivo real: registrar como “validado em código/local; validação em dispositivo real pendente”.

---

## 4) PLANO DE ROLLBACK DO LOTE A

1. Commits atômicos por alteração.
2. Em falha, `git revert <sha>` da alteração específica.
3. Revalidar testes críticos do bot.
4. Confirmar que não houve alteração em preços/produtos/pedidos/clientes.

---

## 5) RESTRIÇÕES

Lote A não autorizado para:
- produção;
- alteração de preços;
- alteração de produtos;
- alteração de pedidos;
- alteração de clientes;
- alteração do Worker;
- alteração de dados administrativos.

---

## 6) SAÍDA ESPERADA

Após atualização documental e aprovação explícita:
- implementar em branch de teste,
- executar testes críticos,
- reportar evidências,
- aguardar nova aprovação antes de qualquer promoção para produção.
