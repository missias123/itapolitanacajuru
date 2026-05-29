# 🗺️ Mapa de Funcionalidades — Sorveteria Itapolitana Cajuru

> Documento gerado automaticamente para orientar testes e auditorias.  
> Última atualização: gerada via Copilot / auditoria automática.

---

## 1. Páginas Principais

| Página | URL | Descrição |
|--------|-----|-----------|
| Home | `/index.html` (ou `/`) | Página principal do site — hero, cardápio inline, promoções, info, Ita Bot, rodapé |
| Promoções | `/promocao.html` | Banner de promoção vigente |
| Encomendas | `/encomendas.html` | Formulário de encomenda (tortas, eventos, etc.) |
| Cardápio | `/carrossel.html` | Carrossel de fotos do cardápio |
| Galeria | `/galeria.html` | Galeria de fotos |
| Dicas | `/dicas.html` | Dicas de sabores e conteúdo editorial |
| Painel Admin | `/admin-painel.html` | Painel interno de administração |
| Painel Qualidade | `/painel-qualidade.html` | Dashboard de qualidade do site |
| Política de Privacidade | `/politica-privacidade.html` | Página LGPD |
| Offline | `/offline.html` | Página exibida quando não há conexão (PWA) |

---

## 2. Botões e Links Importantes

### 2.1 Navegação do Topo (Header)
| Elemento | ID/Classe | Página | Fluxo esperado |
|----------|-----------|--------|----------------|
| Logo Itapolitana | `.brand` | `index.html` | Clicar rola para o topo / recarrega página |
| Botão Cardápio | `.nav-btn` (ícone cardápio) | `index.html` | Scroll/revela a seção do cardápio inline |
| Botão Promoções | `.nav-btn` | `index.html` | Redireciona para `promocao.html` |
| Botão Fidelidade | `.nav-btn` | `index.html` | Redireciona para `` |
| Botão Encomendas | `.nav-btn` | `index.html` | Redireciona para `encomendas.html` |
| Botão WhatsApp | Link `wa.me` | `index.html` | Abre WhatsApp com número configurado |

### 2.2 Hero Section
| Elemento | Fluxo esperado |
|----------|----------------|
| CTA Principal (ex.: "Ver Cardápio") | Abre seção de cardápio inline, sem salto de página |
| Badge "35+ Sabores" | Elemento informativo, sem interação obrigatória |
| Strip sensorial (texto rotativo) | Deve animar sem travar |

### 2.3 Rodapé (Footer)
| Elemento | Fluxo esperado |
|----------|----------------|
| Links de navegação | Levam às seções/páginas corretas |
| Link Google Maps | Abre mapa em nova aba |
| Link WhatsApp | Abre WhatsApp |
| Link Instagram | Abre Instagram em nova aba |
| Link Política de Privacidade | Abre `politica-privacidade.html` |
| Desenvolvido por (crédito) | Elemento estático, sem interação obrigatória |

---

## 3. Formulários

### 3.1 Formulário de Encomendas (`encomendas.html`)
- **Campos esperados**: nome, telefone, tipo de produto, data de retirada, observações
- **Fluxo**: Preencher campos → Clicar em "Enviar" → Mensagem de sucesso ou erro aparecem
- **Validação**: Campos obrigatórios devem exibir mensagem de erro se estiverem vazios
- **Destino**: Envio via WhatsApp (link `wa.me` com texto montado) ou endpoint de API GitHub

### 3.2 Formulário / Wizard de Fidelidade (``)
- **Etapa 1**: Digitar número de celular → Verificar se cliente existe
- **Etapa 2**: Se novo, preencher nome → Criar conta
- **Etapa 3**: Consultar saldo de pontos / histórico
- **Validação de código**: Campo para inserir código de resgate → Botão "✅ Validar Código"
- **Fluxo esperado**: Digitar código → Clicar validar → Pontos creditados ou mensagem de erro

---

## 4. Programa de Fidelidade

| Etapa | Descrição | Arquivo |
|-------|-----------|---------|
| Acesso | Abrir `` | `` |
| Login | Digitar celular no campo de busca → Verificar cliente em `dados/clientes.json` | `` |
| Cadastro | Se cliente novo → Wizard de cadastro (nome + celular) | `` |
| Consulta de pontos | Exibir saldo, histórico e nível do cliente | `` |
| Resgate de código | Inserir código → Validar em `dados/fidelidade.json` → Creditar pontos | `` |
| Regra de pontuação | // TODO: confirmar regra com o proprietário — ex.: R$1 = 1 ponto | `` |
| Resgate de prêmio | // TODO: confirmar regra com o proprietário — ex.: 100 pontos = sorvete grátis | `` |

