# Auto-correções determinísticas — 25/08/2026

## Objetivo

Aplicar somente correções determinísticas alinhadas à `RULES.md`, com backup, validação local e publicação reversível. A rotina não altera clientes, pedidos, reservas, secrets ou campanha ativa.

## Correções aplicadas

| Área | Resultado |
|---|---|
| Navegação mobile | Cinco botões; Feedback em linha própria; demais quatro em 2x2; 56px em 390/430px, 54px até 380px, gaps ampliados e bordas de 2px. |
| ItaBot | Um launcher; posição fixa; LED normal `DÚVIDAS · CLIQUE AQUI`; tema separado `Como funciona: Encontre um Picolé`; sincronização dinâmica com os campos do admin. |
| Promoção | Chamada `ENCONTRE UM PICOLÉ`; janela de exatos 5 segundos; primeiro clique válido; um vencedor diário; formulário exclusivo; retirada presencial e sem delivery. |
| Admin ↔ Site | Matriz corrigida para validar o widget dinâmico; gate aprovado. |
| Auto-correção | `scripts/auto-corrigir-regras.js --check` idempotente; segunda execução não gera alterações adicionais. |
| Build | Manifest raiz e workspace PNPM corrigidos; trigger não-prod do Workers Builds alterado para `npx wrangler deploy --env production --dry-run`. |

## Validação

- `node --check`: aprovado.
- `quality-audit --fail`: aprovado, média 99/100, com um aviso não crítico de imagem PNG/JPEG em `promocao.html`.
- `dependency-audit`: aprovado.
- `admin-espelho-gate`: aprovado.
- CDP local: aprovado em 390, 430, 768 e 1280px; sem overflow; um launcher; tema de Picolé presente; formulário direto de Dúvidas presente.
- `pnpm install --frozen-lockfile`: aprovado.
- Dry-run Wrangler: aprovado; `PICOLE_RESERVA_DO`, `PROMO_KV` e os demais bindings foram reconhecidos.
- A auditoria semanal permanece bloqueada somente porque `https://api.itapolitanacajuru.com.br/api/promocao/picole/status` ainda responde 404. Nenhum envio real foi feito.

## Segurança operacional

O trigger de produção continua com `npx wrangler deploy` para aplicar a migration do Durable Object somente após merge na `main`. O trigger de branches não-prod faz dry-run e não altera o Worker público. A promoção não deve ser divulgada como ativa até o endpoint público responder HTTP 200 com JSON válido e os testes server-side serem concluídos.
