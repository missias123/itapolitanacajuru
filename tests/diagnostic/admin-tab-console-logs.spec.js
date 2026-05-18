const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * TESTE DIAGNÓSTICO: Captura detalhada de console logs para debug de visibilidade das abas
 * Este teste simula os passos manuais solicitados e captura TODOS os logs do console
 */
test.describe('Diagnóstico Detalhado - Tab Visibility com Console Logs', () => {
  let allConsoleLogs = [];
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    allConsoleLogs = [];
    consoleErrors = [];

    // Capturar TODOS os logs do console
    page.on('console', msg => {
      const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      allConsoleLogs.push(logEntry);
      console.log(logEntry);
    });

    // Capturar erros específicos
    page.on('pageerror', error => {
      const errorMsg = `[PAGE ERROR] ${error.message}`;
      consoleErrors.push(errorMsg);
      console.error(errorMsg);
    });

    // Navegar para o admin panel
    await page.goto('http://localhost:8080/admin-painel.html', { waitUntil: 'networkidle' });

    // Aguardar a tela de login aparecer
    await page.waitForSelector('#login-screen', { state: 'visible', timeout: 10000 });

    console.log('\n=== FAZENDO LOGIN ===\n');

    // Usar senha hardcoded para teste (ajustar se necessário)
    // Note: Se o teste falhar no login, precisaremos adicionar senhaAdmin ao config.json
    await page.fill('#inp-senha-admin', 'admin123');
    await page.click('#btn-entrar-senha');

    // Aguardar o carregamento do admin ou erro de senha
    try {
      await page.waitForSelector('#admin-app', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000); // Aguardar carregamento completo
      console.log('\n=== LOGIN REALIZADO COM SUCESSO ===\n');
    } catch (e) {
      console.log('\n=== ERRO NO LOGIN - Verifique se senhaAdmin está configurado ===\n');
      console.log('Logs capturados até agora:', allConsoleLogs);
      throw e;
    }
  });

  /**
   * TESTE 1: Aba Fidelidade
   */
  test('Teste 1: Aba Fidelidade - Captura Console Logs', async ({ page }) => {
    console.log('\n\n========================================');
    console.log('=== TESTE: FIDELIDADE ===');
    console.log('========================================\n');

    const logsBeforeClick = allConsoleLogs.length;

    // Clicar no botão Fidelidade
    console.log('Clicando no botão "🎟️ Fidelidade"...');
    await page.click('button:has-text("Fidelidade")');

    // Aguardar 2 segundos conforme solicitado
    await page.waitForTimeout(2000);

    // Capturar screenshot
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/diagnostic-fidelidade.png'),
      fullPage: true
    });

    // Verificar visibilidade
    const secFidelidade = page.locator('#sec-fidelidade');
    const isVisible = await secFidelidade.isVisible();
    const hasActiveClass = await secFidelidade.evaluate(el => el.classList.contains('ativo'));

    console.log('\n=== O QUE VEJO NA TELA (FIDELIDADE) ===');
    console.log(`Seção #sec-fidelidade visível: ${isVisible}`);
    console.log(`Seção #sec-fidelidade tem classe 'ativo': ${hasActiveClass}`);

    // Verificar conteúdo
    const cards = await secFidelidade.locator('.card').count();
    console.log(`Número de cards encontrados: ${cards}`);

    const hasContent = await page.locator('#fid-total').isVisible().catch(() => false);
    console.log(`Elemento #fid-total visível: ${hasContent}`);

    // Imprimir logs capturados DESDE o clique
    console.log('\n=== LOGS DO CONSOLE (FIDELIDADE) ===');
    const newLogs = allConsoleLogs.slice(logsBeforeClick);
    newLogs.forEach(log => console.log(log));

    if (consoleErrors.length > 0) {
      console.log('\n=== ERROS CAPTURADOS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    console.log('\n========================================\n');
  });

  /**
   * TESTE 2: Aba Dicas
   */
  test('Teste 2: Aba Dicas - Captura Console Logs', async ({ page }) => {
    console.log('\n\n========================================');
    console.log('=== TESTE: DICAS ===');
    console.log('========================================\n');

    const logsBeforeClick = allConsoleLogs.length;

    // Clicar no botão Dicas
    console.log('Clicando no botão "⭐ Dicas e Depoimentos"...');
    await page.click('button:has-text("Dicas e Depoimentos")');

    // Aguardar 2 segundos
    await page.waitForTimeout(2000);

    // Capturar screenshot
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/diagnostic-dicas.png'),
      fullPage: true
    });

    // Verificar visibilidade
    const secDepoimentos = page.locator('#sec-depoimentos');
    const isVisible = await secDepoimentos.isVisible();
    const hasActiveClass = await secDepoimentos.evaluate(el => el.classList.contains('ativo'));

    console.log('\n=== O QUE VEJO NA TELA (DICAS) ===');
    console.log(`Seção #sec-depoimentos visível: ${isVisible}`);
    console.log(`Seção #sec-depoimentos tem classe 'ativo': ${hasActiveClass}`);

    // Verificar conteúdo
    const cards = await secDepoimentos.locator('.card').count();
    console.log(`Número de cards encontrados: ${cards}`);

    const hasList = await page.locator('#dep-lista').isVisible().catch(() => false);
    console.log(`Elemento #dep-lista visível: ${hasList}`);

    // Imprimir logs capturados
    console.log('\n=== LOGS DO CONSOLE (DICAS) ===');
    const newLogs = allConsoleLogs.slice(logsBeforeClick);
    newLogs.forEach(log => console.log(log));

    if (consoleErrors.length > 0) {
      console.log('\n=== ERROS CAPTURADOS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    console.log('\n========================================\n');
  });

  /**
   * TESTE 3: Aba Encomendas
   */
  test('Teste 3: Aba Encomendas - Captura Console Logs', async ({ page }) => {
    console.log('\n\n========================================');
    console.log('=== TESTE: ENCOMENDAS ===');
    console.log('========================================\n');

    const logsBeforeClick = allConsoleLogs.length;

    // Clicar no botão Encomendas
    console.log('Clicando no botão "📦 Encomendas"...');
    await page.click('button:has-text("Encomendas")').first();

    // Aguardar 2 segundos
    await page.waitForTimeout(2000);

    // Capturar screenshot
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/diagnostic-encomendas.png'),
      fullPage: true
    });

    // Verificar visibilidade
    const secEncomendas = page.locator('#sec-encomendas');
    const isVisible = await secEncomendas.isVisible();
    const hasActiveClass = await secEncomendas.evaluate(el => el.classList.contains('ativo'));

    console.log('\n=== O QUE VEJO NA TELA (ENCOMENDAS) ===');
    console.log(`Seção #sec-encomendas visível: ${isVisible}`);
    console.log(`Seção #sec-encomendas tem classe 'ativo': ${hasActiveClass}`);

    // Verificar conteúdo
    const cards = await secEncomendas.locator('.card').count();
    console.log(`Número de cards encontrados: ${cards}`);

    const hasList = await page.locator('#enc-lista').isVisible().catch(() => false);
    console.log(`Elemento #enc-lista visível: ${hasList}`);

    // Imprimir logs capturados
    console.log('\n=== LOGS DO CONSOLE (ENCOMENDAS) ===');
    const newLogs = allConsoleLogs.slice(logsBeforeClick);
    newLogs.forEach(log => console.log(log));

    if (consoleErrors.length > 0) {
      console.log('\n=== ERROS CAPTURADOS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    console.log('\n========================================\n');
  });

  /**
   * TESTE 4: Aba Qualidade
   */
  test('Teste 4: Aba Qualidade - Captura Console Logs', async ({ page }) => {
    console.log('\n\n========================================');
    console.log('=== TESTE: QUALIDADE ===');
    console.log('========================================\n');

    const logsBeforeClick = allConsoleLogs.length;

    // Clicar no botão Qualidade
    console.log('Clicando no botão "📊 Qualidade"...');
    await page.click('button:has-text("Qualidade")');

    // Aguardar 2 segundos
    await page.waitForTimeout(2000);

    // Capturar screenshot
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/diagnostic-qualidade.png'),
      fullPage: true
    });

    // Verificar visibilidade
    const secQualidade = page.locator('#sec-qualidade');
    const isVisible = await secQualidade.isVisible();
    const hasActiveClass = await secQualidade.evaluate(el => el.classList.contains('ativo'));

    console.log('\n=== O QUE VEJO NA TELA (QUALIDADE) ===');
    console.log(`Seção #sec-qualidade visível: ${isVisible}`);
    console.log(`Seção #sec-qualidade tem classe 'ativo': ${hasActiveClass}`);

    // Verificar conteúdo
    const cards = await secQualidade.locator('.card').count();
    console.log(`Número de cards encontrados: ${cards}`);

    const hasScore = await page.locator('#adm-score-perf').isVisible().catch(() => false);
    console.log(`Elemento #adm-score-perf visível: ${hasScore}`);

    // Imprimir logs capturados
    console.log('\n=== LOGS DO CONSOLE (QUALIDADE) ===');
    const newLogs = allConsoleLogs.slice(logsBeforeClick);
    newLogs.forEach(log => console.log(log));

    if (consoleErrors.length > 0) {
      console.log('\n=== ERROS CAPTURADOS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    console.log('\n========================================\n');
  });
});
