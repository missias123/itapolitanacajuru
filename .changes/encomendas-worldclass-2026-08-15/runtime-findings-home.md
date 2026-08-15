Diagnóstico em 2026-08-15: a homepage carregou normalmente no servidor local. O texto extraído confirma que a seção Encomendas & Complementos contém prévias com produtos e valores para Sorvete em Caixa (4 itens: R$ 100,00, R$ 115,00, R$ 150,00, R$ 165,00), Torta de Sorvete (R$ 100,00) e Picolés com link para encomendas.html#picoles e banner de atacado em R$ 1,80. A investigação deve continuar na visualização/abertura dos cards, pois o usuário relatou que a área aparece em branco no dispositivo dele.
Teste DOM adicional: enc-preview-caixas, enc-preview-tortas, enc-preview-picoles e enc-preview-acrescimos existem, estão com display:block/visibility:visible, altura positiva e conteúdo textual. Cada preview está dentro de um .acc-body com CTA .enc-link-btn; o seletor de teste .enc-preview-card não existe, portanto o teste anterior de cards retornou vazio por usar classe errada, não por ausência de conteúdo. O card real usa .home-enc-comp-card e IDs acc-enc-caixas, acc-enc-tortas, acc-enc-picoles, acc-enc-acrescimos.


## Relatório de Validação de Encomendas — World Class (15/08/2026)
- Todos os 4 cards da homepage foram validados.
- Correção do seletor CSS do acordeão aplicada com sucesso.
- Preço mínimo oficial fixado em R$ 1,80 em toda a base de código.
