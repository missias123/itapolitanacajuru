# Teste do Ita Bot — camada ainda atravessando

Após aplicar fundo `#08080A` e regra global em `body.modal-aberto`, o Ita Bot abriu com camada escura e conteúdo do chat visível, porém a captura ainda mostra o cabeçalho, os botões do topo e a barra inferior atravessando visualmente.

Hipótese técnica: o cabeçalho/nav e o chat não estão todos como filhos diretos de `body`, ou algum elemento está fora da exceção usada pelo seletor; o estado `modal-aberto` pode também estar sendo aplicado depois da abertura por um script que redefine a visibilidade. Será feita medição no DOM para localizar o ancestral real e aplicar uma camada superior diretamente no chat e ocultar os elementos por seletor global.

## Segundo teste após ajuste do widget

Após atualizar `ita-bot-widget.js` para adicionar `chat-open`/`modal-aberto`, usar `z-index:2147483000 !important` e fundo `#08080A !important`, a captura ainda mostra o cabeçalho e barras inferiores na área externa do chat, além de fundo visual desfocado. A causa precisa ser medida no estado efetivo após a abertura; possivelmente o servidor local está servindo uma versão antiga em cache, há outro estilo injetado depois, ou o diálogo não está ocupando o viewport visual esperado. Próximo passo: obter `body.className`, classes do diálogo, `getComputedStyle` e retângulos efetivos depois do clique.
