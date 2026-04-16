# 📚 PLAYBOOK ITAPOLITANA CAJURU

**Última atualização:** 16 de Abril de 2026  
**Versão:** 1.0  
**Responsável:** MISSIAS (Policial Aposentado)

---

## 🎯 VISÃO GERAL DO PROJETO

A **Sorveteria Itapolitana Cajuru** é uma sorveteria artesanal que implementou 3 sistemas de engajamento de clientes:

1. **🎟️ Clube de Fidelidade** - Acumula pontos por compras (seg-sex)
2. **🎁 Sorteio Mensal** - Participantes concorrem a prêmios mensais
3. **🌟 Caçada das Estrelas** - Desafio diário de capturar estrelas no site

---

## 📊 ARQUITETURA DO SISTEMA

### 1. Estrutura de Dados

#### IDs Permanentes (Nunca mudam)
- **ID Mestre:** `USR-2026-0001` (Identifica a pessoa de forma única)
- **ID Fidelidade:** `FID-0001` (Vinculado ao ID Mestre)
- **ID Promoção:** `PRM-0001` (Vinculado ao ID Mestre)
- **ID Estrelas:** `EST-0001` (Vinculado ao ID Mestre)

#### Sharding Mensal (Otimização de Performance)
```
dados/
├── fidelidade_2026_05.json (Maio - ~1.2 KB)
├── fidelidade_2026_06.json (Junho - ~1.2 KB)
├── fidelidade_indice.json (Índice rápido - 9.5 KB)
├── fidelidade_metadata.json (Metadados - 376 B)
├── promo_2026_05.json (Promoção Maio)
├── estrelas_2026_05.json (Estrelas Maio)
└── clientes.json (Dados mestres dos clientes)
```

### 2. Regras de Negóc43	#### Fidelidade
44	- ✅ Cupons emitidos a partir de **01/05/2026**
45	- ✅ Apenas **segunda a sexta-feira** (seg-sex)
46	- ✅ Sem sábado, domingo e feriados
47	- ✅ Cupons **SEM prazo de validade**
48	- ✅ Pontos **NÃO expiram**
49	- ✅ Clube pode ser **abortado a qualquer momento**
50	- ✅ Compras em sab-dom-feriados **NÃO geram pontos**
51	- ✅ **Atacado de Picolés:** Mínimo de 100 e Máximo de 250 unidades. (Acima de 250, contato via WhatsApp)teio Mensal)
- ✅ Cadastro manual ou via formulário
- ✅ Detecção de duplicatas (mesmo nome + data de nascimento)
- ✅ Botão para limpar lista mensal
- ✅ Exportação para Excel/CSV

#### Caçada das Estrelas
- ✅ Uma estrela por dia em horário aleatório (seg-sex)
- ✅ Primeiro a clicar ganha 1 estrela
- ✅ Meta: 5 estrelas por mês = 1 prêmio
- ✅ Ranking zera no 1º de cada mês
- ✅ 8 vencedores mensais concorrem a Torta de Natal

---

## 🛡️ SEGURANÇA

### Detecção de Fraude
- ✅ Bloqueio automático após 4 tentativas com código inválido
- ✅ Rastreamento de IP e Device Fingerprint
- ✅ Registro de todas as tentativas suspeitas
- ✅ Honey Pot (campo oculto anti-bot)

### Validação de Dados
- ✅ Double-Check (validação local + servidor)
- ✅ Retry automático em caso de falha de internet
- ✅ Verificação de documento (RG/CNH) idêntico ao cadastro
- ✅ Celular deve estar ativo e acessível

---

## 🚀 PERFORMANCE

### Otimizações Implementadas
- ✅ Sharding mensal: Reduz tamanho em 95% (28 KB → 1.2 KB por mês)
- ✅ Índice rápido: Validação instantânea (<100ms)
- ✅ Auto-limpeza de cache: Navegador do cliente nunca fica pesado
- ✅ Carregamento responsivo: 3 aparelhos (celular, tablet, desktop)

### Métricas Alvo
- ⏱️ Tempo de carregamento: <2 segundos
- 📊 Uptime: >99.9%
- 🔄 Latência: <100ms por transação
- 💾 Tamanho da página: <500 KB

---

## 📱 RESPONSIVIDADE

### 3 Breakpoints Implementados
1. **📱 Celular Pequeno** (até 480px)
   - Padding: 12px
   - Fonte título: 0.9rem
   - Fonte texto: 0.8rem

2. **📱 Tablet** (481px - 768px)
   - Padding: 14px
   - Fonte título: 0.95rem
   - Fonte texto: 0.85rem

3. **🖥️ Desktop** (769px+)
   - Padding: 16px
   - Fonte título: 1rem
   - Fonte texto: 0.9rem

---

## 🎛️ PAINEL ADMIN

### Funcionalidades Disponíveis

#### Fidelidade
- ✅ Gerar lotes de 100 códigos
- ✅ Visualizar todos os códigos (disponíveis, usados, liberados)
- ✅ Configurar prêmios (pontos necessários)
- ✅ Adicionar participante manualmente
- ✅ Excluir participante (botão 🗑️)

#### Promoção
- ✅ Adicionar participante manualmente
- ✅ Excluir participante (botão 🗑️)
- ✅ Limpar lista mensal (🧹)
- ✅ Exportar para CSV/Excel
- ✅ Copiar lista para sorteio

#### Estrelas
- ✅ Agendar estrela (data + horário)
- ✅ Adicionar estrela manualmente para cliente
- ✅ Visualizar ranking do ciclo
- ✅ Excluir participante do ranking (botão 🗑️)
- ✅ Resetar captura (🔄)
- ✅ Botão de pânico (🚨) para desativar estrela

