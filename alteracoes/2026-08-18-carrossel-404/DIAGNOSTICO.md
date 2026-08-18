# Diagnóstico do incidente 404 do carrossel

## Evidência

O commit `ec97d57446a07beed7a01f8d6e6980729c61a66c` (`ec97d57`) foi criado em 18/08/2026 às 15:24:28 UTC pela conta `missias123` e contém a exclusão direta de `carrossel.html`.

## Causa técnica

O commit foi uma limpeza agressiva com a mensagem “unificação total do cabeçalho, remoção de nav redundante e limpeza de código morto World Class”. O arquivo `index.html` continuou contendo o iframe `#itp-crs-iframe` com `src="carrossel.html"`. Assim, a referência permaneceu ativa, mas o destino foi apagado. Ao publicar, o iframe recebeu a página 404.

## Intenção do usuário

Não foi encontrada uma instrução do usuário autorizando a remoção do carrossel. A remoção foi uma falha de procedimento: não houve auditoria de dependências nem teste online após a limpeza.

## Correção preparada

`carrossel.html` foi restaurado exatamente a partir de `ec97d57^`, o último estado imediatamente anterior à exclusão. A alteração ainda deve ser validada no navegador e publicada antes de ser considerada concluída.
