# Auditoria visual do catálogo de picolés

Data: 2026-08-13
URL testada: http://127.0.0.1:8000/encomendas.html?auditoria=fonte-unica-20260813-1

## Evidências observadas no navegador

A página local carregou o modal real de picolés e exibiu quatro categorias:

- Base Água / Frutas (R$ 1,80): Abacaxi, Caju, Goiaba, Groselha, Limão, Melância, Uva, Tamarindo.
- Recheados (R$ 2,00): Açaí, Blue Ice (Algodão Doce Azul), Caraxi, Coco Branco, Chocolate, Amarena (Cereja Italiana), Leite Condensado, Mamão Papaia, Maracujá, Morango, Menta com Chocolate, Nata com Goiaba, Coco Queimado, Milho Verde, Amendoim, Pistache.
- Esquimós (R$ 6,00): Bombom, Nutella, Ovomaltine, Leite Ninho, Nata, Morango, Brigadeiro, Prestígio.
- Especiais (R$ 3,00): Leite Ninho, Ovomaltine.

Os quatro sabores indevidos vistos anteriormente na imagem do usuário — Trufado Especial, Romeu e Julieta, Sensação Trufada e Maracujá Trufado — não apareceram nesta versão local testada.

## Divergência encontrada

O navegador exibiu "Melância" na categoria Base Água / Frutas, enquanto a lista oficial fornecida pelo usuário usa "Melancia". Essa diferença de grafia ainda precisa ser corrigida e validada.

## Regras observadas

A tela exibiu mínimo de 100 unidades no total, máximo de 25 por sabor, preço unitário e subtotal individual por sabor. A disponibilidade visual apareceu como "Estoque da categoria: 200" para os sabores, o que deve ser confirmado contra o estoque oficial para evitar apresentar estoque agregado como se fosse estoque individual.

## Conclusão desta etapa

A versão local atualmente testada não reproduz os quatro sabores indevidos da captura anterior. Não é possível afirmar ainda que o site publicado esteja corrigido, pois esta evidência é apenas do servidor local. Também não foi feita alteração nesta etapa da auditoria.

