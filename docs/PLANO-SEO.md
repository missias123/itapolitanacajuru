# Plano de SEO — Validação Pré-Lote A

> Status: planejamento validado com pendências bloqueadoras
> Data: 2026-07-25

---

## A) CORREÇÕES TÉCNICAS (SEO TÉCNICO)

Escopo técnico separado de alterações comerciais.

Checklist técnico:
- Sitemap
- Robots
- Canonical
- Titles
- Meta descriptions
- H1
- Schema
- Links internos
- Imagens
- Performance

### A.1 Itens já existentes
- `sitemap.xml` existe
- `robots.txt` existe
- canonical existe na home
- title e meta description existem na home

### A.2 Pendências técnicas priorizadas
1. Confirmar canonical nas páginas secundárias.
2. Confirmar meta description única por página.
3. Revisar consistência de headings (H1/H2/H3).
4. Revisar schema para remover blocos não verificáveis.
5. Revisar links internos de conversão (encomenda, retirada, WhatsApp).
6. Revisar atributos de imagens e lazy loading.
7. Revisar performance (principalmente mobile).

---

## B) SEO LOCAL

Checklist local:
- Perfil da Empresa no Google
- Nome, endereço e telefone (NAP)
- Horários
- Fotos reais
- Avaliações reais
- Produtos e serviços
- Rotas e contato

### B.1 Regras
- NAP deve ser idêntico entre site e perfil do Google.
- Horários no site devem refletir operação real.
- Avaliações usadas em schema devem ser reais, verificáveis e autorizadas.
- Não publicar informação local não confirmada.

---

## C) CONTEÚDO

Escopo de conteúdo (sem implementar sem aprovação):
- Cardápio
- Picolés
- Sorvetes
- Açaí
- Milk-shakes
- Encomendas
- Festas
- Revenda
- Localização

### C.1 Regra de governança
Recomendação de SEO não autoriza, por si só, mudança comercial. Toda alteração comercial depende de aprovação explícita.

---

## D) CONVERSÃO

Escopo de conversão:
- WhatsApp
- Encomenda
- Retirada
- CTA
- Ita Bot

### D.1 Regra de governança
Não misturar otimização técnica com alteração comercial sem aprovação.

---

## AGGREGATERATING E REVIEW (BLOQUEADOR)

Foram identificados no código:
- `reviewCount: 250`
- `reviewCount: 180`
- `reviewCount: 300`
- `Review` com autor `Carlos Augusto`

### Perguntas obrigatórias ao proprietário
1. A quantidade corresponde a avaliações reais?
2. As avaliações estão publicadas em fonte verificável?
3. O autor “Carlos Augusto” é pessoa real?
4. Existe autorização para exibir o nome?
5. O texto exibido é real e visível na página?
6. A contagem está atualizada?
7. As avaliações são da própria empresa?
8. Não são avaliações inventadas/agregadas artificialmente/copiadas?

### Regra de decisão
Se qualquer resposta for “não”, “não sei” ou sem comprovação:
- remover `AggregateRating`;
- remover `Review`;
- remover `reviewCount`;
- remover `ratingValue` não verificável;
- remover autor hardcoded;
- manter somente depoimentos reais, autorizados e visíveis.

Status atual:
- **Pendente de confirmação documental do proprietário (bloqueador de SEO).**

---

## DECISÃO PRÉ-LOTE A

O plano de SEO está validado como base, com estas condicionantes:
1. Resolver AggregateRating/Review antes de produção.
2. Manter separação entre técnico/local/conteúdo/conversão.
3. Não alterar dados comerciais sem aprovação explícita.
