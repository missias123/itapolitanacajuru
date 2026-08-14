# Relatório Final: Otimização do Ita Bot e Alinhamento de Conhecimento

**Autor:** Manus AI  
**Data:** 13 de Agosto de 2026  
**Projeto:** Sorveteria Itapolitana Cajuru  

---

## 1. Visão Geral da Correção do Teclado no Celular (Ita Bot)
Em dispositivos móveis (Android e iOS), ao abrir o chat de dúvidas (Ita Bot) e tocar no campo de texto para digitar, o teclado virtual nativo costumava subir e sobrepor a área de entrada, ocultando o que o usuário estava escrevendo.

### Solução Aplicada (Padrão de UX dos Maiores Sites do Mundo)
- **Reposicionamento Dinâmico no Topo**: Quando o `visualViewport` detecta que o teclado virtual foi aberto (altura visível reduzida), a barra de digitação (`.chat-inp-row`) é **automaticamente movida para o topo da janela de chat**, logo abaixo do cabeçalho do Ita Bot.
- **Visibilidade Total**: O usuário agora digita com visão 100% livre do campo de texto e das mensagens anteriores, sem que nenhum elemento fique encoberto pelo teclado.
- **Restauração Automática**: Ao fechar o teclado ou o chat, o campo retorna suavemente para a posição padrão no rodapé.

---

## 2. Contexto Completo e Conhecimento do Ita Bot
O assistente virtual foi estruturado para compreender e responder com precisão cirúrgica sobre todas as seções e regras da sorveteria, sem inventar dados:

| Tópico / Categoria | Informações Oficiais Disponíveis no Site |
| :--- | :--- |
| **Cardápio da Home** | Sorvetes artesanais, picolés, tortas, caixas, milkshakes e acompanhamentos (com Modo Foco e botão único de sabores). |
| **Encomendas (Atacado)** | Pedido mínimo de 100 unidades de picolés, limite de 25 por sabor, separadas por Base Água, Recheados, Esquimós e Especiais. |
| **Prazos e Validação** | Validação obrigatória de 5 dias úteis de antecedência para entregas e encomendas. |
| **Promoção 2027** | Sorteio mensal de Torta de Sorvete (uma caixa por mês até o fim de 2026 e sorteios de tortas em 2027). |
| **Identidade Legal** | Rigoroso cumprimento da nomenclatura **"Tipo Artesanal"** em todo o site. |
| **Painel Administrativo** | Acesso protegido pelo ícone de engrenagem (⚙️) na página de dicas, com senha `2007itapolitania`. |

---

## 3. Publicação e Status de Produção
As alterações foram compiladas, testadas e publicadas com sucesso no repositório oficial (`commit 250f53b`), estando ativas e operacionais em **[itapolitanacajuru.com.br](https://itapolitanacajuru.com.br/)**.
