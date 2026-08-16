# Diagnóstico preliminar — camadas do site

A prévia abriu `encomendas.html`, abriu o accordion de Picolés e depois a tela `modal-picoles`.

Resultado medido antes do último ajuste: a modal ocupava a viewport inteira (`top: 0`, `left: 0`, `width: 1280`, `height: 1100`) e tinha `z-index: 2147483000`. O botão fixo do carrinho estava com `visibility: hidden`, mas o cabeçalho e a navegação permaneciam visíveis porque o fundo da modal ainda era parcialmente transparente e o estado global não ocultava explicitamente `header`/`nav`.

Correção aplicada em seguida: fundo da modal de Encomendas alterado para `#08080A` totalmente opaco; `header`, `nav`, carrinho fixo e elementos marcados como `data-fixed-ui` ficam invisíveis e sem interação durante `body.lock-scroll`.
