# Auditoria visual premium do ItaBot — 18/08/2026

## Referências consultadas

1. Baymard Institute, “These Three (Popular) Approaches to Implementing Live Chat are Often …”: https://baymard.com/blog/live-chat-usability-issues
2. Assistant UI, “Examples — assistant-ui”: https://www.assistant-ui.com/examples
3. UX Design, “Where should AI sit in your UI?”: https://uxdesign.cc/where-should-ai-sit-in-your-ui-1710a258390e
4. Dribbble, “Floating assistant”: https://dribbble.com/search/floating-assistant

## Princípios aplicados

O padrão premium observado é um launcher compacto, reconhecível e persistente no canto da interface, com abertura sob demanda em um painel maior. O launcher não deve bloquear CTA, carrinho, campos, checkout ou controles de consentimento. Em telas pequenas, a área segura precisa considerar barras fixas, safe area e teclado virtual. Elementos decorativos, imagens e banners estáticos não devem fazer o robô desaparecer; a heurística deve priorizar controles realmente interativos e overlays fixos.

## Diagnóstico local

Na home, o elemento `#itabot-launcher` existia, mas a rotina de layout o deixava com `visibility:hidden` e `pointer-events:none` quando todos os pontos eram considerados ocupados. A regra antiga tratava imagens e áreas visuais inteiras como bloqueios, o que fazia o ItaBot desaparecer em uma página com hero/carrossel amplo.

## Ajuste realizado

A heurística agora bloqueia links, botões, campos, elementos com role de botão e overlays fixed/sticky; imagens e áreas decorativas podem receber o launcher. Também foi criado um fallback icon-only que mantém o robô visível quando nenhum ponto ideal é encontrado, respeitando a área ocupada por barras fixas inferiores.

## Validação visual após o ajuste

Na home, o launcher oficial único `#itabot-launcher` ficou visível, com posição calculada no canto inferior direito e estado `visibility: visible`, `pointer-events: auto` e z-index elevado. A heurística deixou de tratar imagens decorativas como obstáculos. O clique no launcher abriu a tela de dúvidas em painel central premium, com cabeçalho vermelho, logo, temas de atendimento, formulário direto e botão de fechamento.

A interface de navegação continua presente atrás do painel, e o robô fica oculto apenas enquanto a central de dúvidas está aberta, evitando duplicidade visual durante o modal.

## Adaptação do ItaBot ao conceito de visor LED

O launcher foi convertido para uma composição transparente, sem cápsula branca, sem borda e sem sombra de caixa. O DOM renderiza um único `#itabot-launcher` com fundo `transparent`, borda `0` e `box-shadow: none`. O personagem usa corpo e capacete azul perolizados, visor escuro com contorno ciano, olhos `^ ^`, boca LED e uma faixa de mensagem animada recortada no próprio visor. O rótulo externo ficou reduzido a `DÚVIDAS` abaixo do robô.

A inspeção visual confirmou que o robô é o único elemento flutuante oficial, com área de toque transparente e posição segura acima da barra inferior no mobile. O clique continua abrindo a central de dúvidas.

## Teste de interação

O clique na área transparente do robô retornou `chat-opened`. A central de dúvidas abriu normalmente com temas, formulário e botões de atendimento. Durante o painel aberto, o launcher é ocultado para evitar duplicação visual; ao fechar, ele deve retornar à posição flutuante original.

## Referência visual pesquisada

A referência [FluxGarage RoboEyes no Instructables](https://www.instructables.com/Smoothly-Animated-Robot-Eyes-on-OLED-Displays-With/) apresenta olhos robóticos monocromáticos com animações fluidas, piscar automático, estados de humor e transições suaves. O artigo também observa que o mesmo visor pode alternar entre olhos e texto, o que orientou a decisão de manter olhos e boca sempre visíveis e inserir a mensagem em uma faixa independente do visor do ItaBot, em vez de substituir completamente a expressão facial.

A adaptação para o ItaBot é original: não reutiliza o personagem, arte ou código da referência. Foram aproveitados apenas princípios gerais de interface expressiva: olhos LED, movimento suave, expressão legível em tamanho pequeno e mensagens curtas dentro de uma tela escura de alto contraste.

## Referências externas adicionais

A página [LottieFiles — Cute Robot Animations](https://lottiefiles.com/free-animations/cute-robot) organiza mascotes robóticos como elementos interativos de UI e evidencia a importância de uma animação simples, simpática e reconhecível em escala reduzida. Para o ItaBot, isso foi traduzido em flutuação suave, brilho controlado e expressão facial legível, sem colocar um card de fundo.

A página [Bubble — Floating AI Assistant](https://bubble.io/plugin/floating-ai-assistant-1773455215592x609340680833597400) descreve um padrão de assistente fixo no canto da janela, disponível imediatamente em todas as páginas e aberto por clique. O ItaBot segue esse princípio funcional, mas usa um personagem transparente próprio da sorveteria: robô isolado, rótulo DÚVIDAS abaixo e área de toque invisível.

## Posicionamento inteligente contínuo

A heurística foi ampliada para considerar controles clicáveis, campos, textos semânticos, cabeçalho, navegação, rodapé, carrinho, checkout, encomendas, cookies, consentimento e overlays fixos/sticky. Quando os seis pontos preferenciais estão ocupados, uma grade de busca procura outra zona livre; se a página inteira estiver congestionada, o robô reduz para o modo compacto e escolhe a posição com menor colisão, sem desaparecer.

A rotina reage a `resize`, `orientationchange`, `scroll`, `focusin`, `focusout`, `visualViewport.resize`, `visualViewport.scroll`, `ResizeObserver`, `MutationObserver` e uma verificação periódica de segurança. Na home testada, houve um único `#itabot-launcher`, com 82×94 px, em `position: fixed`, na posição x=1080/y=922 da viewport 1280×1100, acima do banner de cookies que ocupa y=1000–1101.

## Validação na página ENCOMENDAS

Na página `encomendas.html`, o ItaBot foi encontrado como um único launcher, em posição `br`, com 82×94 px, em x=1080/y=1006 da viewport 1280×1100. A análise geométrica não encontrou sobreposição com nenhum dos 9 controles visíveis da etapa inicial de compra, incluindo os quatro painéis de produtos. O launcher permaneceu acessível e fora da área de interação dos pedidos.

## Regressão final desktop e mobile

O teste automatizado foi concluído sem erros de JavaScript e sem recursos ausentes (HTTP 4xx/5xx). No desktop, o painel abriu, o pulso `itabot-question-pulse` permaneceu ativo e os campos de identificação/mensagem estavam presentes. No mobile simulado em 390×844 px, a abertura do teclado reduziu o painel para 420 px, ocultou o rodapé auxiliar e manteve o campo de mensagem com `fieldBottom=396`, acima do limite simulado de 420 px; a rolagem interna foi ajustada para 508 px. Resultado: aprovado.
