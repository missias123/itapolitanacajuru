# MEMÓRIA OFICIAL E BLINDAGEM — ITAPOLITANA CAJURU
**Data de Consolidação**: 16 de Agosto de 2026  
**Fonte Única de Verdade**: `/dados/produtos.json`  

Este documento estabelece as diretrizes definitivas, contagens e regras de negócio para o projeto da Sorveteria Itapolitana Cajuru. Nenhum componente, script ou alteração futura poderá divergir destas especificações.

---

## 1. Regras de Ouro e Arquitetura
1. **Single Source of Truth**: Toda a renderização do site público (`index.html`), do sistema de encomendas (`encomendas.html`) e do painel de controle (`admin-painel.html`) deve ler exclusivamente de `/dados/produtos.json`. Nenhuma lista de sabores estática ou codificada de forma rígida em arquivos JavaScript (`scripts/products.js`, `scripts/enc-v4.js`) é permitida.
2. **Identificação por SKU**: Todos os produtos possuem códigos únicos (`MAS-001` a `MAS-038` para massas e `PIC-001` a `PIC-034` para picolés) para eliminar ambiguidades e evitar erros de sincronismo.
3. **Terminologia Profissional (Glossy / World Class)**: O termo "artesanal" foi completamente banido do projeto. O design adota o padrão *Premium Glossy* (nítido, sem borrões, com botões finos e responsivos para Android e iOS).
4. **Contagem Inegociável**: 
   - **38 Massas** oficiais.
   - **34 Picolés** oficiais divididos em 5 categorias.

---

## 2. Catálogo Oficial de Massas (38 Sabores)
Codificadas de `MAS-001` a `MAS-038`:
- MAS-001: Abacaxi ao Vinho
- MAS-002: Abacaxi Suíço
- MAS-003: Algodão Doce (Blue Ice)
- MAS-004: Amarena
- MAS-005: Ameixa
- MAS-006: Banana com Nutella
- MAS-007: Bis e Trufa
- MAS-008: Cereja Trufada
- MAS-009: Chocolate
- MAS-010: Chocolate com Café
- MAS-011: Coco Queimado
- MAS-012: Creme Paris
- MAS-013: Croquer
- MAS-014: Doce de Leite
- MAS-015: Ferrero Rocher
- MAS-016: Flocos
- MAS-017: Kinder Ovo
- MAS-018: Leite Condensado
- MAS-019: Leite Ninho
- MAS-020: Leite Ninho Folheado
- MAS-021: Leite Ninho com Oreo
- MAS-022: Limão
- MAS-023: Limão Suíço
- MAS-024: Menta com Chocolate
- MAS-025: Milho Verde
- MAS-026: Morango Trufado
- MAS-027: Mousse de Maracujá
- MAS-028: Mousse de Uva
- MAS-029: Nozes
- MAS-030: Nutella
- MAS-031: Ovomaltine
- MAS-032: Pistache
- MAS-033: Prestígio
- MAS-034: Sensação
- MAS-035: Torta de Chocolate
- MAS-036: Trufado de Maracujá *(Adicionado)*
- MAS-037: Nata com Nozes *(Adicionado)*
- MAS-038: Sonho de Valsa *(Adicionado)*

---

## 3. Catálogo Oficial de Picolés (34 Sabores em 5 Categorias)
Codificados de `PIC-001` a `PIC-034`:

### A. Frutas / Base Água (8 sabores)
- `PIC-001`: Abacaxi
- `PIC-002`: Caju
- `PIC-003`: Goiaba
- `PIC-004`: Groselha
- `PIC-005`: Limão
- `PIC-006`: Melância
- `PIC-007`: Uva
- `PIC-008`: Tamarindo

### B. Recheados — Base Leite (12 sabores)
- `PIC-009`: Açaí
- `PIC-010`: Blue Ice
- `PIC-011`: Caraxi *(Abacaxi + Caramelo)*
- `PIC-012`: Coco Branco
- `PIC-013`: Chocolate
- `PIC-014`: Amarena
- `PIC-015`: Leite Condensado
- `PIC-016`: Mamão Papaia
- `PIC-017`: Maracujá
- `PIC-018`: Morango
- `PIC-019`: Menta com Chocolate
- `PIC-020`: Nata com Goiaba

### C. Sem Recheio — Base Leite (4 sabores)
- `PIC-021`: Coco Queimado
- `PIC-022`: Milho Verde
- `PIC-023`: Amendoim
- `PIC-024`: Pistache

### D. Especiais — Base Leite (2 sabores)
- `PIC-025`: Leite Ninho
- `PIC-026`: Ovomaltine

### E. Esquimós — Base Leite (8 sabores)
- `PIC-027`: Bombom
- `PIC-028`: Nutella
- `PIC-029`: Ovomaltine
- `PIC-030`: Leite Ninho
- `PIC-031`: Nata
- `PIC-032`: Morango
- `PIC-033`: Brigadeiro
- `PIC-034`: Prestígio

---

## 4. Regras de Estoque e Encomendas de Picolés
1. **Lote Fixo**: Cada sabor de picolé possui limite máximo de **250 unidades** por lote de encomenda (`MAX_PICOLES_POR_SABOR = 250`).
2. **Sem Decremento Automático**: As encomendas de picolés **não reduzem** o estoque automaticamente ao finalizar a compra (sistema voltado para lotes de produção/encomenda).
3. **Esgotamento Exclusivamente Manual**: O esgotamento de um sabor de picolé ou massa ocorre **apenas manualmente via Admin** (`admin-painel.html`). Ao acionar o botão de esgotar em um SKU específico, o site exibe instantaneamente a tarja vermelha de "ESGOTADO" e bloqueia a seleção daquele item.
