import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(await fs.readFile(path.join(root, 'dados', 'produtos.json'), 'utf8'));
const port = 8158;
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

function patchedCatalog() {
  const data = JSON.parse(JSON.stringify(raw));
  data.açaí = { ...(data.açaí || {}), esgotado_base: true };
  data.acai = data.açaí;
  return data;
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
    const errors = [];
    const mutationRequests = [];
    page.on('pageerror', (error) => errors.push(String(error?.message || error)));
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutationRequests.push({ method: request.method(), url: request.url() });
      if (/\/dados\/produtos\.json(\?|$)/.test(request.url())) {
        request.respond({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(patchedCatalog()),
        }).catch(() => {});
        return;
      }
      request.continue().catch(() => {});
    });

    await page.goto(`${base}/encomendas.html?acai-base-esgotada-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#lista-caixas .prod-card[data-sku]', { timeout: 10000 });
    await page.evaluate(() => {
      const produto = Array.isArray(window.PRODUTOS) ? window.PRODUTOS[0] : null;
      if (!produto) throw new Error('Produto de caixa não encontrado para auditoria.');
      window.abrirSaboresSorvete(produto.id, produto.preco, produto.max, produto.nome);
    });
    await page.waitForSelector('#modal-sabores[aria-hidden="false"] #grid-sabores .sabor-item', { timeout: 5000 });

    const flavorState = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#grid-sabores .sabor-item')];
      const target = items.find((item) => /Açaí Natureon/i.test(item.textContent || ''));
      return target ? {
        text: (target.textContent || '').trim().replace(/\s+/g, ' '),
        ariaDisabled: target.getAttribute('aria-disabled'),
        className: target.className || '',
      } : null;
    });
    assert.ok(flavorState, `${viewport.name}: Açaí Natureon não apareceu no modal de encomendas para validação`);
    assert.equal(flavorState.ariaDisabled, 'true', `${viewport.name}: Açaí Natureon continuou selecionável em encomendas com a base esgotada`);
    assert.match(flavorState.text, /esgotado/i, `${viewport.name}: Açaí Natureon não exibiu selo de esgotado em encomendas`);

    const beforeSelection = await page.$eval('#status-sabores', (node) => node.textContent.trim());
    await page.evaluate(() => {
      const target = [...document.querySelectorAll('#grid-sabores .sabor-item')].find((item) => /Açaí Natureon/i.test(item.textContent || ''));
      target?.click();
    });
    const afterAttempt = await page.evaluate(() => ({
      selected: [...document.querySelectorAll('#grid-sabores .sabor-item.sel')].some((item) => /Açaí Natureon/i.test(item.textContent || '')),
      status: document.getElementById('status-sabores')?.textContent.trim() || '',
    }));
    assert.equal(afterAttempt.selected, false, `${viewport.name}: Açaí Natureon foi selecionado mesmo esgotado em encomendas`);
    assert.equal(afterAttempt.status, beforeSelection, `${viewport.name}: tentativa de clique no Açaí esgotado alterou o estado do modal`);

    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    assert.deepEqual(mutationRequests, [], `${viewport.name}: houve requisição mutativa`);
    results.push({ viewport: viewport.name, flavorState });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
