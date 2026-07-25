import { test, expect } from '@playwright/test';

const API_URL = '**/api/promocao/cadastro';

async function abrirFormularioPromo(page) {
  await page.goto('/promocao.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.ITAP_WORKER_API = window.location.origin;
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {});
    }
  });
  await page.locator('#btn-quero-participar-principal').click();
  await page.locator('label[for="aceite-sorteio-inline"]').click();
  await page.locator('#btn-aceitar-sorteio-inline').click();
  await expect(page.locator('#form-promocao-cliente')).toBeVisible();
}

async function preencherDados(page) {
  await page.locator('#promo-nome-cliente').fill('USUARIO TESTE PROMOCAO');
  await page.locator('#promo-data-nasc-cliente').fill('01/01/1990');
  await page.locator('#promo-celular-cliente').fill('(16) 90000-0000');
}

test.describe('Promoção — cadastro', () => {
  test('envia payload esperado e evita duplo clique', async ({ page }) => {
    let requests = 0;
    let capturedBody = null;
    await page.route(API_URL, async route => {
      requests += 1;
      capturedBody = route.request().postDataJSON();
      await new Promise(resolve => setTimeout(resolve, 350));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'PROMO_REGISTRATION_CREATED',
          requestId: 'req-test-1',
          registrationId: 'SRT-2026-0001-ABCD'
        })
      });
    });

    await abrirFormularioPromo(page);
    await preencherDados(page);

    await page.locator('#promo-enviar-cadastro').dblclick();
    await expect(page.locator('#promo-enviar-cadastro')).toBeDisabled();
    await expect(page.locator('#promo-feedback-message')).toContainText('Cadastro realizado com sucesso', { timeout: 5000 });

    expect(requests).toBe(1);
    expect(capturedBody).toMatchObject({
      name: 'USUARIO TESTE PROMOCAO',
      birthdate: '1990-01-01',
      phone: '16900000000',
      regulation_accept: true
    });
    expect(capturedBody.idempotencyKey).toMatch(/^promo-/);
  });

  test('reaproveita idempotency key no retry após erro 503', async ({ page }) => {
    let attempt = 0;
    const idempotencyKeys = [];

    await page.route(API_URL, async route => {
      attempt += 1;
      idempotencyKeys.push(route.request().headers()['x-idempotency-key']);
      if (attempt === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, code: 'PROMO_TEMPORARY_UNAVAILABLE', requestId: 'req-503' })
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, code: 'PROMO_REGISTRATION_CREATED', requestId: 'req-ok', registrationId: 'SRT-2026-0002-ABCD' })
      });
    });

    await abrirFormularioPromo(page);
    await preencherDados(page);

    await page.locator('#promo-enviar-cadastro').click();
    await expect(page.locator('#promo-feedback-message')).toContainText('não foi concluído', { timeout: 5000 });

    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.locator('#promo-feedback-message')).toContainText('Cadastro realizado com sucesso', { timeout: 5000 });

    expect(attempt).toBe(2);
    expect(idempotencyKeys[0]).toBeTruthy();
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
  });

  test('mostra mensagem específica para duplicidade (409)', async ({ page }) => {
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'PROMO_REGISTRATION_EXISTS',
          requestId: 'req-dup-1'
        })
      });
    });

    await abrirFormularioPromo(page);
    await preencherDados(page);
    await page.locator('#promo-enviar-cadastro').click();

    await expect(page.locator('#promo-feedback-message')).toContainText('já possui um cadastro', { timeout: 5000 });
  });
});
