# Referências de impressão térmica — Epson TM-T20

## Configuração aplicada ao site

- O comprovante será criado para papel térmico de **80 mm**.
- A largura de conteúdo será limitada para não ultrapassar a área imprimível, com margem zero na página e pequenas margens internas de segurança.
- O layout usará fonte monoespaçada, alto contraste e linhas curtas para preservar a leitura de SKU, código do pedido, itens e totais.
- A impressão será acionada pelo navegador com `window.print()`; a saída direta depende de a Epson TM-T20 estar instalada como impressora padrão e configurada no computador.

## Configuração operacional recomendada no computador

1. Instalar o driver Epson Advanced Printer Driver compatível com o modelo TM-T20.
2. Configurar a porta correta da impressora, normalmente USB quando conectada diretamente ao computador.
3. Definir a Epson TM-T20 como impressora padrão, quando desejado.
4. Nas preferências, selecionar papel de 80 mm e o modo de corte após o documento, como **Document [Feed, Cut]**.
5. Executar uma impressão de teste e, se necessário, criar um papel personalizado de largura 80 mm no utilitário do driver.

## Fontes

1. [Epson — TM-T20II POS Receipt Printer](https://epson.com/For-Work/Printers/POS/TM-T20II-POS-Receipt-Printer/p/C31CD52062): suporte a papel de 80 mm, capacidades de colunas e especificações de fonte.
2. [Eventive — Print with Epson TM-T20III or TM-T20II on Windows](https://help.eventive.org/en/articles/6023087-print-with-epson-tm-t20iii-or-tm-t20ii-on-windows): instalação do driver, definição de porta, corte e tamanho de papel personalizado.
