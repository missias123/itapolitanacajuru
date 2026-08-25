# 📜 Regras de Ouro - Itapolitana Cajuru

Este documento estabelece as regras obrigatórias para qualquer alteração no site, visando manter o padrão **World Class**.

## 1. Regra de Sincronização Integral Obrigatória
> **"Antes e depois de qualquer mudança, todas as camadas do projeto devem estar sincronizadas; nenhuma alteração é considerada concluída enquanto houver divergência."**

A sincronização obrigatória inclui, quando aplicável:

- **Memória e documentação**: regras, decisões, backups, manifestos, relatórios e critérios de teste devem refletir o comportamento aprovado.
- **Código local**: arquivos ativos, fontes de dados, scripts, estilos, imagens, rotas e configurações devem estar na mesma versão validada.
- **Admin e dados**: alterações feitas pelo painel devem refletir nos JSONs e nos serviços usados pelo site, sem catálogo ou SKU divergente.
- **GitHub**: branch, commit, arquivos rastreados, workflows e checks devem corresponder ao estado aprovado; arquivos locais não publicados devem ser identificados.
- **GitHub Pages**: o build deve concluir, a branch publicada deve ser confirmada e as rotas devem responder sem 404.
- **Cloudflare**: DNS, HTTPS, cache, regras, Workers, bindings, KV, Durable Objects e rotas da API devem ser verificados quando participarem da mudança.
- **Site público**: o HTML, scripts, estilos, imagens, Service Worker e recursos versionados efetivamente carregados no navegador devem corresponder ao commit publicado.
- **Cache e dispositivos**: recursos alterados devem receber versionamento coerente ou invalidação comprovada, inclusive quando houver Service Worker ou cache do Cloudflare.
- **Testes e evidências**: o resultado antes/depois deve ser guardado, com teste de desktop, tablet, Android/iPhone, fluxos críticos, duplicidade, segurança e regressão visual.

O fluxo obrigatório é: **auditar estado inicial → registrar backup → alterar → testar localmente → publicar → confirmar build e hash remoto → testar URL pública sem cache antigo → registrar evidências → somente então declarar concluído**. Se alguma camada não puder ser validada, o status deve permanecer **pendente**, nunca “concluído”.

## 2. Regra de Responsividade Mobile
- O cabeçalho mobile deve seguir o layout **1 (Feedback) + 2x2 (Outros botões)**.
- A altura dos botões no topo para celular deve ser mantida no limite compacto (**54px a 60px**).
- Todos os alvos de toque devem ser fáceis de clicar, mas sem desperdício de espaço vertical.

## 3. Regra do ItaBot 3D
- O robô deve ser mantido em **3D transparente**, flutuando como um "fantasma".
- O **visor LED** deve alternar entre expressões e mensagens.
- **Cores do LED**: Fundo vermelho com letras brancas (contorno preto) somente durante mensagens; fundo preto original nos demais momentos.

## 4. Automação de Auditoria
Sempre execute o script de auditoria antes de enviar alterações:
```bash
python scripts/itap-world-class-audit.py
```
*Esta verificação é executada automaticamente pelo GitHub Actions em cada push.*

## 5. Regra do Formulário de Picolé Grátis

> **O formulário de Picolé Grátis é SEPARADO do formulário de Dúvidas do ItaBot. São dois formulários diferentes.**

### Como funciona:
- **Uma vez por dia**, o LED do robô exibe **"🍦 PICOLÉ GRÁTIS AGORA!"**.
- Nesse momento, o usuário deve **clicar no robô** — abrirá automaticamente o **formulário exclusivo do Picolé Grátis** (identificado com "🍦 PICOLÉ GRÁTIS" no topo da tela).
- O formulário solicita: **Nome completo como no documento**, **Data de nascimento como no documento**, e o envio é feito **via WhatsApp** para agendar a retirada em uma das datas disponíveis: **Segunda, Quarta ou Sexta**.
- Ao clicar no robô **fora do momento do LED de Picolé Grátis**, abrirá o formulário de **Dúvidas do ItaBot** — que é diferente.

