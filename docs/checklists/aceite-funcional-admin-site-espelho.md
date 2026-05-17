# Checklist de Aceite Final — Admin ↔ Site Espelho

> Validar em produção antes de considerar uma correção concluída.

## 1) Acesso
- [ ] Entrar no `admin-painel.html` com senha válida.
- [ ] Confirmar banner de modo (somente leitura vs escrita) coerente com presença de PAT.
- [ ] Confirmar que não existe dependência obrigatória de Sessão Worker para leitura.

## 2) Salvamento
- [ ] Editar um campo crítico (ex.: `hero-título`, `promo-h1`, `chat-fab-texto`).
- [ ] Salvar sem erro e confirmar persistência no JSON canônico.
- [ ] Reabrir admin e confirmar que o valor persistiu.

## 3) Reflexo no Site
- [ ] Abrir página pública alvo e validar reflexo do campo alterado.
- [ ] Validar em desktop e mobile (mínimo: Desktop Chrome + Pixel 5).
- [ ] Confirmar ausência de fallback indevido para conteúdo hardcoded no campo testado.

## 4) Evidências
- [ ] Anexar run do Gate de Espelho na CI.
- [ ] Anexar run de testes E2E/Lighthouse/Quality Check.
- [ ] Atualizar incidente em `docs/incidentes/admin-nao-editavel-espelho-quebrado.md`.
