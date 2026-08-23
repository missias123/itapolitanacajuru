const { test, expect } = require('@playwright/test');

test.describe('Admin catálogo - edição manual', () => {
  test('marca o produto como esgotado automaticamente ao editar', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('itap_github_token', 'ghp_' + 'a'.repeat(36));
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
    await expect(page.locator('#pending')).toContainText('alteração');
    await expect(page.locator('#save')).toBeEnabled();
    await expect(page.locator('#notice')).toContainText('marcado como esgotado automaticamente');
  });

  test('permite esgotar e reativar manualmente no catálogo antes de salvar', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('itap_github_token', 'ghp_' + 'a'.repeat(36));
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
    await expect(page.locator('#pending')).toContainText('alteração');
  });
});
