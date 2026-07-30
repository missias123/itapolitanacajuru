# Configuração de Produção — Itapolitana Cajuru

Este documento contém o resumo da configuração de infraestrutura realizada em 30/07/2026.

## 1. Cloudflare Workers (API)
- **Worker Name:** `itapolitanacajuruoficial`
- **Route:** `api.itapolitanacajuru.com.br/*`
- **KV Namespaces:**
  - `CLIENTES_KV`: `9a3e5d5c8fc94c8a8b2d27e0fcc783f9`
  - `ENCOMENDAS_KV`: `6b5f3c8a655842b5a42dfca0bdeafa90`
  - `RATE_KV`: `48321bd8c21f42e98488ff8f28d6da89`

## 2. Painel Administrativo
- **URL:** `https://itapolitanacajuru.com.br/admin-painel.html`
- **Senha Admin:** `Itapolitana@2026`
- **Token GitHub:** Configurado como segredo no Cloudflare Worker (`GITHUB_TOKEN`).
- **Melhoria:** O acesso agora é simplificado. Ao entrar com a senha, o sistema utiliza automaticamente o token do GitHub armazenado no servidor para realizar as alterações.

## 3. GitHub Pages (Frontend)
- **URL Principal:** `https://itapolitanacajuru.com.br`
- **Domínio:** Gerido via Cloudflare com SSL/HTTPS ativo.

## 4. Promoção Especial
- **Funcionamento:** Inscrições salvas diretamente no `CLIENTES_KV`.
- **Gestão:** Os inscritos podem ser visualizados e geridos na nova aba "Sorteio" do Painel Admin.
- **WhatsApp:** Removido o envio automático de mensagem para focar no registo interno.

---
*Configurado por Manus AI.*
