# 🍦 Guia de Padrões World Class: Itapolitana Cajuru
**Versão:** 1.0 — Agosto 2026  
**Autor:** Manus AI  

Este documento estabelece as diretrizes de design, experiência do usuário (UX) e engenharia técnica para manter o site da Itapolitana Cajuru no patamar de excelência dos maiores portais de alimentação do mundo (Starbucks, Häagen-Dazs, iFood).

---

## 1. Identidade Visual e Interação Rápida
A "Primeira Impressão" é baseada em reconhecimento visual imediato, reduzindo a carga cognitiva do cliente.

### 1.1 Matriz de Cores dos 38 Sabores
Cada sabor deve possuir um retângulo com gradiente temático. O cérebro humano processa cores 60.000 vezes mais rápido que textos.

| Categoria | Exemplo de Sabores | Gradiente / Cor | Objetivo Visual |
| :--- | :--- | :--- | :--- |
| **Chocolates** | Belga, Ferrero, Nutella | `#5D4037` → `#3E2723` | Conforto, densidade e desejo. |
| **Frutas Vermelhas** | Morango, Sensação, Amarena | `#F06292` → `#E91E63` | Frescor, doçura e vibração. |
| **Cítricos** | Limão, Limão Suíço | `#DCE775` → `#AFB42B` | Acidez, limpeza e refrescância. |
| **Especiais** | Pistache, Menta | `#C5E1A5` → `#689F38` | Exclusividade e sofisticação. |
| **Clássicos** | Ninho, Coco, Creme | `#FFFFFF` → `#F5F5F5` | Pureza, cremosidade e base. |

> **Regra de Ouro:** O retângulo selecionado deve apresentar uma borda de contraste (`#000`) e um checkmark (`✓`) no canto superior direito para confirmação tátil instantânea.

---

## 2. Fluxo de Compra (Checkout) de Elite
Baseado no modelo de **Divulgação Progressiva**, o site não sobrecarrega o usuário com todos os campos de uma vez.

### 2.1 As 3 Etapas Canônicas
1.  **Revisão do Carrinho:** Foco total nos itens, quantidades e economia (especialmente no atacado de picolés).
2.  **Identificação e Logística:** Coleta de nome e confirmação obrigatória de **Retirada na Loja**.
3.  **Validação e Envio:** Validação de WhatsApp (DDD 16) e ciência do prazo de 5 dias úteis.

### 2.2 Validação Progressiva
Os campos subsequentes permanecem com opacidade reduzida (`0.4`) e bloqueados até que o campo anterior seja preenchido corretamente. Isso evita erros de preenchimento e desistências.

---

## 3. Arquitetura de Navegação Unificada
O site utiliza uma **Gaveta de Navegação Mestra** (`gaveta-navegacao-mestra.js`).

*   **Botões Oficiais:** INÍCIO, PROMOÇÃO, FEEDBACK, HISTÓRIA, ENCOMENDAS.
*   **Consistência:** O cabeçalho deve ser idêntico em todas as abas, carregado via slot dinâmico, eliminando botões duplicados ou menus antigos.

---

## 4. Sincronização e Auditoria (Admin Mirror)
O Painel Administrativo é o **Espelho Fiel** do site.

*   **Mirror Matrix:** Cada campo no Admin (`admin-painel.html`) deve estar mapeado no `admin_espelho_matrix.json`.
*   **Proibição de Termos:** A auditoria automática (`check-tipo-artesanal.js`) impede a publicação de termos proibidos (ex: "artesanal") ou links quebrados (404).

---

## 5. Manutenção e Evolução
Qualquer nova funcionalidade deve passar pelo **Portal de Qualidade**:
1.  **Teste Visual:** Validar em Android, iOS e Desktop.
2.  **Teste de Fluxo:** Realizar um pedido completo até o WhatsApp.
3.  **Auditoria de Cache:** Garantir que o *Cache Busting* reflita a mudança instantaneamente para o cliente final.

> "A perfeição não é alcançada quando não há mais nada a adicionar, mas quando não há mais nada a retirar."
