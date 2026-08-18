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


---

## 5. Regra Crítica de Integridade — Não Remover Dependências Públicas

1. **Nenhum arquivo público pode ser apagado em uma limpeza de código sem auditoria de referências.** Antes de remover qualquer HTML, CSS, JavaScript, imagem ou JSON, deve-se pesquisar todas as referências no projeto e nas configurações de publicação.
2. **Todo arquivo referenciado por `href`, `src`, `iframe`, `fetch`, `import`, `preload`, sitemap, painel administrativo ou configuração CMS é dependência ativa.** A existência de uma referência, mesmo que o arquivo pareça antigo, bloqueia sua remoção até que a referência seja substituída e validada.
3. **Regra específica do carrossel:** `index.html` depende de `carrossel.html` através do iframe `#itp-crs-iframe`. Portanto, `carrossel.html` é arquivo obrigatório de produção e não pode ser tratado como código morto.
4. **Regra de publicação:** nenhuma alteração é considerada concluída apenas porque foi gravada ou enviada ao GitHub. É obrigatório verificar no repositório que todos os arquivos referenciados existem, abrir cada rota principal no navegador e confirmar respostas HTTP sem 404.
5. **Regra de restauração:** se uma limpeza remover uma dependência, deve-se interromper o deploy, restaurar o arquivo a partir do último commit íntegro, testar localmente e só então publicar uma nova correção.
6. **Regra de segurança:** toda alteração significativa deve ser arquivada em `alteracoes/AAAA-MM-DD-descricao/`, com cópia anterior, cópia posterior, lista de arquivos alterados e resultado dos testes.
7. **Causa registrada deste incidente:** no commit `ec97d57`, de 18/08/2026, uma limpeza agressiva intitulada “unificação total do cabeçalho, remoção de nav redundante e limpeza de código morto World Class” apagou `carrossel.html` embora `index.html` continuasse apontando para ele. O resultado foi um 404 dentro do iframe do carrossel. Não houve pedido do usuário para remover o carrossel; foi uma falha de auditoria de dependências e de validação pós-publicação.
8. **Checklist obrigatório antes de qualquer novo deploy:** `git diff --check`; busca de referências a arquivos removidos; verificação de existência de todas as rotas HTML; teste de `index.html`, `promocao.html`, `dicas.html`, `sobre.html`, `encomendas.html` e `carrossel.html`; teste visual do iframe e do cabeçalho; só depois commit e publicação.

> **Princípio principal:** nunca remover um arquivo porque ele parece antigo; remover somente depois de provar que não há referência ativa, substituir todas as dependências e confirmar o site publicado no navegador.

---

**Registro do incidente:** 18 de agosto de 2026 — 404 do carrossel após limpeza agressiva.
**Status da regra:** obrigatória para todas as alterações futuras.

---

## 6. Regra de Cabeçalho Único

O cabeçalho oficial deve ser renderizado por uma única fonte (`scripts/gaveta-navegacao-mestra.js`) em todos os HTMLs. Scripts de navegação antigos ou cabeçalhos estáticos não podem concorrer com a Gaveta Mestra. Antes de publicar, deve-se conferir que existe um único slot de cabeçalho por página e que os cinco rótulos oficiais são idênticos: `INÍCIO`, `PROMOÇÃO`, `FEEDBACK`, `HISTÓRIA` e `COMPRAR`.

## 7. Regra de Teste Visual Antes e Depois

Toda alteração de interface deve ser comparada com uma versão arquivada antes da mudança e testada no navegador depois da mudança. O teste deve verificar a página inicial, o carrossel, cada botão oficial do topo, as rotas de destino e a visualização mobile. Se surgir 404, cabeçalho divergente, carrossel ausente ou quebra de layout, a alteração deve ser revertida antes de qualquer nova modificação.

## 8. Regra de Cache e Publicação

Cada recurso alterado deve receber versionamento coerente nos HTMLs, sem misturar versões antigas e novas do mesmo script. O cache-busting não corrige arquivo ausente: primeiro todos os arquivos devem existir e responder corretamente; depois os parâmetros de versão podem ser atualizados. O teste final deve abrir as URLs publicadas com uma consulta de auditoria e conferir a versão efetivamente carregada no navegador.

---

## 9. Regra de Responsabilidade Técnica

O histórico Git identifica o usuário/conta que realizou o commit, mas a causa técnica deve ser atribuída ao procedimento que falhou, não presumida como intenção do usuário. Neste incidente, o histórico registra a conta `missias123` como autora do commit, porém a causa foi a limpeza agressiva sem auditoria de dependências, com referência ao `carrossel.html` mantida no `index.html`.

---

## 10. Regra de Bloqueio de Deploy

Nenhuma publicação pode prosseguir se qualquer rota referenciada retornar 404, se uma dependência local estiver ausente ou se o teste visual mostrar conteúdo de erro dentro de um iframe. A auditoria deve falhar explicitamente e impedir o commit de publicação até a correção.

---

## 11. Regra de Controle de Integridade por Manifesto

Manter um manifesto de rotas e dependências essenciais. O manifesto deve listar as páginas públicas, scripts críticos, estilos críticos e arquivos carregados por iframe. Uma auditoria automatizada deve comparar o manifesto com os arquivos presentes e retornar falha quando houver referência para arquivo ausente. O carrossel deve permanecer explicitamente listado como dependência obrigatória de `index.html`.

---

## 12. Regra de Não Confundir Restauração com Validação

Um commit chamado “restaurado” não é prova de que o recurso foi restaurado. É necessário verificar a árvore Git, o arquivo publicado, a resposta HTTP e a renderização visual. A palavra “restauração” só pode ser usada no relatório quando essas quatro verificações forem aprovadas.

---

**Resumo memorável:** referência ativa nunca é lixo; limpeza sem auditoria não é segura; publicação só termina depois do teste online.
