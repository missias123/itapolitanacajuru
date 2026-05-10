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
    9 × locator resolved to <button id="btn-registrar-ponto" class="btn btn-sec btn-validar-codigo">✅ Validar Código</button>
      - unexpected value "hidden"

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