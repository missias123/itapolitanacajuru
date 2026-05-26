## Relatório de Auditoria - Fase 2: HTML (Estrutura e Semântica)

### Arquivo: `admin-painel.html`

#### 1. Validação W3C e Semântica

*   **Estrutura Básica**: O documento possui a declaração `<!DOCTYPE html>`, tag `<html>` com `lang="pt-BR"`, `<head>` com meta tags de charset e viewport, e `<body>`. Isso está correto.
*   **Semântica HTML5**: O painel administrativo é construído predominantemente com `<div>` (ex: `<div class="admin-header">`, `<div class="admin-nav">`, `<div class="admin-content">`).
    *   **Problema**: Falta de tags semânticas do HTML5.
    *   **Recomendação**: Substituir `<div class="admin-header">` por `<header class="admin-header">`, `<div class="admin-nav">` por `<nav class="admin-nav">`, e `<div class="admin-content">` por `<main class="admin-content">`. As seções internas (`<div class="seção">`) poderiam ser `<section class="seção">`. Isso melhora a acessibilidade e a estrutura lógica do documento.
*   **Uso de Botões**: A navegação é feita com `<button class="nav-btn">`. Isso é aceitável para um SPA (Single Page Application) onde o JavaScript controla a exibição, mas se fossem links reais, `<a>` seria mais apropriado. Como é um painel de controle dinâmico, `<button>` é semanticamente correto para ações que não mudam a URL.

#### 2. Acessibilidade (WCAG)

*   **Atributos `alt` em Imagens**:
    *   A logo na tela de login possui `alt="Logo Itapolitana"`.
    *   A logo no header possui `alt="Logo"`. Poderia ser mais descritivo, ex: `alt="Logo Sorveteria Itapolitana"`.
*   **Labels em Formulários**:
    *   A tela de login usa `placeholder` em vez de `<label>` visível ou `aria-label` para o campo de senha (`<input type="password" id="inp-senha" placeholder="Senha do administrador"...>`). Isso é uma falha de acessibilidade.
    *   **Recomendação**: Adicionar `<label for="inp-senha" class="sr-only">Senha do administrador</label>` (com uma classe para ocultar visualmente, se o design exigir, mas manter para leitores de tela) ou usar `aria-label="Senha do administrador"`.
    *   O campo de token GitHub (que foi removido visualmente, mas o código ainda pode ter resquícios) tinha `aria-label="Token GitHub"`, o que era bom.
    *   Nas seções de edição (ex: `<div class="campo-edit"><label>Título principal (H1)</label><input type="text" id="home-titulo"...>`), os `<label>` não possuem o atributo `for` ligando-os ao `id` do `<input>`.
    *   **Recomendação Crítica**: Todos os `<label>` devem ter o atributo `for` correspondente ao `id` do input. Ex: `<label for="home-titulo">Título principal (H1)</label>`.
*   **Contraste de Cores**: A paleta de cores parece ter bom contraste (ex: texto escuro `#333` sobre fundo claro `#fff` ou `#f0f2f5`), mas uma ferramenta automatizada seria necessária para uma validação rigorosa. O botão de login laranja (`#e65100`) com texto branco (`#fff`) geralmente passa nos testes de contraste.

#### 3. IDs e Classes

*   **Consistência**: O uso de classes como `.btn`, `.card`, `.campo-edit` demonstra uma tentativa de padronização. No entanto, há uma mistura de português e inglês (ex: `login-screen`, `admin-header`, `seção`, `btn-salvar`).
*   **Unicidade de IDs**: Uma verificação rápida sugere que os IDs são únicos (ex: `home-titulo`, `home-descricao`), o que é essencial para o funcionamento correto do JavaScript (`getElementById`).

#### 4. Código Morto/Comentado

*   O arquivo é bastante longo (mais de 9000 linhas), o que sugere que o CSS e o JavaScript estão embutidos no HTML.
*   **Recomendação Forte**: Separar o CSS para um arquivo `admin-painel.css` e o JavaScript para `admin-painel.js`. Isso melhorará drasticamente a manutenibilidade, o tempo de carregamento (cache do navegador) e a clareza do código.

### Próximos Passos

A análise do CSS e do JavaScript embutidos no `admin-painel.html` será o próximo passo, focando em performance, código morto e na lógica de inicialização das abas.
