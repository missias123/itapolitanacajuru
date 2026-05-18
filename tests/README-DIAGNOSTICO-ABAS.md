# 🔍 Ferramenta de Diagnóstico de Abas - Admin-Painel

## 📋 Visão Geral

Esta ferramenta foi desenvolvida para diagnosticar problemas de visibilidade nas abas **Fidelidade**, **Dicas**, **Encomendas** e **Qualidade** do admin-painel da Sorveteria Itapolitana Cajuru.

## 🎯 Objetivo

A ferramenta executa testes automatizados que verificam:
- ✅ Se as seções HTML existem no DOM
- ✅ Se as seções recebem a classe `ativo` ao clicar no botão
- ✅ Se as seções ficam visíveis (CSS `display`, `visibility`, `opacity`)
- ✅ Se há conteúdo renderizado dentro das seções
- 📝 Captura todos os logs do console durante a navegação

## 🚀 Como Usar (Opção 1: Navegador Local - RECOMENDADO)

### Passo 1: Abrir a Ferramenta
1. Baixe o arquivo `diagnostico-abas-admin.html` deste repositório
2. Abra o arquivo diretamente no seu navegador (Chrome ou Edge recomendado)

### Passo 2: Executar o Diagnóstico
1. Clique no botão **"🚀 Iniciar Diagnóstico Completo"**
2. Aguarde 10-15 segundos (os testes são executados sequencialmente)
3. Observe os resultados em tempo real

### Passo 3: Copiar o Relatório
1. Quando o status mostrar **"Concluído"**, clique em **"📋 Copiar Relatório"**
2. Cole o relatório completo e compartilhe com o desenvolvedor

## 📊 O Que a Ferramenta Testa

Para cada uma das 4 abas, a ferramenta verifica:

### 1. Aba Fidelidade
- Seção `sec-clientes` deve estar ativa e visível
- Seção `sec-fidelidade` deve estar ativa e visível
- Funções `renderClientes()`, `preencherFidelidade()`, `renderCódigos()` devem ser chamadas

### 2. Aba Dicas
- Seção `sec-depoimentos` deve estar ativa e visível
- Função `preencherDepoimentos()` deve ser chamada

### 3. Aba Encomendas
- Seção `sec-encomendas-config` deve estar ativa e visível
- Função `carregarEncomendas()` deve ser chamada

### 4. Aba Qualidade
- Seção `sec-qualidade` deve estar ativa e visível
- Funções `atualizarScoresQualidade()` e `preencherNotasOperacionais()` devem ser chamadas

## 🔧 Interpretando os Resultados

### ✅ Resultado Esperado (Tudo OK)
```
Seção sec-fidelidade: Encontrada=true, Ativa=true, Visível=true
Status Final: SUCESSO
```

### ❌ Problema Identificado
```
Seção sec-fidelidade: Encontrada=true, Ativa=true, Visível=false
Status Final: ERRO
```

Isso indica que a seção existe e está marcada como ativa, mas o CSS não está tornando ela visível.

## 🌐 Como Usar (Opção 2: Hospedagem Online)

Se preferir não baixar o arquivo, você pode:

1. **Hospedar no GitHub Pages**:
   - Faça commit do arquivo `diagnostico-abas-admin.html` na branch `gh-pages`
   - Acesse via `https://missias123.github.io/itapolitanacajuru/tests/diagnostico-abas-admin.html`

2. **Usar localmente via Python**:
   ```powershell
   # No diretório tests/
   python -m http.server 8000
   # Abra http://localhost:8000/diagnostico-abas-admin.html
   ```

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (não suportado)

## 🔒 Segurança

A ferramenta:
- ✅ Executa localmente no seu navegador
- ✅ Não envia dados para servidores externos
- ✅ Usa iframe para isolar os testes
- ✅ Captura logs sem modificar o código do admin-painel

## 🐛 Problemas Conhecidos

1. **Erro de CORS**: Se você abrir o arquivo diretamente (`file://`), pode haver restrições de CORS. Neste caso, use um servidor local.

2. **Iframe bloqueado**: Alguns navegadores podem bloquear iframes. Certifique-se de permitir conteúdo do domínio `itapolitanacajuru.com.br`.

## 📞 Suporte

Se encontrar problemas ao usar a ferramenta:
1. Verifique se o console do navegador mostra erros (F12 → Console)
2. Tire um screenshot do erro
3. Compartilhe com o desenvolvedor

## 📝 Exemplo de Relatório Gerado

```
═══════════════════════════════════════════════════════════════
RELATÓRIO DE DIAGNÓSTICO - ABAS DO ADMIN-PAINEL
Gerado em: 18/05/2026 19:31:00
URL: https://itapolitanacajuru.com.br/admin-painel.html
═══════════════════════════════════════════════════════════════

=== TESTE: FIDELIDADE ===
Seção sec-clientes: Encontrada=true, Ativa=true, Visível=true
  Conteúdo (primeiros 100 chars): [conteúdo da seção...]
Seção sec-fidelidade: Encontrada=true, Ativa=true, Visível=true
  Conteúdo (primeiros 100 chars): [conteúdo da seção...]

Logs do Console (5 mensagens):
  [log] [irPara] Navegando para: fidelidade-admin
  [log] [irPara] IDs das seções a ativar: clientes,fidelidade
  [log] [irPara] ✓ Seção ativada: sec-clientes
  [log] [irPara] ✓ Seção ativada: sec-fidelidade
  [log] [irPara] Inicializando FIDELIDADE

Status Final: SUCESSO

[... restante das abas ...]

═══════════════════════════════════════════════════════════════
DIAGNÓSTICO CONCLUÍDO
═══════════════════════════════════════════════════════════════
```

---

**Desenvolvido para**: Projeto Itapolitana Cajuru
**Versão**: 1.0
**Data**: Maio 2026
