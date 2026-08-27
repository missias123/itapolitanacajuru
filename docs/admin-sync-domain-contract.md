# Contrato de domínio — sincronização Admin/Site/Worker

## Escopo
Este contrato define fronteiras de escrita e leitura para evitar sincronização bidirecional insegura, sobrescrita silenciosa e exposição pública de dados sensíveis.

## Domínios

| Domínio | Fonte de verdade | Escrita permitida | Leitura pública |
| --- | --- | --- | --- |
| Catálogo/SKUs/preços/disponibilidade | `dados/produtos.json` | Admin autenticado com precondição de revisão (`sha`/`ifMatch`) | Somente catálogo público necessário |
| Configuração editorial | `dados/config.json` | Admin autenticado com precondição de revisão (`sha`/`ifMatch`) | Campos editoriais não sensíveis |
| Pedidos/encomendas | Worker (`ENCOMENDAS_KV`) | Site → Worker validado (server-side) e idempotente | Nenhum corpo completo público |
| Campanhas operacionais (Picolé) | Worker (`PROMO_KV` + Durable Object) | Rotas administrativas autenticadas e segregadas por permissão | Estado sanitizado de status |
| Sessão e autorização admin | Worker (`RATE_KV` sessão) | Login/logout administrativo | Não exposto |
| Relatórios | Worker/Admin autenticado | Somente leitura autenticada e mascarada por padrão | Não exposto |

## Regras de segurança aplicadas

1. Sessão administrativa obrigatória para leitura/escrita de rotas administrativas.
2. Permissões segregadas por domínio (`catalog:*`, `orders:*`, `campaign:*`, `reports:export`, `audit:read`).
3. Escrita de catálogo/configuração com precondição de versão (`ifMatch`/`sha`) e `409` em conflito.
4. Pedidos com validação server-side, idempotência por `X-Idempotency-Key` e sem confirmação falsa.
5. Endpoints públicos não alteram estado por `GET`.
6. Relatórios administrativos de pedidos retornam dados mascarados por padrão.
7. A matriz estrutural (`id`, arquivo de origem, chave, `adminId`, alvo e marcador) só é devolvida na resposta autenticada de `GET /api/admin/sync/domains`, sob `audit:read`; ela não é exposta por rota pública nem usada para sobrescrever conteúdo.

## Resposta do endpoint de sincronização

`GET /api/admin/sync/domains` exige `X-Itap-Session-Token` válido e a permissão `audit:read`. A resposta contém `domains` com estado e fonte de verdade de catálogo, configuração editorial, encomendas e campanha do Picolé, além de `matrix` com metadados estruturais sanitizados. O cliente deve exibir divergência, falha de leitura ou conflito como estado de revisão; nunca deve converter uma comparação em escrita automática.

### Semântica dos estados

- `source_available`: a fonte de verdade respondeu e tem revisão/metadado disponível; a igualdade com o Site ainda não foi provada.
- `synchronized`: reservado para reconciliação exacta e verificável entre a fonte declarada e a superfície correspondente.
- `blocked`: o domínio está deliberadamente bloqueado ou inactivo, como uma campanha não autorizada; não deve ser anunciado nem activado pela UI.
- `not_verified`: a leitura falhou, a fonte está ausente ou o estado não pode ser confirmado com segurança.

## Observações de risco existente

- O Admin atual ainda usa token GitHub no navegador para parte do fluxo de publicação.
- Este desenho foi preservado para compatibilidade, mas continua sendo risco operacional.
- Migração recomendada: escrita de conteúdo sensível por rota de servidor autenticada com segredo apenas no backend.
