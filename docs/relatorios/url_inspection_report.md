# Relatório de Inspeção de URLs da API

Este relatório detalha as ocorrências das URLs da API encontradas no repositório `missias123/itapolitanacajuru`, com o objetivo de identificar inconsistências e planejar a unificação para `https://api.itapolitanacajuru.com.br`.

## URLs Encontradas

| Arquivo | Linha | URL Encontrada | Finalidade | Ação Sugerida |
|---|---|---|---|---|
| .htaccess | 33 | `https://itapolitana-api.wmc760.workers.dev` | Política de Segurança de Conteúdo (CSP) | Substituir por `https://api.itapolitanacajuru.com.br` |
| _headers | 11 | `https://itapolitana-api.wmc760.workers.dev` | Política de Segurança de Conteúdo (CSP) | Substituir por `https://api.itapolitanacajuru.com.br` |
| admin-painel.html | 3096 | `https://itapolitana-api.wmc760.workers.dev` | URL da API no painel administrativo | Substituir por `https://api.itapolitanacajuru.com.br` |
| scripts/enc-v2.js | 10 | `https://itapolitana-api.wmc760.workers.dev` | URL da API para encomendas | Substituir por `https://api.itapolitanacajuru.com.br` |
| scripts/itap-promo.js | 66 | `https://itapolitana-api.wmc760.workers.dev` | URL da API para promoções | Substituir por `https://api.itapolitanacajuru.com.br` |
| sw.js | 86 | `itapolitana-api.wmc760.workers.dev` | Hostname permitido no Service Worker | Substituir por `api.itapolitanacajuru.com.br` |
| test_api.py | 4 | `https://itapolitana-api.wmc760.workers.dev/api/promocao/cadastro` | URL de teste da API | Substituir por `https://api.itapolitanacajuru.com.br/api/promocao/cadastro` |
| .htaccess | 33 | `https://api.itapolitanacajuru.com.br` | Política de Segurança de Conteúdo (CSP) | Manter |
| _headers | 11 | `https://api.itapolitanacajuru.com.br` | Política de Segurança de Conteúdo (CSP) | Manter |
| cloudflare-worker/README.md | 81 | `api.itapolitanacajuru.com.br/*` | Padrão de rota no README | Manter |
| cloudflare-worker/README.md | 98 | `https://api.itapolitanacajuru.com.br/api/health` | Exemplo de curl no README | Manter |
| cloudflare-worker/README.md | 116 | `https://api.itapolitanacajuru.com.br` | Parâmetro API no README | Manter |
| cloudflare-worker/tests/migrate-data-guard.test.mjs | 200 | `https://api.itapolitanacajuru.com.br` | URL de teste em arquivo de teste | Manter |
| cloudflare-worker/tests/migrate-data-guard.test.mjs | 469 | `https://api.itapolitanacajuru.com.br` | URL de produção em arquivo de teste | Manter |
| cloudflare-worker/wrangler.toml | 43 | `api.itapolitanacajuru.com.br/*` | Padrão de rota no wrangler.toml | Manter |
| sw.js | 86 | `api.itapolitanacajuru.com.br` | Hostname permitido no Service Worker | Manter |
| PROGRESS.md | 17 | `api.itapolitanacajuru.com.br` | Referência em arquivo de progresso | Manter |
| promocao-v2.html | 757 | `https://api.itapolitanacajuru.com.br/api/promocao/cadastro` | Endpoint de cadastro no formulário de promoção | Manter |
| promocao-v2.html | 817 | `https://api.itapolitanacajuru.com.br/api/sorteio/buscar` | Endpoint de busca de sorteio no formulário de promoção | Manter |
| cloudflare-worker/scripts/migrate-data.cjs | 449 | `${API_URL}/api/health` | Chamada de API para health check em script de migração | Manter (depende de `API_URL`) |
| cloudflare-worker/src/index.js | 1385 | `${GH_RAW}${GH__PATH}?t=${Date.now()}` | Fetch de dados do GitHub em Worker | Manter |
| docs/ESTRUTURA-CONFIG-JSON.md | 567 | `'/dados/config.json'` | Exemplo de fetch de configuração | Manter (documentação) |
| docs/ESTRUTURA-CONFIG-JSON.md | 624 | `'/dados/config.json'` | Exemplo de fetch de configuração | Manter (documentação) |
| docs/admin-mapeamento.md | 371 | `fetch('dados/config.json')` | Sugestão de fetch de configuração em documentação | Manter (documentação) |
| docs/admin-mapeamento.md | 382 | `fetch('dados/config.json')` | Sugestão de fetch de configuração em documentação | Manter (documentação) |
| docs/relatorios/CORRECAO-PAINEL-QUALIDADE-COPILOTO.md | 808 | `https://api.github.com/repos/missias123/itapolitanacajuru/issues` | Fetch de issues do GitHub em relatório | Manter (documentação) |
| docs/relatorios/CORRECAO-PAINEL-QUALIDADE-COPILOTO.md | 827 | `https://docs.google.com/forms/d/.../formResponse` | Fetch para formulário do Google em relatório | Manter (documentação) |
| docs/relatorios/PLANO-ACAO-ADMIN.md | 310 | `https://api.github.com/user` | Fetch de dados do usuário GitHub em relatório | Manter (documentação) |
| index.html | 3996 | `'/dados/promo.json?t=' + Date.now()` | Fetch de dados de promoção no index.html | Manter (dados locais) |
| scripts/itap-promo.js | 744 | `'dados/promocoes.json?v=' + Date.now()` | Fetch de promoções em script | Manter (dados locais) |
| scripts/itap-promo.js | 768 | `'dados/promo.json?t=' + Date.now()` | Fetch de promoções em script | Manter (dados locais) |
| scripts/products.js | 174 | `'/dados/produtos.json?t=' + Date.now()` | Fetch de produtos em script | Manter (dados locais) |
| promocao-v2.html | 757 | `https://api.itapolitanacajuru.com.br/api/promocao/cadastro` | Endpoint de cadastro no formulário de promoção | Manter (URL oficial) |
| promocao-v2.html | 817 | `https://api.itapolitanacajuru.com.br/api/sorteio/buscar` | Endpoint de busca de sorteio no formulário de promoção | Manter (URL oficial) |
| cloudflare-worker/scripts/migrate-data.cjs | 449 | `${API_URL}/api/health` | Chamada de API para health check em script de migração | Manter (depende de `API_URL`) |
| cloudflare-worker/src/index.js | 1385 | `${GH_RAW}${GH__PATH}?t=${Date.now()}` | Fetch de dados do GitHub em Worker | Manter |
| docs/ESTRUTURA-CONFIG-JSON.md | 567 | `'/dados/config.json'` | Exemplo de fetch de configuração | Manter (documentação) |
| docs/ESTRUTURA-CONFIG-JSON.md | 624 | `'/dados/config.json'` | Exemplo de fetch de configuração | Manter (documentação) |
| docs/admin-mapeamento.md | 371 | `fetch('dados/config.json')` | Sugestão de fetch de configuração em documentação | Manter (documentação) |
| docs/admin-mapeamento.md | 382 | `fetch('dados/config.json')` | Sugestão de fetch de configuração em documentação | Manter (documentação) |
| docs/relatorios/CORRECAO-PAINEL-QUALIDADE-COPILOTO.md | 808 | `https://api.github.com/repos/missias123/itapolitanacajuru/issues` | Fetch de issues do GitHub em relatório | Manter (documentação) |
| docs/relatorios/CORRECAO-PAINEL-QUALIDADE-COPILOTO.md | 827 | `https://docs.google.com/forms/d/.../formResponse` | Fetch para formulário do Google em relatório | Manter (documentação) |
| docs/relatorios/PLANO-ACAO-ADMIN.md | 310 | `https://api.github.com/user` | Fetch de dados do usuário GitHub em relatório | Manter (documentação) |
| index.html | 3996 | `'/dados/promo.json?t=' + Date.now()` | Fetch de dados de promoção no index.html | Manter (dados locais) |
| scripts/itap-promo.js | 744 | `fetch('dados/promocoes.json?v=' + Date.now())` | Fetch de promoções em script | Manter (dados locais) |
| scripts/itap-promo.js | 768 | `fetch('dados/promo.json?t=' + Date.now())` | Fetch de promoções em script | Manter (dados locais) |
| scripts/products.js | 174 | `'/dados/produtos.json?t=' + Date.now()` | Fetch de produtos em script | Manter (dados locais) |
| promocao-v2.html | 757 | `https://api.itapolitanacajuru.com.br/api/promocao/cadastro` | Endpoint de cadastro no formulário de promoção | Manter (URL oficial) |
| promocao-v2.html | 817 | `https://api.itapolitanacajuru.com.br/api/sorteio/buscar` | Endpoint de busca de sorteio no formulário de promoção | Manter (URL oficial) |
| cloudflare-worker/src/index.js | 529 | `/api/health` | Rota de health check no Worker | Manter |
| cloudflare-worker/src/index.js | 632 | `/api/promocao/cadastro` | Rota de cadastro no Worker | Manter |
| promocao-v2.html | 757 | `https://api.itapolitanacajuru.com.br/api/promocao/cadastro` | Endpoint de cadastro no formulário de promoção | Manter (URL oficial) |
| promocao-v2.html | 817 | `https://api.itapolitanacajuru.com.br/api/sorteio/buscar` | Endpoint de busca de sorteio no formulário de promoção | Manter (URL oficial) |
| scripts/itap-promo.js | 342 | `/api/promocao/cadastro` | Referência à rota de cadastro em comentário | Manter (comentário) |
| scripts/itap-promo.js | 409 | `/api/promocao/cadastro` | Referência à rota de cadastro em comentário | Manter (comentário) |
| scripts/itap-promo.js | 480 | `ITAP_WORKER_API + '/api/promocao/cadastro'` | Chamada de API para cadastro em script de promoção | Substituir `ITAP_WORKER_API` pela URL oficial |
| admin-painel.html | 4942 | `ITAP_WORKER_API + '/api/promocao/cadastro'` | Chamada de API para cadastro no painel administrativo | Substituir `ITAP_WORKER_API` pela URL oficial |
