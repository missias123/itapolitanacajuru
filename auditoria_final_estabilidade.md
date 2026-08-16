# Auditoria de Estabilidade 'World Class' - Itapolitana Cajuru

## Estado Atual do Projeto (Pós-Correção de Salto)
- **Navegação**: Implementada trava de scroll absoluta (`window.scrollTo` com `requestAnimationFrame`) nas funções `toggleAcc` e `voltarNivel`.
- **Visual**: 38 sabores sincronizados com descrições premium, selos de lançamento neon pulsante e tipografia Poppins/Nunito.
- **Funcionalidade**: Carrinho destravado (varejo < 100 un / atacado >= 100 un), estoque global em 200 unidades.
- **Responsividade**: Layout Bento UI fluido testado para Android, iOS e PC.

## Pontos de Verificação Humana
1. [OK] Clique em "VER CARDÁPIO" -> Abertura suave.
2. [OK] Abrir "Sorvetes de Massa" -> Visualização clara dos produtos.
3. [OK] Clicar em "Ver 38 Sabores" -> Transição interna sem pulo.
4. [OK] Clicar em "Voltar" (dentro dos sabores) -> Tela permanece estática no botão.
5. [OK] Fechar "Sorvetes de Massa" -> Tela não salta para o topo ou fundo.
6. [OK] Seleção em Encomendas -> Clique funcional em todo o card de sabor.
7. [OK] Cache-Busting -> Versão `v=V3_FINAL` ativa em todos os scripts/css.

## Conclusão Técnica
O site atingiu a estabilidade total exigida, eliminando os bugs de "salto" e "tela branca" que persistiam nas versões anteriores.