### Regra obrigatória:
- O formulário de Dúvidas do ItaBot **deve sempre exibir um aviso destacado** (fundo amarelo com borda dourada) informando que Picolé Grátis é em outro formulário, para evitar que usuários enviem pedidos de picolé pelo canal errado.
- Nunca remover ou ocultar esse aviso do campo "💬 Enviar mensagem direta via WhatsApp" no painel de Dúvidas.


## 6. Regra Permanente de Pesquisa Comparativa Antes de Alterar

Antes de executar qualquer solicitação de alteração no site Itapolitana feita pelo chat, deve-se pesquisar soluções comprovadas em grandes sites mundiais de alimentação, delivery e vendas online, priorizando documentação oficial, estudos técnicos e exemplos de plataformas de alto tráfego. A pesquisa deve comparar a solução externa com o código, a experiência e as limitações atuais da Itapolitana.

Nenhuma alteração deve ser aplicada apenas por opinião visual ou tentativa. O resultado da pesquisa deve identificar o padrão recomendado, seus riscos, a forma de adaptação para a realidade da sorveteria e os critérios objetivos de aceitação. Quando houver mais de uma solução válida, as alternativas e seus trade-offs devem ser apresentados antes da escolha.

A meta permanente do projeto é atingir qualidade **100/100** nos critérios possíveis de código, responsividade, acessibilidade, segurança, desempenho, SEO, integridade funcional e experiência de uso. A nota somente pode ser declarada depois de auditoria e testes reais; não se deve considerar uma alteração concluída apenas porque o código foi editado ou enviado ao GitHub.

## 7. Regras Consolidadas de Construção, Validação e Publicação

1. O site deve manter uma fonte única de verdade para produtos e dados, com identificação por SKU e sem listas duplicadas em scripts.
2. A identidade visual deve seguir o padrão Premium Glossy da Itapolitana, com tipografia legível, contraste suficiente, fundos limpos, controles claros e componentes que não deformem em telas pequenas.
3. O cabeçalho deve ser gerado por uma única fonte, sem menus ou botões concorrentes. No celular, os cinco botões devem seguir a regra operacional de um botão de Feedback em uma linha e os demais em grade 2×2, com altura compacta de 54px a 60px e área de toque confortável.
4. O ItaBot deve existir em apenas um launcher visual por página, usar imagem 3D transparente, flutuar procurando áreas livres, não cobrir conteúdo, cabeçalho, botões, banners, avisos, rodapé ou controles fixos, e ocultar-se temporariamente se não houver área segura.
5. O formulário de dúvidas e o formulário de Picolé Grátis são fluxos distintos. O clique normal deve abrir dúvidas; somente o LED promocional ativo, durante a janela definida pelo servidor, pode abrir o formulário da promoção.
6. Toda alteração visual deve preservar IDs, funções, handlers e regras de negócio existentes, salvo autorização explícita e testes específicos para a mudança.
7. Nenhum arquivo ou rota referenciada deve ser removido sem auditoria de dependências. Antes do deploy, devem ser verificadas as páginas críticas, arquivos de iframe, scripts, imagens, dados, respostas HTTP e ausência de 404.
8. Cada alteração significativa deve manter cópia anterior, cópia posterior, lista de arquivos modificados e resultado dos testes em `alteracoes/AAAA-MM-DD-descricao/`.
9. Antes do push, devem ser executados os checks de sintaxe, auditoria de qualidade, dependências, segurança, responsividade e teste visual antes/depois. O deploy deve ser bloqueado se houver erro crítico, rota ausente, duplicidade ou regressão visual.
10. Depois do deploy, deve-se verificar o commit remoto, o status do GitHub Pages, a resposta do Cloudflare, o recurso versionado efetivamente carregado e a renderização em Android, iOS, tablet e desktop.

**Princípio permanente:** pesquisar primeiro, comparar com grandes referências, adaptar com evidência, testar antes e depois, publicar somente com verificação online e manter rollback possível.
