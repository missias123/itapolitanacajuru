# 📜 Regras de Ouro - Itapolitana Cajuru

Este documento estabelece as regras obrigatórias para qualquer alteração no site, visando manter o padrão **World Class**.

## 1. Regra de Sincronização Obrigatória
> **"Antes de qualquer envio (push) ou publicação, o site DEVE estar sincronizado."**

Isso inclui:
- **Admin**: Todas as alterações feitas no painel devem refletir nos arquivos JSON locais.
- **GitHub**: O código local deve ser auditado antes de ser enviado ao repositório.
- **Cloudflare**: A integridade das rotas e bindings deve ser verificada.

## 2. Regra de Responsividade Mobile
- O cabeçalho mobile deve seguir o layout **1 (Feedback) + 2x2 (Outros botões)**.
- A altura dos botões no topo para celular deve ser mantida no limite compacto (**54px a 60px**).
- Todos os alvos de toque devem ser fáceis de clicar, mas sem desperdício de espaço vertical.

## 3. Regra do ItaBot 3D
- O robô deve ser mantido em **3D transparente**, flutuando como um "fantasma".
- O **visor LED** deve alternar entre expressões e mensagens.
- **Cores do LED**: Fundo vermelho com letras brancas (contorno preto) somente durante mensagens; fundo preto original nos demais momentos.

## 4. Automação de Auditoria
Sempre execute o script de auditoria antes de enviar alterações:
```bash
python scripts/itap-world-class-audit.py
```
*Esta verificação é executada automaticamente pelo GitHub Actions em cada push.*

## 5. Regra do Formulário de Picolé Grátis

> **O formulário de Picolé Grátis é SEPARADO do formulário de Dúvidas do ItaBot. São dois formulários diferentes.**

### Como funciona:
- **Uma vez por dia**, o LED do robô exibe **"🍦 PICOLÉ GRÁTIS AGORA!"**.
- Nesse momento, o usuário deve **clicar no robô** — abrirá automaticamente o **formulário exclusivo do Picolé Grátis** (identificado com "🍦 PICOLÉ GRÁTIS" no topo da tela).
- O formulário solicita: **Nome completo como no documento**, **Data de nascimento como no documento**, e o envio é feito **via WhatsApp** para agendar a retirada em uma das datas disponíveis: **Segunda, Quarta ou Sexta**.
- Ao clicar no robô **fora do momento do LED de Picolé Grátis**, abrirá o formulário de **Dúvidas do ItaBot** — que é diferente.

### Regra obrigatória:
- O formulário de Dúvidas do ItaBot **deve sempre exibir um aviso destacado** (fundo amarelo com borda dourada) informando que Picolé Grátis é em outro formulário, para evitar que usuários enviem pedidos de picolé pelo canal errado.
- Nunca remover ou ocultar esse aviso do campo "💬 Enviar mensagem direta via WhatsApp" no painel de Dúvidas.
