# Matriz obrigatória — Auditoria semanal World Class

A auditoria semanal da Itapolitana deve avaliar o produto digital e a operação interna, não apenas se uma página abre. Cada resultado precisa indicar evidência, data, commit, URL e estado. A ausência de evidência não pode ser convertida em aprovação.

## Critérios e bloqueios

| Domínio | O que verificar toda segunda-feira | Evidência mínima | Estado que bloqueia |
|---|---|---|---|
| Integridade do projeto | Arquivos críticos, páginas, scripts, dados e regras presentes | Lista de arquivos e hashes/commit | Arquivo ou rota crítica ausente |
| Código | Sintaxe JavaScript, dependências, referências internas, ausência de token exposto | Saída dos gates e lista de referências | Sintaxe quebrada, asset/rota ausente ou segredo exposto |
| Site público | HTTP 200/redirect esperado para páginas críticas, sem 404, HTML válido e recursos carregáveis | Status HTTP, URL final, tempo e corpo resumido | Página crítica indisponível |
| Admin | HTML, seções, IDs, funções de carregamento/salvamento, matriz espelho e caminhos de dados | Gate admin↔site, auditoria estrutural e E2E | Divergência entre admin, JSON e site ou falha crítica de salvamento |
| Responsividade | 360, 390, 430, 768 e 1280px; overflow, reflow, cabeçalho 1+2×2 | Medições DOM e screenshots quando houver falha | Overflow, layout quebrado ou cabeçalho fora da regra |
| Toque e acessibilidade | Altura de 54–60px dos cinco botões mobile, espaçamento, foco, teclado, contraste, nome acessível, WCAG 2.2 | Medições e resultados E2E | Controle impossível de acionar, sem foco ou falha crítica de acessibilidade |
| Desempenho | LCP, INP, CLS quando houver dados, tamanho, imagens, cache e carregamento | Métricas reais ou medição local explicitamente identificada | Regressão grave ou ausência de recurso essencial |
| SEO/PWA | `lang`, title/description, canonical, OG, schema, manifest, theme-color, ícones e offline | Auditoria estática por página | Meta essencial ausente em página principal |
| Segurança | HTTPS, HSTS, nosniff, Referrer-Policy, CSP, mixed content, exposição de credenciais, inputs e autenticação | Headers públicos, scan estático e testes não destrutivos | Segredo exposto, mixed content, autenticação quebrada ou endpoint inseguro |
| ItaBot | Um launcher, imagem 3D transparente, LED, posição fixa, áreas livres, ausência no rodapé/colisões e fluxo Dúvidas | DOM, estilo computado, posições em scroll e screenshot | Duplicidade, cobertura de conteúdo/navegação ou fluxo quebrado |
| Promoção | Endpoint server-authoritative, janela de 5s, um vencedor diário, idempotência, formulário separado e retirada | GET seguro de status com `campaign_configured`, `campaign_active`, `activation_explicit`, `paused`, `schedule_created` e `safeToAnnounce`; testes isolados sem premiação real | GET com efeitos colaterais, ativação automática, endpoint 404, lógica não verificável ou possibilidade de dupla premiação |
| Catálogo e SKU | Fonte única de verdade, sequência por tipo, sem sabores inventados e paridade com admin | Comparação JSON↔scripts↔renderização | Divergência de produto, SKU ou preço |
| Publicação e cache | Commit remoto, Pages build, hashes, query strings, Service Worker e cache | URL pública, workflow e recursos carregados | Build falho, versão antiga ou rota não publicada |

## Estados

`APROVADO` significa que o critério foi testado e a evidência está disponível. `AVISO` significa que há risco não bloqueante, mas existe ação recomendada. `PENDENTE` significa que a camada não pôde ser validada e não pode ser anunciada como segura ou operacional. `BLOQUEADO` significa que existe falha crítica que deve impedir publicação ou ativação.

## Princípios de execução

A coleta é somente leitura: não salva no admin, não envia WhatsApp, não reserva prêmio, não cria vencedor, não cria campanha e não altera dias ou estado. O GET público de status precisa permanecer sem escritas em `PROMO_KV`; qualquer ativação deve ser feita por rota administrativa autenticada. Testes de promoção devem usar ambiente isolado, fixture ou endpoint explicitamente seguro; nunca se deve testar concorrência contra a campanha pública. Cada execução deve produzir `auditoria-semanal-latest.json` e `auditoria-semanal-latest.md`, além dos artefatos de teste e do commit auditado.

## Referências normativas

A meta de alvo de toque da W3C WCAG 2.2 é no mínimo 24×24 CSS pixels, com exceções de espaçamento; a regra local de 54–60px para os botões do cabeçalho é deliberadamente mais rigorosa. O Google recomenda LCP até 2,5s, INP abaixo de 200ms e CLS abaixo de 0,1 para boa experiência. O OWASP ASVS fornece a base para verificação técnica de segurança de aplicações web.

- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://owasp.org/www-project-application-security-verification-standard/
