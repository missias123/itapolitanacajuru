# Controles de borda de segurança

## Bloqueio de JSONs operacionais públicos

**Domínio:** `itapolitanacajuru.com.br`  
**Zona Cloudflare:** `86b83a31b53223e7e435430f0c0ccff1`  
**Ruleset:** `Itapolitana - bloquear JSONs operacionais públicos`  
**Ruleset ID:** `1d6ad9449e8d405c9274365236812d8d`  
**Fase:** `http_request_firewall_custom`  
**Data de aplicação:** 2026-08-27 13:22:43 UTC  
**Estado:** ativo

A regra bloqueia somente requisições cujo host seja `itapolitanacajuru.com.br` e cujo caminho seja um dos seguintes:

- `/dados/auth.json`
- `/dados/clientes.json`
- `/dados/pedidos.json`
- `/dados/encomendas.json`
- `/dados/submissoes_encomendas.json`
- `/dados/fidelidade.json`
- `/dados/carrinhos_abandonados.json`

A regra não bloqueia `/dados/produtos.json`, que é utilizado como catálogo público, nem a Home. O teste automatizado correspondente usa apenas `HEAD`, não lê corpos JSON e está em `tests/sensitive-paths-audit.mjs`.

A regra de borda complementa `_redirects` e `robots.txt`; esses arquivos não devem ser tratados isoladamente como controle de acesso. Qualquer alteração futura deve preservar a lista de caminhos, testar 403/404 nos sete caminhos sensíveis e confirmar HTTP 200 para a Home e o catálogo mestre.
