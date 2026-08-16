# Auditoria visual da marca d’água

Data: 16/08/2026

## Android — 390 × 844

A marca d’água passou a aparecer nas áreas claras laterais e na superfície clara abaixo do bloco de cardápio. O conteúdo continua legível, sem overflow horizontal visível e sem corte adicional provocado pela textura. A logo permanece discreta, mas agora perceptível.

## PC — 1280 × 900

A marca d’água aparece repetida nas margens brancas ao redor do conteúdo principal, com contraste suave. A área colorida do cabeçalho e a fotografia permanecem preservadas, sem a logo ser desenhada por cima da imagem. O padrão é mais perceptível no PC por existir uma faixa branca lateral maior.

## Decisão

A solução usa duas camadas nas superfícies claras: um véu branco de 94% para manter o fundo limpo e a imagem `images/logo-watermark.png` repetida em tamanho fluido de 260–360 px. A imagem foi recalibrada para alpha médio aproximado de 16,8/255, suficiente para aparecer sem agressividade.

## Próxima verificação

Testar também a página de encomendas e o painel administrativo, remover scripts temporários e publicar somente após confirmar que os modais continuam cobrindo integralmente o conteúdo anterior.

## Encomendas — 390 × 844

A marca d’água ficou claramente perceptível nas faixas brancas entre os cards e nas superfícies claras do fluxo de categorias. Os cards de Sorvete em Caixa, Tortas Geladas, Picolés no Atacado e Acréscimos continuam legíveis e alinhados. Nenhum botão ou texto foi coberto pela estampa.

## Painel administrativo — 390 × 844

A tela inicial do painel mantém o cartão de autenticação branco limpo e o gradiente externo. O painel administrativo não mostra a estampa dentro do cartão de login porque essa área é intencionalmente uma superfície de autenticação isolada; a marca d’água está configurada no conteúdo administrativo após o acesso, onde os cards editáveis recebem o mesmo tratamento visual das páginas públicas.
