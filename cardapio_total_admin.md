# Integração Total: Nosso Cardápio -> Painel Admin

Este documento garante que todos os itens visíveis na seção "Nosso Cardápio" do site itapolitanacajuru.site sejam editáveis no Painel de Stock Management.

## 1. Estrutura de Produtos (Espelho do Cardápio)

| Categoria | Itens para o Admin |
| :--- | :--- |
| **Sorvetes** | Caixas 5L/10L (2 e 3 sabores), Sorvetes em Cone (1, 2 e 3 bolas), Tortas de Sorvete. |
| **Picolés** | Picolé de Frutas/Água, Picolé de Leite sem Recheio, Picolé de Leite com Recheio, Picolé de Leite Ninho, Picolé Esquimó. |
| **Açaí** | Açaí Promoção (8 variações), Açaí Personalizado (4 variações). |
| **Milkshakes** | Todos os 6 produtos da categoria Milkshake. |
| **Taças** | Todas as 8 variações de Taças Tradicionais. |
| **Taças Premium** | Todas as 7 variações de Taças Premium. |

## 2. Correções de Layout e Funcionalidade

*   **Botões de Encomenda:** Alinhamento horizontal no fluxo inicial; empilhamento vertical (2 linhas de distância) no checkout final.
*   **Botão "Escolher Sabores":** Substituir "Sem avaliação" em todos os itens de Milkshakes e Taças.
*   **Padronização:** Sabores de picolés no cardápio idênticos aos da aba de encomendas.

## 3. Instrução Técnica
O Painel Admin deve carregar dinamicamente todos os itens listados acima, permitindo a alteração de **Preço** e **Status de Stock** (Disponível/Indisponível).
