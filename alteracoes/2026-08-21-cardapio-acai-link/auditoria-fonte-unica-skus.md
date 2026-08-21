# Auditoria de fonte única de SKUs

## Resultado

O arquivo `dados/produtos.json` já é a fonte oficial do catálogo e contém **198 SKUs de produtos**, além dos 38 sabores de massa e dos SKUs individuais de picolés. A página inicial e o fluxo de retirada já usam o adaptador `scripts/catalogo-mestre.js` e se aproximam do modelo desejado.

Foram encontrados dois pontos que ainda precisam de consolidação para que o painel administrativo controle todo o site sem listas paralelas.

| Área | Situação atual | Correção prevista |
|---|---|---|
| `encomendas.html` | Reconstrói catálogos de caixas, tortas, picolés, sabores e acréscimos em arrays locais. | Substituir os arrays por uma visão derivada de `cadastro_skus.por_chave`, preservando somente o estado do carrinho da página. |
| `admin-painel.html` | Possui grades de sabores e estoques codificadas no HTML e usa chaves de `localStorage` como reserva. | Transformar a gestão de disponibilidade em painel derivado de `dados/produtos.json`, com salvamento no mesmo arquivo oficial. |
| `admin-catalogo.html` | Já edita `cadastro_skus.por_chave` diretamente, mas não abrange embalagens nem dependências. | Estender para editar disponibilidade de produtos, sabores e embalagens no mesmo cadastro. |
| `scripts/catalogo-mestre.js` | Já propaga preço e status para caixas, tortas, picolés e sabores de massa. | Incluir status de açaís e bloqueio por embalagem dependente para todas as telas que usam o adaptador. |

## Modelo único proposto

O cadastro `cadastro_skus.por_chave` continuará sendo o único lugar para nome, tamanho, preço e disponibilidade. As cinco embalagens operacionais serão cadastradas como registros internos com SKU próprio, sem alterar a contagem dos 198 produtos vendáveis.

| Registro | Controle de esgotamento | Efeito no site |
|---|---|---|
| Produto vendável | `ativo: false` no SKU do produto | Tarja **Esgotado** e bloqueio do pedido daquele item. |
| Sabor de massa | `ativo: false` no SKU `MAS-xxx` | Bloqueia somente esse sabor em todos os itens de massa. |
| Sabor de picolé | `ativo: false` no SKU `PIC-xxx` | Bloqueia somente esse sabor de picolé. |
| Copo de açaí | `ativo: false` no SKU individual do copo | Bloqueia somente a receita fechada do copo. |
| Embalagem operacional | `ativo: false` no SKU interno `EMB-xxx` | Bloqueia todos os SKUs vendáveis declarados como dependentes da embalagem. |

## Dependências de embalagem confirmadas

| Embalagem interna | Produtos dependentes |
|---|---|
| `EMB-5L` | `CAX-5L_2S`, `CAX-5L_3S` |
| `EMB-10L` | `CAX-10L_2S`, `CAX-10L_3S` |
| `EMB-7B` | `ISO-07_` |
| `EMB-9B` | `ISO-09_` |
| `EMB-12B` | `ISO-12_` |

> A mudança de disponibilidade será sempre feita no painel administrativo e gravada em `dados/produtos.json`. As telas públicas lerão esse mesmo arquivo ao carregar, eliminando controles operacionais duplicados.
