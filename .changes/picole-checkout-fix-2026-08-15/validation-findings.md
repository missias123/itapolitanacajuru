# Correção do checkout de picolés — 15/08/2026

## Causa raiz

Os botões `+` e `−` dos sabores de picolé chamavam `window.addPicole()`, mas o contador era renderizado com um `id` literal incorreto: `q-' + key + '`. Assim, `document.getElementById('q-' + key)` retornava `null` e o primeiro clique interrompia a função ao tentar atualizar `textContent`.

## Correção aplicada

O contador passou a ser renderizado com interpolação correta dentro do template literal:

```html
<span id="q-${key}">...</span>
```

Nenhuma regra de estoque, mínimo de 100 unidades, fluxo de carrinho ou validação do formulário foi removida.

## Auditoria automatizada

O teste `audit_all_clickables.py` foi executado em viewport móvel de 393 × 852 px e aprovou **24/24 verificações**, sem erros de JavaScript:

| Área validada | Resultado |
|---|---:|
| Handlers públicos existentes | Aprovado |
| Abertura isolada das três categorias | Aprovado |
| Modal de caixas e seleção de sabores | Aprovado |
| Modal de torta e seleção de sabores | Aprovado |
| Modal de picolés e 33 botões `+` ativos | Aprovado |
| Incremento e decremento por sabor | Aprovado |
| Lote mínimo de 100 unidades | Aprovado |
| Bloqueio abaixo de 100 unidades | Aprovado |
| Confirmação no carrinho | Aprovado |
| Edição e exclusão de item | Aprovado |
| Formulário progressivo: nome, endereço e WhatsApp | Aprovado |
| Ciência do prazo e liberação do envio | Aprovado |
| Erros JavaScript capturados | 0 |

## Painel de qualidade

O painel estático continua em **100/100 para todas as páginas**, incluindo `encomendas.html`, com **0 itens críticos**.

## Arquivos

- `encomendas.html`: correção do `id` do contador.
- `audit_all_clickables.py`: auditoria abrangente dos elementos clicáveis.
- `clickable-audit-results.json`: resultado objetivo, 24/24 aprovados.
- `verify_picole_checkout.py`: teste específico do fluxo de compra de picolés.
- `checkout-results.json`: resultado específico, 11/11 aprovados.
