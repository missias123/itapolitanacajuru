const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Admin Panel - Tab Visibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o admin panel
    await page.goto('http://localhost:8080/admin-painel.html');

    // Aguardar a tela de login aparecer
    await page.waitForSelector('#login-screen', { state: 'visible', timeout: 10000 });

    // Preencher senha (usando a senha padrão de teste)
    await page.fill('#inp-senha-admin', 'admin123');
    await page.click('#btn-entrar-senha');

    // Aguardar o carregamento dos dados
    await page.waitForSelector('#admin-app', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(3000); // Aguardar carregamento completo dos dados
  });

  test('Aba Fidelidade deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Fidelidade...');

    // Clicar no botão Fidelidade no dashboard
    await page.click('button:has-text("Fidelidade")');
    await page.waitForTimeout(1000);

    // Verificar se a seção fidelidade está ativa
    const secFidelidade = page.locator('#sec-fidelidade');
    await expect(secFidelidade).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secFidelidade).toBeVisible();

    // Verificar se há conteúdo dentro da seção
    const cards = secFidelidade.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/fidelidade-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('#fid-total')).toBeVisible();
    await expect(page.locator('text=Configuração dos Prêmios')).toBeVisible();

    console.log('[TEST] ✓ Aba Fidelidade mostra conteúdo');
  });

  test('Aba Dicas deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Dicas...');

    // Clicar no botão Dicas no dashboard
    await page.click('button:has-text("Dicas e Depoimentos")');
    await page.waitForTimeout(1000);

    // Verificar se a seção depoimentos está ativa
    const secDepoimentos = page.locator('#sec-depoimentos');
    await expect(secDepoimentos).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secDepoimentos).toBeVisible();

    // Verificar se há conteúdo dentro da seção
    const cards = secDepoimentos.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/dicas-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('text=Dicas e Depoimentos')).toBeVisible();
    await expect(page.locator('#dep-lista')).toBeVisible();

    console.log('[TEST] ✓ Aba Dicas mostra conteúdo');
  });

  test('Aba Encomendas deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Encomendas...');

    // Clicar no botão Encomendas no dashboard
    await page.click('button:has-text("Encomendas"):first');
    await page.waitForTimeout(1000);

    // Verificar se a seção encomendas está ativa
    const secEncomendas = page.locator('#sec-encomendas');
    await expect(secEncomendas).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secEncomendas).toBeVisible();

    // Verificar se há conteúdo dentro da seção
    const cards = secEncomendas.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/encomendas-tab.png'),
      fullPage: true
    });

    // Verificar elementos específicos estão visíveis
    await expect(page.locator('text=Registros de Encomendas')).toBeVisible();
    await expect(page.locator('#enc-lista')).toBeVisible();

    console.log('[TEST] ✓ Aba Encomendas mostra conteúdo');
  });

  test('Aba Qualidade deve mostrar conteúdo visível', async ({ page }) => {
    console.log('[TEST] Testando aba Qualidade...');

    // Clicar no botão Qualidade no dashboard
    await page.click('button:has-text("Qualidade")');
    await page.waitForTimeout(1000);

    // Verificar se a seção qualidade está ativa
    const secQualidade = page.locator('#sec-qualidade');
    await expect(secQualidade).toHaveClass(/ativo/);

    // Verificar se o elemento está visível
    await expect(secQualidade).toBeVisible();

    // Verificar se há conteúdo dentro da seção
    const cards = secQualidade.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Tirar screenshot para evidência
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/qualidade-tab.png'),
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
    await page.click('button:has-text("Fidelidade")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Dicas e Depoimentos")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Encomendas"):first');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Qualidade")');
    await page.waitForTimeout(500);

    // Verificar que os logs foram capturados
    expect(consoleLogs.length).toBeGreaterThan(0);
    console.log('[TEST] Console logs capturados:', consoleLogs.length);
    consoleLogs.forEach(log => console.log('[CONSOLE]', log));

    console.log('[TEST] ✓ Console logs verificados');
  });
});
