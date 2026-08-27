import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const base = process.env.BASE_URL || 'http://127.0.0.1:8135';
const viewports = [320, 390, 768, 1280];
const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const requests = [];
let workerMode = 'ok';

const workerPayload = {
  ok: true,
  generatedAt: '2026-08-27T00:00:00.000Z',
  domains: [
    { domain: 'catalog', sourceOfTruth: 'dados/produtos.json', writePath: 'admin_authenticated_github', state: 'source_available' },
    { domain: 'editorial_config', sourceOfTruth: 'dados/config.json', writePath: 'admin_authenticated_github', state: 'source_available' },
    { domain: 'orders', sourceOfTruth: 'worker.ENCOMENDAS_KV', writePath: 'public_form_to_worker', state: 'source_available' },
    { domain: 'campaign_picole', sourceOfTruth: 'worker.PROMO_KV', writePath: 'admin_authenticated_worker', state: 'blocked' }
  ],
  matrix: {
    state: 'available',
    revision: 'matrix-test-revision',
    total: 1,
    campos: [{
      id: 'sync-nav',
      adminId: 'nav-btn-sincronizacao',
      targetFile: 'admin-painel.html',
      siteNeedle: 'Centro de Sincronização'
    }]
  }
};

const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => { throw error; });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    requests.push({ url: request.url(), method: request.method() });
    if (mutationMethods.has(request.method())) throw new Error(`Método de mutação inesperado: ${request.method()} ${request.url()}`);
    if (request.url().includes('/api/admin/sync/domains')) {
      if (request.method() === 'OPTIONS') {
        request.respond({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Itap-Session-Token', 'Access-Control-Max-Age': '60' } }).catch(() => {});
        return;
      }
      if (workerMode === 'unauthorized') {
        request.respond({ status: 401, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Sessão ausente ou inválida' }) }).catch(() => {});
      } else {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(workerPayload) }).catch(() => {});
      }
      return;
    }
    request.continue().catch(() => {});
  });

  for (const width of viewports) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: width < 768 });
    await page.goto(`${base}/admin-painel.html?sync-ui-test=${width}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-app').style.display = 'block';
    });
    const navRect = await page.$eval('#nav-btn-sincronizacao', (element) => {
      element.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });
    assert.ok(navRect.width > 0 && navRect.height > 0, `aba sem área clicável em ${width}px`);
    await page.mouse.click(navRect.left + navRect.width / 2, navRect.top + navRect.height / 2);
    await page.waitForFunction(() => {
      const text = document.querySelector('#sync-summary')?.textContent || '';
      return text.includes('Verificação concluída.') || text.includes('Verificação não executada.');
    }, { timeout: 15000 });
    const syncStateText = await page.$eval('#sync-summary', (element) => element.textContent);
    assert.match(syncStateText, /Verificação concluída\./, `falha de sincronização em ${width}px: ${syncStateText}`);
    const metrics = await page.evaluate(() => {
      const section = document.getElementById('sec-sincronizacao');
      const run = document.getElementById('sync-run');
      const copy = document.getElementById('sync-copy');
      const report = document.getElementById('sync-report');
      return {
        sectionVisible: getComputedStyle(section).display !== 'none',
        run: { width: run.getBoundingClientRect().width, height: run.getBoundingClientRect().height },
        copy: { width: copy.getBoundingClientRect().width, height: copy.getBoundingClientRect().height },
        summary: document.getElementById('sync-summary').textContent,
        report: report.textContent,
        matrix: document.getElementById('sync-matrix').textContent
      };
    });
    assert.equal(metrics.sectionVisible, true, `secção não visível em ${width}px`);
    assert.ok(metrics.run.height >= 44, `botão verificar menor que 44px em ${width}px`);
    assert.ok(metrics.copy.height >= 44, `botão copiar menor que 44px em ${width}px`);
    assert.match(metrics.summary, /4 domínios consultados/);
    assert.match(metrics.summary, /0 reconciliados/);
    assert.match(metrics.summary, /3 fontes disponíveis sem reconciliação/);
    assert.match(metrics.matrix, /1 de 1 relações/);
    assert.match(metrics.report, /Dados pessoais: não lidos nem incluídos/);
    assert.doesNotMatch(metrics.report, /Maria|16912345678|token-sintetico/);
  }

  workerMode = 'unauthorized';
  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1, isMobile: true });
  await page.goto(`${base}/admin-painel.html?sync-ui-test=401`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'block';
  });
  const unauthorizedNav = await page.$eval('#nav-btn-sincronizacao', (element) => {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  });
  await page.mouse.click(unauthorizedNav.left + unauthorizedNav.width / 2, unauthorizedNav.top + unauthorizedNav.height / 2);
  await page.waitForFunction(() => document.querySelector('#sync-summary')?.textContent.includes('Verificação não executada.'), { timeout: 15000 });
  const unauthorizedText = await page.$eval('#sync-summary', (element) => element.textContent);
  assert.match(unauthorizedText, /Sessão do Worker ausente ou expirada/);
  assert.match(unauthorizedText, /não fez fallback para GitHub/);
  assert.equal(requests.some((request) => mutationMethods.has(request.method)), false);

  console.log(JSON.stringify({ ok: true, viewports, requests: requests.length, mutations: 0 }));
} finally {
  await browser.close();
}
