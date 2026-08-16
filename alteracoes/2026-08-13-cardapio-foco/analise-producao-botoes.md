# Análise de Erro de Botões em Produção

URL: https://itapolitanacajuru.com.br/index.html?v=debug-buttons-missing-1

## Observação
Ao clicar no botão "Ver 38 Sabores" (índice 13) no site oficial, a tela não ativou o Modo Foco esperado. O cardápio expandiu apenas o accordion padrão, mas o conteúdo interno (os botões dos sabores) não foi renderizado ou permaneceu oculto.

## Suspeitas Técnicas
1. **Cache de Script**: O navegador pode estar usando uma versão antiga do `index.html` ou de `scripts/products.js` onde o Modo Foco ainda não existia ou o alias `produtos` não estava definido.
2. **Conflito de ID**: O Modo Foco depende do ID `acc-sorvetes`. Se o accordion histórico restaurado usar um ID diferente, a função `abrirSaboresInline` falha silenciosamente.
3. **Estilo Inline**: O Modo Foco usa `display: block !important`. Se houver um conflito de especificidade com as classes históricas restauradas, o painel pode não aparecer.

## Próximo Passo
Analisar o código do `index.html` restaurado e comparar os IDs dos botões e containers com as funções de script.
