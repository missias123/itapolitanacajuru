# Política de Segurança — Sorveteria Itapolitana Cajuru

## Reportar uma Vulnerabilidade

Para reportar uma vulnerabilidade de segurança, envie um e-mail diretamente ao administrador do sistema (não abra uma Issue pública) ou use a funcionalidade "Security Advisories" do GitHub (aba Security > Advisories).

---

## ⚠️ Aviso Crítico: Dados de Clientes em Repositório Público

### Situação Atual

O arquivo `dados/clientes.json` armazena dados pessoais dos participantes do Clube de Fidelidade:

- Nome completo
- Data de nascimento
- Número de celular
- Histórico de pontos e resgates

**Este arquivo está acessível publicamente** por estar em um repositório GitHub Pages. Isso representa um risco de conformidade com a LGPD (Lei nº 13.709/2018).

### Mitigação Aplicada (16/05/2026)

✅ **PII removido dos arquivos expostos**: os dados reais de clientes e encomendas foram apagados dos arquivos `dados/clientes.json`, `dados/encomendas.json` e `dados/vinculos_clientes.json`. Todos foram substituídos por estruturas vazias compatíveis com o código existente.

> ⚠️ Esta é uma mitigação de emergência. Novos dados inseridos pelo painel admin voltarão a ficar expostos publicamente enquanto o repositório permanecer público. A solução definitiva é a migração para um backend seguro (ver seção abaixo).

### Mitigações Adicionais Recomendadas

1. **Repositório Privado**: Migrar o repositório para privado no GitHub. O GitHub Pages suporta repositórios privados em planos pagos. Isso impede o acesso público direto ao JSON.

2. **Acesso via API com Token Restrito**: O sistema já utiliza um token GitHub com escopo limitado (`contents: write`) para salvar dados. Garantir que o token de produção **nunca seja exposto** no frontend.

3. **Minimização de Dados**: Avaliar quais campos são estritamente necessários e remover informações desnecessárias (ex.: `historico_alteracoes` completo pode ser resumido).

### Caminho Recomendado para Produção (Médio Prazo)

Migrar o armazenamento de clientes para um backend dedicado com:

- **Cloudflare Workers + KV** (gratuito no plano básico): substitui o GitHub API como backend.
- **Supabase** (banco Postgres gerenciado, tier gratuito): autenticação, RLS e API REST prontos.
- **Firebase Firestore**: alternativa Google com regras de segurança por usuário.

Qualquer uma dessas opções elimina a exposição de PII em repositório público e simplifica a gestão de permissões.

### Situação dos Outros Dados Sensíveis

| Arquivo | Conteúdo | Exposição | Risco |
|---|---|---|---|
| `dados/clientes.json` | PII (nome, cel, nasc.) — **vazio após 16/05/2026** | Público (GitHub Pages) | **Alto** (ver aviso acima) |
| `dados/encomendas.json` | Pedidos + telefone — **vazio após 16/05/2026** | Público | **Alto** (ver aviso acima) |
| `dados/vinculos_clientes.json` | Vínculo nome+cel — **vazio após 16/05/2026** | Público | **Alto** (ver aviso acima) |
| `dados/config.json` | Configurações do site | Público | Baixo (sem senhas em texto claro) |
| `dados/fidelidade*.json` | Códigos de pontos | Público | Médio |

### Configurações de Segurança Já Implementadas

- ✅ HTTPS com HSTS (`max-age=31536000; includeSubDomains`)
- ✅ `Content-Security-Policy` restritiva (sem `unsafe-eval`)
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ Google Consent Mode v2 (analytics negado por padrão)
- ✅ Banner de cookies com opt-in
- ✅ Política de Privacidade publicada (`/politica-privacidade.html`)
- ✅ Admin (`/admin-painel.html`) com `noindex, nofollow` e `no-store`
- ✅ `robots.txt` bloqueia acesso de crawlers ao admin
- ✅ Inputs de formulário sanitizados via `textContent` (sem `innerHTML` com dados externos)
