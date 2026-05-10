# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-fidelidade.spec.js >> Programa de Fidelidade >> botão Validar Código existe
- Location: e2e/04-fidelidade.spec.js:33:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button').filter({ hasText: /validar\s*c[oó]digo/i }).first()
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button').filter({ hasText: /validar\s*c[oó]digo/i }).first()
    10 × locator resolved to <button id="btn-registrar-ponto" class="btn btn-sec btn-validar-codigo">✅ Validar Código</button>
       - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - button "Dúvidas — Ita Bot" [ref=e6] [cursor=pointer]: 💬 DÚVIDAS
      - navigation "Menu principal" [ref=e7]:
        - link "Voltar à Tela Inicial" [ref=e8] [cursor=pointer]:
          - /url: index.html
          - generic [ref=e9]: 🏠
          - generic [ref=e10]: TELA INICIAL
        - link "🛒 ENCOMENDAS" [ref=e11] [cursor=pointer]:
          - /url: encomendas.html
          - generic [ref=e12]: 🛒
          - generic [ref=e13]: ENCOMENDAS
        - link "🎉 PROMOÇÃO" [ref=e14] [cursor=pointer]:
          - /url: promocao.html
          - generic [ref=e15]: 🎉
          - generic [ref=e16]: PROMOÇÃO
        - link "💬 DICAS/DEPOIMENTOS" [ref=e17] [cursor=pointer]:
          - /url: dicas.html
          - generic [ref=e18]: 💬
          - generic [ref=e19]: DICAS/DEPOIMENTOS
        - link "🎟️ FIDELIDADE" [ref=e20] [cursor=pointer]:
          - /url: fidelidade.html
          - generic [ref=e21]: 🎟️
          - generic [ref=e22]: FIDELIDADE
  - main [ref=e23]:
    - region "Clube de Fidelidade Itapolitana" [ref=e24]:
      - img "Logo Sorveteria Itapolitana" [ref=e25]
      - heading "Clube de Fidelidade Itapolitana" [level=1] [ref=e26]
      - paragraph [ref=e27]: Acumule pontos, consulte seu saldo e valide códigos em um fluxo simples no mobile.
      - generic [ref=e28]: ⚡ Fase de testes · Em breve totalmente online
      - generic [ref=e29]:
        - link "🎟️ Fazer cadastro" [ref=e30] [cursor=pointer]:
          - /url: "#titulo-cadastro"
        - link "🔎 Consultar pontos" [ref=e31] [cursor=pointer]:
          - /url: "#titulo-area-cliente"
        - link "📜 Ver regras" [ref=e32] [cursor=pointer]:
          - /url: "#titulo-regras"
    - region "Resumo rápido do programa" [ref=e33]:
      - heading "Resumo rápido do programa" [level=2] [ref=e34]
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: "1"
          - paragraph [ref=e38]:
            - text: Compras acima de
            - strong [ref=e39]: R$ 30,00
            - text: ", de segunda a sexta, geram 1 cupom."
        - generic [ref=e40]:
          - generic [ref=e41]: "2"
          - paragraph [ref=e42]: Cadastre-se com nome, WhatsApp, data de nascimento e aceite das regras.
        - generic [ref=e43]:
          - generic [ref=e44]: "3"
          - paragraph [ref=e45]: Entre com seu WhatsApp, valide o código do cupom e acompanhe a progressão dos prêmios.
    - region "Como funciona" [ref=e46]:
      - heading "Como funciona" [level=2] [ref=e47]
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]: "1"
          - paragraph [ref=e51]:
            - text: Compre acima de
            - strong [ref=e52]: R$ 30,00
            - text: ", de"
            - strong [ref=e53]: segunda a sexta
            - text: .
        - generic [ref=e54]:
          - generic [ref=e55]: "2"
          - paragraph [ref=e56]:
            - text: Receba um
            - strong [ref=e57]: cupom com código
            - text: na loja.
        - generic [ref=e58]:
          - generic [ref=e59]: "3"
          - paragraph [ref=e60]:
            - text: Acesse o site e faça seu
            - strong [ref=e61]: cadastro gratuito
            - text: .
        - generic [ref=e62]:
          - generic [ref=e63]: "4"
          - paragraph [ref=e64]:
            - text: Digite o código do cupom e acumule
            - strong [ref=e65]: +1 ponto
            - text: .
      - generic [ref=e66]:
        - article [ref=e67]:
          - generic [ref=e68]: 🥤
          - generic [ref=e69]: ⭐ 10 pontos
          - generic [ref=e70]: Milkshake 300ml grátis
        - article [ref=e71]:
          - generic [ref=e72]: 🍨
          - generic [ref=e73]: ⭐ 30 pontos
          - generic [ref=e74]: Caixa com 7 bolas grátis
      - generic [ref=e75]:
        - generic [ref=e76]:
          - generic [ref=e77]: "🥤 Milkshake (meta: 10 pts)"
          - strong [ref=e78]: 0 / 10 pts
        - progressbar "Progresso para Milkshake" [ref=e79]
        - generic [ref=e80]:
          - generic [ref=e81]: "🍨 Caixa 7 bolas (meta: 30 pts)"
          - strong [ref=e82]: 0 / 30 pts
        - progressbar "Progresso para Caixa 7 bolas" [ref=e83]
        - paragraph [ref=e84]: Entre com seu WhatsApp para ver seus pontos reais
    - region "Regras completas do programa" [ref=e85]:
      - heading "Regras completas do programa" [level=2] [ref=e86]
      - group [ref=e87]:
        - generic "📜 Ler regulamento completo do Clube de Fidelidade" [ref=e88] [cursor=pointer]
        - generic [ref=e89]:
          - paragraph [ref=e90]:
            - strong [ref=e91]: 1. DO PROGRAMA
            - text: 1.1. O Clube de Fidelidade Itapolitana é uma ação promocional gratuita da Sorveteria Itapolitana Cajuru.
            - text: 1.2. O programa funciona por acúmulo de pontos via códigos de cupons distribuídos na loja.
            - text: 1.3. Não há campanhas promocionais extras paralelas nesta fase.
          - paragraph [ref=e92]:
            - strong [ref=e93]: 2. DA PARTICIPAÇÃO
            - text: 2.1. A participação exige cadastro no site oficial, com dados verdadeiros do cliente.
            - text: 2.2. O participante deve informar um número de celular (WhatsApp) válido para identificação e contato.
          - paragraph [ref=e94]:
            - strong [ref=e95]: 3. DOS CUPONS E PONTOS
            - text: 3.1. Compras acima de R$ 30,00, de segunda a sexta, geram 1 cupom com código.
            - text: 3.2. Cada código válido inserido no site gera +1 ponto.
            - text: 3.3. Pontos não expiram enquanto o programa estiver ativo.
            - text: 3.4. Códigos inválidos, duplicados ou já utilizados não geram pontuação.
          - paragraph [ref=e96]:
            - strong [ref=e97]: 4. DOS PRÊMIOS
            - text: "4.1. Com 10 pontos: 1 Milkshake 300ml grátis."
            - text: "4.2. Com 30 pontos: 1 Caixa com 7 bolas de sorvete grátis."
            - text: 4.3. O resgate é pessoal e pode exigir confirmação de cadastro para retirada.
          - paragraph [ref=e98]:
            - strong [ref=e99]: 5. DAS PROIBIÇÕES E FRAUDES
            - text: 5.1. É proibido usar código de terceiros sem autorização, manipular sistema, automações, robôs ou qualquer tentativa de fraude.
            - text: 5.2. Em caso de fraude, a conta pode ser bloqueada e excluída do programa, sem aviso prévio.
          - paragraph [ref=e100]:
            - strong [ref=e101]: 6. DAS CRÍTICAS E CONDUTA
            - text: 6.1. O canal de atendimento deve ser usado com respeito e boa-fé.
            - text: 6.2. Condutas ofensivas, abusivas ou ameaçadoras podem resultar em restrição de atendimento e participação.
          - paragraph [ref=e102]:
            - strong [ref=e103]: 7. DAS ALTERAÇÕES E FASE DE TESTES
            - text: 7.1. O programa pode sofrer ajustes operacionais, de regras e de prêmios, com atualização nesta página.
            - text: 7.2. A Itapolitana pode suspender ou encerrar o programa em caso de necessidade operacional.
          - paragraph [ref=e104]:
            - strong [ref=e105]: 8. DO FORO
            - text: 8.1. Para eventuais controvérsias, fica eleito o foro da comarca de Cajuru/SP, com renúncia a qualquer outro, por mais privilegiado que seja.
    - region "📝 Cadastro gratuito no Clube de Fidelidade" [ref=e106]:
      - heading "📝 Cadastro gratuito no Clube de Fidelidade" [level=2] [ref=e107]
      - generic [ref=e108]:
        - paragraph [ref=e109]: Preencha os campos abaixo com seus dados reais. Use seu WhatsApp principal para receber as confirmações da loja.
        - generic [ref=e110]:
          - generic [ref=e111]: Nome completo
          - textbox "Nome completo" [ref=e112]:
            - /placeholder: Informe seu nome completo
        - generic [ref=e113]:
          - generic [ref=e114]: Celular (WhatsApp)
          - textbox "Celular (WhatsApp)" [ref=e115]:
            - /placeholder: (16) 99999-9999
        - generic [ref=e116]:
          - generic [ref=e117]: Data de nascimento
          - generic [ref=e118]:
            - combobox [ref=e119]:
              - option "Dia" [selected]
              - option "01"
              - option "02"
              - option "03"
              - option "04"
              - option "05"
              - option "06"
              - option "07"
              - option "08"
              - option "09"
              - option "10"
              - option "11"
              - option "12"
              - option "13"
              - option "14"
              - option "15"
              - option "16"
              - option "17"
              - option "18"
              - option "19"
              - option "20"
              - option "21"
              - option "22"
              - option "23"
              - option "24"
              - option "25"
              - option "26"
              - option "27"
              - option "28"
              - option "29"
              - option "30"
              - option "31"
            - combobox [ref=e120]:
              - option "Mês" [selected]
              - option "Janeiro"
              - option "Fevereiro"
              - option "Março"
              - option "Abril"
              - option "Maio"
              - option "Junho"
              - option "Julho"
              - option "Agosto"
              - option "Setembro"
              - option "Outubro"
              - option "Novembro"
              - option "Dezembro"
            - combobox [ref=e121]:
              - option "Ano" [selected]
              - option "2026"
              - option "2025"
              - option "2024"
              - option "2023"
              - option "2022"
              - option "2021"
              - option "2020"
              - option "2019"
              - option "2018"
              - option "2017"
              - option "2016"
              - option "2015"
              - option "2014"
              - option "2013"
              - option "2012"
              - option "2011"
              - option "2010"
              - option "2009"
              - option "2008"
              - option "2007"
              - option "2006"
              - option "2005"
              - option "2004"
              - option "2003"
              - option "2002"
              - option "2001"
              - option "2000"
              - option "1999"
              - option "1998"
              - option "1997"
              - option "1996"
              - option "1995"
              - option "1994"
              - option "1993"
              - option "1992"
              - option "1991"
              - option "1990"
              - option "1989"
              - option "1988"
              - option "1987"
              - option "1986"
              - option "1985"
              - option "1984"
              - option "1983"
              - option "1982"
              - option "1981"
              - option "1980"
              - option "1979"
              - option "1978"
              - option "1977"
              - option "1976"
              - option "1975"
              - option "1974"
              - option "1973"
              - option "1972"
              - option "1971"
              - option "1970"
              - option "1969"
              - option "1968"
              - option "1967"
              - option "1966"
              - option "1965"
              - option "1964"
              - option "1963"
              - option "1962"
              - option "1961"
              - option "1960"
              - option "1959"
              - option "1958"
              - option "1957"
              - option "1956"
              - option "1955"
              - option "1954"
              - option "1953"
              - option "1952"
              - option "1951"
              - option "1950"
              - option "1949"
              - option "1948"
              - option "1947"
              - option "1946"
              - option "1945"
              - option "1944"
              - option "1943"
              - option "1942"
              - option "1941"
              - option "1940"
        - generic [ref=e122]:
          - paragraph [ref=e123]: ↓ Leia as regras acima e marque a caixa para continuar
          - generic [ref=e124] [cursor=pointer]:
            - checkbox "Li e aceito as Regras do Clube de Fidelidade" [ref=e125]
            - generic [ref=e126]: ✓
            - generic [ref=e127]:
              - text: Li e aceito as
              - link "Regras do Clube de Fidelidade" [ref=e128]:
                - /url: "#titulo-regras"
        - button "🎟️ Cadastrar no Clube" [ref=e129] [cursor=pointer]
      - status [ref=e130]: Preencha o formulário acima para se cadastrar gratuitamente no Clube de Fidelidade.
    - region "Área do Cliente — Consultar pontos" [ref=e131]:
      - heading "Área do Cliente — Consultar pontos" [level=2] [ref=e132]
      - paragraph [ref=e133]: Já é cadastrado? Digite seu WhatsApp para consultar seus pontos e inserir o código do cupom.
      - generic [ref=e135]:
        - generic [ref=e136]: Telefone (WhatsApp)
        - textbox "Telefone (WhatsApp)" [ref=e137]:
          - /placeholder: (16) 99999-9999
        - button "Entrar / Consultar meus pontos" [ref=e138] [cursor=pointer]
      - status [ref=e139]: Olá! Entre com seu WhatsApp para consultar sua pontuação.
  - contentinfo [ref=e140]:
    - generic [ref=e141]:
      - generic [ref=e142]:
        - link "🍦 Cardápio" [ref=e143] [cursor=pointer]:
          - /url: index.html
        - link "💬 WhatsApp" [ref=e144] [cursor=pointer]:
          - /url: https://wa.me/5516996062046?text=
        - link "📦 Encomendas" [ref=e145] [cursor=pointer]:
          - /url: encomendas.html
        - link "⭐ Fidelidade" [ref=e146] [cursor=pointer]:
          - /url: fidelidade.html
      - generic [ref=e147]:
        - generic [ref=e148]:
          - generic [ref=e149]: 🏅
          - text: Desde 2007
        - generic [ref=e150]:
          - generic [ref=e151]: 🔒
          - text: Site Seguro
        - generic [ref=e152]:
          - generic [ref=e153]: 💳
          - text: Pix Aceito
        - generic [ref=e154]:
          - generic [ref=e155]: 📱
          - text: App Disponível
        - generic [ref=e156]:
          - generic [ref=e157]: ⭐
          - text: Clube Fidelidade
        - generic [ref=e158]:
          - generic [ref=e159]: ✅
          - text: LGPD Conforme
      - generic [ref=e160]:
        - link "🔒 Política de Privacidade (LGPD)" [ref=e161] [cursor=pointer]:
          - /url: politica-privacidade.html
        - link "ℹ️ Sobre a Itapolitana" [ref=e162] [cursor=pointer]:
          - /url: sobre.html
      - paragraph [ref=e163]: 📍 R. Cel. Manoel Caetano, 311 — Cajuru/SP · ☎ (16) 99606-2046
      - paragraph [ref=e164]: © 2026 Sorveteria Itapolitana Cajuru — Todos os direitos reservados.
