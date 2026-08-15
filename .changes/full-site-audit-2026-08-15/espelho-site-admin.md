# Espelhamento Oficial: Site Atual vs Painel Administrativo

Este documento define a equivalência exata entre cada componente visual do site público (`index.html`, `encomendas.html`, etc.) e os campos editáveis correspondentes no painel administrativo (`admin-painel.html`), garantindo que o admin reflita fielmente a estrutura visual do site.

---

## 1. Página Inicial (`index.html`)

| Seção Visual no Site | Elementos / Campos | Equivalente no Painel Admin (`admin-painel.html`) |
| :--- | :--- | :--- |
| **Hero / Topo** | Badge, Título H1, Descrição, Subtítulo, Botões CTA | Aba `🏠 Página Inicial` (`sec-home`) |
| **Separador de Encomendas** | Título "Encomendas & Complementos", Subtítulo | Aba `🧩 Site Encomendas` / `🏠 Página Inicial` |
| **4 Cards de Encomendas (Rodapé)** | Caixas, Tortas, Picolés, Acréscimos (Previews e Botões) | Aba `🛒 Encomendas` e `📦 Produtos` |
| **Acordeão do Cardápio** | Sorvetes, Milkshakes, Taças, Açaí, Picolés Varejo, Sobremesas | Aba `📦 Produtos` e editor de cardápio |

---

## 2. Página de Encomendas (`encomendas.html`)

| Seção / Gaveta no Site | Elementos / Campos | Equivalente no Painel Admin |
| :--- | :--- | :--- |
| **Cabeçalho & Hero** | Título de Encomendas, Badges | Aba `🛒 Encomendas` (`sec-encomendas`) |
| **Gaveta 1: Caixas** | 4 tamanhos de caixas, preços, estoques | Aba `🛒 Encomendas` / `📦 Estoque` (`sec-estoque`) |
| **Gaveta 2: Tortas** | Torta de Sorvete, preço, estoque, limite de sabores | Aba `🛒 Encomendas` / `📦 Estoque` |
| **Gaveta 3: Picolés Atacado** | 5 categorias, lote (100-250), min/max por sabor, preços | Aba `🛒 Encomendas` / `📦 Estoque` (Picolés) |
| **Gaveta 4: Acréscimos** | Complementos, coberturas, preços | Aba `🛒 Encomendas` / `📦 Estoque` (Acréscimos) |

---

## 3. Diretrizes de Sincronização
1. **Ordem Visual**: As abas do admin seguem a mesma sequência lógica de navegação do site público.
2. **Preço Mínimo**: Atacado fixado rigidamente em **R$ 1,80** em ambos os ambientes.
3. **Nomes Especiais**: Sabor **Caraxi (Abacaxi com Caramelo)** e **Blue Ice (Algodão Doce Azul)** sincronizados em dados e interface.
