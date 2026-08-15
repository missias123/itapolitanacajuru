
## Validação do selo e do status do lote — 15/08/2026

A página `encomendas.html` foi aberta localmente em navegador real. O modal de picolés exibiu as cinco categorias aprovadas e o selo `Leite Pasteurizado da Fazenda` somente nas categorias marcadas como `Base Leite`; a categoria `Frutas / Base Água` permaneceu sem o selo.

Após um clique no botão `+` de Abacaxi, o status foi confirmado como `Faltam 99 unidades · Selecionadas: 1 · R$ 1,80`, e o subtotal da linha foi `Subtotal: R$ 1,80`. Isso confirma que faltantes, quantidade selecionada e total acumulado são atualizados juntos, além do preço unitário individual.

O painel de qualidade retornou `100/100` em todas as seis páginas auditadas, com `0` itens críticos. A auditoria móvel foi executada nos perfis do projeto e confirmou abertura/fechamento das áreas, rolagem livre, restauração da posição original, limpeza de foco e ausência de clipping externo nos cenários observados.

Arquivos ativos alterados nesta etapa: `index.html`, `encomendas.html`, `scripts/products.js` e `css/itap-shared.css`. Os artefatos históricos de auditoria permanecem em `.changes` para rollback e rastreabilidade.

## Nota de escopo

A etiqueta foi aplicada aos produtos e categorias classificados como base leite, incluindo sorvetes, sobremesas, isopores e picolés de base leite. Produtos de base água/frutas e açaí não recebem a etiqueta.
