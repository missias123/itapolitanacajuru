# Pesquisa e escopo da prévia de ícones — 2026-08-15

## Referência de UX consultada

Fonte: [LogRocket — Every common UI menu icon and its use case](https://blog.logrocket.com/ux-design/every-common-ui-menu-icon/).

Princípios aproveitados: ícones precisam ser fáceis de ver, não podem ficar pequenos em telas grandes, devem comunicar visualmente a função e usar navegação local quando há conteúdo relacionado. A prévia manterá o mesmo tamanho aproximado dos ícones antigos, com SVG nítido e área de toque preservada, em vez de aumentar os blocos coloridos.

## Escopo real do site

A prévia deve usar somente categorias que já aparecem no site: Promoções, Horário de Funcionamento, Sabores e Cardápio, Encomendas, Picolés, Como Chegar, Dicas e Avaliações e Preços. Também há categorias de produto já presentes na biblioteca: sorvete de massa/bolas, picolé, açaí, milkshake, torta, encomendas/caixas, fruta/água, chocolate, floco de neve e entrega.

## Direção visual aprovada para teste, ainda sem substituir o site

- SVG responsivo com `viewBox`, sem emojis e sem dependências externas.
- Mesmo porte visual do ícone antigo: aproximadamente 26–32 px no botão, com escala fluida e limite para não dominar o texto.
- Um único traço/estilo por família, cantos arredondados e detalhes brasileiros apenas quando fizerem sentido: picolé retangular com palito, tigela de açaí, bola de sorvete, caixa de encomenda e localização.
- Fundo leve ou transparente no cabeçalho; nada de quadrados grandes e gradientes pesados.
- Contraste suficiente no Android, iPhone, tablet e PC; área de toque do botão continua em pelo menos 44 px.
- A proposta será mostrada primeiro em uma página de demonstração isolada. Nenhum arquivo principal será alterado até aprovação do usuário.

## Observação

Esta etapa é uma prévia visual; não aplicar os ícones no `index.html`, `encomendas.html` ou `nav-active.js` antes de aprovação explícita.

## Mapeamento para a demo

| Categoria existente | Ícone de teste | Motivo |
|---|---|---|
| Promoções | tag | Comunicação direta de oferta |
| Horário de Funcionamento | relógio | Reconhecimento imediato |
| Sabores e Cardápio | sorvete de massa/bolas | Produto principal real |
| Encomendas | caixa | Representa pedido e lote |
| Picolés | picolé retangular com palito | Produto brasileiro real, não pirulito |
| Como Chegar | pin de localização | Padrão universal |
| Dicas e Avaliações | estrela | Avaliação reconhecível |
| Preços | cifrão | Informação comercial | 
| Açaí / Milkshake / Torta | ícones de produto existentes | Só para comparação dentro do preview |

## Evidência visual da prévia

A prévia foi aberta em desktop e capturada em 393×852 px. O resultado mostra ícones SVG com aproximadamente 27–34 px, cards discretos, sem blocos pesados no topo, títulos legíveis e grade de duas colunas no celular. O picolé aparece retangular com palito; o açaí aparece como tigela; sorvete, caixa, milkshake, torta e localização têm símbolos próprios. A composição preserva o texto e não deixa o ícone dominar a tela.

A página permanece isolada em `demo-icones.html`; nenhum ícone foi substituído no `index.html`, `encomendas.html` ou no cabeçalho oficial.

Arquivos de evidência:
- `.changes/icons-preview-2026-08-15/preview-393.png`
- captura desktop registrada pelo navegador em `/home/ubuntu/screenshots/127_0_0_1_2026-08-15_15-52-00_9713.webp`
