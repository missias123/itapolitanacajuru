# Auditoria World Class — Itapolitana Cajuru

## 16/08/2026 — Página inicial (localhost)

A página inicial carregou com `body.fueap-surface fueap-index itap-world cookie-banner-open`, sem overflow horizontal: `document.scrollWidth = clientWidth = 1265` no viewport lógico de 1280 px. O `main#conteudo-principal` ficou com 1201 px de largura e margem lateral de 32 px, coerente com o contêiner desktop. O header tem 181 px e está sticky com `z-index: 99999`; o footer tem 849 px. Os três modais principais estão ocultos e usam `position: fixed`, tela inteira e `z-index: 2147483000`, portanto não repetem o problema de botões da tela anterior ficando por cima.

Ponto de atenção: o navegador aberto para teste iniciou em viewport lógico de 1280 × 1100, portanto ainda é necessário validar larguras móveis por emulação/medição e testar a abertura real dos modais, especialmente no cardápio e no fluxo de encomendas.

## Integridade da marcação

O carrossel tinha a tag `<bodyclass=...>` malformada; ela foi corrigida para `<body class="fueap-surface fueap-carrossel itap-world">`. O script global agora percorre as páginas públicas e adicionou a camada visual também a `offline.html` e `politica-privacidade.html`.
