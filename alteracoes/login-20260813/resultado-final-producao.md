# Teste final do painel administrativo — 13/08/2026

## Resultado

O login do painel administrativo foi validado no site oficial:

- URL testada: `https://itapolitanacajuru.com.br/admin-painel.html?v=3cd2397-final-2`
- Senha testada: `2007itapolitania`
- Commit publicado: `3cd2397a1c725f1a56affb7baa4a343a9a4ccef9`
- Build do GitHub Pages: `built`
- Resultado visual: o formulário foi substituído pelo painel completo, com Dashboard, Página Inicial, Encomendas, Produtos, Promoção, Participantes, Dicas, Sobre, Galeria, Carrossel, Qualidade, Rastreio e Auditoria.

## Causa comprovada

A senha não era o problema. O primeiro script inline do `admin-painel.html` não era compilado pelo navegador porque entidades HTML usadas dentro de strings JavaScript eram decodificadas pelo parser. Em particular, a sequência `&#39;` virava uma aspa simples dentro de uma string, produzindo `Unexpected token ')'`. Como consequência, `window.entrar` e `window.sha256` ficavam indefinidos e o clique não avançava.

Durante a auditoria também foi encontrado um defeito independente no segundo script inline de validação: a declaração de `fnsSalvar` estava truncada e havia rotina com `await` fora de função assíncrona. Esse bloco foi restaurado pela versão histórica íntegra e compilável.

## Correção publicada

O primeiro script foi ajustado para manter as entidades como escapes JavaScript (`\\x26amp;`, `\\x26lt;`, `\\x26gt;`, `\\x26quot;` e `\\x26#39;`), impedindo a alteração do código pelo parser HTML. O segundo script foi restaurado da versão histórica funcional. Os dois scripts passaram em `node --check` após a transformação equivalente ao DOM do navegador.

## Observação secundária

Após o login, o painel mostrou um aviso de carregamento parcial para `dados/fidelidade.json` e entrou em modo somente leitura porque nenhum token GitHub foi informado. Isso não impediu a autenticação. A senha foi aceita e a interface do painel foi aberta. Para operações de escrita no GitHub, o próprio painel solicita um PAT válido no botão “Adicionar Token”.

## Backups

Foram preservadas as versões anteriores em:

- `admin-painel.before-entity-fix.html`
- `admin-painel.before-validation-script-restore.html`
