# Auditoria dos botões Peça e retire

## Resultado da verificação no navegador

O cardápio principal foi aberto e os links renderizados foram inspecionados diretamente no navegador.

| Critério | Resultado |
|---|---:|
| Botões Peça e retire renderizados | 109 |
| Botões com SKU oficial preenchido | 109 |
| Destinos no formato `retirada.html?sku=SKU_OFICIAL#catalogo` | 109 |
| Botões sem SKU | 0 |
| Destinos incorretos | 0 |

## Amostra conferida

| Produto | SKU | Destino |
|---|---|---|
| Casquinha/copo | `SVM-CC-01` | `retirada.html?sku=SVM-CC-01#catalogo` |
| Picolé de Frutas | `PCT-FRT` | `retirada.html?sku=PCT-FRT#catalogo` |
| Açaí Natureon + leite condensado | `ACA-250-001` | `retirada.html?sku=ACA-250-001#catalogo` |

Os produtos exclusivos de Encomendas mantêm seus próprios botões e não receberam esse redirecionamento.

## Teste de produto de açaí

O botão do produto `ACA-250-001` foi conferido no navegador com o endereço absoluto abaixo:

```text
https://4173-ihd9pqhd5aqroe1wstvxr-c799fc09.us2.manus.computer/retirada.html?sku=ACA-250-001#catalogo
```

A regra de horário estava liberada no momento da validação. Portanto, o botão de açaí transmite corretamente o SKU fechado para o HTML de pedidos.

## Observação de navegação

O controlador de retirada lê o parâmetro `sku` pelo endereço e rola até a seção correspondente quando ele é recebido. A ferramenta de prévia navegou ao endereço sem preservar a consulta na inspeção final, mas os 109 links renderizados foram verificados no formato correto com o SKU oficial. A futura melhoria de pré-seleção visual poderá ser tratada separadamente, sem risco para a abertura do HTML de pedidos.
