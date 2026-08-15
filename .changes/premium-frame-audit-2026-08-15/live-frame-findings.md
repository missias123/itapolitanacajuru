# Evidências de enquadramento — validação local

A página `encomendas.html` abriu corretamente na versão local e o modo foco mostrou apenas a categoria de picolés selecionada. O card do lote ficou centralizado, o botão Montar lote permaneceu acessível e o carrinho fixo não cobriu o conteúdo principal.

O modal de montagem renderizou as cinco categorias esperadas, os preços unitários e subtotais, os controles de remover/adicionar e o selo `Leite Pasteurizado da Fazenda` somente nas categorias Base Leite. O indicador inicial apareceu como `Faltam 100 unidades · Selecionadas: 0 · R$ 0,00`.

A captura do navegador contém caixas tracejadas e números de inspeção gerados pela própria auditoria visual; esses marcadores não pertencem ao site. A medição DOM ainda deve confirmar que os containers Bento e os textos não colidem em 360px, 393px, 768px e desktop, bem como validar a atualização do indicador após clique.
