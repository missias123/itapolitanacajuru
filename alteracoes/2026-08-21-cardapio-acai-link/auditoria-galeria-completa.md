# Auditoria do cardápio visual completo

O PDF enviado contém **12 páginas**. O site disponibiliza as mesmas 12 imagens WebP, nomeadas de `pagina-01.webp` até `pagina-12.webp`, todas em **1200 × 1697 px**. O controlador do modal referencia as 12 páginas em sequência.

No teste de abertura do link, as 12 imagens completaram o carregamento. A razão natural de cada imagem é mantida pela regra `width: auto`, `height: auto`, `max-width: 100%`, `max-height` responsivo e `object-fit: contain`; a validação do navegador confirmou proporção preservada em todas as páginas. O carregamento agora inicia com as duas primeiras páginas e põe as demais em fila curta após a abertura, evitando que a rolagem interna deixe páginas sem imagem.