#### Clientes
- ✅ Visualizar todos os clientes
- ✅ Buscar por nome ou WhatsApp
- ✅ Detectar duplicatas
- ✅ Bloquear/desbloquear cliente

---

## 📋 PROTOCOLO DE ANÁLISE (ANTES DE QUALQUER MUDANÇA)

Quando receber uma tarefa, SEMPRE fazer:

### 1️⃣ LEITURA INICIAL
- [ ] Ler este Playbook
- [ ] Entender o contexto da tarefa
- [ ] Identificar os sistemas afetados

### 2️⃣ LISTAR O QUE PRECISA ANALISAR
- [ ] **Arquivos afetados** (quais arquivos serão modificados?)
- [ ] **Dados que serão modificados** (qual informação muda?)
- [ ] **Impacto em outros sistemas** (afeta Fidelidade? Promoção? Estrelas?)
- [ ] **Segurança e validações** (há risco de fraude?)
- [ ] **Performance e escalabilidade** (vai ficar mais lento?)
- [ ] **Compatibilidade** (funciona em celular, tablet, desktop?)
- [ ] **Backup necessário?** (precisa fazer backup antes?)

### 3️⃣ APRESENTAR ANÁLISE
- [ ] Listar os arquivos que serão modificados
- [ ] Explicar o impacto de cada mudança
- [ ] Mostrar os riscos (se houver)
- [ ] Sugerir alternativas (se houver)

### 4️⃣ AGUARDAR CONFIRMAÇÃO
- [ ] Esperar o MISSIAS confirmar antes de fazer qualquer mudança
- [ ] NÃO inventar, NÃO assumir, NÃO adivinhar

### 5️⃣ FAZER AS ALTERAÇÕES
- [ ] Aplicar as mudanças exatamente como planejado
- [ ] Fazer backup antes
- [ ] Testar cada mudança

### 6️⃣ TESTAR AO VIVO
- [ ] Acessar o site real
- [ ] Testar como um cliente faria (não usar dados da memória)
- [ ] Registrar cada resultado
- [ ] Não inventar resultados

### 7️⃣ ENTREGAR RELATÓRIO
- [ ] O que foi feito
- [ ] O que funcionou
- [ ] O que não funcionou (se houver)
- [ ] Alterações necessárias
- [ ] Recomendações

---

## 🔍 RECOMENDAÇÕES PARA SER O MELHOR DA REGIÃO

### 1. SEO (Aparecer no topo do Google)
- ✅ Meta tags otimizadas
- ✅ Schema.org para avaliações
- ✅ Sitemap XML
- ✅ Mobile-friendly certified
- ✅ Page Speed Insights >90

### 2. REVIEWS (Avaliações 5 Estrelas)
- ✅ Google Business Profile atualizado
- ✅ Link para deixar avaliação no site
- ✅ Responder comentários rapidamente
- ✅ Mostrar avaliações no site

### 3. MOBILE FIRST
- ✅ Carrega em <2 segundos no 4G
- ✅ Botões grandes e fáceis de clicar
- ✅ Sem pop-ups intrusivos
- ✅ Compatível com iOS e Android

### 4. SEGURANÇA
- ✅ HTTPS (SSL/TLS)
- ✅ Proteção contra DDoS
- ✅ Backup automático diário
- ✅ Monitoramento 24/7

### 5. ENGAGEMENT
- ✅ WhatsApp integrado
- ✅ Notificações push (opcional)
- ✅ Email marketing (opcional)
- ✅ Instagram/Facebook links

### 6. ANALYTICS
- ✅ Google Analytics 4
- ✅ Rastreamento de conversões
- ✅ Heatmap de cliques
- ✅ Relatório semanal

---

## 📂 ESTRUTURA DE ARQUIVOS

```
/home/ubuntu/repo_ita/
├── fidelidade.html (Página de Fidelidade)
├── promocao.html (Página de Promoção)
├── admin-painel.html (Painel Admin)
├── dados/
│   ├── clientes.json
│   ├── fidelidade_2026_05.json até 12.json
│   ├── fidelidade_indice.json
│   ├── promo.json
│   └── estrelas_ciclo.json
├── backups/
│   ├── backup_20260416_114413/
│   └── latest/ (sempre aponta para o backup mais recente)
├── gerar_365_horarios_ano.py
├── gerar_novo_id_cliente.py
├── vincular_3_sistemas.py
├── reestruturar_fidelidade.py
└── PLAYBOOK_ITAPOLITANA.md (Este arquivo)
```

---

## 🎯 CHECKLIST PARA PRÓXIMAS TAREFAS

Quando MISSIAS pedir uma tarefa, usar este checklist:

- [ ] Li o Playbook?
- [ ] Identifiquei os arquivos afetados?
- [ ] Fiz a análise completa?
- [ ] Apresentei a análise para MISSIAS?
- [ ] Recebi confirmação para prosseguir?
- [ ] Fiz backup dos dados?
- [ ] Fiz as alterações?
- [ ] Testei ao vivo (como cliente)?
- [ ] Registrei os resultados reais?
- [ ] Entreguei o relatório final?

---

## 📞 CONTATO E SUPORTE

- **Responsável:** MISSIAS (Policial Aposentado)
- **Email:** (conforme necessário)
- **WhatsApp:** (conforme necessário)
- **GitHub:** https://github.com/missias123/itapolitanacajuru

---

**Este Playbook é um documento vivo e será atualizado conforme novas funcionalidades forem adicionadas.**

Última revisão: 16 de Abril de 2026
