# Regras Permanentes e Memória do Projeto - Itapolitana Cajuru

Este documento registra as diretrizes definitivas e inegociáveis estabelecidas pelo usuário (MISSIAS) para o site e painel administrativo da Itapolitana Cajuru.

## 1. Fonte Única de Verdade do Catálogo
- Nenhum produto, sabor ou preço pode ser inventado ou alterado sem autorização explícita do usuário.
- O catálogo oficial de picolés e sorvetes é a única lei do site.
- Sabores indevidos (como Romeu e Julieta, Trufado Especial, Sensação (morango x choc.) Trufada, Maracujá Trufado) são estritamente proibidos e bloqueados em qualquer renderização ou formulário.

## 2. Padrão Obrigatório do Fluxo de Encomendas
- **Picolés**: Exibidos por categoria (tipo) e listados individualmente por sabor, em linhas com:
  - Nome do sabor.
  - Preço unitário e subtotal individual.
  - Controles de quantidade (`−` e `+`).
  - Lote mínimo global de 100 unidades e limite máximo de 25 unidades por sabor.
- **Caixas e Tortas**: Exibidas por tipo de produto (ex: Caixa 5 Litros, Caixa 10 Litros, Torta de Sorvete), em uma única linha por item, com os sabores escolhidos descritos de forma elegante logo abaixo.
- **Relatório e Carrinho**: Picolés extraídos por sabor individual; caixas e tortas agrupadas por tipo.

## 3. Validações e Regras de Negócio
- Prazo obrigatório de **5 dias úteis** de antecedência para encomendas (com alerta visual piscante).
- Validação rigorosa de WhatsApp aceitando exclusivamente o **DDD 16**.
- Sincronismo total com o estoque oficial (`produtos.json`) e painel administrativo (protegido por senha `2007itapolitania` com alternador de visibilidade e engrenagem de acesso).
- Controle de disponibilidade: itens esgotados aparecem como "Esgotado" e ficam bloqueados para compra.
