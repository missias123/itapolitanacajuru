# Relatório de Auditoria Técnica e UX — Sorveteria Itapolitana Cajuru

**Data da Auditoria:** 12 de Abril de 2026
**Ferramentas Utilizadas:** Google Lighthouse, Console JS, Regex DOM Analysis, Z-Index Mapper

Este relatório apresenta os resultados de uma auditoria completa no site da Sorveteria Itapolitana Cajuru, utilizando as mesmas metodologias aplicadas por grandes empresas de tecnologia (Google, Meta, Amazon) para identificar conflitos, erros, bugs, problemas de performance e acessibilidade.

---

## 1. Visão Geral (Scores Lighthouse)

A auditoria do Google Lighthouse revelou os seguintes scores para as páginas principais:

| Métrica | `index.html` | `encomendas.html` | Status |
|---------|--------------|-------------------|--------|
| **Performance** | 49/100 ❌ | 78/100 ⚠️ | Precisa de otimização |
| **Acessibilidade** | 96/100 ✅ | 100/100 ✅ | Excelente |
| **Boas Práticas** | 96/100 ✅ | 100/100 ✅ | Excelente |
| **SEO** | 100/100 ✅ | 100/100 ✅ | Perfeito |

---

## 2. Problemas Críticos Encontrados (Bugs e Erros)

### 2.1. Erros de Console JavaScript (JS)
Foram detectados erros que quebram a execução de scripts na página inicial:

*   ❌ **ReferenceError: `respostas` is not defined**
    *   **Onde:** `index.html` (linha 3455)
    *   **Causa:** O código tenta iterar sobre um objeto `respostas` que não foi declarado ou importado corretamente. Isso quebra a inicialização do chatbot.
    *   **Solução:** Declarar o objeto `respostas` antes do seu uso ou garantir que o script que o contém seja carregado antes.

*   ❌ **Erro 404 (Not Found)**
    *   **Onde:** `favicon.ico`
    *   **Causa:** O navegador tenta carregar o ícone do site, mas o arquivo não existe no servidor.
    *   **Solução:** Adicionar um arquivo `favicon.ico` (ou `.png`) na raiz do projeto e referenciá-lo no `<head>`.

### 2.2. Links e Recursos Quebrados
A análise de links internos revelou variáveis de template vazando para o HTML final:

*   ❌ **Arquivos não encontrados:** `${f}` e `${foto}`
    *   **Onde:** `index.html`
    *   **Causa:** Variáveis de template literal do JavaScript (ex: `${foto}`) foram escritas diretamente no HTML estático ou não foram interpoladas corretamente.
    *   **Solução:** Localizar essas strings no HTML e substituí-las por caminhos reais ou movê-las para dentro de scripts JS.

---

## 3. Auditoria de UX e Mobile (Celular)

A experiência do usuário no celular foi analisada focando em touch targets, legibilidade e responsividade.

### 3.1. Fontes Pequenas (Zoom Automático no iOS)
O iOS (iPhone) aplica um zoom automático irritante quando o usuário toca em inputs ou lê textos com fonte menor que 16px.

*   ⚠️ **`index.html`:** 113 ocorrências de fontes menores que 16px (ex: 11px, 12px, 13px).
*   ⚠️ **`encomendas.html`:** 61 ocorrências de fontes menores que 16px (ex: 0.7rem, 0.8rem).
*   **Solução:** Aumentar o tamanho base das fontes para no mínimo 14px (ideal 16px) e garantir que todos os `<input>` e `<select>` tenham `font-size: 16px`.

### 3.2. Risco de Scroll Horizontal
*   ⚠️ **`admin.html`:** Não possui a regra `overflow-x: hidden` no `body`.
*   **Causa:** Elementos mais largos que a tela podem causar rolagem horizontal indesejada no celular.
*   **Solução:** Adicionar `body { overflow-x: hidden; }` no CSS do painel admin.

### 3.3. Imagens sem Lazy Loading
*   ⚠️ **`fidelidade.html`:** 6 imagens carregadas simultaneamente.
*   **Solução:** Adicionar o atributo `loading="lazy"` nas tags `<img>` que ficam abaixo da dobra da tela para economizar dados do usuário.

---

## 4. Auditoria de Performance

A baixa pontuação de performance (49/100) no `index.html` se deve principalmente ao peso das imagens e bloqueio de renderização.

### 4.1. Imagens Pesadas e Mal Dimensionadas
*   ⚠️ **`logo.webp`:** Desperdício de 144 KB.
*   ⚠️ **`carrinho-picole.webp`:** Desperdício de 35 KB.
*   ⚠️ **`itamandua_lambendo.webp`:** Desperdício de 32 KB.
*   **Solução:** Redimensionar as imagens para o tamanho exato em que são exibidas na tela e usar atributos `width` e `height` explícitos no HTML para evitar *Cumulative Layout Shift* (CLS).

### 4.2. Bloqueio de Renderização (Render-blocking)
*   ❌ **Fontes do Google (Inter):** Atraso de 150ms no carregamento da página.
*   **Solução:** Adicionar `rel="preconnect"` para o Google Fonts e usar `font-display: swap` (já implementado, mas pode ser otimizado).

### 4.3. JavaScript Não Utilizado
*   ⚠️ **Google Tag Manager:** 63 KB carregados sem uso imediato.
*   ⚠️ **Swiper JS:** 25 KB carregados.
*   **Solução:** Adiar o carregamento de scripts não essenciais usando `defer` ou carregá-los apenas quando o usuário interagir com a página.

---

## 5. Conclusão e Próximos Passos

O site possui uma excelente base de SEO e Acessibilidade, mas requer atenção imediata aos erros de JavaScript que podem quebrar funcionalidades (como o chatbot) e otimizações de performance para melhorar o tempo de carregamento.

**Plano de Ação Recomendado:**
1.  **Crítico:** Corrigir o erro `ReferenceError: respostas is not defined` no `index.html`.
2.  **Crítico:** Remover as strings literais `${f}` e `${foto}` do HTML estático.
3.  **Importante:** Adicionar um `favicon.ico` para resolver o erro 404.
4.  **UX:** Ajustar o tamanho das fontes dos inputs para 16px para evitar zoom no iPhone.
5.  **Performance:** Redimensionar a `logo.webp` e adicionar `loading="lazy"` nas imagens secundárias.
