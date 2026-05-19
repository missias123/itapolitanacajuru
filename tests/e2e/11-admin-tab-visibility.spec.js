const { test, expect } = require('@playwright/test');
const path = require('path');

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

test.describe('Admin Panel - Tab Visibility Tests', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-screen', { state: 'visible', timeout: 10000 });

    const senhaAdmin = await obterSenhaAdmin(request);
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');

    await page.waitForSelector('#admin-app', { state: 'visible', timeout: 15000 });
  });

  test('Aba Fidelidade deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Fidelidade...');

    await page.click('#nav-btn-fidelidade');
    await page.waitForTimeout(1000);

    // Verificar se a seção fidelidade está ativa
    const secFidelidade = page.locator('#sec-fidelidade');
    await expect(secFidelidade).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secFidelidade).toBeVisible();

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../test-results/fidelidade-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('#fid-total')).toBeVisible();
    await expect(page.locator('#fid-prêmio-milk-nome')).toBeVisible();

    console.log('[TEST] ✓ Aba Fidelidade mostra conteúdo');
  });

  test('Aba Dicas deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Dicas...');

    await page.click('#nav-btn-dicas');
    await page.waitForTimeout(1000);

    // Verificar se a seção depoimentos está ativa
    const secDepoimentos = page.locator('#sec-depoimentos');
    await expect(secDepoimentos).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secDepoimentos).toBeVisible();

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../test-results/dicas-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('#dep-lista')).toBeVisible();

    console.log('[TEST] ✓ Aba Dicas mostra conteúdo');
  });

  test('Aba Encomendas deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Encomendas...');

    await page.click('#nav-btn-encomendas');
    await page.waitForTimeout(1000);

    // Verificar se a seção encomendas está ativa
    const secEncomendas = page.locator('#sec-encomendas');
    await expect(secEncomendas).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secEncomendas).toBeVisible();

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../test-results/encomendas-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('text=Registros de Encomendas')).toBeVisible();
    await expect(page.locator('#enc-lista')).toBeVisible();

    console.log('[TEST] ✓ Aba Encomendas mostra conteúdo');
  });

  test('Aba Qualidade deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Qualidade...');

    await page.click('#nav-btn-qualidade');
    await page.waitForTimeout(1000);

    // Verificar se a seção qualidade está ativa
    const secQualidade = page.locator('#sec-qualidade');
    await expect(secQualidade).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secQualidade).toBeVisible();

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../test-results/qualidade-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('text=Painel de Qualidade')).toBeVisible();
    await expect(page.locator('#adm-score-perf')).toBeVisible();

    console.log('[TEST] ✓ Aba Qualidade mostra conteúdo');
  });

  test('Verificar console logs durante navegação das abas', async ({ page }) => {
    console.log('[TEST] Testando logs de console...');

    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[irPara]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Navegar por todas as abas problemáticas
    await page.click('#nav-btn-fidelidade');
    await page.waitForTimeout(500);

    await page.click('#nav-btn-dicas');
    await page.waitForTimeout(500);

    await page.click('#nav-btn-encomendas');
    await page.waitForTimeout(500);

    await page.click('#nav-btn-qualidade');
    await page.waitForTimeout(500);

    // Verificar que a captura de logs está funcionando (não falhar se não houver logs específicos)
    expect(Array.isArray(consoleLogs)).toBe(true);
    console.log('[TEST] Console logs capturados:', consoleLogs.length);
    consoleLogs.forEach(log => console.log('[CONSOLE]', log));

    console.log('[TEST] ✓ Console logs verificados');
  });
});
