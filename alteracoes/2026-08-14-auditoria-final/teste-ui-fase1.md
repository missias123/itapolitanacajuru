# Teste de UI — Fase 1

## 2026-08-14

A página inicial foi aberta em `index.html?v=teste-completo-2026-08-14`. O cabeçalho oficial exibiu DÚVIDAS e os botões TELA INICIAL, PROMOÇÃO, DICAS/DEPOIMENTOS, QUEM SOMOS e ENCOMENDAS. O carrossel apareceu imediatamente abaixo da linha amarela.

A página `encomendas.html?v=teste-completo-2026-08-14` foi então aberta. O cabeçalho **não está idêntico** ao da página inicial: usa INÍCIO em vez de TELA INICIAL e apresenta ordem/cores diferentes. Portanto, a exigência de um cabeçalho oficial único para todo o site ainda não está validada e não deve ser declarada concluída.

A página de encomendas carregou os três blocos principais: Sorvete em Caixa, Tortas Geladas e Picolés (Atacado), além do aviso de prazo de 5 dias úteis.

## Resultado parcial

- Carregamento da página inicial: aprovado.
- Carrossel abaixo da linha amarela: aprovado visualmente na página inicial.
- Cabeçalho idêntico entre index e encomendas: **reprovado; requer correção**.
- Conteúdo inicial de encomendas: carregado.

## Verificação adicional de páginas públicas

A página `promocao.html` também exibiu o cabeçalho alternativo com INÍCIO, ENCOMENDAS, PROMOÇÃO, DICAS/DEPOIMENTOS e QUEM SOMOS, diferente da página inicial.

A página `dicas.html` exibiu o cabeçalho oficial com TELA INICIAL, PROMOÇÃO, DICAS/DEPOIMENTOS, QUEM SOMOS e ENCOMENDAS, coincidente na ordem textual com `index.html`.

Resultado parcial atualizado: há pelo menos duas implementações divergentes (`encomendas.html` e `promocao.html`) e uma implementação coincidente (`dicas.html`). A unificação global ainda requer correção antes do deploy.
