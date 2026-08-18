# Validação da remoção do rótulo legado

A versão do script foi atualizada para `ita-bot-widget.js?v=20260818-fale-clean-1` nas 8 páginas HTML ativas.

Validação no navegador:

- `#itabot-launcher` existe e permanece clicável.
- `aria-label`: `Abrir ItaBot — Dúvidas`.
- O `innerHTML` contém somente o robô 3D, o visor LED e o ponto de estado.
- Não existe `itabot-launcher-question`.
- Não existe o texto visual `Fale` no launcher.
- O visor LED continua funcionando com mensagens como `SORVETE ARTESANAL`.
- O JavaScript passou em `node --check`.

A causa da imagem antiga era cache do navegador: o HTML usava a versão fixa `?v=20260818-respostas-fix`. A troca de versão forçou o carregamento da correção.
