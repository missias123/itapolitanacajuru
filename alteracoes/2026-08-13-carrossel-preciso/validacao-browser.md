# Validação no navegador — pré-visualização local

URL testada: `http://127.0.0.1:4173/index.html?preview=carousel-order-v1`

## Resultado visual observado

A captura da pré-visualização mostra o cabeçalho vermelho, a borda inferior amarela e o carrossel começando imediatamente abaixo da linha amarela. O restante da página vem depois do carrossel.

## Medições DOM no viewport da sandbox

| Verificação | Resultado |
|---|---:|
| Final do `.itap-header` | `199px` |
| Topo do `#itp-crs-wrap` | `199px` |
| Altura reservada do carrossel | `800px` |
| Início do `#strip-sensorial` | `1031px` |
| `src` do iframe | `carrossel.html` |
| Links `.itap-nav-btn` | `5` |
| Botão DÚVIDAS presente | `sim` |
| Largura total vs. viewport | `1265px` vs. `1265px` |
| Rolagem horizontal detectada | `não` |

Conclusão: no viewport testado, o carrossel está estruturalmente encostado ao término do header, sem duplicação e sem overflow horizontal.

## Capturas visuais

As capturas `preview-mobile-500.png` e `preview-desktop-1366.png` mostram o mesmo resultado: a linha amarela permanece no limite inferior do topo vermelho e o primeiro frame do carrossel começa imediatamente abaixo dela. Os seis controles do topo permanecem visíveis, sem o código CSS aparecendo como texto. O banner de cookies é uma camada existente da página, não foi criado nem alterado pela movimentação.

O Chromium headless reportou `ok=true`, sem erros de console, em todas as nove execuções solicitadas. Para as larguras de 320 a 414px, o modo headless reportou viewport efetivo mínimo de 500px; ainda assim, a checagem de overflow e ordem foi aprovada. As larguras 768, 1024, 1366 e 1920px foram medidas diretamente.
