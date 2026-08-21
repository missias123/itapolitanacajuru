# Padrões aplicados à galeria visual do Açaí Natureon

As referências consultadas convergem em três decisões aplicáveis ao catálogo visual: a experiência deve tratar celular como layout próprio, sem apenas reduzir um desktop; a galeria deve preencher a área útil com uma moldura discreta; e cada imagem deve manter proporção natural, sem caber por força em largura ou altura.

| Decisão | Aplicação no modal |
|---|---|
| Área útil da tela | O modal usa o viewport com margens responsivas em telas médias e grandes; em celular, ocupa a tela com áreas seguras. |
| Proporção da mídia | Cada página do PDF usa `width: 100%`, `height: auto`, `object-fit: contain` e uma razão de aspecto explícita de 1200:1697. |
| Ritmo de leitura | Uma página por vez na coluna de leitura, com largura máxima calculada para não transformar o PDF em uma faixa excessivamente alta. |
| Moldura e fundo | Fundo escuro neutro e contêiner claro, com sombra suave e borda discreta para separar a imagem do entorno sem competir com o cardápio. |

Fontes consultadas: [Five Star – menus móveis](https://www.fivestarplugins.com/how-to-create-mobile-friendly-restaurant-menus/) e [Sirv – visualização em modal](https://sirv.com/help/articles/open-gallery-in-a-modal-popup/).
