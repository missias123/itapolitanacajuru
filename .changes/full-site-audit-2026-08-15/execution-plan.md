# Plano de Execução e Correção World Class — Itapolitana Cajuru

## Objetivo

Implementar correções definitivas em todo o site com base na auditoria integral de responsividade, enquadramento e consistência, elevando a experiência do usuário em dispositivos Android, iOS, tablets e computadores ao padrão internacional de grandes plataformas de alimentos.

## Fases da Execução

1. **Correção do Shell e Navegação Móvel Compartilhada**:
   - Atualizar a barra inferior fixa (`.nav-mobile`) no CSS compartilhado (`css/itap-shared.css` e arquivos globais) para garantir que rótulos longos como “CARDÁPIO” e “ENCOMENDAS” não fiquem truncados ou sobrepostos em telas de 360px.
   - Garantir que todas as páginas públicas principais (`index.html`, `dicas.html`, `galeria.html`, `sobre.html`) compartilhem exatamente a mesma estrutura de cabeçalho superior e barra inferior, eliminando discrepâncias de margens.

2. **Ajuste Fino do Separador de Encomendas e Modais**:
   - Refinar as regras de *clamp* e *padding* do separador de encomendas na homepage para que o título e o subtítulo permaneçam perfeitamente legíveis sob qualquer largura de tela.
   - Ajustar o contêiner de abas de picolés no modal de encomendas (`#picoles-abas-container`) para utilizar rolagem horizontal suave (`overflow-x: auto`) com rolagem nativa oculta, eliminando qualquer risco de transbordamento horizontal (`overflow`).

3. **Validação de Preços, Nomes e Selos**:
   - Assegurar que o preço mínimo de **R$ 1,80** esteja visível e consistente em todos os cartões de atacado.
   - Padronizar os nomes dos sabores especiais (ex: `Caraxi (Abacaxi com Caramelo)` e `Blue Ice (Algodão Doce Azul)`) e a presença do selo pulsante `Leite Pasteurizado da Fazenda` em todos os produtos lácteos.

4. **Publicação e Sincronização com o GitHub**:
   - Consolidar todas as alterações nos arquivos estáticos, commitar via CLI do GitHub e preparar a entrega final com instruções claras para limpeza de cache e validação em aparelhos reais.
