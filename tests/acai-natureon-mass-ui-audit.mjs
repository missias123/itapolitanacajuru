import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(await fs.readFile(path.join(root, 'dados', 'produtos.json'), 'utf8'));
const port = 8154;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function patchedCatalog() {
  const data = JSON.parse(JSON.stringify(raw));
  if (data.cadastro_skus?.por_chave?.['massas.MAS-039']) data.cadastro_skus.por_chave['massas.MAS-039'].ativo = true;
  data.açaí = { ...(data.açaí || {}), esgotado_base: false };
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
    await page.goto(`${base}/retirada.html?acai-natureon-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('[data-catalog-sku="SVM-CASK-01"]', { timeout: 10000 });

    const pageState = await page.evaluate(() => {
      const mass = document.querySelector('[data-section-tone="massa"]');
      const acai = document.querySelector('[data-section-tone="acai"]');
      const picoles = document.querySelector('[data-section-tone="picoles"]');
      const traditionalMilkshake = document.querySelector('[data-catalog-sku="MLK-TRD-300"]');
      const acaiMilkshake = document.querySelector('[data-catalog-sku="ACA-MSK-001"]');
      const massButton = mass?.querySelector('[data-catalog-sku="SVM-CASK-01"] .add-btn');
      const massCards = [...(mass?.querySelectorAll('[data-catalog-sku]') || [])].length;
      const massText = mass?.textContent || '';
      return {
        massCards,
        massText,
        acaiText: acai?.textContent || '',
        picolesText: picoles?.textContent || '',
        traditionalMilkshakeButton: traditionalMilkshake?.querySelector('.add-btn')?.textContent?.trim() || '',
        acaiMilkshakeButton: acaiMilkshake?.querySelector('.add-btn')?.textContent?.trim() || '',
        massButtonExists: Boolean(massButton),
      };
    });
    assert.ok(pageState.massCards > 0, `${viewport.name}: secção de massa sem produtos`);
    assert.equal(pageState.massButtonExists, true, `${viewport.name}: botão da Casquinha não encontrado`);
    assert.match(pageState.traditionalMilkshakeButton, /Escolher sabores/i, `${viewport.name}: milkshake tradicional não permite sabores`);
    assert.match(pageState.acaiMilkshakeButton, /Adicionar ao pedido/i, `${viewport.name}: milk-shake de Açaí não ficou pronto/fechado`);
    assert.doesNotMatch(pageState.picolesText, /Açaí Natureon/i, `${viewport.name}: Açaí Natureon vazou para picolés`);

    await page.click('[data-catalog-sku="SVM-CASK-01"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open]', { timeout: 5000 });
    const massFlavorState = await page.evaluate(() => ({
      flavorNames: [
        ...[...document.querySelectorAll('#flavor-grid button')].map((button) => button.textContent.trim()),
        ...[...document.querySelectorAll('#flavor-distribution-list .flavor-distribution__name')].map((node) => node.textContent.trim()),
      ],
      title: document.querySelector('#flavor-title')?.textContent || '',
    }));
    assert.ok(massFlavorState.flavorNames.includes('Açaí Natureon'), `${viewport.name}: Açaí Natureon não aparece na escolha de sorvete`);
    assert.match(massFlavorState.title, /Casquinha/i, `${viewport.name}: diálogo abriu o produto errado`);
    await page.evaluate(() => {
      const firstFlavor = document.querySelector('#flavor-grid button:not(:disabled)');
      if (firstFlavor) {
        firstFlavor.click();
        return;
      }
      const firstPlus = document.querySelector('#flavor-distribution-list .qty button:last-child:not(:disabled)');
      if (!firstPlus) throw new Error('Nenhum sabor disponível para testar o avanço guiado');
      firstPlus.click();
    });
    await sleep(150);
    const guidedFlowState = await page.evaluate(() => {
      const grid = document.querySelector('#flavor-grid');
      const distributionList = document.querySelector('#flavor-distribution-list');
      const mode = document.querySelector('#item-mode');
      const fadedGrid = [...document.querySelectorAll('#flavor-grid button')].find((button) => button.getAttribute('aria-pressed') !== 'true');
      const fadedDistribution = [...document.querySelectorAll('#flavor-distribution-list .flavor-distribution__row')].find((row) => !row.classList.contains('is-selected'));
      const faded = fadedGrid || fadedDistribution;
      const active = document.activeElement;
      return {
        limitReached: Boolean(grid?.classList.contains('limite-atingido') || distributionList?.classList.contains('limite-atingido')),
        fadedDisabled: 'disabled' in (faded || {}) ? Boolean(faded?.disabled) : true,
        fadedOpacity: faded ? Number(window.getComputedStyle(faded).opacity || '1') : 1,
        fadedFilter: faded ? window.getComputedStyle(faded).filter : '',
        modeVisible: Boolean(mode && !mode.hidden),
        guideTargetId: document.querySelector('.guide-next-step')?.id || '',
        activeInMode: Boolean(mode && active && mode.contains(active)),
        status: document.querySelector('#flavor-status')?.textContent?.trim() || '',
      };
    });
    assert.equal(guidedFlowState.limitReached, true, `${viewport.name}: a grade não marcou o limite de sabores`);
    assert.equal(guidedFlowState.fadedDisabled, true, `${viewport.name}: os sabores restantes não foram bloqueados ao atingir o limite`);
    assert.ok(guidedFlowState.fadedOpacity < 0.5 || guidedFlowState.fadedFilter !== 'none', `${viewport.name}: os sabores restantes não ficaram visualmente apagados`);
    assert.equal(guidedFlowState.modeVisible, true, `${viewport.name}: o próximo passo não foi liberado`);
    assert.equal(guidedFlowState.guideTargetId, 'item-mode', `${viewport.name}: o guia visual não destacou o próximo passo`);
    assert.equal(guidedFlowState.activeInMode, true, `${viewport.name}: o foco não avançou para o próximo passo`);
    assert.match(guidedFlowState.status, /agora escolha como deseja receber/i, `${viewport.name}: o status não informou o próximo passo`);
    await page.keyboard.press('Escape');
    await sleep(50);

    await page.click('[data-catalog-sku="MLK-TRD-300"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open]', { timeout: 5000 });
    const milkshakeFlavorNames = await page.evaluate(() => [...document.querySelectorAll('#flavor-grid button')].map((button) => button.textContent.trim()));
    assert.ok(milkshakeFlavorNames.includes('Açaí Natureon'), `${viewport.name}: Açaí Natureon não aparece no milkshake tradicional`);
    await page.keyboard.press('Escape');
    await sleep(50);

    const dimensions = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth }));
    assert.ok(dimensions.bodyWidth <= dimensions.viewportWidth + 2, `${viewport.name}: overflow horizontal (${dimensions.bodyWidth}/${dimensions.viewportWidth})`);
    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    assert.deepEqual(mutationRequests, [], `${viewport.name}: houve requisição mutativa`);
    results.push({ viewport: viewport.name, massCards: pageState.massCards, massFlavorState, guidedFlowState, dimensions, errors, mutationRequests });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
