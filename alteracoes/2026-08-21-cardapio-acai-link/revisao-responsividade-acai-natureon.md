# Revisão de responsividade — Açaí Natureon

## Evidência observada

O acesso público ao Açaí Natureon abre o modal visual `#catalogo-acai-natureon`. A grade HTML do Natureon não é a interface mostrada nesse caminho; a imagem do catálogo ocupa a parte central do modal.

Em celular, o catálogo ficou legível, porém aproveita pouco a largura útil. Em computador, a imagem permaneceu estreita em relação ao espaço disponível do modal. A correção prioritária é aplicar escala responsiva ao conteúdo visual do modal, com largura fluida, altura limitada à viewport e preservação da proporção da imagem.

## Critérios de ajuste

| Dispositivo | Escala desejada |
|---|---|
| Celular | Imagem ampla, margem lateral de toque, sem corte e sem exigir zoom |
| Computador | Imagem maior e centralizada, aproveitando o modal sem ultrapassar a altura útil |
| Ambos | Mesma proporção original, cabeçalho e fechamento sempre visíveis |

## Resultado após ajuste

Em celular, o catálogo passou a usar praticamente toda a largura útil, preservando margem lateral para toque e o botão Fechar no cabeçalho. Em computador, a imagem ganhou altura e largura dentro do modal, ocupando a área de leitura sem ultrapassar a viewport. A proporção original da arte foi preservada nos dois formatos.
