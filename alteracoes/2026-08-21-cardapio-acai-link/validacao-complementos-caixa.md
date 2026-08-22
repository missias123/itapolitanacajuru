# Validação ao vivo — caixa de 12 bolas com complementos

Data do teste: 22/08/2026.

Foi aberta a caixa de 12 bolas no fluxo **Peça e retire**. A distribuição de 8 unidades do primeiro sabor e 4 unidades do segundo sabor completou corretamente a soma de 12 de 12 bolas e liberou a ação de adicionar ao pedido.

Após a soma ser concluída, o bloco de complementos para viagem ficou visível. Foi adicionada uma unidade de complemento e o total parcial exibido no modal foi de R$ 0,25. A caixa manteve a modalidade obrigatória de viagem e a ação de adicionar permaneceu liberada.

O carrinho real da retirada usa a chave de armazenamento `itap_retirada_v1`; a conferência final deve usar essa chave, e não uma chave de teste diferente.

O teste criou uma segunda linha para a mesma caixa quando o complemento foi escolhido, preservando a primeira linha sem complemento. A nova linha registrou `Canudinho Wafer`, SKU `ACR-001`, quantidade 1, valor de R$ 0,25, além da embalagem vinculada `EMB-VIAGEM` com taxa de R$ 1,00.

## Revisão visual

Foram geradas capturas em 375 × 812 e 1280 × 900. Em celular, cabeçalho, aviso, guia, busca e navegação permanecem legíveis, sem sobreposição; a tipografia Inter e os pesos de texto seguem o padrão da página Encomendas. Em computador, a hierarquia do conteúdo, cartões e botões preserva espaçamento e contraste.

Os itens criados somente para o teste foram removidos do armazenamento do navegador, restaurando o carrinho vazio da prévia.
