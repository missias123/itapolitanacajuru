# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-botoes-navegacao.spec.js >> Hero Section >> logo da sorveteria é visível
- Location: e2e/02-botoes-navegacao.spec.js:83:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.brand img, .brand, header img[src*="logo"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.brand img, .brand, header img[src*="logo"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Pular para o conteúdo principal" [ref=e2] [cursor=pointer]:
    - /url: "#conteudo-principal"
  - main [ref=e3]:
    - generic [ref=e5]:
      - button "Dúvidas — Ita Bot" [ref=e8] [cursor=pointer]: 💬 DÚVIDAS
      - navigation "Menu principal" [ref=e9]:
        - link "🛒 ENCOMENDAS" [ref=e10] [cursor=pointer]:
          - /url: encomendas.html
          - generic [ref=e11]: 🛒
          - generic [ref=e12]: ENCOMENDAS
        - link "🎉 PROMOÇÃO" [ref=e13] [cursor=pointer]:
          - /url: promocao.html
          - generic [ref=e14]: 🎉
          - generic [ref=e15]: PROMOÇÃO
        - link "⭐ DICAS/DEPOIMENTOS" [ref=e16] [cursor=pointer]:
          - /url: dicas.html
          - generic [ref=e17]: ⭐
          - generic [ref=e18]: DICAS/DEPOIMENTOS
        - link "🎟️ FIDELIDADE" [ref=e19] [cursor=pointer]:
          - /url: fidelidade.html
          - generic [ref=e20]: 🎟️
          - generic [ref=e21]: FIDELIDADE
    - generic [ref=e22]: 🍨 Sorvete de Massa · Picolés Recheados · Açaí Premium · Tortas · Milkshakes · Taças · 🍨
    - generic [ref=e23]:
      - generic [ref=e25]:
        - generic [ref=e26]: ✨ 35 sabores tipo artesanal - Produção Própria- leite fresco
        - generic [ref=e27]: 🍇 O melhor açaí de Cajuru — Natureon!
        - generic [ref=e28]: 🍨 "35 sabores tipo artesanal que encantam na primeira colherada"
        - heading "O Sorvete que Cajuru Ama de Verdade" [level=1] [ref=e29]
        - paragraph [ref=e30]: Cremosidade real, sabores que encantam e um Picolé diferenciado como o carro chefe O LEITINHO. Venha descobrir por que a Itapolitana é a sorveteria favorita de Cajuru e região há mais de 17 anos.
        - note "Aviso sobre entregas programadas futuras" [ref=e31]: 🚚 Breve teremos entregas programadas, feitas 2h antes
      - generic [ref=e32]:
        - generic [ref=e33]: 🛒 Carrinhos Cortesia para Eventos
        - generic [ref=e34]:
          - link "Carrinho 1 Carrinho Cortesia 1 para Eventos - Sorveteria Itapolitana 🛒 Carrinho para Eventos Toque para consultar" [ref=e35] [cursor=pointer]:
            - /url: https://wa.me/5516996062046?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20a%20disponibilidade%20do%20carrinho%20para%20eventos.
            - generic [ref=e36]: Carrinho 1
            - img "Carrinho Cortesia 1 para Eventos - Sorveteria Itapolitana" [ref=e38]
            - generic [ref=e39]: 🛒 Carrinho para Eventos
            - generic [ref=e40]: Toque para consultar
          - link "Carrinho 2 Carrinho Cortesia 2 para Eventos - Sorveteria Itapolitana 🛒 Carrinho Cortesia para Eventos 📲 Consultar Disponibilidade" [ref=e41] [cursor=pointer]:
            - /url: https://wa.me/5516996062046?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20a%20disponibilidade%20do%20Carrinho%202%20para%20evento.
            - generic [ref=e42]: Carrinho 2
            - img "Carrinho Cortesia 2 para Eventos - Sorveteria Itapolitana" [ref=e44]
            - generic [ref=e45]:
              - text: 🛒 Carrinho Cortesia
              - text: para Eventos
            - generic [ref=e46]: 📲 Consultar Disponibilidade
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]: ✨ Feito com amor desde 2007
        - heading "🍦 Escolha sua Felicidade Hoje" [level=2] [ref=e50]
        - generic [ref=e51]: Toque numa categoria e descubra sabores irresistíveis
      - iframe [ref=e53]:
        - generic [active] [ref=f1e1]:
          - heading "Carrossel de Fotos – Sorveteria Itapolitana Cajuru" [level=1] [ref=f1e2]
          - generic [ref=f1e3]:
            - generic [ref=f1e4]:
              - img "Açaí do Seu Jeito — O Mais Pedido — Sorveteria Itapolitana Cajuru" [ref=f1e6]
              - img "Taça Unicórnio — Venha Experimentar — Sorveteria Itapolitana Cajuru" [ref=f1e8]
              - img "Sobremesa dos Sonhos com Nutella — Sorveteria Itapolitana Cajuru" [ref=f1e10]
              - img "Picolé Ovomaltine Novo — Sorveteria Itapolitana Cajuru" [ref=f1e12]
              - img "Picolés para Eventos — Sorveteria Itapolitana Cajuru" [ref=f1e14]
              - img "Maracujá Diet + Leite Ninho — Venha Experimentar — Sorveteria Itapolitana Cajuru" [ref=f1e16]
              - img "Escolha o Seu Favorito — Taça Suja, Milkshake, Açaí e Sorvete — Sorveteria Itapolitana Cajuru" [ref=f1e18]
              - img "Sorvetes tipo artesanal em sabores variados — Sorveteria Itapolitana Cajuru" [ref=f1e20]
              - img "Brownie com Sorvete — Combinação Irresistível — Sorveteria Itapolitana Cajuru" [ref=f1e22]
              - img "Petit Gateau com Sorvete — Combinação Irresistível — Sorveteria Itapolitana Cajuru" [ref=f1e24]
              - img "Cascão com 3 Bolas de Sorvete — Sorveteria Itapolitana Cajuru" [ref=f1e26]
              - img "Sorvete, Milkshake, Picolé e Taça — Sorveteria Itapolitana Cajuru" [ref=f1e28]
            - generic "Banner anterior" [ref=f1e29]
            - generic "Próximo banner" [ref=f1e30]
            - tablist "Banners"
      - generic [ref=e54]:
        - generic [ref=e55]:
          - generic [ref=e56]: 🍦 🍧 🍨 🧃 🍦
          - generic [ref=e57]: Nosso Cardápio Completo
          - generic [ref=e58]: 35 sabores · Sorvetes · Picolés · Açaí · Milkshakes · Taças · Sobremesas
          - generic [ref=e59]:
            - generic [ref=e60]: 👉
            - button "Ver nosso Cardápio" [ref=e61] [cursor=pointer]:
              - text: 🍦 Ver nosso Cardápio
              - generic [ref=e62]: ▼
            - generic [ref=e63]: 👈
        - generic:
          - generic [ref=e64]:
            - button "🍨 Sorvetes de Massa Cremoso, gelado, irresistível · 35 sabores pra você escolher ▼" [ref=e65] [cursor=pointer]:
              - generic [ref=e66]:
                - generic [ref=e67]: 🍨
                - generic [ref=e68]:
                  - generic [ref=e69]: Sorvetes de Massa
                  - generic [ref=e70]: Cremoso, gelado, irresistível · 35 sabores pra você escolher
              - generic [ref=e71]: ▼
            - generic [ref=e72]:
              - generic [ref=e73]:
                - generic [ref=e74]:
                  - generic [ref=e75]: 🍦
                  - generic [ref=e76]:
                    - generic [ref=e77]: Casquinha / Copo
                    - generic [ref=e78]: 1 bola
                    - generic [ref=e79]: A partir de R$ 8,00
                - generic [ref=e80]:
                  - generic [ref=e81]: 🍦
                  - generic [ref=e82]:
                    - generic [ref=e83]: Copo Recheado
                    - generic [ref=e84]: 1 bola + recheio
                    - generic [ref=e85]: A partir de R$ 10,00
                - generic [ref=e86]:
                  - generic [ref=e87]: 🍦
                  - generic [ref=e88]:
                    - generic [ref=e89]: Cascão
                    - generic [ref=e90]: Casquinha grande
                    - generic [ref=e91]: A partir de R$ 12,00
                - generic [ref=e92]:
                  - generic [ref=e93]: 🍦
                  - generic [ref=e94]:
                    - generic [ref=e95]: Cestinha Recheada
                    - generic [ref=e96]: Cestinha recheada crocante
                    - generic [ref=e97]: A partir de R$ 14,00
              - button "Ver 35 sabores de sorvete tipo artesanal" [ref=e99] [cursor=pointer]: 🍦 Ver 35 Sabores
              - button "← Voltar ao Início do Cardápio" [ref=e101] [cursor=pointer]
          - generic [ref=e102]:
            - button "🧊 Picolés Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó ▼" [ref=e103] [cursor=pointer]:
              - generic [ref=e104]:
                - generic [ref=e105]: 🧊
                - generic [ref=e106]:
                  - generic [ref=e107]: Picolés
                  - generic [ref=e108]: Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó
              - generic [ref=e109]: ▼
            - generic [ref=e110]:
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - generic [ref=e113]: 🍓
                  - generic [ref=e114]: Picolé de Frutas
                  - generic [ref=e115]: Sem Lactose
                  - generic [ref=e116]: Feito com frutas naturais, sem leite. Refrescante e leve — ideal para os dias quentes!
                  - generic [ref=e117]: R$ 2,50 / un.
                  - button "🍭 8 Sabores" [ref=e118] [cursor=pointer]
                - generic [ref=e119]:
                  - generic [ref=e120]: 🍦
                  - generic [ref=e121]: Picolé de Leite
                  - generic [ref=e122]: Cremoso
                  - generic [ref=e123]: Cremoso, feito com leite. Sabor suave e irresistível para toda a família.
                  - generic [ref=e124]: R$ 2,50 / un.
                  - button "🍭 4 Sabores" [ref=e125] [cursor=pointer]
                - generic [ref=e126]:
                  - generic [ref=e127]: 🍬
                  - generic [ref=e128]: Picolé Recheado
                  - generic [ref=e129]: Com Recheio
                  - generic [ref=e130]: Picolé de leite com recheio surpresa por dentro. Cada mordida é uma descoberta!
                  - generic [ref=e131]: R$ 3,00 / un.
                  - button "🍭 12 Sabores" [ref=e132] [cursor=pointer]
                - generic [ref=e133]:
                  - generic [ref=e134]: ⭐
                  - generic [ref=e135]: Picolé Leite Ninho
                  - generic [ref=e136]: Especial
                  - generic [ref=e137]: O sabor inconfundível do Leite Ninho em forma de picolé. Sucesso garantido!
                  - generic [ref=e138]: R$ 4,00 / un.
                  - button "🍭 1 Sabores" [ref=e139] [cursor=pointer]
                - generic [ref=e140]:
                  - generic [ref=e141]: 🍫
                  - generic [ref=e142]: Picolé Esquimó
                  - generic [ref=e143]: Premium
                  - generic [ref=e144]: Picolé premium coberto com chocolate belga. Sabores nobres para momentos especiais.
                  - generic [ref=e145]: R$ 8,00 / un.
                  - button "🍭 8 Sabores" [ref=e146] [cursor=pointer]
              - generic [ref=e147]:
                - text: 🧊
                - strong [ref=e148]: "Atacado e Eventos:"
                - text: Acima de 100 picolés — carrinho disponível com reserva antecipada. Consulte descontos por quantidade via WhatsApp.
              - button "← Voltar ao Início do Cardápio" [ref=e150] [cursor=pointer]
          - generic [ref=e151]:
            - button "🫐 🔥 Açaí em Promoção Aproveite agora! 8 combos irresistíveis · 400ml a 700ml ▼" [ref=e152] [cursor=pointer]:
              - generic [ref=e153]:
                - generic [ref=e154]: 🫐
                - generic [ref=e155]:
                  - generic [ref=e156]: 🔥 Açaí em Promoção
                  - generic [ref=e157]: Aproveite agora! 8 combos irresistíveis · 400ml a 700ml
              - generic [ref=e158]: ▼
            - generic [ref=e159]:
              - generic [ref=e160]:
                - generic [ref=e161]:
                  - generic [ref=e162]: 🛖 Açaí Promocional 400ml
                  - generic [ref=e163]: R$ 15,00
                - generic [ref=e164]: Açaí + Banana + Leite em Pó + Leite Condensado
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]: 🛖 Açaí Promocional 400ml
                  - generic [ref=e168]: R$ 16,00
                - generic [ref=e169]: Açaí + Morango + Leite em Pó + Leite Condensado
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - generic [ref=e172]: 🛖 Açaí Promocional 400ml
                  - generic [ref=e173]: R$ 18,00
                - generic [ref=e174]: Açaí + Morango + Nutella
              - generic [ref=e175]:
                - generic [ref=e176]:
                  - generic [ref=e177]: 🛖 Açaí Promocional 400ml
                  - generic [ref=e178]: R$ 17,00
                - generic [ref=e179]: Açaí + Banana + Confete + Leite Condensado
              - generic [ref=e180]:
                - generic [ref=e181]:
                  - generic [ref=e182]: 🛖 Açaí Promocional 500ml
                  - generic [ref=e183]: R$ 20,00
                - generic [ref=e184]: Açaí + Morango + Granola + Leite Condensado + Leite em Pó
              - generic [ref=e185]:
                - generic [ref=e186]:
                  - generic [ref=e187]: 🛖 Açaí Promocional 500ml
                  - generic [ref=e188]: R$ 20,00
                - generic [ref=e189]: Açaí + Banana + Creme Leite Ninho + Paçoca
              - generic [ref=e190]:
                - generic [ref=e191]:
                  - generic [ref=e192]: 🛖 Açaí Promocional 600ml
                  - generic [ref=e193]: R$ 23,00
                - generic [ref=e194]: Açaí + Morango + Banana + Leite em Pó + Leite Condensado
              - generic [ref=e195]:
                - generic [ref=e196]:
                  - generic [ref=e197]: 🛖 Açaí Promocional 700ml
                  - generic [ref=e198]: R$ 28,00
                - generic [ref=e199]: Açaí + Morango + Nutella
              - button "← Voltar ao Início do Cardápio" [ref=e201] [cursor=pointer]
          - generic [ref=e202]:
            - button "🍇 Açaí tipo artesanal Do jeito que você ama · Monte o seu · 300ml a 600ml ▼" [ref=e203] [cursor=pointer]:
              - generic [ref=e204]:
                - generic [ref=e205]: 🍇
                - generic [ref=e206]:
                  - generic [ref=e207]: Açaí tipo artesanal
                  - generic [ref=e208]: Do jeito que você ama · Monte o seu · 300ml a 600ml
              - generic [ref=e209]: ▼
            - generic [ref=e210]:
              - generic [ref=e211]:
                - generic [ref=e212]:
                  - generic [ref=e213]: 🫐 Monte o Seu 300ml
                  - generic [ref=e214]: R$ 15,00
                - generic [ref=e215]: Todos ingredientes extras
                - button "🍓 Ver Ingredientes" [ref=e217] [cursor=pointer]
              - generic [ref=e218]:
                - generic [ref=e219]:
                  - generic [ref=e220]: 🫐 Monte o Seu 360ml
                  - generic [ref=e221]: R$ 16,00
                - generic [ref=e222]: Todos ingredientes extras
                - button "🍓 Ver Ingredientes" [ref=e224] [cursor=pointer]
              - generic [ref=e225]:
                - generic [ref=e226]:
                  - generic [ref=e227]: 🫐 Monte o Seu 400ml
                  - generic [ref=e228]: R$ 17,00
                - generic [ref=e229]: Todos ingredientes extras
                - button "🍓 Ver Ingredientes" [ref=e231] [cursor=pointer]
              - generic [ref=e232]:
                - generic [ref=e233]:
                  - generic [ref=e234]: 🫐 Monte o Seu 600ml
                  - generic [ref=e235]: R$ 20,00
                - generic [ref=e236]: Todos ingredientes extras
                - button "🍓 Ver Ingredientes" [ref=e238] [cursor=pointer]
              - button "← Voltar ao Início do Cardápio" [ref=e240] [cursor=pointer]
          - generic [ref=e241]:
            - button "🥤 Milkshakes Cremoso e gelado · Tradicional e Top · 35 sabores ▼" [ref=e242] [cursor=pointer]:
              - generic [ref=e243]:
                - generic [ref=e244]: 🥤
                - generic [ref=e245]:
                  - generic [ref=e246]: Milkshakes
                  - generic [ref=e247]: Cremoso e gelado · Tradicional e Top · 35 sabores
              - generic [ref=e248]: ▼
            - generic [ref=e249]:
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - generic [ref=e252]: 🥤
                  - generic [ref=e253]:
                    - generic [ref=e254]: Milkshake Tradicional 300ml
                    - generic [ref=e255]: R$ 17,00
                - generic [ref=e256]:
                  - generic [ref=e257]: 🥤
                  - generic [ref=e258]:
                    - generic [ref=e259]: Milkshake Tradicional 400ml
                    - generic [ref=e260]: R$ 20,00
                - generic [ref=e261]:
                  - generic [ref=e262]: 🥤
                  - generic [ref=e263]:
                    - generic [ref=e264]: Milkshake Tradicional 500ml
                    - generic [ref=e265]: R$ 22,00
                - generic [ref=e266]:
                  - generic [ref=e267]: 🥤
                  - generic [ref=e268]:
                    - generic [ref=e269]: Milkshake Tradicional 750ml
                    - generic [ref=e270]: R$ 28,00
                - generic [ref=e271]:
                  - generic [ref=e272]: 🥤
                  - generic [ref=e273]:
                    - generic [ref=e274]: Milkshake Top 360ml
                    - generic [ref=e275]: R$ 20,00
                - generic [ref=e276]:
                  - generic [ref=e277]: 🥤
                  - generic [ref=e278]:
                    - generic [ref=e279]: Milkshake Top 600ml
                    - generic [ref=e280]: R$ 24,00
              - button "Ver sabores de milkshake" [ref=e282] [cursor=pointer]: 🥤 Ver Sabores do Milkshake
              - button "← Voltar ao Início do Cardápio" [ref=e284] [cursor=pointer]
          - generic [ref=e285]:
            - button "🍧 Taças Uma experiência única · Colegial, Sundae, Banana Split e mais ▼" [ref=e286] [cursor=pointer]:
              - generic [ref=e287]:
                - generic [ref=e288]: 🍧
                - generic [ref=e289]:
                  - generic [ref=e290]: Taças
                  - generic [ref=e291]: Uma experiência única · Colegial, Sundae, Banana Split e mais
              - generic [ref=e292]: ▼
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]:
                  - generic [ref=e296]: 🍨
                  - generic [ref=e297]:
                    - generic [ref=e298]: Taça Colegial
                    - generic [ref=e299]: R$ 20,00
                - generic [ref=e300]:
                  - generic [ref=e301]: 🍨
                  - generic [ref=e302]:
                    - generic [ref=e303]: Taça Sundae
                    - generic [ref=e304]: R$ 23,00
                - generic [ref=e305]:
                  - generic [ref=e306]: 🍨
                  - generic [ref=e307]:
                    - generic [ref=e308]: Taça Banana Split
                    - generic [ref=e309]: R$ 25,00
                - generic [ref=e310]:
                  - generic [ref=e311]: 🍨
                  - generic [ref=e312]:
                    - generic [ref=e313]: Taça Universitário
                    - generic [ref=e314]: R$ 23,00
                - generic [ref=e315]:
                  - generic [ref=e316]: 🍨
                  - generic [ref=e317]:
                    - generic [ref=e318]: Taça Morango Split
                    - generic [ref=e319]: R$ 28,00
                - generic [ref=e320]:
                  - generic [ref=e321]: 🍨
                  - generic [ref=e322]:
                    - generic [ref=e323]: Taça Vaca Preta
                    - generic [ref=e324]: R$ 23,00
                - generic [ref=e325]:
                  - generic [ref=e326]: 🍨
                  - generic [ref=e327]:
                    - generic [ref=e328]: Taça Sundae com Nutella
                    - generic [ref=e329]: R$ 28,00
                - generic [ref=e330]:
                  - generic [ref=e331]: 🍨
                  - generic [ref=e332]:
                    - generic [ref=e333]: Taça Ula-Ula
                    - generic [ref=e334]: R$ 48,00
              - button "🍧 Ver Sabores das Taças" [ref=e336] [cursor=pointer]
              - button "← Voltar ao Início do Cardápio" [ref=e338] [cursor=pointer]
          - generic [ref=e339]:
            - button "👑 Taças Premium (Taças Sujas) O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais ▼" [ref=e340] [cursor=pointer]:
              - generic [ref=e341]:
                - generic [ref=e342]: 👑
                - generic [ref=e343]:
                  - generic [ref=e344]: Taças Premium (Taças Sujas)
                  - generic [ref=e345]: O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais
              - generic [ref=e346]: ▼
            - generic [ref=e347]:
              - generic [ref=e348]:
                - generic [ref=e349]:
                  - generic [ref=e350]: 🍰
                  - generic [ref=e351]:
                    - generic [ref=e352]: Taça Suja – Prestígio
                    - generic [ref=e353]: R$ 42,00
                - generic [ref=e354]:
                  - generic [ref=e355]: 🍰
                  - generic [ref=e356]:
                    - generic [ref=e357]: Taça Suja – Bis com Negresco
                    - generic [ref=e358]: R$ 42,00
                - generic [ref=e359]:
                  - generic [ref=e360]: 🍰
                  - generic [ref=e361]:
                    - generic [ref=e362]: Taça Suja – Lacta com Leite Ninho
                    - generic [ref=e363]: R$ 42,00
                - generic [ref=e364]:
                  - generic [ref=e365]: 🍰
                  - generic [ref=e366]:
                    - generic [ref=e367]: Taça Suja – Kit Kat
                    - generic [ref=e368]: R$ 42,00
                - generic [ref=e369]:
                  - generic [ref=e370]: 🍰
                  - generic [ref=e371]:
                    - generic [ref=e372]: Taça Suja – Morango com Ovomaltine
                    - generic [ref=e373]: R$ 42,00
                - generic [ref=e374]:
                  - generic [ref=e375]: 🍰
                  - generic [ref=e376]:
                    - generic [ref=e377]: Taça Suja – Sonho de Valsa
                    - generic [ref=e378]: R$ 45,00
                - generic [ref=e379]:
                  - generic [ref=e380]: 🍰
                  - generic [ref=e381]:
                    - generic [ref=e382]: Taça Suja – Unicórnio
                    - generic [ref=e383]: R$ 28,00
              - button "👑 Ver Taças Premium" [ref=e385] [cursor=pointer]
              - button "← Voltar ao Início do Cardápio" [ref=e387] [cursor=pointer]
          - generic [ref=e388]:
            - button "🧊 Isopores de Viagem Leve o prazer para casa · 4 tamanhos disponíveis ▼" [ref=e389] [cursor=pointer]:
              - generic [ref=e390]:
                - generic [ref=e391]: 🧊
                - generic [ref=e392]:
                  - generic [ref=e393]: Isopores de Viagem
                  - generic [ref=e394]: Leve o prazer para casa · 4 tamanhos disponíveis
              - generic [ref=e395]: ▼
            - generic [ref=e396]:
              - generic [ref=e397]:
                - generic [ref=e398]:
                  - generic [ref=e399]: 🧊
                  - generic [ref=e400]:
                    - generic [ref=e401]: 🧊 Isopore 4 Bolas
                    - generic [ref=e402]: Leve sorvete para casa
                    - generic [ref=e403]: R$ 25,00
                - generic [ref=e404]:
                  - generic [ref=e405]: 🧊
                  - generic [ref=e406]:
                    - generic [ref=e407]: 🧊 Isopore 7 Bolas
                    - generic [ref=e408]: Leve sorvete para casa
                    - generic [ref=e409]: R$ 30,00
                - generic [ref=e410]:
                  - generic [ref=e411]: 🧊
                  - generic [ref=e412]:
                    - generic [ref=e413]: 🧊 Isopore 9 Bolas
                    - generic [ref=e414]: Leve sorvete para casa
                    - generic [ref=e415]: R$ 40,00
                - generic [ref=e416]:
                  - generic [ref=e417]: 🧊
                  - generic [ref=e418]:
                    - generic [ref=e419]: 🧊 Isopore 12 Bolas
                    - generic [ref=e420]: Leve sorvete para casa
                    - generic [ref=e421]: R$ 50,00
              - button "🧊 Ver os 35 Sabores" [ref=e424] [cursor=pointer]
              - button "← Voltar ao Início do Cardápio" [ref=e426] [cursor=pointer]
          - generic [ref=e427]:
            - button "🍨 Sobremesas Geladas Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais ▼" [ref=e428] [cursor=pointer]:
              - generic [ref=e429]:
                - generic [ref=e430]: 🍨
                - generic [ref=e431]:
                  - generic [ref=e432]: Sobremesas Geladas
                  - generic [ref=e433]: Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais
              - generic [ref=e434]: ▼
            - generic [ref=e435]:
              - generic [ref=e436]:
                - generic [ref=e437]:
                  - generic [ref=e438]: 🎂
                  - generic [ref=e439]:
                    - generic [ref=e440]: 🍨 Torta de Sorvete
                    - generic [ref=e441]: R$ 100,00
                - generic [ref=e442]:
                  - generic [ref=e443]: 🫕
                  - generic [ref=e444]:
                    - generic [ref=e445]: 🍨 Fondue
                    - generic [ref=e446]: R$ 25,00
                - generic [ref=e447]:
                  - generic [ref=e448]: 🎂
                  - generic [ref=e449]:
                    - generic [ref=e450]: 🍨 Sorvete com Bolo no Copo 300ml
                    - generic [ref=e451]: R$ 15,00
                - generic [ref=e452]:
                  - generic [ref=e453]: 🎂
                  - generic [ref=e454]:
                    - generic [ref=e455]: 🍨 Sorvete com Bolo no Copo 600ml
                    - generic [ref=e456]: R$ 25,00
                - generic [ref=e457]:
                  - generic [ref=e458]: 🎂
                  - generic [ref=e459]:
                    - generic [ref=e460]: 🍨 Petit Gâteau (1 bola)
                    - generic [ref=e461]: R$ 20,00
                - generic [ref=e462]:
                  - generic [ref=e463]: 🎂
                  - generic [ref=e464]:
                    - generic [ref=e465]: 🍨 Petit Gâteau (2 bolas)
                    - generic [ref=e466]: R$ 25,00
                - generic [ref=e467]:
                  - generic [ref=e468]: 🍫
                  - generic [ref=e469]:
                    - generic [ref=e470]: 🍫 Brownie com Sorvete (1 bola)
                    - generic [ref=e471]: R$ 20,00
                - generic [ref=e472]:
                  - generic [ref=e473]: 🍫
                  - generic [ref=e474]:
                    - generic [ref=e475]: 🍫 Brownie com Sorvete (2 bolas)
                    - generic [ref=e476]: R$ 25,00
                - generic [ref=e477]:
                  - generic [ref=e478]: 🥗
                  - generic [ref=e479]:
                    - generic [ref=e480]: 🍨 Sorvete Diet (1 bola)
                    - generic [ref=e481]: R$ 10,00
              - button "🍨 Ver os 35 Sabores" [ref=e484] [cursor=pointer]
              - button "← Voltar ao Início do Cardápio" [ref=e486] [cursor=pointer]
      - generic [ref=e487]:
        - generic [ref=e490]: 📦 Encomendas & Complementos
        - generic [ref=e492]: Peça com antecedência · Retirada na loja
      - generic [ref=e493]:
        - generic [ref=e494]:
          - button "📦 Sorvetes em Caixa 5 e 10 Litros Ideal para festas e eventos · 2 ou 3 sabores à escolha ▼" [ref=e495] [cursor=pointer]:
            - generic [ref=e496]:
              - generic [ref=e497]: 📦
              - generic [ref=e498]:
                - generic [ref=e499]: Sorvetes em Caixa 5 e 10 Litros
                - generic [ref=e500]: Ideal para festas e eventos · 2 ou 3 sabores à escolha
            - generic [ref=e501]: ▼
          - generic [ref=e502]:
            - generic [ref=e503]:
              - generic [ref=e504]: 📦 Para encomendar, acesse a página de Encomendas no menu acima
              - link "📦 Ir para Encomendas" [ref=e505] [cursor=pointer]:
                - /url: encomendas.html
            - button "← Voltar ao Início do Cardápio" [ref=e506] [cursor=pointer]
        - generic [ref=e507]:
          - button "🎂 Tortas de Sorvete Faça a festa! 3 sabores · Encomende com 3 dias de antecedência ▼" [ref=e508] [cursor=pointer]:
            - generic [ref=e509]:
              - generic [ref=e510]: 🎂
              - generic [ref=e511]:
                - generic [ref=e512]: Tortas de Sorvete
                - generic [ref=e513]: Faça a festa! 3 sabores · Encomende com 3 dias de antecedência
            - generic [ref=e514]: ▼
          - generic [ref=e515]:
            - link "🎂 Ver Tortas de Sorvete e Encomendar →" [ref=e516] [cursor=pointer]:
              - /url: encomendas.html#tortas
            - button "← Voltar ao Início do Cardápio" [ref=e517] [cursor=pointer]
        - generic [ref=e518]:
          - button "❄️ Picolés para Encomenda Preço especial de atacado · 5 tipos · Mín. 100 unidades ▼" [ref=e519] [cursor=pointer]:
            - generic [ref=e520]:
              - generic [ref=e521]: ❄️
              - generic [ref=e522]:
                - generic [ref=e523]: Picolés para Encomenda
                - generic [ref=e524]: Preço especial de atacado · 5 tipos · Mín. 100 unidades
            - generic [ref=e525]: ▼
          - generic [ref=e526]:
            - link "🍭 Ver picolés" [ref=e527] [cursor=pointer]:
              - /url: encomendas.html#picolés
            - link "💬 Encomendar no WhatsApp" [ref=e528] [cursor=pointer]:
              - /url: https://wa.me/5516996062046?text=Ol%C3%A1!%20Gostaria%20de%20encomendar%20picol%C3%A9s%20no%20atacado.
            - button "← Voltar ao Início do Cardápio" [ref=e529] [cursor=pointer]
        - generic [ref=e530]:
          - button "🍫 Complementos para Sorvetes Canudinho, Casquinha, Cascão, Cestinha, Cobertura ▼" [ref=e531] [cursor=pointer]:
            - generic [ref=e532]:
              - generic [ref=e533]: 🍫
              - generic [ref=e534]:
                - generic [ref=e535]: Complementos para Sorvetes
                - generic [ref=e536]: Canudinho, Casquinha, Cascão, Cestinha, Cobertura
            - generic [ref=e537]: ▼
          - generic [ref=e539]:
            - generic [ref=e540]:
              - generic [ref=e541]: 🍪
              - generic [ref=e542]:
                - generic [ref=e543]: Canudinho Wafer UN
                - generic [ref=e544]: R$ 0,25 / un.
            - generic [ref=e545]:
              - generic [ref=e546]: 🍪
              - generic [ref=e547]:
                - generic [ref=e548]: Casquinhas UN
                - generic [ref=e549]: R$ 0,25 / un.
            - generic [ref=e550]:
              - generic [ref=e551]: 🍪
              - generic [ref=e552]:
                - generic [ref=e553]: Cascão UN
                - generic [ref=e554]: R$ 1,00 / un.
            - generic [ref=e555]:
              - generic [ref=e556]: 🍪
              - generic [ref=e557]:
                - generic [ref=e558]: Cestinha UN
                - generic [ref=e559]: R$ 1,00 / un.
            - generic [ref=e560]:
              - generic [ref=e561]: 🍪
              - generic [ref=e562]:
                - generic [ref=e563]: Cobertura 1.3L UN
                - generic [ref=e564]: R$ 40,00 / un.
            - generic [ref=e565]:
              - generic [ref=e566]: 🛒 Para encomendar complementos, acesse a página de Encomendas no menu acima
              - link "📦 Ir para Encomendas" [ref=e567] [cursor=pointer]:
                - /url: encomendas.html
    - region "Avaliacoes de clientes" [ref=e568]:
      - heading "💬 O que nossos clientes dizem" [level=2] [ref=e569]
      - generic [ref=e570]:
        - generic [ref=e571]:
          - generic [ref=e572]: ★★★★★
          - paragraph [ref=e573]: "\"O melhor sorvete de Cajuru! Cremoso, saboroso e com preco justo. Toda semana a gente vai la. Recomendo demais!\""
          - text: Maria Aparecida S. · Cajuru, SP
        - generic [ref=e574]:
          - generic [ref=e575]: ★★★★★
          - paragraph [ref=e576]: "\"Fiz encomenda de torta gelada para aniversario da minha filha. Ficou perfeita! Todos elogiaram muito. Voltarei sempre!\""
          - text: Joao Carlos M. · Cassia dos Coqueiros, SP
        - generic [ref=e577]:
          - generic [ref=e578]: ★★★★★
          - paragraph [ref=e579]: "\"Açaí delicioso e sorvete tipo artesanal incrivel. Atendimento excelente, lugar limpo e aconchegante. Nota 10!\""
          - text: Ana Paula R. · Ribeirão Preto, SP
      - link "⭐ Deixe sua avaliacao no Google" [ref=e581] [cursor=pointer]:
        - /url: https://search.google.com/local/writereview?placeid=ChIJ6YxyBxd5lJQRwl8Kmda5WZ8
    - generic [ref=e582]:
      - generic [ref=e583]:
        - generic [ref=e584]:
          - img "Logo Sorveteria Itapolitana Cajuru – Sorvete tipo artesanal desde 2007" [ref=e585]
          - generic [ref=e586]: Sorveteria & Açaiteria Itapolitana Cajuru
          - generic [ref=e587]: Sorvete Cremoso Tipo Artesanal desde 2007
        - generic [ref=e589]:
          - generic [ref=e590]: ⏰ Nosso Horário
          - generic [ref=e592]:
            - text: "Todos os dias: 10h às 22h"
            - text: Segunda a Domingo
          - generic [ref=e596]: Aberto agora - Fecha às 22h
      - generic [ref=e597]:
        - generic [ref=e598]:
          - generic [ref=e599]:
            - generic [ref=e600]: 🏅
            - text: Desde 2007
          - generic [ref=e601]:
            - generic [ref=e602]: 🔒
            - text: Site Seguro
          - generic [ref=e603]:
            - generic [ref=e604]: 💳
            - text: Pix Aceito
          - generic [ref=e605]:
            - generic [ref=e606]: 📱
            - text: App Disponível
          - generic [ref=e607]:
            - generic [ref=e608]: ⭐
            - text: Clube Fidelidade
          - generic [ref=e609]:
            - generic [ref=e610]: ✅
            - text: LGPD Conforme
        - generic [ref=e611]: 🔒 Seus dados estão seguros. Usamos apenas cookies essenciais e de análise. Nenhum dado de pagamento é armazenado pelo site.
        - link "🔒 Política de Privacidade (LGPD)" [ref=e612] [cursor=pointer]:
          - /url: politica-privacidade.html
        - text: ·
        - link "ℹ️ Sobre a Itapolitana" [ref=e613] [cursor=pointer]:
          - /url: sobre.html
      - generic [ref=e614]:
        - text: © 2007–2026 Sorveteria Itapolitana · Cajuru-SP · Todos os direitos reservados
        - text: Desenvolvido por MissiaScaçarato
      - link "⚙️" [ref=e616] [cursor=pointer]:
        - /url: admin-painel.html
  - generic [ref=e618]:
    - paragraph [ref=e619]:
      - text: Usamos cookies essenciais para o funcionamento do site e, com seu consentimento, cookies de análise (Google Analytics) para melhorar sua experiência. Você pode aceitar todos ou recusar os não essenciais.
      - link "Saiba mais →" [ref=e620] [cursor=pointer]:
        - /url: politica-privacidade.html
    - generic [ref=e621]:
      - button "✅ Aceitar todos" [ref=e622] [cursor=pointer]
      - button "❌ Recusar não essenciais" [ref=e623] [cursor=pointer]
