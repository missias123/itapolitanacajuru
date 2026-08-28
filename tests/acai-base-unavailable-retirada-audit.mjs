import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(await fs.readFile(path.join(root, 'dados', 'produtos.json'), 'utf8'));
const port = 8157;
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

function patchedCatalog() {
  const data = JSON.parse(JSON.stringify(raw));
  data.açaí = { ...(data.açaí || {}), esgotado_base: true };
  data.acai = data.açaí;
  return data;
}

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

    await page.goto(`${base}/retirada.html?acai-base-esgotada-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('[data-catalog-sku="ACA-300-006"] .add-btn', { timeout: 10000 });

    const acaiButtons = await page.evaluate(() => ({
      cup: (() => {
        const button = document.querySelector('[data-catalog-sku="ACA-300-006"] .add-btn');
        return button ? { text: button.textContent.trim(), disabled: Boolean(button.disabled) } : null;
      })(),
      milkshake: (() => {
        const button = document.querySelector('[data-catalog-sku="ACA-MSK-001"] .add-btn');
        return button ? { text: button.textContent.trim(), disabled: Boolean(button.disabled) } : null;
      })(),
    }));
    assert.deepEqual(acaiButtons.cup, { text: 'Esgotado', disabled: true }, `${viewport.name}: copo de açaí não foi bloqueado quando a base esgotou`);
    assert.deepEqual(acaiButtons.milkshake, { text: 'Esgotado', disabled: true }, `${viewport.name}: milk-shake de açaí não foi bloqueado quando a base esgotou`);

    await page.click('[data-catalog-sku="SVM-CASK-01"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open]', { timeout: 5000 });
    const massFlavorState = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#flavor-distribution-list .flavor-distribution__row')];
      const target = rows.find((row) => /Açaí Natureon/i.test(row.textContent || ''));
      if (!target) return null;
      const buttons = target.querySelectorAll('button');
      return {
        text: (target.textContent || '').trim().replace(/\s+/g, ' '),
        plusDisabled: Boolean(buttons[1]?.disabled),
        minusDisabled: Boolean(buttons[0]?.disabled),
      };
    });
    assert.ok(massFlavorState, `${viewport.name}: Açaí Natureon não apareceu no fluxo de sorvete para ser validado`);
    assert.equal(massFlavorState.plusDisabled, true, `${viewport.name}: Açaí Natureon continuou disponível no sorvete de massa com a base esgotada`);
    assert.equal(massFlavorState.minusDisabled, true, `${viewport.name}: Açaí Natureon deveria iniciar sem permitir decremento no sorvete de massa`);
    await page.keyboard.press('Escape');

    await page.click('[data-catalog-sku="MLK-TRD-300"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open]', { timeout: 5000 });
    const milkshakeFlavorState = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('#flavor-grid button')];
      const target = buttons.find((button) => /Açaí Natureon/i.test(button.textContent || ''));
      return target ? {
        text: (target.textContent || '').trim().replace(/\s+/g, ' '),
        disabled: Boolean(target.disabled),
      } : null;
    });
    assert.ok(milkshakeFlavorState, `${viewport.name}: Açaí Natureon não apareceu no fluxo de milk-shake para ser validado`);
    assert.equal(milkshakeFlavorState.disabled, true, `${viewport.name}: Açaí Natureon continuou disponível no milk-shake tradicional com a base esgotada`);
    assert.match(milkshakeFlavorState.text, /esgotado/i, `${viewport.name}: Açaí Natureon não exibiu estado de esgotado no milk-shake tradicional`);
    await page.keyboard.press('Escape');

    const dimensions = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth }));
    assert.ok(dimensions.bodyWidth <= dimensions.viewportWidth + 2, `${viewport.name}: overflow horizontal (${dimensions.bodyWidth}/${dimensions.viewportWidth})`);
    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    assert.deepEqual(mutationRequests, [], `${viewport.name}: houve requisição mutativa`);
    results.push({ viewport: viewport.name, acaiButtons, massFlavorState, milkshakeFlavorState, dimensions });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
