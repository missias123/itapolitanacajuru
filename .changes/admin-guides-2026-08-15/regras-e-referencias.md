# Regras de edição e anexos — Itapolitana Cajuru

## Princípio
O painel não pode criar estrutura, produto, botão, categoria ou formato que o site público não suporte. Toda alteração inválida deve bloquear o salvamento e informar o motivo em português brasileiro.

## Referências consultadas
- Shopify — Uploading and managing files: https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads
- Shopify — Product media types: https://help.shopify.com/en/manual/products/product-media/product-media-types
- Concrete CMS — Validating file uploads: https://documentation.concretecms.org/developers/security/validating-file-uploads

## Regras adaptadas ao site
- Imagens de banners: JPG, JPEG, PNG, WebP ou HEIC; recomendado 1536 × 1024 px, proporção 3:2, máximo de 250 KB conforme a regra já exibida no Admin.
- Imagem de promoção: JPG, JPEG, PNG ou WebP; recomendado 1200 × 900 px, proporção 4:3, máximo de 250 KB.
- Imagem de carrossel dedicado: JPG, JPEG, PNG ou WebP; recomendado 1536 × 1024 px, proporção 3:2, máximo de 250 KB.
- Nomes de arquivos: sem arquivo oculto iniciado por ponto, sem extensão incompatível e preferencialmente sem acentos ou símbolos especiais.
- Textos: manter UTF-8 e português brasileiro; preservar acentos, cedilha e nomes oficiais do catálogo. Cada campo respeita o maxlength definido pelo layout público.
- Preços: número positivo em reais; exibição brasileira em R$ 0,00; atacado nunca abaixo de R$ 1,80.
- Telefones e cadastros: somente DDD 16, conforme regra do projeto; nome e texto sem HTML ou scripts.
- Seleções e sabores: somente opções já existentes no catálogo do site; não permitir inclusão de estruturas novas.

## Comportamento esperado
A instrução de cada campo aparece logo abaixo dele. O contador mostra caracteres usados e limite. O erro aparece no próprio campo e no resumo de validação. Qualquer erro bloqueia os salvamentos conhecidos do Admin até a correção.
