# Análise antes do reposicionamento do carrossel

## Projeto

Site estático HTML/CSS/JavaScript no repositório `missias123/itapolitanacajuru`, com publicação pelo GitHub Pages.

## Elementos identificados

| Elemento | Seletor/estrutura real | Localização observada |
|---|---|---|
| Topo vermelho | `.itap-header` | `index.html`, CSS na linha aproximada 260 e elemento `header` dentro de `main` |
| Seis botões/ações do topo | `.itap-header-nav` e ações do cabeçalho | dentro de `.itap-header` |
| Linha amarela | `border-bottom: 4px solid #FFD600` em `.itap-header` | parte visual do próprio `header`, sem elemento DOM separado |
| Carrossel original | `#itp-crs-wrap` contendo `#itp-crs-iframe` com `src="carrossel.html"` | originalmente dentro de `.vc-wrap`, após `.vc-banner` e antes de `.vc-container` |
| Conteúdo posterior | `.vc-container` e demais seções da página | permanece no fluxo original após a remoção do bloco |

## Diagnóstico

O carrossel é um bloco HTML original com CSS inline em `<style id="itp-crs-style">` e um iframe original para `carrossel.html`. Não será recriado, duplicado ou movido por JavaScript. O bloco completo será recortado e inserido no fluxo normal imediatamente após `</header>`, que é o ponto estrutural seguinte à linha amarela do `.itap-header`.

## Backup

Backup completo: `index.backup.html`.

Commit-base: registrado em `commit-base.txt`.

## Restrições aplicadas

Nenhuma alteração será feita nos textos, preços, produtos, imagens, seis botões, banner, funcionamento, slides ou scripts do carrossel. A alteração ficará restrita à posição do bloco original no DOM e à documentação da mudança.