---


| Aspecto | Detalhes |
|---------|----------|
| Token | Gerado pelo motor: formato `EST_xxx`, validade 8 minutos |
| Wizard (5 etapas) | Etapa 1: Clicar na estrela. Etapa 2: Inserir celular. Etapa 3: Confirmar identidade. Etapa 4: Confirmar resgate. Etapa 5: Tela de sucesso |
| Testes | Verificar que não há erros JS, que o botão de captura aparece e que a tela não trava |

### Referência no Ita Bot (FAQ)

---

## 6. Ita Bot (Chat / Robô)

| Aspecto | Detalhes |
|---------|----------|
| Elemento | `#itabot-wrap` (div flutuante) |
| Botão de abertura | `#chat-fab-btn` → chama `abrirItaBot()` |
| Dialog | `<dialog id="chat-dialog">` |
| Badge de notificação | `#itabot-badge` (contador) |
| Sugestões rápidas | Botões de tema pré-definidos: Horários, Cardápio, Fidelidade, Encomendas, Estrela, etc. |
| Fluxo | Clicar no botão flutuante → Dialog abre → Digitar mensagem ou clicar sugestão → Resposta automática aparece |
| Testes | Verificar abertura do dialog, envio de mensagem, resposta do bot, fechamento |

---

## 7. PWA (Progressive Web App)

| Aspecto | Detalhes |
|---------|----------|
| Manifest | `/manifest.json` — name, icons, start_url, display: standalone |
| Service Worker | `/sw.js` — Cache First para assets, Network First para HTML |
| Instalação | Prompt de instalação deve aparecer em navegadores compatíveis |
| Offline | Deve carregar `/offline.html` quando sem conexão |
| Cache de assets críticos | Logo, ícones, CSS, HTML principal em cache no install |
| Shortcuts | Cardápio, Encomendas, Promoções, Fidelidade (definidos no manifest.json) |

---

## 8. Banner LGPD / Cookies

| Aspecto | Detalhes |
|---------|----------|
| Elemento | `#cookie-banner` (fixo no rodapé) |
| Condição de exibição | Exibido se `localStorage.getItem('cookies_aceitos')` for null |
| Botão Aceitar | Grava `cookies_aceitos=true`, atualiza Google Consent Mode, oculta banner |
| Botão Recusar | Grava `cookies_aceitos=false`, mantém Consent Mode negado, oculta banner |
| Analytics | Google Analytics / GTM só envia dados após consentimento |
| Fluxo de teste | Limpar localStorage → Recarregar página → Banner aparece → Clicar aceitar → Analytics ativa |

---

## 9. Analytics / Consent Mode

| Aspecto | Detalhes |
|---------|----------|
| Google Analytics | ID: `G-S6TCMLQLQF` |
| GTM | ID: `GTM-K7L8M9N` |
| Consent Mode v2 | Padrão: todos negados (`analytics_storage: denied`) até usuário escolher |
| Atualização | `gtag('consent', 'update', {...})` chamado após clique no banner |

---

## 10. Checklist de Testes por Categoria

### ✅ Testes Automatizados Planejados
- [ ] Abrir cada página sem erros de JS no console
- [ ] Verificar elementos principais (logo, CTA, seções)
- [ ] Clicar em todos os botões de navegação
- [ ] Testar formulário de encomendas (campos vazios + campos preenchidos)
- [ ] Testar wizard de fidelidade (inserir celular, validar código)
- [ ] Verificar abertura e funcionamento do Ita Bot
- [ ] Verificar manifest.json e registro do service worker
- [ ] Verificar banner de cookies e comportamento do consent
- [ ] Testar carregamento offline básico (offline.html)

### 🔧 Ferramentas de Auditoria Configuradas
- **ESLint** → Erros de JavaScript em `scripts/`
- **HTMLHint** → Erros de HTML em páginas principais
- **Playwright** → Testes E2E de fluxo e funcionalidade
- **Lighthouse CLI** → Performance, Acessibilidade, SEO, PWA
- **Axe** (via Playwright) → Acessibilidade detalhada
