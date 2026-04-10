# Relatório de Auditoria e Otimização: Sorveteria Itapolitana Cajuru

**Data da Análise:** 08 de Abril de 2026
**Especialista:** Manus AI (UX/UI, CRO e Segurança)
**Site Analisado:** itapolitanacajuru.com.br

---

## 1. Problemas Atuais (Resumo Executivo)

A Sorveteria Itapolitana possui um site funcional e com identidade visual forte, mas que atualmente apresenta oportunidades significativas de melhoria em conversão (CRO) e experiência do usuário (UX), especialmente no ambiente mobile.

Os principais gargalos identificados são:
- **Excesso de estímulos na primeira dobra (Hero):** Há muitos botões, textos e emojis competindo por atenção antes mesmo de o usuário rolar a página.
- **Hierarquia de botões confusa:** Botões de navegação (topo), botões de ação (WhatsApp) e botões de expansão (Cardápio) possuem pesos visuais semelhantes.
- **Fluxo de conversão fragmentado:** O usuário precisa de muitos cliques para entender a diferença entre consumo imediato e encomendas.
- **Segurança percebida poluída:** A seção de certificações no rodapé possui selos técnicos (SEO, Mobile Friendly) que não agregam valor de confiança para o consumidor final e poluem o visual.

---

## 2. Melhorias de Estrutura e Navegação

A hierarquia de informações atual entrega muito conteúdo de uma só vez. O fluxo principal (fazer pedido) não está claro em 5 segundos porque o olhar do usuário se perde entre o menu superior, o texto de introdução, o botão de WhatsApp e o botão do cardápio.

### Reorganização Sugerida

**A. Primeira Dobra (Hero Section)**
- **Headline Principal:** Deve focar no benefício imediato. Sugestão: *"O Sorvete Mais Cremoso de Cajuru, Desde 2007"*.
- **Subheadline:** *"Cremosidade real e sabores que encantam. Peça agora ou venha nos visitar."*
- **Limpeza de Textos:** Remover as frases repetitivas como *"Cremoso · Cremoso · Leite Puro"* que aparecem acima do título principal.
- **Ação Principal (CTA):** Deixar apenas UM botão de destaque máximo nesta área: **"Ver Cardápio e Pedir"**. O botão de WhatsApp solto deve ser integrado ao fluxo do cardápio.

**B. Agrupamento de Categorias**
Atualmente, as categorias de consumo imediato (Taças, Milkshakes) estão misturadas com as de eventos (Sorvetes em Caixa 10L, Picolés Atacado).
- **Sugestão:** Criar duas abas ou blocos visuais distintos:
  1. **Para Agora:** Sorvetes de Massa, Picolés (varejo), Açaí, Milkshakes, Taças.
  2. **Para Eventos e Encomendas:** Caixas de 5L/10L, Tortas, Picolés (atacado).

---

## 3. Melhorias Visuais (UX/UI)

O uso de cores quentes (laranja, vermelho, amarelo) é excelente para o segmento de alimentação, pois estimula o apetite. No entanto, a aplicação atual gera poluição visual.

### Ajustes Práticos

**A. Redução de Emojis e Poluição**
- O uso excessivo de emojis (ex: `🧊 🧊 Isopore 4 Bolas`) polui a leitura.
- **Ação:** Limitar a um emoji por categoria (ex: apenas no título do Accordion) e remover dos itens internos.

**B. Consistência dos Botões (CTAs)**
- Atualmente temos: *"Ver 35 Sabores"*, *"8 Sabores"*, *"Ver Sabores do Milkshake"*, *"Ir para Encomendas"*.
- **Ação:** Padronizar.
  - Para expansão de lista: *"Ver Sabores"* (com ícone de seta para baixo).
  - Para ação de compra/encomenda: *"Encomendar pelo WhatsApp"* (com ícone do WhatsApp).

