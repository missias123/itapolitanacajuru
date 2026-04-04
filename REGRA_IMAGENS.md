# 📸 REGRA OFICIAL DE IMAGENS — Sorveteria Itapolitana

> **LEI PERMANENTE:** Toda imagem incluída no site é convertida automaticamente para WebP,
> redimensionada e comprimida. Isso acontece automaticamente no Admin — sem ação manual.

---

## Padrões por Seção

| Seção | Dimensão | Tamanho Máx. | Formato | Proporção |
|---|---|---|---|---|
| Hero / Banner principal | 1200 × 630 px | 200 KB | WebP | 16:9 |
| Promoção (card) | 800 × 600 px | 150 KB | WebP | 4:3 |
| Produto / Cardápio | 600 × 600 px | 100 KB | WebP | 1:1 |
| Açaí / Destaque | 800 × 600 px | 150 KB | WebP | 4:3 |
| Fidelidade (prêmio) | 400 × 400 px | 80 KB | WebP | 1:1 |
| OG Image (compartilhamento) | 1200 × 630 px | 200 KB | WebP | 16:9 |
| Favicon | 512 × 512 px | 50 KB | PNG/ICO | 1:1 |

---

## Regras Automáticas (aplicadas no Admin)

1. **Conversão automática para WebP** — qualquer JPG, PNG ou GIF é convertido
2. **Redimensionamento automático** — imagem maior que o limite é reduzida proporcionalmente
3. **Compressão automática** — qualidade 82% (invisível ao olho humano, 60-90% menor)
4. **Lazy loading obrigatório** — toda imagem fora da tela carrega só quando necessário
5. **Alt text obrigatório** — toda imagem precisa de descrição para SEO e acessibilidade
6. **Sem imagens acima de 300KB** — o sistema bloqueia o upload se ultrapassar

---

## O que NÃO fazer

- ❌ Nunca enviar imagens JPG/PNG diretamente sem converter
- ❌ Nunca usar imagens acima de 1MB
- ❌ Nunca usar imagens sem alt text
- ❌ Nunca usar imagens com texto embutido (prejudica SEO)
- ❌ Nunca usar GIFs animados (use vídeo WebM)

---

## Processo Automático no Admin

```
Usuário faz upload → Canvas API converte → WebP + resize + compress → Salvo no GitHub
```

O Admin processa a imagem **no navegador** antes de salvar, usando a Canvas API:
- Lê o arquivo original
- Desenha no canvas com as dimensões corretas
- Exporta como WebP com qualidade 82%
- Salva no GitHub já otimizado

---

*Regra criada em: 04/04/2026 | Versão: 1.0*
*Qualquer imagem fora do padrão é automaticamente corrigida pelo Admin.*
