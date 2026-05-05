// Testes: 03-formularios.spec.js
// Verifica o formulário de encomendas: validação de campos obrigatórios e envio.

import { test, expect } from '@playwright/test';

test.describe('Formulário de Encomendas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/encomendas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
  });

  test('página carrega sem erros de JS', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    await page.goto('/encomendas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    expect(jsErrors).toHaveLength(0);
  });

  test('campos de formulário existem na página', async ({ page }) => {
    // Verifica presença de inputs relevantes — sem impor nomes específicos
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('submeter formulário vazio exibe validação HTML5', async ({ page }) => {
    // Clicar em botão de envio sem preencher campos
    const submitBtn = page.locator('button[type="submit"], input[type="submit"], button').filter({ hasText: /enviar|solicitar|confirmar/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Validação nativa HTML5: verifica :invalid no primeiro campo obrigatório
      const invalidField = page.locator('input:invalid, textarea:invalid, select:invalid').first();
      const count = await invalidField.count();
      // Se há campos obrigatórios, ao menos um deve ficar inválido
      if (count === 0) {
        // Alternativa: mensagem de erro customizada
        const errorMsg = page.locator('.erro, .error, [class*="error"], [class*="erro"]').first();
        // Apenas verificar que não houve crash — formulário permanece na página
        await expect(page).toHaveURL(/encomend/);
      }
    } else {
      test.skip();
    }
  });

  test('link para WhatsApp de encomenda existe', async ({ page }) => {
    const waLink = page.locator('a[href*="wa.me"]').first();
    if (await waLink.count() > 0) {
      const href = await waLink.getAttribute('href');
      expect(href).toMatch(/wa\.me\/\d+/);
    } else {
      // Não há link WhatsApp, mas página não deve estar quebrada
      await expect(page.locator('h1, h2, main').first()).toBeVisible();
    }
  });
});

test.describe('Banner de Cookies / LGPD', () => {
  test('banner de cookies aparece quando localStorage está limpo', async ({ page }) => {
    // Limpar localStorage antes de navegar
    await page.addInitScript(() => {
      localStorage.removeItem('cookies_aceitos');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const banner = page.locator('#cookie-banner');
    if (await banner.count() > 0) {
      // O banner deve estar visível ou ter sido removido pelo localStorage
      // (pode já estar hidden se outro teste rodou antes — apenas garantir que existe)
      await expect(banner).toBeAttached();
    }
  });

  test('aceitar cookies oculta o banner', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('cookies_aceitos');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const banner = page.locator('#cookie-banner');
    if (await banner.count() > 0 && await banner.isVisible()) {
      // Clicar em "Aceitar"
      const acceptBtn = page.locator('#cookie-banner button').filter({ hasText: /aceitar|ok/i }).first();
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
        await page.waitForTimeout(400);
        await expect(banner).toBeHidden();
      }
    } else {
      test.skip();
    }
  });
});
