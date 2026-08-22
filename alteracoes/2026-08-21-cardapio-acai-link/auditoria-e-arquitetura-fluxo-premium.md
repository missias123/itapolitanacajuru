# Auditoria e arquitetura premium — Peça e retire

## Diagnóstico da jornada atual

O catálogo já possui recursos importantes: busca, seções, carrinho persistente, seleção de sabores por produto, controle de estoque de picolés, resumo discriminado e confirmação humana. Entretanto, o primeiro contato ainda apresenta simultaneamente hero, aviso, guia, busca, navegação horizontal e muitas seções; para uma pessoa leiga, isso cria mais de um caminho de leitura antes da primeira escolha.

| Ponto de decisão | Risco de confusão | Regra premium aplicada |
|---|---|---|
| Entrada no catálogo | Muitos elementos informativos antes da primeira escolha | Exibir uma orientação compacta de três passos e uma vitrine de seções por intenção de compra. |
| Escolha de categoria | Navegação horizontal exige entender os nomes técnicos | Criar cartões de seção com título simples, contagem e orientação do que acontece ao tocar. |
| Produto com opções | Cliente pode não antecipar a próxima escolha | Usar rótulo de ação específico: escolher sabores, recipiente ou adicionar; manter a regra no cartão e no modal. |
| Personalização | Muitas escolhas em tela podem levar a erro | Mostrar uma decisão de cada vez, contador de limite e botão de avançar bloqueado até a escolha válida. |
| Continuidade | O cliente pode não saber se deve voltar ou finalizar | Exibir carrinho persistente com quantidade/total e CTA explícito para continuar comprando ou revisar. |
| Confirmação | Possível interpretação de pedido como produção imediata | Fixar a confirmação humana no resumo e na mensagem de WhatsApp. |

## Arquitetura proposta

> **1. Escolha uma seção → 2. Monte cada produto → 3. Revise e confirme por ligação.**

1. **Seções de compra na entrada.** Cada cartão leva a uma seção do catálogo, informa a quantidade de produtos e antecipa a regra predominante. Nenhum produto é ocultado.
2. **Catálogo ainda completo.** A busca e a barra de seções permanecem para clientes que já sabem o que querem; a vitrine serve como entrada simples, não como bloqueio.
3. **Modal com próxima decisão clara.** Ingredientes fixos são informativos; apenas sabores, recipiente, viagem e regras especiais viram decisões interativas.
4. **Carrinho como saída segura.** Depois de adicionar, o cliente pode voltar ao ponto em que estava ou revisar; quantidade, embalagem e complementos ficam discriminados.
5. **Confirmação humana como última etapa.** O formulário não promete produção automática e exige a conferência por ligação antes da elaboração.

## Seções visuais planejadas

| Título para o cliente | Seções do cadastro abrangidas | Ajuda curta |
|---|---|---|
| Sorvetes de massa | Sorvetes de massa e caixas por bolas | Escolha o tamanho e distribua os sabores. |
| Açaí Natureon | Açaís e milk-shakes de açaí | Combinações prontas; adicione direto ao pedido. |
| Picolés | Picolés | Escolha sabores e quantidade conforme o estoque. |
| Milk-shakes | Milkshakes | Escolha 1 ou até 2 sabores. |
| Taças e sobremesas | Taças tradicionais, premium, gourmet e sobremesas | Veja ingredientes e escolha sabores quando necessário. |

As regras de torta, caixas, picolés, modalidade de consumo/viagem e confirmação por ligação permanecem sem alteração.
