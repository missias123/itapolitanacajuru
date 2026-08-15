# Validação da limpeza de ícones — 15/08/2026

## Escopo

Foi validada a página `encomendas.html` em viewport móvel de 393 × 852 CSS px, com DPR 3, por CDP e captura visual do modal de montagem de lote.

## Correções confirmadas

- Os três cabeçalhos de categoria usam `.categoria-header__main`, `.categoria-header__icon` e `.categoria-header__copy` com flex seguro e `min-width: 0`.
- A categoria de picolés recebe a classe `categoria--picoles`, portanto as regras compactas passam a ser aplicadas de fato.
- O fallback legado `🍦` foi removido da renderização dinâmica dos grupos de picolés.
- Os títulos dinâmicos usam `.picole-grupo-sec__titulo`, `.picole-grupo-sec__icon` e `.picole-grupo-sec__label`, sem wrapper inline estreito.
- O título do modal não usa mais o emoji de pirulito.

## Métricas do teste direcionado

- Cabeçalhos analisados: 3.
- Sobreposição ícone/cópia nos cabeçalhos: 0 casos.
- Estado de foco: somente a categoria de picolés aberta; as outras 2 ocultas.
- Modal: `display: flex`.
- Grupos de picolés renderizados: 4.
- Ícones ausentes nos títulos de grupo: 0.
- Sobreposição ícone/rótulo nos títulos dos grupos: 0 casos.
- Emojis legados `🍦`/`🍭` dentro do modal: não encontrados.

## Evidência visual

Arquivo: `encomendas-icons-393.png`.

A captura mostra o ícone de cada grupo separado do título, as abas com ícones contidos e os cards de sabores sem elementos circulares residuais por baixo do novo sistema Bento.

## Auditoria móvel herdada

O `run_mobile_audit.py` foi executado para Android 360×800, Android 390×844, iPhone 375×812, iPhone 393×852, tablet 768×1024 e PC 1366×768, cobrindo sorvetes e picolés na página inicial. Todos os casos abriram, restauraram a origem ao fechar, limparam o foco e não reportaram elementos externos visíveis; os cards ficaram dentro do viewport.

O resumo completo está em `../mobile-audit-2026-08-15/audit-summary.txt` e os resultados brutos em `../mobile-audit-2026-08-15/results.json`.

## Painel estático de qualidade

O comando `node scripts/quality-audit.js --fail --md` não passou no estado global: `index.html`, `carrossel.html`, `dicas.html` e `offline.html` ficaram em 100/100, enquanto `encomendas.html` marcou 50/100 e `promocao.html` 56/100 por pendências de H1/metadados SEO/PWA que não foram introduzidas por esta correção visual. O log bruto está em `quality-audit.log`. Não foi mascarada nenhuma falha nem alterado o relatório histórico do projeto.

## Validação cross-device do Encomendas

O teste direcionado foi repetido em Android 360×800, iPhone 393×852, tablet 768×1024 e desktop 1366×768. Em todos os quatro casos foram renderizados 4 grupos, não houve emoji legado, não houve título sem ícone e todos os pares ícone/rótulo ficaram sem interseção geométrica. A captura de 360px confirma que os cards continuam legíveis; as abas permanecem em uma faixa horizontal rolável, comportamento esperado para preservar a largura do conteúdo.
