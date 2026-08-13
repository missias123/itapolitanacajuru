# Teste de login — 13/08/2026

## Reprodução inicial

Antes da restauração, o painel carregava o campo de senha, mas o primeiro script inline falhava na análise sintática. O erro observado no navegador foi `entrar is not defined`, porque o bloco que definia `entrar()` não era executado.

## Correção aplicada

Foi preservado o arquivo `admin-painel.before-full-script-restore.html` e restaurado apenas o script inline principal a partir da versão histórica sintaticamente válida em `alteracoes/qa_admin_git/inline_0.js`.

## Reteste visual

URL: `http://127.0.0.1:8080/admin-painel.html?qa=auth-fixed-20260813-2`

Senha digitada: `2007itapolitania`

Resultado: **autenticação aceita**. Após o clique em `Entrar no Admin`, a tela mudou para o painel administrativo com Dashboard, Página Inicial, Encomendas, Produtos, Promoção, Participantes, Dicas, Sobre, Galeria, Carrossel, Site Encomendas, Qualidade, Rastreio e Auditoria. Isso comprova que a senha foi aceita e que `entrar()` voltou a executar.

## Avisos secundários observados após o login

O painel exibiu um aviso de falha parcial ao carregar `dados/fidelidade.json`, além de um aviso separado ao abrir a aba FALE CONOSCO. Esses avisos não impediram o login, mas devem ser tratados em uma etapa posterior de estabilização se essa área fizer parte do escopo ativo.
