# Validação — categorias, SKUs e preços de picolés

**Data:** 22/08/2026  
**Escopo:** cadastro mestre, Peça e retire, Encomendas e referências ativas do site.

| Ordem | Categoria | Faixa de SKU | Preço varejo | Itens |
|---:|---|---|---:|---:|
| 1 | Picolés Base Água & Frutas | `PIC-AG-001`–`PIC-AG-008` | R$ 2,50 | 8 |
| 2 | Picolés AO LEITE Cremosos S/ Recheio | `PIC-CR-001`–`PIC-CR-004` | R$ 2,50 | 4 |
| 3 | Picolés AO LEITE Cremosos Recheados | `PIC-REC-001`–`PIC-REC-012` | R$ 3,00 | 12 |
| 4 | Picolés AO LEITE Especiais | `PIC-ESP-001`–`PIC-ESP-002` | R$ 4,00 | 2 |
| 5 | Picolés AO LEITE Premium Eskimós | `PIC-PREM-ESKIMO-001`–`PIC-PREM-ESKIMO-008` | R$ 8,00 | 8 |

O cadastro mestre contém **34 SKUs únicos** de picolés. A sequência está em ordem crescente sem redução de preço; as duas primeiras categorias permanecem no mesmo valor de R$ 2,50 para preservar os preços atuais. Nenhuma referência ativa aos códigos antigos `PIC-001` a `PIC-034` permaneceu nos arquivos validados.

No Peça e retire, os cinco grupos foram conferidos na ordem solicitada. Encomendas usa a mesma ordem de grupos na configuração de montagem do catálogo. Os arquivos JSON ativos foram validados, o controlador de retirada passou na verificação de sintaxe, e a seleção direta de sabores continuou funcionando. Os testes não abriram WhatsApp e não enviaram pedidos.
