# Inventário de Componentes e Pontos Críticos para Auditoria Rigorosa

## 1. Cabeçalho e Navegação Superior
- Barra de abas (`TELA INICIAL`, `PROMOÇÃO`, `DICAS/DEPOIMENTOS`, `QUEM SOMOS`, `ENCOMENDAS`)
- Comportamento de quebra em telas de 360px a 414px (largura típica de Android)
- Verificação de margens, padding e recortes horizontais

## 2. Seção de Encomendas & Complementos (Separador)
- Título `.home-enc-separator-title`: verificação de padding, tamanho de fonte fluido e prevenção de corte nas laterais
- Subtítulo `.home-enc-separator-sub`: espaçamento, ícone de relógio e quebra de linha
- Linhas laterais decorativas

## 3. Os 4 Cards Principais da Homepage (Sorvete em Caixa, Torta, Picolés, Acréscimos)
- Alinhamento de ícones, título, subtítulo e indicador circular
- Altura mínima e comportamento do acordeão ao abrir e fechar
- Vitrines internas (`enc-preview-list` e `enc-preview-item`) e centralização dos produtos

## 4. Página de Encomendas (`encomendas.html`)
- Gavetas de categorias (Caixas, Tortas, Picolés, Acréscimos)
- Seletor de picolés no atacado, contador de lotes (`Restante`, `Selecionados`, `Total R$`)
- Botões de fechar, voltar e navegação sem saltos para o topo
