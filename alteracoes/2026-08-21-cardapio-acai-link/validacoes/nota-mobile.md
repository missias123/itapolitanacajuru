# Validação móvel do catálogo modal

A primeira captura em 390 × 844 px confirmou que a página inicial se adapta à largura de celular. O fragmento do catálogo foi enviado codificado na consulta e, por isso, o modal não abriu nessa tentativa. A próxima captura foi executada com o fragmento `#catalogo-acai-natureon` separado da consulta.

A validação correta mostra o modal ocupando toda a área útil do celular, com cabeçalho fixo, botão **Fechar** com área de toque ampla, texto sem corte, cartões em uma coluna e nenhuma rolagem horizontal. O conteúdo inicial apresenta Açaí Natureon, os dados institucionais e o primeiro grupo de 250 ml.

No navegador, a rolagem interna foi levada até o último grupo e exibiu o rodapé informativo. Não há links de compra, carrinho ou WhatsApp dentro do modal. Tanto o botão **Fechar** quanto a tecla ESC fecharam o catálogo, devolveram o foco para `Açaí Natureon` e preservaram a posição da página em `scrollY: 2055`.
