# Atualização Oficial de Promoções e Sorteios — 2026/2027

Data: 2026-08-19

## Regra publicada

As inscrições para o sorteio da caixa de sorvete foram encerradas, com mais de 1.400 inscritos. As inscrições para o sorteio mensal de uma torta de sorvete já estão abertas exclusivamente pelo site oficial `itapolitanacajuru.com.br`, na aba Promoção. O primeiro sorteio será em janeiro de 2027.

## Arquivos sincronizados

- `scripts/ita-bot-widget.js`: tema visual do itaBot para Promoções e Sorteios.
- `scripts/ita-bot-engine.js`: respostas por palavras-chave e fallback.
- `dados/faq_sorteio_promocoes.json`: respostas de perguntas frequentes.
- `dados/promo.json`: configuração oficial consumida pelo site.
- `promocao.html`: banner, descrição, regras e formulário visíveis.
- `scripts/itap-promo.js`: confirmação de cadastro e texto do botão.

A orientação antiga para comentar no Instagram foi removida das fontes ativas; a participação é somente pelo site oficial.
- `index.html`: respostas legadas da homepage.

## Validação

- `node --check` executado nos três scripts JavaScript alterados.
- JSON de promoção e FAQ validado com `JSON.parse`.
- Teste de navegador em viewport móvel 360px concluído com sucesso.
- A página `promocao.html` e a resposta aberta do itaBot contêm: `mais de 1.400`, `torta de sorvete`, `inscrições já estão abertas`, `janeiro de 2027` e `itapolitanacajuru.com.br`.
- Nenhuma das mensagens antigas avaliadas apareceu no teste ativo.
