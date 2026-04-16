# 📋 PROTOCOLO PERMANENTE — SITE ITAPOLITANA CAJURU
> **Leia este arquivo ANTES de fazer qualquer alteração no projeto.**

---

## 🌐 REGRA 1 — DOMÍNIO ÚNICO E OFICIAL
- O site oficial é **`https://itapolitanacajuru.com.br`**
- **NUNCA** publicar ou testar em `missias123.github.io` como destino final
- Todo commit publicado no branch `principal` vai automaticamente para o domínio oficial
- O HTTPS **DEVE** estar sempre ativado no GitHub Pages (Configurações → Páginas → "Impor HTTPS" ✅)

---

## 📱 REGRA 2 — PROTOCOLO DE TESTE HUMANO (PC, CELULAR E TABLET)
- **Toda alteração** deve ser validada simulando um usuário real em 3 dispositivos:
  - 📱 **Celular:** Botões fáceis de clicar com o polegar, texto legível sem zoom, modais em tela cheia
  - 📟 **Tablet:** Layout se adapta sem espaços vazios ou quebras
  - 💻 **PC:** Navegação fluida com mouse, visual profissional em telas grandes
- **NUNCA** marcar como "concluído" sem passar pelo Teste Humano

---

## 🧹 REGRA 3 — ANALISAR ANTES DE EDITAR
- **NUNCA** editar código sem identificar a causa raiz do problema primeiro
- Sequência obrigatória: **1. ANALISAR → 2. PLANEJAR → 3. EXECUTAR UMA VEZ, CERTO**
- Usar ferramentas de busca (`grep`) para localizar o problema exato antes de qualquer edição

---

## 🚫 REGRA 4 — PROIBIDO: CÓDIGO SOLTO NO HTML
- **NUNCA** inserir atributos HTML (`class=`, `id=`, `onkeydown=`) fora de tags `< >`
- Se o usuário enviar um trecho de código como mensagem de texto, usar apenas como **referência**, nunca colar diretamente no HTML
- **CAUSA DO ERRO HISTÓRICO (16/04/2026):** O texto `class="chat-inp" id="chat-inp" onkeydown=...` foi inserido dentro de um `<label>` como conteúdo visível, causando exibição do código na tela do cliente

---

## 🔒 REGRA 5 — HTTPS SEMPRE ATIVO
- O HTTPS **NUNCA** pode ser desativado
- Se o GitHub Pages mostrar status `errored`, verificar primeiro se o HTTPS está ativo
- Certificado SSL válido até: **24/05/2026** (renovar antes do vencimento)

---

## 🎟️ REGRA 6 — ID ÚNICO PERMANENTE (USR-2026)
- Cada cliente tem **um único ID** no formato `USR-2026-XXXX`
- O mesmo ID é usado nos 3 programas: **Fidelidade**, **Sorteio** e **Estrelas**
- Se o cliente se cadastrar em qualquer um dos 3, o sistema reconhece pelo celular e usa o mesmo ID
- **NUNCA** criar IDs separados para o mesmo cliente

---

## 🛒 REGRA 7 — CARRINHO DE PICOLÉS
- Mínimo: **100 picolés** por encomenda
- Máximo: **250 picolés** por encomenda
- Se o cliente remover itens e ficar abaixo de 100, mostrar botão **"➕ Adicionar mais sabores"**
- O carrinho deve manter o que já foi escolhido ao retornar para o menu

---

## 📅 REGRA 8 — REGULAMENTO 2026
- Pontos acumulados de **segunda a sexta-feira** (dias úteis)
- Pontos **SEM PRAZO DE VALIDADE** (nunca expiram)
- IDs permanentes (nunca mudam, mesmo que o cliente se recadastre)

---

## ⚡ REGRA 9 — CACHE BUSTING (ATUALIZAÇÃO INSTANTÂNEA)
- Todos os scripts devem ter versão no formato `?v=AAAAMMDD_VERSAO`
- Exemplo: `scripts/site-loader.js?v=20260416_FINAL_V2`
- Atualizar a versão a cada deploy para forçar o navegador a baixar a versão nova

---

## 🏗️ ESTRUTURA DO PROJETO
```
itapolitanacajuru/
├── index.html          → Página principal (Home + Chat + FAQ + Fale Conosco)
├── fidelidade.html     → Clube de Fidelidade + Sorteio + Estrelas
├── promocao.html       → Formulário de Promoção
├── admin-painel.html   → Painel Administrativo (exclusivo do MISSIAS)
├── encomendas.html     → Carrinho de Picolés e Encomendas
├── scripts/
│   ├── site-loader.js      → Carregamento principal
│   ├── products.js         → Cardápio e produtos
│   ├── enc-v2.js           → Lógica do carrinho de encomendas
│   └── motor-estrelas-v2.js → Sistema de Caça às Estrelas
├── CNAME               → itapolitanacajuru.com.br
└── PROTOCOLO.md        → Este arquivo (regras permanentes)
```

---

## 📞 CONTATO DO PROPRIETÁRIO
- **Nome:** MISSIAS
- **Função:** Policial Aposentado / Proprietário da Sorveteria Itapolitana Cajuru
- **Site:** https://itapolitanacajuru.com.br
- **WhatsApp:** Configurado no site

---

---

## 🚨 REGRA 10 — NUNCA ALTERAR CONFIGURAÇÕES DO GITHUB PAGES VIA API
- **NUNCA** usar comandos de API (`gh api --method PUT repos/.../pages`) para alterar configurações do GitHub Pages
- Isso **desativa o HTTPS automaticamente** sem aviso
- Configurações (HTTPS, domínio personalizado) só devem ser alteradas **manualmente** pelo proprietário MISSIAS na interface do GitHub
- Para publicar código: usar apenas `git push origin main`
- **CAUSA DO ERRO HISTÓRICO (16/04/2026):** Tentativa de ativar HTTPS via API desativou o HTTPS e causou erro de deploy no domínio `.com.br`

---

*Última atualização: 16/04/2026 — Criado após auditoria completa do sistema*
