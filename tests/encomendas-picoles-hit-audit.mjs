import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8159;
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
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.message || error)));

    await page.goto(`${base}/encomendas.html?picoles-hit-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('button.btn-sabores--picoles', { timeout: 10000 });
    await page.evaluate(() => { if (typeof window.toggleSecao === 'function') window.toggleSecao('sec-picoles'); });
    await page.$eval('button.btn-sabores--picoles', (button) => button.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.click('button.btn-sabores--picoles');
    await page.waitForSelector('#lista-sabores-picole [data-picole-key]', { timeout: 10000 });

    const flavorChecks = [];
    for (const flavor of ['Brigadeiro', 'Prestígio']) {
      const check = await page.evaluate((targetFlavor) => {
        const row = [...document.querySelectorAll('#lista-sabores-picole [data-picole-key]')].find((item) => item.textContent.includes(targetFlavor));
        if (!row) return null;
        row.scrollIntoView({ block: 'center', inline: 'nearest' });
        const plus = row.querySelector('.picole-qtd-btn--plus');
        const rect = plus?.getBoundingClientRect();
        if (!rect) return null;
        const midX = rect.left + rect.width / 2;
        const midY = rect.top + rect.height / 2;
        const top = document.elementFromPoint(midX, midY);
        return {
          flavor: targetFlavor,
          dataKey: row.getAttribute('data-picole-key'),
          buttonIsTopmost: top === plus,
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          listRight: document.getElementById('lista-sabores-picole')?.getBoundingClientRect().right || 0,
        };
      }, flavor);
      assert.ok(check, `${viewport.name}: não encontrou a linha do sabor ${flavor}`);
      assert.equal(check.buttonIsTopmost, true, `${viewport.name}: botão + de ${flavor} ficou encoberto`);
      flavorChecks.push(check);
    }

    const plusButtons = await page.$$(`#lista-sabores-picole .picole-qtd-btn--plus`);
    const brigadeiro = plusButtons[plusButtons.length - 2];
    const prestigio = plusButtons[plusButtons.length - 1];
    await brigadeiro.click();
    await prestigio.click();

    const quantities = await page.evaluate(() => ['Brigadeiro', 'Prestígio'].map((targetFlavor) => {
      const row = [...document.querySelectorAll('#lista-sabores-picole [data-picole-key]')].find((item) => item.textContent.includes(targetFlavor));
      return {
        flavor: targetFlavor,
        quantity: row?.querySelector('[id^="q-"]')?.textContent?.trim() || '',
        subtotal: row?.querySelector('[id^="sub-"]')?.textContent?.trim() || '',
      };
    }));

    assert.deepEqual(quantities, [
      { flavor: 'Brigadeiro', quantity: '1', subtotal: 'Subtotal: R$ 8,00' },
      { flavor: 'Prestígio', quantity: '1', subtotal: 'Subtotal: R$ 8,00' },
    ], `${viewport.name}: os dois sabores do final da lista não entraram corretamente no lote`);
    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    results.push({ viewport: viewport.name, flavorChecks, quantities });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
