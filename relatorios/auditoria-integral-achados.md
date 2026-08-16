# Auditoria integral — achados visuais iniciais

Data da inspeção: 2026-08-16
Página: `sobre.html`
Viewport observado no navegador: 900×800 (captura local)

## Evidências observadas

1. O rodapé da página Quem Somos renderiza os links `Política de Privacidade (LGPD)` e `Sobre a Itapolitana` com texto claro e legível na captura atual, dentro de um painel azul escuro.
2. O CTA `Ver nosso cardápio` aparece com texto de baixo contraste sobre o botão laranja; o texto não está com a mesma presença visual dos demais controles.
3. O CTA `Falar com a sorveteria` também aparenta usar texto escuro sobre fundo verde, exigindo medição computada e possível correção.
4. O rodapé contém botões `Cardápio`, `WhatsApp` e `Encomendas`; devem ser medidos individualmente, inclusive ícones e estados de foco.
5. O rodapé contém um link de engrenagem administrativa com opacidade reduzida; deve ser avaliado quanto à legibilidade e acessibilidade, embora seja um controle secundário.
6. A captura do navegador inclui marcadores verdes de elementos interativos da ferramenta de inspeção; eles não fazem parte do site e não devem ser considerados defeitos visuais.

## Próxima medição

Executar inspeção DOM/computed style para cada link e botão em todos os viewports, calculando cor efetiva do texto, fundo composto, razão de contraste, tamanho, bounding box e seletor CSS. Depois mapear as ocorrências para arquivo e linha.

## Medição DOM comprovada — sobre.html

A inspeção computada no navegador encontrou:

| Elemento | Fundo renderizado | Cor computada | Observação |
|---|---|---|---|
| `.cta-btn-secondary` | Gradiente laranja `#E65100 → #FF6D00` | `rgb(21, 101, 192)` | **Erro real:** texto azul sobre botão laranja; a cor inline branca foi sobrescrita pela cascata. |
| `.cta-btn-primary` | Gradiente verde `#25D366 → #128C7E` | `rgb(21, 101, 192)` | **Erro real:** texto azul sobre botão verde; a cor inline branca foi sobrescrita. |
| `.itap-footer-lnk` | Branco translúcido sobre rodapé azul | `rgb(255,255,255)` | Cor computada correta; a razão simples do auditor atual é inválida porque não compõe a transparência com o fundo. |
| `.itap-footer-pill` | Amarelo translúcido sobre painel azul | `rgb(255,255,255)` | Cor computada correta; a razão simples do auditor atual também é inválida sem composição alfa. |
| `#ita-bot-duvidas` | Gradiente azul | `rgb(255,255,255)` | Correto no navegador; auditor anterior avaliava o fundo errado por ignorar gradientes. |

A inspeção da cascata não retornou regras de folhas de estilo para os CTAs porque as declarações problemáticas estão em blocos inline/localizados no HTML ou em estilos não expostos como regras acessíveis; a cor final computada comprova que o problema é real e precisa de uma regra específica posterior com prioridade controlada.

Conclusão parcial: o auditor antigo não era integralmente confiável para contraste, pois ignorava gradientes, transparência alfa e a cascata final. A nova auditoria deve calcular o fundo efetivo por amostragem/renderização e registrar os valores computados.
