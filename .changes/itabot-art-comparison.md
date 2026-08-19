# Comparação das artes do ItaBot

A arte atualmente servida pelo widget é `images/itabot-3d.png` e ainda possui o rótulo FALE incorporado no próprio bitmap, conforme confirmado pelo grep do widget e pelas capturas mobile.

A versão `itabot-3d-clean2.png` tem a composição correta — robô azul/branco, sorvete no peito e sem texto — mas o gerador entregou um padrão quadriculado opaco, sem canal alfa real.

A versão `itabot-3d-official-alpha.png` tem canal alfa, mas a remoção determinística do fundo preto deixou linhas horizontais residuais e não deve ser colocada em produção.

Decisão: não substituir o ativo do site por uma versão visualmente comprometida. O cabeçalho mobile continua validado separadamente; a troca do ItaBot só deve ocorrer quando houver uma arte transparente e limpa, sem FALE e sem artefatos.
