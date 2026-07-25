# LOTE 2.1 — Plano técnico detalhado (OPÇÃO B)

## Objetivo
Migrar autenticação e dados administrativos sensíveis para backend seguro (Worker/API), removendo dependência de JSON público no frontend.

## Escopo
- Autenticação administrativa com verificação apenas no backend.
- Sessão temporária com expiração e revogação.
- Leitura/escrita administrativa via endpoints autenticados.
- Dados sensíveis em KV (ou banco protegido), não no conteúdo público.

## Arquitetura proposta
1. **Auth backend**
   - `POST /api/admin/auth` valida credencial e cria sessão.
   - `DELETE /api/admin/session` revoga sessão.
   - Rate limiting por IP e por rota.
2. **Autorização**
   - Token de sessão curto (`X-Itap-Session-Token`) com TTL.
   - Checagem obrigatória em todas as rotas admin.
3. **Dados**
   - `CLIENTES_KV` para clientes.
   - `ENCOMENDAS_KV` para encomendas/pedidos.
   - `RATE_KV` para sessões e rate limit.
4. **Frontend admin**
   - Sem leitura direta de `/dados/*.json` sensíveis.
   - Consumo exclusivo de endpoints autenticados.

## Migração de senha (OPÇÃO B)
1. Substituir SHA-256 sem salt por **Argon2id** (preferencial) ou **bcrypt**.
2. Salvar apenas hash no secret manager.
3. Nunca expor hash/senha no navegador, logs ou repositório.
4. Rotação controlada da credencial de staging.
5. Rotação de produção somente após aprovação separada.

## Endpoints-alvo da migração
- `/api/admin/auth`
- `/api/admin/session` (logout/revogação)
- `/api/admin/github-file` (somente onde ainda houver dependência transitória de GitHub)
- `/api/clientes*` e `/api/encomendas*` para fluxo definitivo administrativo

## Critérios de aceite para produção
- URLs sensíveis retornando 401/403/404.
- Login/logout/sessão expirada/credencial inválida validados.
- Ausência de senha/hash/token no bundle frontend.
- Auditoria de logs sem dados sensíveis.
- Backup auditável restaurado com sucesso.
- Rollback testado em staging.

## Custo operacional e impacto
- **Impacto técnico:** médio-alto (mudança de fluxo do admin e de persistência).
- **Risco funcional:** médio (necessita bateria de regressão admin + site público).
- **Dependências externas:** Cloudflare KV, secrets, domínio/API.
- **Operação:** exige runbook de deploy por ambiente (local/staging/produção).

## Plano de rollback (sem reexpor auth.json)
1. Reverter frontend admin para commit anterior estável em branch de staging.
2. Manter `auth.json` fora do conteúdo público.
3. Revogar sessões emitidas durante janela de incidente.
4. Restaurar dados de KV a partir do backup auditável validado.
5. Reexecutar smoke tests de login/admin/site.

## Pendências antes de produção
- Aprovação formal da estratégia Argon2id/bcrypt no runtime alvo.
- Teste de carga básico no endpoint de auth com rate limit ativo.
- Revisão de segurança do fluxo completo de sessão.
- Assinatura do plano de rotação da credencial de produção.
