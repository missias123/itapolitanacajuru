# Política Permanente de Enquadramento, Alinhamento e Preservação (FUEAP)
**Sorveteria Itapolitana Cajuru — Versão v5.0+**

Esta política estabelece os critérios obrigatórios e inegociáveis de engenharia visual, responsividade e integridade funcional para todas as páginas do site (`index.html`, `encomendas.html`, `promocao.html`, `admin-painel.html`, entre outras).

## 1. Princípios de Enquadramento e Geometria (Anti-Desforme)
- **Grids de Produtos e Sabores**: Utilizar obrigatoriamente proporção geométrica consistente (`aspect-ratio: 1/1`) para itens de seleção rápida (ex: sabores de sorvete, picolés e tortas), garantindo formato perfeitamente quadrado em qualquer dispositivo.
- **Flexbox & Grid Responsivo**: Utilizar colunas flexíveis com largura mínima controlada (`minmax(120px, 1fr)`) para que os elementos se auto-alinhem sem quebras de layout ou espaços vazios disformes.
- **Overflow Prevention**: Todo conteúdo textual longo deve possuir quebra de linha natural ou truncamento controlado, evitando que botões ou cartões estiquem de forma assimétrica.

## 2. Tipografia, Cores e Cromatismo Premium
- **Fonte Padrão**: Utilizar a família **Inter** / **Poppins** com renderização otimizada (`-webkit-font-smoothing: antialiased`).
- **Escala Hierárquica**: Títulos principais (20px-24px, peso 800/900), subtítulos (16px-18px, peso 600/700) e corpo (14px, peso 400/600).
- **Paleta iFood / Itapolitana**: Vermelho principal (`#EA1D2C` ou `#E8000D`), amarelo de destaque (`#FFD600`), fundos limpos (`#FFF8F0` ou `#FFFFFF`) e textos em tons de alta legibilidade (`#1A0A00`).

## 3. Preservação Absoluta de Handlers e Lógica de Botões
- **Isolamento de Estilos**: As modificações visuais devem atingir exclusivamente as classes de container, grids, modais (`.modal`, `.sabor-grid`, `.sabor-item`) e espaçamentos.
- **Integridade de IDs e Funções**: É terminantemente proibido alterar nomes de IDs (`id="..."`), funções onclick ou lógica JavaScript existente nas páginas. O objetivo é refinar a "moldura" visual sem tocar no motor funcional.

## 4. Comportamento de Modais e Bottom Sheets
- **Mobile (Bottom Sheet)**: Em telas menores, os modais devem surgir da base da tela com cantos superiores arredondados e barra de rolagem interna suave.
- **Desktop (Modal Centralizado)**: Centralizado com fundo escurecido com desfoque (`backdrop-filter: blur(4px)`) para foco total do usuário.
- **Scroll Lock Inteligente**: Ao abrir qualquer modal de encomenda ou promoção, o fundo da página deve travar o scroll para evitar deslocamentos indesejados da tela.
