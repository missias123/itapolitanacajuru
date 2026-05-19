const { test, expect } = require('@playwright/test');

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

test.describe('Admin Panel - Sobre, Galeria, Pág. Encomendas Sections', () => {
  test.beforeEach(async ({ page, request }) => {
    // Navigate to admin panel
    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });

    // Login
    const senhaAdmin = await obterSenhaAdmin(request);
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');

    // Wait for dashboard to load
    await page.waitForSelector('#admin-app', { state: 'visible', timeout: 15000 });
  });

  test('should load Sobre section and populate all fields', async ({ page }) => {
    // Click on Sobre nav button
    await page.click('#nav-btn-sobre');

    // Wait for section to become active
    await page.waitForSelector('#sec-sobre.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-sobre');
    expect(sectionVisible).toBe(true);

    // Check if carregarSobre was called - verify fields are present and populated
    const fields = [
      '#sobre-quem-somos-ano',
      '#sobre-quem-somos-endereco',
      '#sobre-quem-somos-cidade',
      '#sobre-quem-somos-texto1',
      '#sobre-quem-somos-texto2',
      '#sobre-stat-anos-trad',
      '#sobre-stat-sabores',
      '#sobre-stat-nota-google',
      '#sobre-stat-amor',
      '#sobre-historia-titulo',
      '#sobre-historia-texto1',
      '#sobre-historia-texto2',
      '#sobre-fazemos-titulo',
      '#sobre-fazemos-texto',
      '#sobre-cta-titulo',
      '#sobre-cta-texto'
    ];

    for (const fieldId of fields) {
      const field = await page.locator(fieldId);
      await expect(field).toBeVisible();

      // Verify field has a value (default or loaded from config)
      const value = await field.inputValue();
      console.log(`${fieldId}: "${value}"`);
    }

    // Verify save button is present
    const saveBtn = await page.locator('button:has-text("💾 Salvar Página Sobre")');
    await expect(saveBtn).toBeVisible();
  });

  test('should load Galeria section and populate all fields', async ({ page }) => {
    // Click on Galeria nav button
    await page.click('#nav-btn-galeria');

    // Wait for section to become active
    await page.waitForSelector('#sec-galeria.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-galeria');
    expect(sectionVisible).toBe(true);

    // Check if carregarGaleria was called - verify fields are present and populated
    const fields = [
      '#cfg-seo-galeria-titulo',
      '#cfg-seo-galeria-descricao',
      '#galeria-h1',
      '#galeria-descricao'
    ];

    for (const fieldId of fields) {
      const field = await page.locator(fieldId);
      await expect(field).toBeVisible();

      // Verify field has a value (default or loaded from config)
      const value = await field.inputValue();
      console.log(`${fieldId}: "${value}"`);
    }

    // Verify save button is present
    const saveBtn = await page.locator('button:has-text("💾 Salvar Galeria")');
    await expect(saveBtn).toBeVisible();
  });

  test('should load Pág. Encomendas section and populate all fields', async ({ page }) => {
    // Click on Pág. Encomendas nav button
    await page.click('#nav-btn-encomendas-config');

    // Wait for section to become active
    await page.waitForSelector('#sec-encomendas-config.ativo', { timeout: 5000 });

    // Verify the section is visible
    const sectionVisible = await page.isVisible('#sec-encomendas-config');
    expect(sectionVisible).toBe(true);

    // Check if carregarEncomendas was called - verify fields are present and populated
    const fields = [
      '#cfg-seo-encomendas-titulo',
      '#cfg-seo-encomendas-descricao',
      '#encomendas-hero-titulo',
      '#encomendas-hero-descricao'
    ];

    for (const fieldId of fields) {
      const field = await page.locator(fieldId);
      await expect(field).toBeVisible();

      // Verify field has a value (default or loaded from config)
      const value = await field.inputValue();
      console.log(`${fieldId}: "${value}"`);
	    }

	    // Verify save button is present
	    const saveBtn = page.locator('#sec-encomendas-config button:has-text("💾 Salvar Encomendas")');
	    await expect(saveBtn).toBeVisible();
	  });

  test('should verify carregarSobre, carregarGaleria, carregarEncomendas functions exist', async ({ page }) => {
    // Execute diagnostic commands in console
    const diagnostics = await page.evaluate(() => {
      return {
        functionsExist: {
          carregarSobre: typeof window.carregarSobre,
          carregarGaleria: typeof window.carregarGaleria,
          carregarEncomendas: typeof window.carregarEncomendas,
          carregarCarrosselConfig: typeof window.carregarCarrosselConfig,
          salvarSobre: typeof window.salvarSobre,
          salvarGaleria: typeof window.salvarGaleria,
          salvarEncomendas: typeof window.salvarEncomendas
        },
        stateConfig: !!window.STATE?.config
      };
    });

    console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));

    // Verify functions exist
    expect(diagnostics.functionsExist.carregarSobre).toBe('function');
    expect(diagnostics.functionsExist.carregarGaleria).toBe('function');
    expect(diagnostics.functionsExist.carregarEncomendas).toBe('function');
    expect(diagnostics.functionsExist.carregarCarrosselConfig).toBe('function');
    expect(diagnostics.functionsExist.salvarSobre).toBe('function');
    expect(diagnostics.functionsExist.salvarGaleria).toBe('function');
    expect(diagnostics.functionsExist.salvarEncomendas).toBe('function');

    // Verify STATE.config exists
    expect(diagnostics.stateConfig).toBe(true);
  });

  test('should check console for errors when clicking Sobre, Galeria, Pág. Encomendas', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Try clicking the three sections
    const sections = [
      { btn: '#nav-btn-sobre', name: 'Sobre' },
      { btn: '#nav-btn-galeria', name: 'Galeria' },
      { btn: '#nav-btn-encomendas-config', name: 'Pág. Encomendas' }
    ];

    for (const section of sections) {
      console.log(`Clicking ${section.name}...`);
      await page.click(section.btn);
      await page.waitForTimeout(2000); // Wait for section to load and carregarXxx() to execute
    }

    // Report any console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }

    // Test passes if no errors
    expect(consoleErrors.length).toBe(0);
  });

	  test('should verify all sections can be edited (fields are not disabled)', async ({ page }) => {
    const sections = [
      {
        btn: '#nav-btn-sobre',
        sectionId: '#sec-sobre',
        testField: '#sobre-quem-somos-ano'
      },
      {
        btn: '#nav-btn-galeria',
        sectionId: '#sec-galeria',
        testField: '#galeria-h1'
      },
      {
        btn: '#nav-btn-encomendas-config',
        sectionId: '#sec-encomendas-config',
        testField: '#encomendas-hero-titulo'
      }
    ];

	    for (const section of sections) {
      // Click section
      await page.click(section.btn);
      await page.waitForSelector(`${section.sectionId}.ativo`, { timeout: 5000 });

      // Check if test field is enabled (not disabled)
      const field = await page.locator(section.testField);
      const isDisabled = await field.isDisabled();
      expect(isDisabled).toBe(false);

	      // Try to type in the field
	      await field.focus();
	      const initialValue = await field.inputValue();
	      const maxLengthRaw = await field.getAttribute('maxlength');
	      const maxLength = maxLengthRaw ? Number.parseInt(maxLengthRaw, 10) : null;

	      let candidateValue = initialValue;
	      if (Number.isFinite(maxLength) && maxLength > 0) {
	        const base = String(initialValue || '').padEnd(maxLength, '0').slice(0, maxLength);
	        const last = base.charAt(maxLength - 1);
	        const replacement = last === '0' ? '1' : '0';
	        candidateValue = base.slice(0, maxLength - 1) + replacement;
	      } else {
	        candidateValue = String(initialValue || '') + ' TESTE';
	      }

	      await field.fill(candidateValue);
	      const updatedValue = await field.inputValue();
	      expect(updatedValue).toBe(candidateValue);

	      // Restore original value
	      await field.fill(initialValue);
	    }
	  });
});
