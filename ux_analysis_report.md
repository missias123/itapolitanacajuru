# Análise de UX Premium - Fluxo de Pedidos Itapolitana Cajuru

Após analisar referências globais (Jeni's Splendid Ice Creams, Ben & Jerry's, Baskin-Robbins) e sites de delivery líderes (iFood, Rappi), identifiquei a "fórmula de gênio" para o fluxo de picolés e sorvetes.

## 1. Achados da Pesquisa (Benchmarking)

| Recurso | Referência | Aplicação na Itapolitana |
| :--- | :--- | :--- |
| **Progress Bar Visual** | Jeni's | Barra de progresso no topo do modal indicando quanto falta para o lote (100 un). |
| **Feedback de Limite** | iFood | Mensagem em tempo real: "Você já escolheu 25 de Limão (Limite atingido)". |
| **Sticky Summary** | Rappi | Um rodapé fixo no modal que mostra o total atual e o botão de confirmar, que só ativa no "ponto certo". |
| **Categorização Visual** | Baskin-Robbins | Uso de cores e ícones para diferenciar Tipos (Água vs Recheados) sem poluir a tela. |

## 2. O Novo Fluxo de "Gênio" (Engenharia UX)

### A. Seleção de Picolés (Otimizada)
- **Hierarquia**: Tipo (Topo, pequeno, bold) > Sabor (Destaque) > Descrição (Abaixo).
- **Controles**: Botões `[-]` e `[+]` com feedback tátil e visual (cor muda quando atinge 25).
- **Validação Viva**: O sistema não apenas impede >25 por sabor, mas sugere: "Que tal adicionar picolés de Fruta para completar seu lote?".

### B. O Carrinho "Inquebrável"
- **Sync de Estoque**: Conforme a regra de negócio, o carrinho e o estoque conversam em tempo real.
- **Proteção de Mínimo**: Se o usuário remover itens no carrinho e cair abaixo de 100 picolés, o botão de "Finalizar" se transforma em "Completar Lote" e abre o seletor automaticamente.

### C. Estética Premium (Neuromarketing)
- **Cores**: Uso do Vermelho iFood (#EA1D2C) para ações e Verde Sucesso (#008912) para confirmações.
- **Fontes**: Inter para legibilidade técnica e Poppins para títulos amigáveis.

## 3. Próximos Passos (Fase 2)
1. Implementar a **Sticky Progress Bar** nos modais.
2. Refinar a lógica de **Sync de Estoque** (0-200) conforme a regra de negócio.
3. Adicionar o **Botão de Exclusão Individual** com confirmação inteligente.
