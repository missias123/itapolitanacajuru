const { test, expect } = require('@playwright/test');

test.describe('Admin catálogo - edição manual', () => {
  test('marca o produto como esgotado automaticamente ao editar', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('itap_worker_session_token', 'sessao-admin-teste');
    });

    await page.goto('/admin-catalogo.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#notice')).toContainText('Base única carregada');
    await expect(page.locator('#skuTotal')).toContainText('SKU(s) oficiais no catálogo');

    const row = page.locator('#productsPanel tr[data-key]').first();
    await expect(row.locator('.sku-linked-badge')).toContainText('SKU');
    const nome = row.locator('input[data-field="nome"]');
    const valorOriginal = await nome.inputValue();

    await nome.fill(`${valorOriginal} teste`);

    await expect(row.locator('label.status')).toContainText('Esgotado');
    await expect(row.locator('input[data-field="ativo"]')).not.toBeChecked();
    await expect(row.locator('[data-availability-action]')).toContainText('Voltar ao site');
    await expect(page.locator('#pending')).toContainText('alteração');
    await expect(page.locator('#save')).toBeEnabled();
    await expect(page.locator('#notice')).toContainText('marcado como esgotado automaticamente');
  });

  test('permite esgotar e reativar manualmente no catálogo antes de salvar', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('itap_worker_session_token', 'sessao-admin-teste');
    });

    await page.goto('/admin-catalogo.html', { waitUntil: 'domcontentloaded' });
    const row = page.locator('#productsPanel tr[data-key]').first();
    const actionButton = row.locator('[data-availability-action]').first();

    await expect(actionButton).toContainText('Esgotar manualmente');
    await actionButton.click();
    await page.click('#confirmAvailability');

    await expect(row.locator('label.status')).toContainText('Esgotado');
    await expect(row.locator('[data-availability-action]')).toContainText('Voltar ao site');

    await row.locator('[data-availability-action]').click();
    await page.click('#confirmAvailability');

    await expect(row.locator('label.status')).toContainText('Disponível');
    await expect(row.locator('[data-availability-action]')).toContainText('Esgotar manualmente');
    await row.locator('[data-availability-action]').click();
    await page.click('#confirmAvailability');

    await expect(row.locator('label.status')).toContainText('Esgotado');
    await expect(page.locator('#pending')).toContainText('3 alteração');
  });

  test('salva pelo Worker com token de sessão e mantém a sessão ativa', async ({ page }) => {
    let requestHeaders;
    let requestBody;

    await page.route('https://api.itapolitanacajuru.com.br/api/admin/github-file', async (route) => {
      requestHeaders = route.request().headers();
      requestBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, revision: 'sha-novo' }),
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('itap_worker_session_token', 'sessao-admin-teste');
    });

    await page.goto('/admin-catalogo.html', { waitUntil: 'domcontentloaded' });
    const row = page.locator('#productsPanel tr[data-key]').first();
    const nome = row.locator('input[data-field="nome"]');
    const valorOriginal = await nome.inputValue();
    await nome.fill(`${valorOriginal} teste`);
    await page.click('#save');

    await expect(page.locator('#notice')).toContainText('Site atualizado. A base única foi enviada pelo Worker seguro');
    await expect(page.locator('#pending')).toBeEmpty();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('itap_worker_session_token'))).toBe('sessao-admin-teste');
    expect(requestHeaders['x-itap-session-token']).toBe('sessao-admin-teste');
    expect(requestBody.path).toBe('dados/produtos.json');
    expect(requestBody.content).toBeTruthy();
  });

  test('limpa a sessão local e pede novo login quando o Worker retorna 401', async ({ page }) => {
    await page.route('https://api.itapolitanacajuru.com.br/api/admin/github-file', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Sessão expirada' }),
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('itap_worker_session_token', 'sessao-expirada');
    });

    await page.goto('/admin-catalogo.html', { waitUntil: 'domcontentloaded' });
    const row = page.locator('#productsPanel tr[data-key]').first();
    const nome = row.locator('input[data-field="nome"]');
    const valorOriginal = await nome.inputValue();
    await nome.fill(`${valorOriginal} teste`);
    await page.click('#save');

    await expect(page.locator('#notice')).toContainText('Sua sessão administrativa não está mais autorizada');
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('itap_worker_session_token'))).toBeNull();
    await expect(page.locator('#save')).toBeEnabled();
    await page.click('#tokenBtn');
    await expect(page.locator('#sessionDescription')).toContainText('faça login no admin-painel.html');
  });
});
