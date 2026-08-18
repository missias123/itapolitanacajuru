# Investigação do rótulo legado abaixo do ItaBot

## Causa raiz
O texto visível não estava no `index.html`. Ele era injetado dinamicamente por `scripts/ita-bot-widget.js`, na função `_itabotInjetarLauncher()`, dentro do HTML do launcher:

```html
<span class="itabot-launcher-question">Fale</span>
```

A regra visual associada estava no mesmo script, com `.itabot-launcher-question` e a animação `itabot-fale-pulse`.

## Histórico
O launcher com o rótulo pulsante foi implantado no commit `b39c263`, em `2026-08-18 19:55:21 +0000`, com a mensagem `feat: ItaBot mascote flutuante transparente com visor LED e FALE pulsante...`. Depois, a aparência foi atualizada no commit `55bc320`, em `2026-08-18 20:10:42 +0000`, com a mensagem `style(itabot): update FALE label to pulsing red...`.

## Correção planejada
Remover o nó visual `itabot-launcher-question`, retirar as regras CSS exclusivas do rótulo e atualizar o `aria-label` para não mencionar o texto legado. O botão do ItaBot e a tela de dúvidas permanecem funcionando.
