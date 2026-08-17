## Evidência 1 — Encomendas e modal de sabores

Após a aplicação da FUEAP, a categoria **Sorvete em Caixa** abriu normalmente. Os quatro produtos apareceram em cards alinhados, com os botões “Escolher Sabores” preservados. Ao abrir a Caixa de 5 Litros, o modal exibiu os 38 sabores Tipo Artesanal em grid de três colunas na largura de desktop do navegador. Os itens mantiveram proporção quadrada, texto centralizado e espaçamento uniforme; o modal permaneceu contido com rolagem interna, sem rolagem horizontal da página de fundo. IDs, handlers e scripts foram preservados pelo fingerprint do aplicador.

Observação: a marcação colorida da captura pertence ao modo de inspeção do navegador, não ao site.

Fonte da evidência: `http://localhost:8080/encomendas.html?fueap=1`, screenshot gerado em 13/08/2026.

## Métricas reais do grid — viewport de teste

No viewport de teste de 1280 × 1100 CSS pixels, o modal mediu 650px de largura por 1040px de altura e o grid mediu 585px de largura. O grid apresentou 35 itens e três colunas computadas de 187px. A faixa de proporção dos itens foi exatamente `1.000–1.000`, confirmando quadrados matematicamente proporcionais. O documento registrou `scrollWidth = clientWidth = 1280`, portanto não houve overflow horizontal.

