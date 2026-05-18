import { test, expect } from '@playwright/test';

async function obterSenhaAdmin(request) {
  const [cfgResp, authResp] = await Promise.all([
    request.get('/dados/config.json'),
    request.get('/dados/auth.json')
  ]);
  expect(cfgResp.ok()).toBeTruthy();
  expect(authResp.ok()).toBeTruthy();
  const cfg = await cfgResp.json();
  const auth = await authResp.json();
  return String(auth.senhaAdmin || cfg.senhaAdmin || '');
}

test.describe('Admin Painel — Login e Editabilidade', () => {
  test('login humano abre seção editável com dados carregados', async ({ page, request }) => {
    const senhaAdmin = await obterSenhaAdmin(request);

    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');

    await expect(page.locator('#admin-app')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/);
    await expect(page.locator('#home-titulo')).toBeVisible();
    await expect(page.locator('#home-titulo')).not.toHaveValue('');
  });

  test('salvar sem PAT mostra feedback visual de modo somente leitura', async ({ page, request }) => {
    const senhaAdmin = await obterSenhaAdmin(request);

    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/, { timeout: 15000 });

    await page.click('button:has-text("Salvar Página Inicial")');
    await expect(page.locator('#toast')).toContainText('Modo somente leitura');
  });
});
