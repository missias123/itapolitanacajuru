# Teste UX do fluxo de encomendas

## Execução inicial — 13/08/2026

A página local `encomendas.html` carregou sem erro visível. As três categorias principais abriram: Sorvete em Caixa, Tortas Geladas e Picolés no Atacado.

O modal de picolés abriu corretamente e exibiu as quatro categorias solicitadas, cada sabor em uma linha, com tipo acima do sabor, limite de 25 unidades e controles menos/quantidade/mais. A lista exibida foi: Base Água / Frutas (8 sabores), Recheados (16 sabores), Esquimós (8 sabores) e Especiais (2 sabores). O total inicial exibido foi 0 unidades e o botão Confirmar Pedido permaneceu cinza/desabilitado, com mensagem de que faltam 100 unidades.

Observação visual: a captura mostrou os elementos numerados pelo modo de inspeção do navegador; essa numeração não pertence ao site. O modal possui rolagem interna e ações inferiores fixas no viewport do modal, adequado ao fluxo mobile.

Próximas verificações: somar 100 unidades respeitando o máximo de 25 por sabor, confirmar a criação do carrinho por categoria, editar e excluir uma categoria, reduzir abaixo de 100 e confirmar o bloqueio de finalização, além de validar caixas/tortas e os dados de contato com DDD 16.


## Teste do formulário final por sabor

Após selecionar Abacaxi, Caju, Goiaba e Groselha, com 25 unidades cada, o carrinho confirmou 100 unidades e exibiu quatro linhas independentes, uma por sabor. Cada linha mostrou o tipo acima, o sabor abaixo, a quantidade, o preço unitário, o subtotal e os comandos `Editar lote` e `Excluir sabor`. O total exibido foi R$ 180,00 (4 x 25 x R$ 1,80). A mensagem de validação informou que o lote mínimo de 100 unidades foi atingido. O formulário final permaneceu simples, com nome, endereço e WhatsApp DDD 16.


## Teste de caixas e torta por tipo

Com o carrinho limpo, foram adicionados uma Caixa 5 Litros - 2 Sabores e uma Torta de Sorvete. O formulário final exibiu exatamente duas linhas: `Caixa 5 Litros - 2 Sabores` com tipo `Sorvete em caixa` e `Torta de Sorvete` com tipo `Sobremesa gelada`. Os sabores escolhidos permaneceram dentro da descrição de cada item, sem virar linhas separadas. Resultado: regra por tipo confirmada.


## Testes finais de segurança do formulário

O contador de Abacaxi foi acionado 26 vezes e permaneceu em 25, comprovando o limite individual sem salto. A tentativa de finalizar com WhatsApp `(15) 99999-9999` foi bloqueada com a mensagem para usar DDD 16; nenhuma janela externa foi aberta.

A visualização final após excluir a caixa manteve somente a Torta de Sorvete, em uma única linha por tipo, com os três sabores dentro da descrição e o botão `Excluir item`.

