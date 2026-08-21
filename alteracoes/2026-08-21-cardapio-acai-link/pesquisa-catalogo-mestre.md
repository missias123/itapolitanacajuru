# Catálogo mestre: práticas validadas

Foram consultadas três referências: [Shopify — Single Source of Truth](https://www.shopify.com/blog/single-source-of-truth), [Shopify Enterprise — Product Data Management](https://www.shopify.com/enterprise/blog/product-data-management) e [Adobe Commerce — Atributos de Produto](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/data-transfer/data-attributes-product).

As três fontes convergem em quatro regras aplicáveis ao site. O cadastro oficial deve reunir a identidade do item, categoria, nome, tamanho, valor, disponibilidade e SKU em um único registro. O SKU deve ser um identificador alfanumérico único e estável. Tamanhos e demais opções vendáveis devem ser tratados como variantes ligadas a um produto, cada uma com SKU e valor próprios. Por fim, as páginas do site devem apenas ler registros do catálogo mestre, sem copiar nomes, preços ou tamanhos em código de interface.

> Decisão aplicada: substituir o espelho de SKU por um cadastro mestre em lista única. A interface do cardápio consultará esse cadastro usando a chave estável de cada item; validações bloquearão SKU duplicado, nome vazio, tamanho ausente quando necessário e valor inválido.

## Referências internacionais de cardápios de alimentos

Foram adicionadas as referências [Rezku — Restaurant Online Ordering Best Practices](https://rezku.com/blog/restaurant-online-ordering-best-practices/), [UsableNet — Mobile Restaurant Menus](https://blog.usablenet.com/navigating-menus-on-mobile-a-blind-diners-accessibility-insights) e [BoIA — Web Accessibility for Restaurants](https://www.boia.org/blog/web-accessibility-for-restaurants-4-quick-tips).

As práticas incorporadas são: um cardápio digital próprio, ação de pedido simples e visível em celular, botões com área de toque confortável, conteúdo em HTML — sem depender somente de PDF —, preço disponível como texto e rótulos claros para tecnologias assistivas. O site já usa esses pontos no botão **Peça e retire**: dados de produto no texto, SKU na mensagem, retirada explícita e botão com 44 px de altura mínima.

> Decisão de padrão mundial: o PDF permanece como material visual, mas o pedido e os dados de cada produto permanecem em HTML estruturado e acessível. A lista mestre é a única origem de SKU, nome, tamanho, valor e status.
