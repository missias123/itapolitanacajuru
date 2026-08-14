# Evidência de QA — botão único de sabores no cardápio

Data: 2026-08-13
Escopo: somente `index.html` / cardápio da página inicial.

## Correção aplicada

Foi removido o CTA duplicado `Ver sabores` injetado pela função `renderSorvetes()`. O botão principal existente no bloco do produto, `Ver 35 Sabores`, foi preservado. O link `Falar no WhatsApp` permanece separado.

## Validação local

URL: `http://127.0.0.1:8080/index.html?qa=single-flavor-button-20260813-3`

O DOM local mostrou, dentro de `#acc-sorvetes`:

- Um único botão de ação para sabores: `Ver 35 Sabores`.
- Um link separado: `Falar no WhatsApp`.
- Nenhum link duplicado `Ver sabores`.
- JavaScript inline compilado: `scripts_js=10 errors=0`.

Ao clicar no botão único:

- `focus: true`;
- painel do produto presente;
- botão Voltar presente;
- `scrollY: 0`;
- nenhum erro JavaScript.

Ao clicar no botão Voltar:

- `focus: false`;
- painel fechado;
- `scrollY: 0`;
- nenhum erro JavaScript.

## Integridade de outras abas

O diff local confirmou sem alterações: `encomendas.html`, `promocao.html`, `scripts/products.js`, `dados/produtos.json` e `admin-painel.html`.

## Observação de publicação

Esta evidência corresponde ao código local corrigido. A publicação oficial deve ser feita somente após revisar o diff e verificar o build do GitHub Pages; não considerar a correção como disponível no site público antes dessa confirmação.

## Backup

`index-before-single-flavor-button.html` e seu SHA-256 estão na mesma pasta de alterações.
