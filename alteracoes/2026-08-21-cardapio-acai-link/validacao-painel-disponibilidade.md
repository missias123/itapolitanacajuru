# Validação do painel de disponibilidade

## Painel único de administração

O endereço `admin-catalogo.html` foi aberto e carregou a base oficial sem erros de navegador.

| Controle validado | Resultado |
|---|---|
| Produtos e SKUs | Exibe os 198 SKUs vendáveis agrupados por categoria, com preço, tamanho, dependência e status. |
| 38 sabores de massa | Exibe os SKUs `MAS-001` a `MAS-038` com interruptor individual de disponibilidade e ações em lote. |
| Embalagens dependentes | Exibe as cinco embalagens operacionais e os SKUs de caixas ou isopores que elas bloqueiam. |
| Base de dados | A tela informa e carrega `dados/produtos.json` como a única fonte para produtos, sabores e embalagens. |

O painel ficou em modo de consulta porque a sessão administrativa com token não foi ativada no navegador. Ao abrir pelo painel administrativo autenticado, os mesmos controles usam o salvamento já existente no repositório para atualizar o arquivo oficial.
