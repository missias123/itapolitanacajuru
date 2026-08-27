import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8147;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['tests/local-static-server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (serverOutput.includes('STATIC_SERVER_READY')) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Servidor local não iniciou: ${serverOutput}`);
}

const viewports = [
  { name: 'iphone-small', width: 320, height: 780, isMobile: true, hasTouch: true },
  { name: 'iphone', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false, hasTouch: false },
];

await waitForServer();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const results = [];
try {
  for (const viewport of viewports) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    const requests = [];
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.message || error)));
    await page.goto(`${base}/admin-catalogo.html?sku-ui-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('#skuTotal')?.textContent?.includes('SKU(s) oficiais'), { timeout: 10000 });

    const moduleLoaded = await page.evaluate(() => Boolean(window.ITAP_CATALOGO_MESTRE?.resolverNome));
    assert.equal(moduleLoaded, true, `${viewport.name}: adaptador não carregado`);

    const search = page.locator('#search');
    await search.fill('Sundee com Nutela');
    await page.waitForFunction(() => document.querySelector('#searchHint')?.textContent?.includes('TAC-TRD-007'), { timeout: 5000 });
    const typoState = await page.evaluate(() => ({
      hint: document.querySelector('#searchHint')?.textContent || '',
      rows: [...document.querySelectorAll('#productsPanel tr[data-key]')].map((row) => ({ key: row.dataset.key, sku: row.querySelector('.sku')?.textContent?.trim() })),
    }));
    assert.equal(typoState.rows.filter((row) => row.sku === 'TAC-TRD-007').length, 1, `${viewport.name}: SKU sugerido não apareceu`);
    assert.match(typoState.hint, /não altera nada/i, `${viewport.name}: sugestão não foi marcada como não automática`);

    await search.fill('Copo recheado');
    await new Promise((resolve) => setTimeout(resolve, 100));
    const ambiguousState = await page.evaluate(() => ({
      hint: document.querySelector('#searchHint')?.textContent || '',
      skus: [...document.querySelectorAll('#productsPanel tr[data-key] .sku')].map((cell) => cell.textContent.trim()).filter((sku) => sku.startsWith('SVM-CR-')),
    }));
    assert.equal(ambiguousState.skus.length, 3, `${viewport.name}: ambiguidade de Copo recheado não mostrou os três SKUs`);
    assert.match(ambiguousState.hint, /possível/i, `${viewport.name}: ambiguidade não foi informada`);

    await search.fill('Sundae com Nutella');
    await page.waitForFunction(() => [...document.querySelectorAll('#productsPanel tr[data-key] .sku')].some((cell) => cell.textContent.trim() === 'TAC-TRD-007'), { timeout: 5000 });
    const aliasState = await page.evaluate(() => [...document.querySelectorAll('#productsPanel tr[data-key] .sku')].map((cell) => cell.textContent.trim()).filter((sku) => sku === 'TAC-TRD-007'));
    assert.equal(aliasState.length, 1, `${viewport.name}: alias histórico não apontou para TAC-TRD-007`);

    const dimensions = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      searchWidth: document.querySelector('#search')?.getBoundingClientRect().width || 0,
      hintWidth: document.querySelector('#searchHint')?.getBoundingClientRect().width || 0,
    }));
    assert.ok(dimensions.searchWidth > 0, `${viewport.name}: campo de busca invisível`);
    assert.ok(dimensions.bodyWidth <= dimensions.viewportWidth + 2, `${viewport.name}: overflow horizontal (${dimensions.bodyWidth}/${dimensions.viewportWidth})`);
    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    assert.equal(requests.filter((request) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)).length, 0, `${viewport.name}: houve requisição mutativa`);
    results.push({ viewport: viewport.name, typoState, ambiguousState, dimensions, errors, mutationRequests: requests.filter((request) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
