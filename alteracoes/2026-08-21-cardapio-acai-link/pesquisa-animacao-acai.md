# Padrão de animação do destaque Açaí Natureon

Foram selecionados três princípios para a implementação: usar movimento somente como acento do título, animar exclusivamente `transform` e `opacity`, e desativar movimento não essencial quando a pessoa ativar redução de movimento no dispositivo.

| Princípio | Aplicação no título |
|---|---|
| Acento seletivo | Apenas o Açaí Natureon recebe a entrada das frutinhas; o restante do hero permanece estável. |
| Desempenho | Duas frutinhas vetoriais leves usam deslocamento e opacidade, sem mudanças de dimensão, margem ou posição do layout. |
| Clareza | As frutinhas ficam no plano visual do título, mas não cobrem letras nem a área clicável. |
| Acessibilidade | `prefers-reduced-motion: reduce` elimina o salto e mantém somente o texto roxo estático. |

As escolhas seguem as recomendações de animações de acento e uso intencional de movimento do [Tubik Studio](https://tubikstudio.com/blog/web-animation/), animações compostas por `transform` e `opacity` do [Motion](https://motion.dev/magazine/web-animation-performance-tier-list) e redução de movimento da [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).
