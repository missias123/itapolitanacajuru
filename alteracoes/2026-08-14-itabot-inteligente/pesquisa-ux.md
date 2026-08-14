# Pesquisa de padrões de busca para o Ita Bot

## Fonte 1 — Baymard Institute

URL: https://baymard.com/blog/offer-autocomplete-suggestions-for-misspellings

A pesquisa relata que usuários dependem de sugestões de autocomplete durante a formulação de consultas e que erros pequenos de digitação podem fazer sugestões desaparecerem ou se tornarem irrelevantes. O artigo descreve quatro reações comuns: corrigir rapidamente o erro; gastar tempo tentando corrigir; mudar para a navegação por categorias; ou concluir que o produto não existe e abandonar a busca. A recomendação aplicável ao Ita Bot é manter sugestões relevantes mesmo quando a entrada tem erro, acento ausente, singular/plural diferente ou pequena troca de letras.

## Aplicação ao Ita Bot

1. Normalizar acentos, caixa, hífens e espaços.
2. Reconhecer singular/plural e formas sem acento, como “picolé”, “picole” e “picolés”.
3. Usar aliases oficiais por produto e categoria.
4. Oferecer chips de desambiguação quando a palavra for ampla, por exemplo “picolés no varejo”, “picolés no atacado” e “picolés esquimós”.
5. Nunca responder “não existe” apenas porque uma grafia contém erro; procurar primeiro por correspondência aproximada no catálogo oficial.
6. Quando não houver correspondência segura, informar que não encontrou e mostrar caminhos oficiais: Cardápio, Encomendas e WhatsApp.

As informações acima são princípios de UX extraídos da fonte citada; os produtos, preços e sabores devem continuar sendo obtidos exclusivamente dos arquivos oficiais do site.
