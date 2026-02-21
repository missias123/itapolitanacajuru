# 🚀 Instruções de Deploy - Sorveteria Itapolitana

## Status Atual
- **Repositório GitHub:** https://github.com/missias123/itapolitanacajuru
- **Branch:** main
- **Último Commit:** 2723313
- **Domínio:** itapolitanacajuru.site

## ✅ O que foi implementado

### Design Visual
- ✅ Cores neon: Cyan (#00E5FF), Pink (#FF007F), Yellow (#FFD700), Green (#39FF14)
- ✅ Fundo branco (#FFFFFF)
- ✅ Design mobile-first responsivo até 430px
- ✅ Gradientes e sombras neon

### Cardápio
- ✅ **37 Sorvetes** com preços variados (R$ 7,50 - R$ 9,00)
- ✅ **19 Picolés de Leite com Recheio** (R$ 3,00)
  - Morango, Maracujá, Limão, Coco, Amendoim, Doce de Leite, Chocolate, Abacaxi, Banana, Uva, Goiaba, Blue Ice, Caraxi, Coco Branco, Amarena, Leite Condensado, Mamão Papaia, Menta com Chocolate, Nata com Goiaba
- ✅ **8 Picolés Eskimo** (R$ 8,00)
  - Brigadeiro, Bombom, Nutella, Ovomaltine, Leite Ninho, Nata, Morango, Prestígio
- ✅ **6 Opções de Açaí** (R$ 12,00 - R$ 15,00)

### SEO e Funcionalidades
- ✅ SEO otimizado para: Cajuru, Santa Cruz da Esperança, Cássia dos Coqueiros
- ✅ Schema LocalBusiness estruturado
- ✅ Meta tags Open Graph
- ✅ Integração WhatsApp para pedidos
- ✅ Carrinho de compras funcional
- ✅ Painel administrativo (senha: itapolitanacajuru2007)

### Arquivos Criados
```
/
├── index.html                    (Página principal - 186 linhas)
├── styles/
│   ├── main.css                 (Estilos neon - 600+ linhas)
│   └── mobile.css               (Responsivo - 300+ linhas)
├── scripts/
│   ├── products.js              (37 sorvetes + picolés)
│   └── main.js                  (Carrinho e pedidos)
├── admin/
│   └── index.html               (Painel administrativo)
└── DEPLOY_INSTRUCTIONS.md       (Este arquivo)
```

## 🔄 Como Fazer Deploy no Manus

### Opção 1: Via Manus Dashboard (Manual)
1. Acesse https://manus.im/app/projects
2. Procure pelo projeto "Itapolitana Cajuru"
3. Clique em "Redeploy" ou "Sync with GitHub"
4. Aguarde a sincronização completar
5. Verifique em https://itapolitanacajuru.site

### Opção 2: Via GitHub Webhook (Automático)
1. O repositório GitHub já está conectado ao Manus
2. Qualquer push para a branch `main` dispara deploy automático
3. Aguarde 2-3 minutos para a sincronização

### Opção 3: Via CLI do Manus (Futuro)
```bash
manus deploy --project itapolitana-cajuru --branch main
```

## 📋 Checklist de Verificação Pós-Deploy

Após fazer o deploy, verifique:

- [ ] Site carrega em https://itapolitanacajuru.site
- [ ] Fundo é branco com cores neon (cyan, pink, yellow, green)
- [ ] Logo "🍦 Itapolitana" aparece no topo
- [ ] 37 sorvetes aparecem no cardápio
- [ ] Picolés de Leite com Recheio aparecem (19 sabores, R$ 3,00)
- [ ] Picolés Eskimo aparecem (8 sabores com Brigadeiro, R$ 8,00)
- [ ] Formulário de encomenda funciona
- [ ] Carrinho de compras funciona
- [ ] Botão WhatsApp funciona
- [ ] Painel admin acessível em /admin (senha: itapolitanacajuru2007)
- [ ] Layout é responsivo em celular (até 430px)
- [ ] SEO meta tags aparecem (verificar com DevTools)

## 🔧 Troubleshooting

### Site mostra design antigo
- Limpar cache do navegador (Ctrl+Shift+Del)
- Fazer hard refresh (Ctrl+F5)
- Verificar se o commit foi feito corretamente

### Picolés não aparecem
- Verificar se `scripts/products.js` foi sincronizado
- Verificar console do navegador (F12) para erros

### Cores não aparecem neon
- Verificar se `styles/main.css` foi sincronizado
- Verificar se `styles/mobile.css` foi sincronizado

### Admin não funciona
- Verificar se `admin/index.html` foi sincronizado
- Senha correta: `itapolitanacajuru2007`

## 📞 Suporte

**Repositório GitHub:** https://github.com/missias123/itapolitanacajuru

**Contato WhatsApp:** +55 (16) 3354-1234

## 📝 Histórico de Atualizações

| Data | Versão | Alterações |
|------|--------|-----------|
| 21/02/2026 | 2.0.0 | Design neon completo, 37 sorvetes, picolés corretos, mobile-first |
| 21/02/2026 | 1.0.0 | Versão inicial |

---

**Última atualização:** 21 de Fevereiro de 2026
**Status:** ✅ Pronto para Deploy