**C. Legibilidade Mobile**
- Os botões do menu superior (Encomendas, Promoção, Dicas, Fidelidade) ocupam muito espaço vertical no celular.
- **Ação:** Transformar o menu superior em um "Menu Hambúrguer" (três linhas) no mobile, fixo no topo, liberando espaço para o conteúdo principal.

---

## 4. Melhorias de Conversão (CRO)

O objetivo principal do site é gerar pedidos via WhatsApp e encomendas. O caminho atual exige que o usuário abra o cardápio, leia os itens e depois procure o botão de WhatsApp.

### Otimização do Fluxo

**A. Redução de Cliques**
- Em vez de ter um botão *"Ver 35 Sabores"* dentro do accordion que apenas expande texto, cada sabor ou categoria deve ter um botão direto *"Pedir este"*, que já abre o WhatsApp com a mensagem pré-preenchida (ex: *"Olá, gostaria de pedir um Milkshake Tradicional..."*).

**B. Prova Social (Dicas/Depoimentos)**
- O botão "Dicas/Depoimentos" leva para outra página.
- **Ação:** Trazer 3 depoimentos curtos em formato de carrossel para a página inicial, logo abaixo do cardápio. Isso gera desejo imediato e aumenta a conversão sem tirar o usuário da página de compra.

**C. Promoções e Sorteios**
- O contador regressivo é excelente para urgência, mas deve ficar oculto automaticamente quando não houver promoção ativa, evitando frustração.
- A página de promoção deve ter o formulário de captura de leads (Nome, WhatsApp) logo na primeira dobra, sem exigir rolagem.

---

## 5. Melhorias de Segurança e LGPD

O site precisa transmitir confiança para o usuário leigo, mas sem parecer um painel técnico.

### Ajustes de Confiança

**A. Limpeza dos Selos de Segurança**
- Selos como "Mobile Friendly", "Performance Otimizada" e "SEO Otimizado" não significam nada para o consumidor de sorvete e parecem artificiais.
- **Ação:** Manter apenas **"Ambiente Seguro"** (cadeado) e **"Compra Garantida"**.

**B. Adequação LGPD (Simples e Direta)**
- Como o site coleta Nome e WhatsApp para sorteios e encomendas, é obrigatório informar o uso desses dados.
- **Ação:** Adicionar no rodapé um texto simples:
  > *"Seus dados estão seguros. Utilizamos suas informações apenas para processar seus pedidos e informar sobre promoções, em conformidade com a LGPD. Nunca compartilhamos seus dados com terceiros."*
- No formulário do Sorteio Mensal, adicionar um checkbox obrigatório: `[ ] Aceito receber comunicações da Itapolitana via WhatsApp.`

---

## 6. Lista de Ações Prioritárias (Top 10)

Para gerar impacto imediato, recomendo executar estas ações na seguinte ordem:

1. **Limpar a Hero Section:** Deixar apenas o título principal, subtítulo e UM botão de destaque ("Ver Cardápio").
2. **Padronizar CTAs:** Mudar todos os botões de ação final para "Pedir pelo WhatsApp" com a cor verde padrão do app.
3. **Separar Consumo Imediato de Encomendas:** Criar duas abas distintas no cardápio para não confundir o usuário.
4. **Simplificar o Menu Mobile:** Transformar os 4 botões coloridos do topo em um menu hambúrguer para telas pequenas.
5. **Reduzir Emojis:** Limpar os emojis repetidos dentro das listas de produtos.
6. **Integrar Prova Social:** Colocar 3 depoimentos reais na página inicial.
7. **Limpar Selos do Rodapé:** Remover selos técnicos (SEO, Performance) e deixar apenas o de Segurança.
8. **Adicionar Texto LGPD:** Inserir a frase de proteção de dados no rodapé.
9. **Checkbox de Aceite no Sorteio:** Garantir que o formulário de promoção tenha o aceite claro para uso do WhatsApp.
10. **Links Diretos para o WhatsApp:** Fazer com que os botões de produtos abram o WhatsApp já com o texto do pedido preenchido.
