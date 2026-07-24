const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:8080/admin-painel.html';
const TEST_PASSWORD = process.env.TEST_PASSWORD;

test.describe('Admin Panel - Comprehensive Diagnostic', () => {
  let diagnosticResults = {};

  test('Execute comprehensive diagnostic', async ({ page }) => {
    if (!TEST_PASSWORD) {
      throw new Error('TEST_PASSWORD não configurada. Defina a variável de ambiente para executar este diagnóstico.');
    }

    // Enable console logging
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        consoleErrors.push(text);
      }
      consoleMessages.push({ type, text });
    });

    // Navigate to admin panel
    await page.goto(ADMIN_URL);

    // Login
    await page.fill('#inp-senha', TEST_PASSWORD);
    await page.click('button:has-text("Entrar")');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);

    // Execute comprehensive diagnostic
    const diagnostic = await page.evaluate(() => {
      const results = {};

      // ── 1. VERIFICAR STATE E CONFIG ──────────────────────
      results.stateCheck = {
        stateExists: typeof STATE !== 'undefined',
        configExists: !!STATE?.config,
        configSha: STATE?.configSha || 'AUSENTE',
        fidelidadeExists: !!STATE?.fidelidade,
        encomendasExists: !!STATE?.encomendas,
        promoExists: !!STATE?.promo,
        produtosExists: !!STATE?.produtos
      };

      // ── 2. VERIFICAR CAMPOS DO CONFIG ────────────────────
      results.configFields = {};
      if (STATE?.config) {
        results.configFields = {
          fidelidadeTitulo: STATE.config.fidelidadeTitulo || 'AUSENTE',
          premioMilkshake: STATE.config.premioMilkshake || 'AUSENTE',
          depoimentos: STATE.config.depoimentos?.length || 0,
          encomendasPagina: STATE.config.encomendasPagina || 'AUSENTE',
          dicasPagina: STATE.config.dicasPagina || 'AUSENTE',
          qualidadePagina: STATE.config.qualidadePagina || 'AUSENTE',
          configComplete: STATE.config
        };
      } else {
        results.configFields.error = 'STATE.config está NULL ou UNDEFINED';
      }

      // ── 3. VERIFICAR FUNÇÕES ESSENCIAIS ──────────────────
      results.functions = {
        irPara: typeof irPara,
        preencherFidelidade: typeof preencherFidelidade,
        preencherDepoimentos: typeof preencherDepoimentos,
        renderEncomendas: typeof renderEncomendas,
        atualizarScoresQualidade: typeof atualizarScoresQualidade,
        checkDirty: typeof checkDirty,
        preencherConfig: typeof preencherConfig,
        renderProdutosAdmin: typeof renderProdutosAdmin
      };

      // ── 4. VERIFICAR ELEMENTOS DOM ───────────────────────
      results.domElements = {};
      const secoes = ['fidelidade', 'depoimentos', 'encomendas', 'qualidade', 'produtos'];
      secoes.forEach(id => {
        const el = document.getElementById('sec-' + id);
        const existe = !!el;
        const ativo = el?.classList.contains('ativo');
        results.domElements['sec-' + id] = {
          exists: existe,
          active: ativo,
          display: el ? window.getComputedStyle(el).display : 'N/A'
        };
      });

      // ── 5. VERIFICAR BOTÕES DE NAVEGAÇÃO ─────────────────
      results.navButtons = {};
      const botoes = ['fidelidade', 'dicas', 'encomendas', 'qualidade', 'produtos'];
      botoes.forEach(id => {
        const btn = document.getElementById('nav-btn-' + id);
        results.navButtons['nav-btn-' + id] = {
          exists: !!btn,
          onclick: btn ? (btn.onclick ? 'has onclick' : 'no onclick attribute') : 'N/A'
        };
      });

      // ── 7. ESTADO adminDirty ──────────────────────────────
      results.dirtyState = {
        adminDirty: typeof adminDirty !== 'undefined' ? adminDirty : 'UNDEFINED'
      };

      return results;
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DIAGNOSTIC RESULTS - ADMIN PANEL');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('[1] STATE AND CONFIG CHECK:');
    console.log(JSON.stringify(diagnostic.stateCheck, null, 2));

    console.log('\n[2] CONFIG FIELDS:');
    console.log(JSON.stringify(diagnostic.configFields, null, 2));

    console.log('\n[3] FUNCTIONS:');
    console.log(JSON.stringify(diagnostic.functions, null, 2));

    console.log('\n[4] DOM ELEMENTS:');
    console.log(JSON.stringify(diagnostic.domElements, null, 2));

    console.log('\n[5] NAV BUTTONS:');
    console.log(JSON.stringify(diagnostic.navButtons, null, 2));

    console.log('\n[7] DIRTY STATE:');
    console.log(JSON.stringify(diagnostic.dirtyState, null, 2));

    if (consoleErrors.length > 0) {
      console.log('\n[CONSOLE ERRORS DETECTED]:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    // ── 6. TESTE MANUAL DE NAVEGAÇÃO ─────────────────────
    console.log('\n[6] NAVIGATION TESTS:');

    const navigationTests = [
      { name: 'Fidelidade', btnId: 'nav-btn-fidelidade', sectionId: 'sec-fidelidade' },
      { name: 'Dicas', btnId: 'nav-btn-dicas', sectionId: 'sec-depoimentos' },
      { name: 'Encomendas', btnId: 'nav-btn-encomendas', sectionId: 'sec-encomendas' },
      { name: 'Qualidade', btnId: 'nav-btn-qualidade', sectionId: 'sec-qualidade' },
      { name: 'Produtos', btnId: 'nav-btn-produtos', sectionId: 'sec-produtos' }
    ];

    for (const navTest of navigationTests) {
      console.log(`\nTesting ${navTest.name}...`);

      const result = await page.evaluate((test) => {
        const btn = document.getElementById(test.btnId);
        if (!btn) {
          return { success: false, error: `Button ${test.btnId} not found` };
        }

        // Clear any previous active sections
        document.querySelectorAll('.seção').forEach(s => s.classList.remove('ativo'));

        // Click the button
        try {
          btn.click();
        } catch (e) {
          return { success: false, error: `Click failed: ${e.message}` };
        }

        // Check if section became active
        setTimeout(() => {}, 500);

        const section = document.getElementById(test.sectionId);
        if (!section) {
          return { success: false, error: `Section ${test.sectionId} not found` };
        }

        const isActive = section.classList.contains('ativo');
        const display = window.getComputedStyle(section).display;

        return {
          success: isActive && display !== 'none',
          isActive,
          display,
          error: null
        };
      }, navTest);

      console.log(`  Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log(`  Active: ${result.isActive}, Display: ${result.display}`);

      await page.waitForTimeout(500);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('END OF DIAGNOSTIC');
    console.log('═══════════════════════════════════════════════════════\n');

    // Assertions for test framework
    expect(diagnostic.stateCheck.stateExists).toBe(true);
    expect(diagnostic.stateCheck.configExists).toBe(true);
    expect(diagnostic.functions.irPara).toBe('function');
    expect(diagnostic.functions.preencherFidelidade).toBe('function');
    expect(diagnostic.functions.preencherDepoimentos).toBe('function');
    expect(diagnostic.functions.renderEncomendas).toBe('function');

    diagnosticResults = diagnostic;
  });
});
