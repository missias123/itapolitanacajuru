# Incidente Único — Admin não editável / Espelho quebrado

## Contexto

Regra operacional: se o **admin-painel** não estiver editável para o proprietário, o trabalho é inválido.  
Objetivo obrigatório: **Admin ↔ Site como espelho** (acesso, salvamento e reflexo).

## Evidências vinculadas

### Commits de autenticação (últimos ciclos)
- `a4f217292fd80d0c596e86f19bc2779865b9a89e`
- `267c33f48a79a2b8daf9ab9a59463007267d1ee7`
- `f88339e94061d6a6a5720c6f608c5ee2c71a9c8a`
- merge `8b51676e77bbc8183661ae04417662a3d8a54ecb`

### Runs CI com falha em token-check
- `quality-check` run `25997154247` (step: "🔒 Verificar tokens expostos")
- `auto-repair` run `25997154232` (step: "Verificar tokens expostos no código")

## Hipótese-raiz

1. Oscilação do contrato de acesso (Sessão Worker obrigatória ↔ senha+PAT) gerou retrabalho.
2. Falha precoce de segurança na CI impediu trilha completa de validação.
3. Lacunas de espelhamento (fontes duplicadas e campos sem reflexo real) mantiveram percepção de "não resolvido".

## Critério de encerramento do incidente

Encerrar somente quando os três itens passarem juntos:

- [ ] **Acesso**: login no admin-painel com senha válida e modo de edição disponível com PAT válido.
- [ ] **Salvamento**: alteração salva no JSON canônico esperado.
- [ ] **Reflexo visual**: alteração refletida na página pública correspondente.

## Ferramentas de validação vinculadas

- Gate de espelho: `scripts/admin-espelho-gate.js` + `dados/admin_espelho_matrix.json`
- Segurança de token real: `scripts/check-exposed-tokens.js`
- Relatório operacional de 5 dias: `scripts/gerar-relatorio-5dias.js`
