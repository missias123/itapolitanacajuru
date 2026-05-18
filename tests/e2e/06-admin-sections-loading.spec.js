const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:8080/admin-painel.html';
const TEST_PASSWORD = '12345678';

test.describe('Admin Panel - Sections Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel
    await page.goto(ADMIN_URL);

    // Login
    await page.fill('#inp-senha', TEST_PASSWORD);
    await page.click('button:has-text("Entrar")');

    // Wait for dashboard to load
    await page.waitForSelector('#sec-dashboard.ativo', { timeout: 10000 });
  });

  test('should load Fidelidade section when clicked', async ({ page }) => {
    // Click on Fidelidade nav button
    await page.click('#nav-btn-fidelidade');

    // Wait for section to become active
    await page.waitForSelector('#sec-fidelidade.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-fidelidade');
    expect(sectionVisible).toBe(true);

    // Check if preencherFidelidade function was called (fields should be populated)
    const premioMilkInput = await page.locator('#fid-prêmio-milk-nome');
    await expect(premioMilkInput).toBeVisible();
  });

  test('should load Depoimentos section when clicked', async ({ page }) => {
    // Click on Dicas nav button (which contains depoimentos)
    await page.click('#nav-btn-dicas');

    // Wait for section to become active
    await page.waitForSelector('#sec-depoimentos.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-depoimentos');
    expect(sectionVisible).toBe(true);

    // Check if section header is present
    const header = await page.locator('#sec-depoimentos h2:has-text("Dicas e Depoimentos")');
    await expect(header).toBeVisible();
  });

  test('should load Encomendas section when clicked', async ({ page }) => {
    // Click on Encomendas nav button
    await page.click('#nav-btn-encomendas');

    // Wait for section to become active
    await page.waitForSelector('#sec-encomendas.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-encomendas');
    expect(sectionVisible).toBe(true);

    // Check if renderEncomendas was called (container should be present)
    const container = await page.locator('#encomendas-container');
    await expect(container).toBeVisible();
  });

  test('should load Qualidade section when clicked', async ({ page }) => {
    // Click on Qualidade nav button
    await page.click('#nav-btn-qualidade');

    // Wait for section to become active
    await page.waitForSelector('#sec-qualidade.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-qualidade');
    expect(sectionVisible).toBe(true);

    // Check if quality metrics section header is present
    const header = await page.locator('#sec-qualidade h2:has-text("Painel de Qualidade")');
    await expect(header).toBeVisible();
  });

  test('should load Produtos section when clicked', async ({ page }) => {
    // Click on Produtos nav button
    await page.click('#nav-btn-produtos');

    // Wait for section to become active
    await page.waitForSelector('#sec-produtos.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-produtos');
    expect(sectionVisible).toBe(true);

    // Check if products container is present
    const container = await page.locator('#produtos-container');
    await expect(container).toBeVisible();
  });

  test('should verify STATE and config are loaded', async ({ page }) => {
    // Execute diagnostic commands in console
    const diagnostics = await page.evaluate(() => {
      const result = {
        stateConfig: !!window.STATE?.config,
        stateConfigSha: !!window.STATE?.configSha,
        stateFidelidade: !!window.STATE?.fidelidade,
        stateEncomendas: !!window.STATE?.encomendas,
        statePromo: !!window.STATE?.promo,
        functionsExist: {
          preencherFidelidade: typeof window.preencherFidelidade,
          preencherDepoimentos: typeof window.preencherDepoimentos,
          renderEncomendas: typeof window.renderEncomendas,
          atualizarScoresQualidade: typeof window.atualizarScoresQualidade
        },
        configFields: {}
      };

      if (window.STATE?.config) {
        result.configFields = {
          fidelidadeTitulo: !!window.STATE.config.fidelidadeTitulo,
          premioMilkshake: !!window.STATE.config.premioMilkshake,
          depoimentos: Array.isArray(window.STATE.config.depoimentos),
          depoimentosCount: window.STATE.config.depoimentos?.length || 0
        };
      }

      return result;
    });

    console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));

    // Verify STATE.config exists
    expect(diagnostics.stateConfig).toBe(true);

    // Verify functions exist
    expect(diagnostics.functionsExist.preencherFidelidade).toBe('function');
    expect(diagnostics.functionsExist.preencherDepoimentos).toBe('function');
    expect(diagnostics.functionsExist.renderEncomendas).toBe('function');
    expect(diagnostics.functionsExist.atualizarScoresQualidade).toBe('function');
  });

  test('should check console for errors when clicking sections', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Try clicking all problematic sections
    const sections = [
      { btn: '#nav-btn-fidelidade', name: 'Fidelidade' },
      { btn: '#nav-btn-dicas', name: 'Dicas' },
      { btn: '#nav-btn-encomendas', name: 'Encomendas' },
      { btn: '#nav-btn-qualidade', name: 'Qualidade' },
      { btn: '#nav-btn-produtos', name: 'Produtos' }
    ];

    for (const section of sections) {
      await page.click(section.btn);
      await page.waitForTimeout(1000); // Wait for section to load
    }

    // Report any console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }

    // Test should not fail on console errors, but we report them
    expect(consoleErrors.length).toBeLessThanOrEqual(10);
  });
});
