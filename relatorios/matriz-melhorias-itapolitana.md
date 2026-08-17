# Matriz de Melhorias e Mitigação de Riscos — Itapolitana Cajuru

Esta matriz classifica todas as melhorias propostas para o site com base no **risco técnico**, **impacto visual/UX** e **estratégia de implementação segura** (sem quebrar a página de encomendas ou a lógica de pedidos).

| Categoria | Descrição da Melhoria | Risco de Bug | Benefício UX | Ação Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **Visual & Tipografia** | Aumentar fonte de botões, cartões e subtítulos (`>0.95rem`), garantindo leitura confortável em mobile e desktop. | **Baixo** | **Alto** | **Aplicar imediatamente** (já aplicado em `encomendas.html`). |
| **Áreas de Toque** | Expandir `min-height` de itens interativos para 52px e paddings para toque ideal em smartphones. | **Baixo** | **Alto** | **Aplicar imediatamente**. |
| **Sombras & Contraste** | Adicionar elevação suave (`box-shadow`) e bordas definidas nos cartões (*Bento Grid*). | **Baixo** | **Médio** | **Aplicar imediatamente**. |
| **Acessibilidade** | Garantir estados de foco (`:focus-visible`), contraste adequado e atributos ARIA nos accordions. | **Baixo** | **Alto** | **Aplicar em fases**. |
| **Navegação Inline** | Lógica de abertura de acordião com Modo Foco e retorno de scroll (`_semPulo`). | **Médio** | **Alto** | **Isolar e testar em sandbox antes de publicar**. |
| **Centralização de Dados** | Unificar catálogo de 38 sabores em fonte única (`products.js`). | **Médio** | **Alto** | **Manter compatibilidade com páginas existentes**. |
| **Lógica de Pedidos** | Regras de atacado, carrinho, mínimo de 100 picolés e limite por sabor. | **Alto (Crítico)** | **Crítico** | **PROIBIDO ALTERAR** (área protegida). |

## Regras de Ouro para Operação Segura
1. **Zero alterações na regra de negócio**: Valores, estoque, restrições de quantidade e carrinho não sofrem modificações.
2. **Isolamento de Estilos**: Ajustes visuais são feitos exclusivamente em classes de apresentação.
3. **Validação Humana**: Cada modificação é testada visualmente e por script antes de ser considerada concluída.
