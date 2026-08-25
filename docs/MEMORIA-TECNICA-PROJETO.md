# Memoria Tecnica Consolidada — Sorveteria Itapolitana

Este documento consolida o historico completo de decisoes, arquitetura, regras de interface, padroes de responsividade e otimizacoes de engenharia aplicadas ao ecossistema da **Sorveteria Itapolitana** (site oficial e painel administrativo).

---

## 1. Arquitetura do Assistente Virtual (itaBot 3D)

O assistente virtual **itaBot** foi totalmente reestruturado para atender aos mais altos criterios de qualidade de engenharia e apelo visual:
- **Mascote 3D em Corpo Inteiro:** Utiliza o ativo oficial otimizado (`itabot-3d-v2027.webp`) em 400×400 RGBA lossless, exibindo o robo com pernas e pes visiveis, segurando um picolé azul em uma das maos e um sorvete colorido na outra, alem do cone integrado no peito. O PNG original (`itabot-3d-v2027.png`) permanece versionado como fallback.
- **Letreiro LED Dinâmico (Marquee):** Posicionado exatamente abaixo dos pes do robo, o painel LED possui fundo vermelho brilhante, borda nítida e exibe a mensagem em movimento contínuo: **`DÚVIDA — CLIQUE AQUI`**. A largura foi ajustada para 50% para manter uma proporção elegante e discreta, enquanto a altura garante perfeita legibilidade.
- **Interação Inteligente:** Clicar em qualquer parte do launcher (robo, pes, maos ou letreiro LED) aciona instantaneamente a abertura do painel HTML de dúvidas central (`#chat-dialog`), sem duplicações e sem sobrepor botões críticos do site.

---

## 2. Regras de Campanhas e Sorteios (2026–2027)

Todas as seções promocionais do site, do painel de administração e do motor de respostas do bot foram sincronizadas com as diretrizes comerciais oficiais:
- **Encerramento 2026:** Confirmado o encerramento das inscrições para os sorteios de tortas de sorvete de 2026, que atingiram a marca de mais de 1.400 inscritos.
- **Temporada 2027:** Aberto exclusivamente pelo site oficial (`itapolitanacajuru.com.br`) o cadastro para o sorteio mensal de uma torta de sorvete ao longo de todo o ano de 2027.
- **Remoção do Instagram:** Todas as exigências anteriores de comentários em posts do Instagram foram completamente removidas dos textos promocionais e do assistente, centralizando a captação de leads e clientes no próprio site.

---

## 3. Limpeza de Código e Auditoria de Segurança (Zero Bugs)

Uma varredura completa baseada em grafos de dependências foi executada para eliminar código obsoleto sem causar regressões:
- **Remoção de Módulos Mortos:** Trechos legados e órfãos referentes a campanhas antigas de *Fidelidade* e menções descontinuadas (*Itamandua*) foram expurgados da base de conhecimento pública e dos scripts de runtime.
- **Preservação Administrativa:** Os contratos de dados do painel de administração (`admin-painel.html`, `config.json` e arquivos de sincronização) foram mantidos intactos, garantindo a bidirecionalidade entre o site público e a gestão interna.
- **Cache-Busting Avançado:** Todos os arquivos de script e assets críticos receberam versionamento dinâmico (`?v=2027-final-width`), forçando a invalidação imediata de cache em CDNs, GitHub Pages e navegadores mobile.

---

## 4. Responsividade e Padrões Mobile (Android e Apple)

O layout foi rigorosamente testado em viewports de smartphones (Android/iPhone) e computadores para garantir excelência mundial:
- **Toque e Usabilidade:** Elementos interativos e botões do topo seguem o grid 1 + 2x2 com áreas de toque otimizadas (mínimo de 48px).
- **Zero Overflow:** Bloqueio absoluto de rolagem horizontal indesejada, garantindo largura idêntica à de aplicativos nativos.
- **Acessibilidade WCAG AAA:** Alto contraste validado em botões, links e títulos, eliminando fontes apagadas ou fundos opacos.

---

*Documento gerado e versionado para preservar a integridade e orientar futuras manutenções do projeto.*
