# MEMÓRIA OFICIAL E BLINDAGEM — ITAPOLITANA CAJURU
**Data de Consolidação**: 16 de Agosto de 2026
**Fonte Única de Verdade**: `/dados/produtos.json`

Este documento estabelece as diretrizes definitivas, contagens e regras de negócio para o projeto da Sorveteria Itapolitana Cajuru. Nenhum componente, script ou alteração futura poderá divergir destas especificações.

---

## 1. Regras de Ouro e Arquitetura
1. **Single Source of Truth**: Toda a renderização do site público (`index.html`), do sistema de encomendas (`encomendas.html`) e do painel de controle (`admin-painel.html`) deve ler exclusivamente de `/dados/produtos.json`. Nenhuma lista de sabores estática ou codificada de forma rígida em arquivos JavaScript (`scripts/products.js`, `scripts/enc-v4.js`) é permitida.
2. **Identificação por SKU**: Todos os produtos possuem códigos únicos (`MAS-001` a `MAS-038` para massas e `PIC-AG-001` a `PIC-PREM-ESKIMO-008` para picolés) para eliminar ambiguidades e evitar erros de sincronismo.
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
Codificados de `PIC-AG-001` a `PIC-PREM-ESKIMO-008`:

### A. Picolés Base Água & Frutas (8 sabores)
- `PIC-AG-001`: Abacaxi
- `PIC-AG-002`: Caju
- `PIC-AG-003`: Goiaba
- `PIC-AG-004`: Groselha
- `PIC-AG-005`: Limão
- `PIC-AG-006`: Melância
- `PIC-AG-007`: Uva
- `PIC-AG-008`: Tamarindo

### B. Picolés AO LEITE Cremosos Recheados (12 sabores)
- `PIC-REC-001`: Açaí
- `PIC-REC-002`: Blue Ice
- `PIC-REC-003`: Caraxi *(Abacaxi + Caramelo)*
- `PIC-REC-004`: Coco Branco
- `PIC-REC-005`: Chocolate
- `PIC-REC-006`: Amarena
- `PIC-REC-007`: Leite Condensado
- `PIC-REC-008`: Mamão Papaia
- `PIC-REC-009`: Maracujá
- `PIC-REC-010`: Morango
- `PIC-REC-011`: Menta com Chocolate
- `PIC-REC-012`: Nata com Goiaba

### C. Picolés AO LEITE Cremosos S/ Recheio (4 sabores)
- `PIC-CR-001`: Coco Queimado
- `PIC-CR-002`: Milho Verde
- `PIC-CR-003`: Amendoim
- `PIC-CR-004`: Pistache

### D. Picolés AO LEITE Especiais (2 sabores)
- `PIC-ESP-001`: Leite Ninho
- `PIC-ESP-002`: Ovomaltine

### E. Picolés AO LEITE Premium Eskimós (8 sabores)
- `PIC-PREM-ESKIMO-001`: Bombom
- `PIC-PREM-ESKIMO-002`: Nutella
- `PIC-PREM-ESKIMO-003`: Ovomaltine
- `PIC-PREM-ESKIMO-004`: Leite Ninho
- `PIC-PREM-ESKIMO-005`: Nata
- `PIC-PREM-ESKIMO-006`: Morango
- `PIC-PREM-ESKIMO-007`: Brigadeiro
- `PIC-PREM-ESKIMO-008`: Prestígio

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


## 13. Regra Permanente de Benchmark e Construção World Class

A partir desta consolidação, toda solicitação de alteração do site feita pelo chat deve ser precedida por pesquisa comparativa em grandes sites de alimentação, delivery e vendas online, usando fontes oficiais e referências técnicas confiáveis sempre que disponíveis. A análise deve comparar o padrão encontrado com o código, as rotas, os fluxos e a experiência atuais da Itapolitana, registrando a adaptação recomendada, os riscos e os critérios de aceitação antes da execução.

A meta do projeto é **qualidade 100/100**, medida por critérios verificáveis de funcionalidade, responsividade em Android/iOS/tablet/desktop, acessibilidade, desempenho, segurança, SEO, integridade de dependências, ausência de duplicidade e experiência visual. Nenhuma nota ou restauração pode ser declarada sem validação no código efetivo, no repositório, na publicação, nas respostas HTTP e na renderização real.

A construção deve preservar a fonte única de dados por SKU, a identidade Premium Glossy, a navegação por cabeçalho único, o ItaBot 3D transparente com um único launcher e posicionamento seguro fora de conteúdo/rodapé, além da separação entre dúvidas e promoção. IDs, handlers, funções de negócio, páginas referenciadas, iframes e arquivos públicos não podem ser removidos ou alterados sem auditoria de dependências, cópia anterior, rollback e testes antes/depois.

Todo deploy deve ser bloqueado quando houver 404, dependência ausente, erro de sintaxe, token exposto, duplicidade visual, quebra de responsividade ou regressão funcional. Após a publicação, é obrigatório conferir commit remoto, Pages, Cloudflare, cache/versionamento do recurso e comportamento visual em múltiplas larguras.

**Regra de decisão:** pesquisar primeiro; comparar com referências globais; propor a adaptação; aplicar somente com evidência; testar antes e depois; publicar apenas com confirmação online; manter rollback.


## 14. Regra de Sincronização Integral entre Camadas

Toda mudança no projeto deve ser sincronizada e validada entre memória, documentação, código local, dados, Admin, GitHub, GitHub Pages, Cloudflare, Worker, KV, Durable Object, site público, Service Worker, cache e recursos versionados, conforme a participação de cada camada na mudança.

O procedimento obrigatório é: auditar o estado inicial; criar backup; alterar; testar localmente; publicar; confirmar commit remoto e build; verificar hashes e respostas HTTP; abrir o recurso no navegador com consulta de auditoria; testar os fluxos e larguras relevantes; registrar evidências; e somente então declarar a mudança concluída. Se uma camada não puder ser verificada, o status permanece pendente.

Nenhuma divergência entre Admin e dados, entre código e GitHub, entre GitHub Pages e domínio público, entre Worker e bindings, ou entre recurso publicado e cache do dispositivo deve ser ignorada. Mudanças com rota 404, dependência ausente, build incompleto, recurso antigo carregado, duplicidade visual, regressão funcional ou teste não realizado devem ser bloqueadas até a sincronização ser restabelecida.