```

# Test source

```ts
  1  | // Testes: 02-botoes-navegacao.spec.js
  2  | // Verifica que os botões do header e hero funcionam corretamente.
  3  | 
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test.describe('Botões de Navegação — Header', () => {
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  9  |     await page.waitForTimeout(800);
  10 |   });
  11 | 
  12 |   test('botão Cardápio revela seção de cardápio', async ({ page }) => {
  13 |     // Clicar no botão de cardápio do header
  14 |     const btnCardapio = page.locator('.nav-btn').filter({ hasText: /cardápio|cardapio/i }).first();
  15 |     if (await btnCardapio.isVisible()) {
  16 |       await btnCardapio.click();
  17 |       await page.waitForTimeout(800);
  18 |       // Após clicar, seção de cardápio deve estar visível
  19 |       const secCardapio = page.locator('#cardapio, .cardápio, [id*="cardapio"]').first();
  20 |       // Verifica que não houve erro — a seção existe no DOM
  21 |       await expect(secCardapio).toBeAttached({ timeout: 5000 });
  22 |     } else {
  23 |       test.skip();
  24 |     }
  25 |   });
  26 | 
  27 |   test('botão Promoções navega para promocao.html', async ({ page }) => {
  28 |     const btn = page.locator('.nav-btn').filter({ hasText: /promo/i }).first();
  29 |     if (await btn.isVisible()) {
  30 |       await Promise.all([
  31 |         page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
  32 |         btn.click(),
  33 |       ]);
  34 |       // Aceita tanto navegação para nova página quanto scroll anchor
  35 |       const url = page.url();
  36 |       const isInPage = url.includes('promocao') || url.includes('promo') || url.includes('#');
  37 |       expect(isInPage).toBeTruthy();
  38 |     } else {
  39 |       test.skip();
  40 |     }
  41 |   });
  42 | 
  43 |   test('botão Fidelidade navega para fidelidade.html', async ({ page }) => {
  44 |     const btn = page.locator('.nav-btn').filter({ hasText: /fidelidade/i }).first();
  45 |     if (await btn.isVisible()) {
  46 |       await Promise.all([
  47 |         page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
  48 |         btn.click(),
  49 |       ]);
  50 |       const url = page.url();
  51 |       expect(url).toContain('fidelidade');
  52 |     } else {
  53 |       test.skip();
  54 |     }
  55 |   });
  56 | 
  57 |   test('botão Encomendas navega para encomendas.html', async ({ page }) => {
  58 |     const btn = page.locator('.nav-btn').filter({ hasText: /encomen/i }).first();
  59 |     if (await btn.isVisible()) {
  60 |       await Promise.all([
  61 |         page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
  62 |         btn.click(),
  63 |       ]);
  64 |       const url = page.url();
  65 |       expect(url).toContain('encomend');
  66 |     } else {
  67 |       test.skip();
  68 |     }
  69 |   });
  70 | 
  71 |   test('link WhatsApp tem href válido para wa.me', async ({ page }) => {
  72 |     const waLink = page.locator('a[href*="wa.me"]').first();
  73 |     if (await waLink.isVisible()) {
  74 |       const href = await waLink.getAttribute('href');
  75 |       expect(href).toMatch(/wa\.me\/\d+/);
  76 |     } else {
  77 |       test.skip();
  78 |     }
  79 |   });
  80 | });
  81 | 
  82 | test.describe('Hero Section', () => {
  83 |   test('logo da sorveteria é visível', async ({ page }) => {
  84 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  85 |     const logo = page.locator('.brand img, .brand, header img[src*="logo"]').first();
> 86 |     await expect(logo).toBeVisible({ timeout: 5000 });
     |                        ^ Error: expect(locator).toBeVisible() failed
  87 |   });
  88 | 
  89 |   test('strip sensorial ou frase dinâmica existe', async ({ page }) => {
  90 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  91 |     await page.waitForTimeout(500);
  92 |     const strip = page.locator('.strip-sensorial, .frase-sensorial').first();
  93 |     await expect(strip).toBeAttached({ timeout: 5000 });
  94 |   });
  95 | });
  96 | 
```