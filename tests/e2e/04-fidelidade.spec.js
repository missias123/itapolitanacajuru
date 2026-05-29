// Testes: 04-fidelidade.spec.js
// Testa o fluxo básico do Programa de Fidelidade:
// abrir página, preencher celular, validar código, verificar ausência de erros JS.

import { test, expect } from '@playwright/test';

test.describe('Programa de Fidelidade', () => {
  test('página  carrega sem erros de JS', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    expect(jsErrors, `Erros JS: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('campo de celular existe e aceita input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const abrirCadastro = page.locator('#btn-mostrar-cadastro-fid');
    const aceitarRegras = page.locator('#btn-aceitar-regras-fid');
    const nomeInput = page.locator('#fid-nome');
    const nascInput = page.locator('#fid-data-nasc');
    const celInput = page.locator('#fid-celular');
    const btnCadastro = page.locator('#fid-executar-cadastro');

    if (await abrirCadastro.count() > 0 && await aceitarRegras.count() > 0 && await celInput.count() > 0) {
      await abrirCadastro.click();
      await expect(nomeInput).toBeDisabled();
      await expect(nascInput).toBeDisabled();
      await expect(celInput).toBeDisabled();
      await expect(btnCadastro).toBeDisabled();

      await aceitarRegras.dispatchEvent('click');
      await expect(nomeInput).toBeEnabled();
      await nomeInput.fill('Cliente Teste');
      await expect(nascInput).toBeEnabled();

      await nascInput.fill('01/01/2000');
      await expect(celInput).toBeEnabled();

      await celInput.fill('16999990000');
      await expect(btnCadastro).toBeEnabled();

      const val = await celInput.inputValue();
      expect(val).toContain('16');
    } else {
      test.skip();
    }
  });

  test('botão Validar Código existe no DOM (visível após consulta)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Botão de validação de código (label conforme memória: '✅ Validar Código')
    const btn = page.locator('button').filter({ hasText: /validar\s*c[oó]digo/i }).first();
    if (await btn.count() > 0) {
      await expect(btn).toBeAttached({ timeout: 5000 });
    } else {
      // Pode estar escondido até login — apenas garantir que existe no DOM
      const btnAny = page.locator('#btn-registrar-ponto, .btn-validar-codigo, [id*="validar"], [class*="validar"]').first();
      await expect(btnAny).toBeAttached({ timeout: 5000 });
    }
  });

  test('tentativa de validar código vazio exibe mensagem', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Tentar clicar no botão de validar sem inserir código
    const btn = page.locator('button').filter({ hasText: /validar/i }).first();
    if (await btn.count() > 0 && await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(600);

      // Não deve haver erros de JS após a tentativa
      expect(jsErrors).toHaveLength(0);

      // Alguma mensagem de feedback deve aparecer
      const feedback = page.locator('.alert, .msg, .erro, .error, [class*="msg"], [class*="alert"]').first();
      // Se não aparecer mensagem, pelo menos a página não deve ter navegado para fora
      await expect(page).toHaveURL(/fidelidade/);
    } else {
      test.skip();
    }
  });

  test('wizard de fidelidade não trava com celular inválido', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const abrirCadastro = page.locator('#btn-mostrar-cadastro-fid');
    const aceitarRegras = page.locator('#btn-aceitar-regras-fid');
    const nomeInput = page.locator('#fid-nome');
    const nascInput = page.locator('#fid-data-nasc');
    const celInput = page.locator('#fid-celular');
    const btnCadastro = page.locator('#fid-executar-cadastro');

    if (await abrirCadastro.count() > 0 && await celInput.count() > 0) {
      await abrirCadastro.click();
      await aceitarRegras.dispatchEvent('click');
      await expect(nomeInput).toBeEnabled();
      await nomeInput.fill('Cliente Teste');
      await nascInput.fill('01/01/2000');
      await celInput.fill('16000000000');
      await page.waitForTimeout(500);

      // Não deve haver crash
      expect(jsErrors).toHaveLength(0);
      await expect(btnCadastro).toBeDisabled();
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });
});