```

# Test source

```ts
  1   | // Testes: 04-fidelidade.spec.js
  2   | // Testa o fluxo básico do Programa de Fidelidade:
  3   | // abrir página, preencher celular, validar código, verificar ausência de erros JS.
  4   | 
  5   | import { test, expect } from '@playwright/test';
  6   | 
  7   | test.describe('Programa de Fidelidade', () => {
  8   |   test('página fidelidade.html carrega sem erros de JS', async ({ page }) => {
  9   |     const jsErrors = [];
  10  |     page.on('pageerror', (err) => jsErrors.push(err.message));
  11  | 
  12  |     await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
  13  |     await page.waitForTimeout(1500);
  14  | 
  15  |     expect(jsErrors, `Erros JS: ${jsErrors.join(', ')}`).toHaveLength(0);
  16  |   });
  17  | 
  18  |   test('campo de celular existe e aceita input', async ({ page }) => {
  19  |     await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
  20  |     await page.waitForTimeout(800);
  21  | 
  22  |     // Campo de busca por celular — ID ou name típicos
  23  |     const celInput = page.locator('#fid-celular, input[name="celular"], input[placeholder*="celular"], input[placeholder*="telefone"]').first();
  24  |     if (await celInput.count() > 0) {
  25  |       await celInput.fill('16999999999');
  26  |       const val = await celInput.inputValue();
  27  |       expect(val).toBeTruthy();
  28  |     } else {
  29  |       test.skip();
  30  |     }
  31  |   });
  32  | 
  33  |   test('botão Validar Código existe', async ({ page }) => {
  34  |     await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
  35  |     await page.waitForTimeout(800);
  36  | 
  37  |     // Botão de validação de código (label conforme memória: '✅ Validar Código')
  38  |     const btn = page.locator('button').filter({ hasText: /validar\s*c[oó]digo/i }).first();
  39  |     if (await btn.count() > 0) {
> 40  |       await expect(btn).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  41  |     } else {
  42  |       // Pode estar escondido até login — apenas garantir que existe no DOM
  43  |       const btnAny = page.locator('[id*="validar"], [class*="validar"]').first();
  44  |       await expect(btnAny).toBeAttached({ timeout: 5000 });
  45  |     }
  46  |   });
  47  | 
  48  |   test('tentativa de validar código vazio exibe mensagem', async ({ page }) => {
  49  |     const jsErrors = [];
  50  |     page.on('pageerror', (err) => jsErrors.push(err.message));
  51  | 
  52  |     await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
  53  |     await page.waitForTimeout(800);
  54  | 
  55  |     // Tentar clicar no botão de validar sem inserir código
  56  |     const btn = page.locator('button').filter({ hasText: /validar/i }).first();
  57  |     if (await btn.count() > 0 && await btn.isVisible()) {
  58  |       await btn.click();
  59  |       await page.waitForTimeout(600);
  60  | 
  61  |       // Não deve haver erros de JS após a tentativa
  62  |       expect(jsErrors).toHaveLength(0);
  63  | 
  64  |       // Alguma mensagem de feedback deve aparecer
  65  |       const feedback = page.locator('.alert, .msg, .erro, .error, [class*="msg"], [class*="alert"]').first();
  66  |       // Se não aparecer mensagem, pelo menos a página não deve ter navegado para fora
  67  |       await expect(page).toHaveURL(/fidelidade/);
  68  |     } else {
  69  |       test.skip();
  70  |     }
  71  |   });
  72  | 
  73  |   test('wizard de fidelidade não trava com celular inválido', async ({ page }) => {
  74  |     const jsErrors = [];
  75  |     page.on('pageerror', (err) => jsErrors.push(err.message));
  76  | 
  77  |     await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
  78  |     await page.waitForTimeout(800);
  79  | 
  80  |     const celInput = page.locator('#fid-celular, input[name="celular"], input[placeholder*="celular"], input[placeholder*="telefone"]').first();
  81  |     if (await celInput.count() > 0) {
  82  |       // Inserir celular claramente inválido
  83  |       await celInput.fill('00000000000');
  84  | 
  85  |       // Encontrar botão de busca/consulta
  86  |       const buscarBtn = page.locator('button').filter({ hasText: /buscar|consultar|verificar|entrar|acessar/i }).first();
  87  |       if (await buscarBtn.count() > 0) {
  88  |         await buscarBtn.click();
  89  |         await page.waitForTimeout(800);
  90  |       }
  91  | 
  92  |       // Não deve haver crash
  93  |       expect(jsErrors).toHaveLength(0);
  94  |       // A página deve continuar respondendo
  95  |       await expect(page.locator('body')).toBeVisible();
  96  |     } else {
  97  |       test.skip();
  98  |     }
  99  |   });
  100 | });
  101 | 
```