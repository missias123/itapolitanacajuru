const { test, expect } = require('@playwright/test');

test.describe('Admin catálogo - edição manual', () => {
  test('marca o produto como esgotado automaticamente ao editar', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('itap_github_token', 'ghp_' + 'a'.repeat(36));
    });

    await page.goto('/admin-catalogo.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#notice')).toContainText('Base única carregada');

    const row = page.locator('#productsPanel tr[data-key]').first();
    const nome = row.locator('input[data-field="nome"]');
    const valorOriginal = await nome.inputValue();

    await nome.fill(`${valorOriginal} teste`);

    await expect(row.locator('label.status')).toContainText('Esgotado');
    await expect(row.locator('input[data-field="ativo"]')).not.toBeChecked();
    await expect(page.locator('#pending')).toContainText('alteração');
    await expect(page.locator('#save')).toBeEnabled();
    await expect(page.locator('#notice')).toContainText('marcado como esgotado automaticamente');
  });
});
