# Relatório Técnico: ItaBot World Class — Sorveteria Itapolitana Cajuru

## 1. Visão Geral
O assistente virtual **ItaBot** foi otimizado para alcançar o padrão global **World Class** de experiência de usuário (UX) e design de interfaces (UI), integrando inteligência conversacional em linguagem natural com acesso direto a todo o catálogo oficial da sorveteria (38 sabores de sorvete, picolés, açaís, milkshakes, taças, tortas, caixas e encomendas).

---

## 2. Pilares de Design e UX Implementados
- **Identidade Visual Perolizada e Neon**: Robô 3D estilizado com contorno azul brilhante, visor LED animado (olhos e boca), casquinha de sorvete na mão e o botão vermelho pulsante **FALE** na base.
- **Posicionamento Inteligente Anti-Sobreposição**: Heurística baseada em viewport que monitora a rolagem para evitar obstruir botões, rodapés e o banner de cookies.
- **Abertura em Tela Cheia e Suporte Mobile (Gboard)**: Transição fluida para o modo imersivo em dispositivos móveis, garantindo que o teclado virtual do Android/iOS não encubra o campo de entrada e nem deforme o layout.
- **Conhecimento Abrangente de Produtos**: Motor compartilhado unificado (`ita-bot-engine.js`) que processa buscas textuais exatas e parciais para:
  - Sorvetes artesanais e os **38 sabores** oficiais (incluindo Lançamentos: *Cheesecake*, *Passas ao Rum* e *Bem Casado*).
  - Picolés (frutas, leite, recheados, especiais de Leite Ninho/Ovomaltine e Esquimós cobertos de chocolate).
  - Açaís Natureon e complementos (frutas, cremes, guloseimas e chocolates).
  - Sobremesas, taças, milkshakes, brownies e fondues.
  - Regras de Encomendas: retirada exclusiva na loja física em Cajuru/SP (sem delivery), prazo mínimo de 3 dias úteis e pagamento antecipado (Pix, cartão ou dinheiro).

---

## 3. Matriz de Validação de Tópicos e Intenções

| Tópico / Intenção | Gatilhos e Palavras-Chave | Resposta Principal Gerada | Link de Direcionamento |
| :--- | :--- | :--- | :--- |
| **Cardápio e Sabores** | `cardapio`, `38 sabores`, `pistache`, `cheesecake` | Lista dinâmica de sabores e preços (a partir de R$ 8,00). | `encomendas.html` |
| **Picolés e Atacado** | `picolés`, `esquimó`, `atacado` | Preços de varejo e atacado (mín. 100 un.). | `encomendas.html` |
| **Açaí Natureon** | `açaí`, `complementos` | Copos de 300ml a 600ml e adicionais. | `encomendas.html` |
| **Encomendas e Festas** | `encomenda`, `caixa 5 litros`, `torta` | Regras de retirada em 3 dias úteis e produtos para festa. | `encomendas.html` |
| **Horário e Localização** | `horário`, `endereço`, `cajuru` | Funcionamento diário das 10h às 22h na Pça. Largo São Bento, 311. | `sobre.html` |
| **Promoções e Sorteios** | `promoção`, `sorteio` | Sorteio mensal gratuito de caixa de 5L. | `promocao.html` |
| **Atendimento Humano** | `whatsapp`, `atendente`, `falar` | Redirecionamento direto para o WhatsApp oficial `(16) 99606-2046`. | `https://wa.me/5516996062046` |

---

## 4. Conclusão
O ItaBot está totalmente integrado a todas as páginas do site por meio do script global `ita-bot-widget.js`, operando em harmonia com o cabeçalho responsivo (1 botão no topo + grade 2x2 no celular) e o design Glossy/Neon da Sorveteria Itapolitana Cajuru.
