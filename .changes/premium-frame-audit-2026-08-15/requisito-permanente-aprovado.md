# Registro Permanente de Requisitos Aprovados — Sorveteria Itapolitana

## 1. Diretriz Visual e de Enquadramento
- **Padrão único de enquadramento**: Mesma proporção e largura útil em todas as páginas e dispositivos (Android, iPhone, tablet e desktop), seguindo o layout limpo e equilibrado do print de referência.
- **Prevenção de sobreposição de ícones (`isolation: isolate`)**: Os recipientes Bento possuem isolamento de camada e remoção garantida de pseudo-elementos legados, evitando que ícones antigos ou círculos apareçam por trás dos novos vetores.
- **Responsividade fluida**: Margens proporcionais, quebra de texto controlada por `overflow-wrap: anywhere` e botões com área de toque mínima de 44px.

## 2. Categorias de Picolés e Nomenclatura Padronizada
- **Frutas / Base Água**
- **Recheados — Base Leite**
- **Sem Recheio — Base Leite** (Coco Queimado, Milho Verde, Amendoim e Pistache)
- **Especiais — Base Leite** (Leite Ninho e Ovomaltine)
- **Eskimo — Base Leite**
- **Nomes Amigáveis**: *Blue Ice (Algodão Doce Azul)* e *Caraxi (Abacaxi com Caramelo)* padronizados em todo o site.

## 3. Selo de Origem e Indicador de Lote
- **Selo Pulsante**: Exclusivo para produtos e picolés cuja receita utiliza **base leite** (*Leite Pasteurizado da Fazenda*), posicionado em faixa própria sem cobrir nomes ou preços.
- **Indicador Unificado de Lote de Picolés**: Exibe simultaneamente na mesma linha e tamanho as unidades faltantes, as unidades selecionadas e o **valor acumulado em reais** (`Faltam X unidades · Selecionadas: Y · R$ Z`), atualizando instantaneamente a cada clique.

## 4. Integridade Arquitetural
- Construído sobre a estrutura atual em funcionamento, sem bugs, sem quebra de fluxo de checkout de 3 etapas e com pontuação mantida em **100/100** no painel de qualidade.
