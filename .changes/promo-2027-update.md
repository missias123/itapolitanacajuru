# Atualização Oficial de Promoções e Sorteios — 2026/2027

Data: 2026-08-19

## Regra publicada

As inscrições do sorteio de 2026 foram encerradas, com mais de 1.400 inscritos. Em 2027 haverá sorteio mensal de uma torta de sorvete. O cadastro será realizado exclusivamente pelo site `itapolitanacajuru.com.br`, na aba Promoção.

## Arquivos sincronizados

- `scripts/ita-bot-widget.js`: tema visual do itaBot para Promoções e Sorteios.
- `scripts/ita-bot-engine.js`: respostas por palavras-chave e fallback.
- `dados/faq_sorteio_promocoes.json`: respostas de perguntas frequentes.
- `dados/promo.json`: configuração oficial consumida pelo site.
- `promocao.html`: banner, descrição, regras e formulário visíveis.
- `scripts/itap-promo.js`: confirmação de cadastro e texto do botão.
- `index.html`: respostas legadas da homepage.

## Validação

- `node --check` executado nos três scripts JavaScript alterados.
- JSON de promoção e FAQ validado com `JSON.parse`.
- Teste de navegador em viewport móvel 360px concluído com sucesso.
- A página `promocao.html` e a resposta aberta do itaBot contêm: `mais de 1.400`, `torta de sorvete`, `itapolitanacajuru.com.br` e `2027`.
- Nenhuma das mensagens antigas avaliadas apareceu no teste ativo.
