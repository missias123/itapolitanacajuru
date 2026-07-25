import { test, expect } from '@playwright/test';

function obterSenhaAdminTeste() {
  const senha = String(process.env.TEST_PASSWORD || '').trim();
  if (!senha) {
    throw new Error('TEST_PASSWORD não configurada. Defina uma credencial de staging segura para executar o teste do admin.');
  }
  return senha;
}

test.describe('Admin Painel — Login e Editabilidade', () => {
  test('login humano abre seção editável com dados carregados', async ({ page }) => {
    const senhaAdmin = obterSenhaAdminTeste();

    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');

    await expect(page.locator('#admin-app')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/);
    await expect(page.locator('#home-titulo')).toBeVisible();
    await expect(page.locator('#home-titulo')).not.toHaveValue('');
  });

  test('salvar sem PAT mostra feedback visual de modo somente leitura', async ({ page }) => {
    const senhaAdmin = obterSenhaAdminTeste();

    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/, { timeout: 15000 });

    await page.click('button:has-text("Salvar Página Inicial")');
    await expect(page.locator('#toast')).toContainText('Modo somente leitura');
  });
});
