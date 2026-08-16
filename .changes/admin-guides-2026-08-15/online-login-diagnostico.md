# Diagnóstico online do acesso

A versão publicada foi aberta em `https://itapolitanacajuru.com.br/admin-painel.html`.

A tela de login carregou com os dois campos, os dois botões de olho e o botão **Entrar no Admin**. O console do navegador não mostrou mensagens de erro.

O hash SHA-256 de `2007itapolitania` é `585a63b3d1dde2c6867b155194e56cb2b78eb57a5d66913048427a1e877580ab`, que coincide com o valor atualmente armazenado em `dados/auth.json`; portanto, a senha solicitada já é a senha configurada no repositório.

Próximo teste: acionar os handlers diretamente e observar a mudança de tipo dos campos, sem inserir token GitHub nem publicar alterações.
