# Baseline da home — 20/08/2026

## Carregamento
A home local em `http://localhost:4174/index.html` carregou com conteúdo principal, navegação, cardápio, promoções e seção de encomendas visíveis.

## itaBot encontrado no DOM
O launcher real usa `#itabot-launcher` e aparece uma única vez na home. O robô é composto por `.itabot-launcher-robot` e `.itabot-launcher-image`. O painel LED usa `.itabot-launcher-led-panel` e `.itabot-launcher-led-track`, com o texto `DÚVIDA — CLIQUE AQUI •`.

A busca por seletores históricos (`#ita-bot-launcher`, `#ita-bot-trigger`, `#ita-bot-duvidas`, `.ita-bot-duvidas-btn`, `.itabot-btn`, `.itabot-launcher`, `.itabot-widget`) não encontrou elementos, o que mostra que testes antigos precisam ser atualizados para o identificador oficial atual e não deve ser interpretado como ausência do robô.

## Scripts carregados
A home carregou `site-loader.js`, `products.js` (duas referências com versões diferentes), `quality-guard.js`, `itap-icons.js`, `ita-bot-engine.js`, `ita-bot-widget.js`, `itap-device-adapter.js` e `gaveta-navegacao-mestra.js`, além de blocos inline e Google Tag Manager.

## Layout medido
Na viewport de 1280px, `document.documentElement.scrollWidth` foi 1265px, portanto não houve overflow horizontal. O launcher mediu aproximadamente 94x150px e o painel LED ficou abaixo do robô, dentro da área do botão.

## Legado no texto visível
A busca no texto do `body` não encontrou `Fidelidade`, `Itamandua` nem o texto antigo `Fale do antigo`.

## Ponto de atenção
A home carrega `products.js` duas vezes (com parâmetros de versão diferentes). Isso não provou bug nesta observação, mas é um candidato a duplicação para análise estática e funcional antes de remoção.

## Fonte
Resultados do DOM via navegador local, salvos em `console_outputs/exec_result_2026-08-20_17-12-49_577.txt` e `console_outputs/exec_result_2026-08-20_17-12-58_768.txt`.
