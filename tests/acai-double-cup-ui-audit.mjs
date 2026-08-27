import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8156;
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
    const mutationRequests = [];
    page.on('pageerror', (error) => errors.push(String(error?.message || error)));
    page.on('request', (request) => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutationRequests.push({ method: request.method(), url: request.url() });
    });
    await page.goto(`${base}/retirada.html?acai-double-audit=${viewport.name}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => localStorage.removeItem('itap_retirada_v1'));
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('[data-catalog-sku="ACA-300-006"] .add-btn', { timeout: 10000 });

    const initial = await page.$eval('[data-catalog-sku="ACA-300-006"] .add-btn', (button) => ({ text: button.textContent.trim(), disabled: button.disabled }));
    assert.equal(initial.text, 'Escolher complementos', `${viewport.name}: copo de Açaí não abriu o fluxo de complementos`);
    assert.equal(initial.disabled, false, `${viewport.name}: copo de Açaí ficou indisponível`);

    await page.click('[data-catalog-sku="ACA-300-006"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open] #acai-double-options:not([hidden])', { timeout: 5000 });
    const form = await page.evaluate(() => {
      const section = document.querySelector('#acai-double-options');
      return {
        visible: Boolean(section && !section.hidden),
        title: section?.querySelector('.acai-double-options__title')?.textContent.trim() || '',
        hint: section?.querySelector('.acai-double-options__hint')?.textContent.trim() || '',
        options: [...(section?.querySelectorAll('.acai-double-option') || [])].map((row) => ({
          ingredient: row.querySelector('.acai-double-option__name')?.textContent.trim() || '',
          price: row.querySelector('.acai-double-option__price')?.textContent.trim() || '',
          checked: Boolean(row.querySelector('input')?.checked),
        })),
      };
    });
    assert.equal(form.visible, true, `${viewport.name}: quadro de dobro não visível`);
    assert.deepEqual(form.options.map((item) => item.ingredient), ['morango', 'leite condensado'], `${viewport.name}: ingredientes do SKU ACA-300-006 divergentes`);
    assert.ok(form.options.every((item) => item.price === 'Em dobro (+ R$ 3,00)'), `${viewport.name}: preço do dobro não foi discriminado`);
    assert.match(form.hint, /preço e o SKU.*continuam iguais/i, `${viewport.name}: formulário não protegeu o SKU/preço base`);

    await page.$$eval('#acai-double-options-list input', (inputs) => inputs[0].click());
    await page.$$eval('#acai-double-options-list input', (inputs) => inputs[1].click());
    const selected = await page.$eval('#acai-double-options-total', (node) => node.textContent.trim());
    assert.match(selected, /morango em dobro.*leite condensado em dobro/i, `${viewport.name}: itens seleccionados não foram descritos`);
    assert.match(selected, /R\$ 6,00/i, `${viewport.name}: dois adicionais não somaram R$ 6,00`);

    await page.click('#confirm-flavors');
    await page.waitForSelector('#cart-dialog[open]', { timeout: 5000 });
    const cart = await page.evaluate(() => ({
      itemMeta: document.querySelector('.cart-item__meta')?.textContent.trim() || '',
      pricing: document.querySelector('.cart-item__pricing')?.textContent.trim() || '',
      itemValue: document.querySelector('.cart-item__value')?.textContent.trim() || '',
      total: document.querySelector('#cart-total')?.textContent.trim() || '',
      breakdown: document.querySelector('#cart-breakdown')?.textContent.trim() || '',
      skuCount: [...document.querySelectorAll('.cart-item__meta')].filter((node) => node.textContent.includes('ACA-300-006')).length,
    }));
    assert.match(cart.itemMeta, /ACA-300-006/, `${viewport.name}: SKU base não foi preservado`);
    assert.match(cart.itemMeta, /morango em dobro/i, `${viewport.name}: morango em dobro ausente do resumo`);
    assert.match(cart.itemMeta, /leite condensado em dobro/i, `${viewport.name}: leite condensado em dobro ausente do resumo`);
    assert.match(cart.pricing, /morango em dobro: R\$ 3,00/i, `${viewport.name}: preço de morango não discriminado no carrinho`);
    assert.match(cart.pricing, /leite condensado em dobro: R\$ 3,00/i, `${viewport.name}: preço de leite condensado não discriminado no carrinho`);
    assert.match(cart.pricing, /Total de adicionais: R\$ 6,00/i, `${viewport.name}: total de adicionais não discriminado`);
    assert.equal(cart.itemValue, 'R$ 21,00', `${viewport.name}: subtotal do copo deveria ser R$ 21,00`);
    assert.equal(cart.total, 'R$ 21,00', `${viewport.name}: total do pedido deveria ser R$ 21,00`);
    assert.match(cart.breakdown, /Total de adicionais\s*R\$ 6,00/i, `${viewport.name}: breakdown não mostra R$ 6,00`);
    assert.equal(cart.skuCount, 1, `${viewport.name}: SKU base apareceu mais de uma vez ou foi duplicado`);

    const outgoingMessage = await page.evaluate(() => {
      const frozenNow = new Date('2026-08-27T12:00:00-03:00').getTime();
      Date.now = () => frozenNow;
      window.ItapHorarioPedidos = { estaAberto: () => true, aviso: () => {}, textoAviso: () => '' };
      window.open = (url) => { window.__capturedWhatsApp = url; return null; };
      const setValue = (selector, value, eventName = 'input') => { const field = document.querySelector(selector); field.value = value; field.dispatchEvent(new Event(eventName, { bubbles: true })); };
      setValue('#client-name', 'Auditoria local');
      setValue('#client-phone', '99999-9999');
      setValue('#pickup-time', '14:00', 'input');
      document.querySelector('#confirm-payment').click();
      document.querySelector('#continue-notes').click();
      const accept = document.querySelector('#accept-rules'); accept.checked = true; accept.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#pickup-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      const url = window.__capturedWhatsApp || '';
      return url ? decodeURIComponent(new URL(url).searchParams.get('text') || '') : '';
    });
    assert.match(outgoingMessage, /\(ACA-300-006\)/, `${viewport.name}: mensagem não contém o SKU base`);
    assert.match(outgoingMessage, /morango em dobro — R\$ 3,00/i, `${viewport.name}: mensagem não discrimina morango em dobro`);
    assert.match(outgoingMessage, /leite condensado em dobro — R\$ 3,00/i, `${viewport.name}: mensagem não discrimina leite condensado em dobro`);
    assert.match(outgoingMessage, /Total final: R\$ 21,00/i, `${viewport.name}: mensagem não contém o total final correcto`);

    await page.evaluate(() => document.getElementById('cart-dialog')?.close());
    await page.click('[data-catalog-sku="ACA-MSK-001"] .add-btn');
    await page.waitForSelector('#cart-dialog[open]', { timeout: 5000 });
    const excludedMilkshake = await page.$eval('#acai-double-options', (section) => ({ hidden: section.hidden, dialogOpen: Boolean(section.closest('dialog')?.open) }));
    assert.equal(excludedMilkshake.dialogOpen, false, `${viewport.name}: opção de dobro vazou para milk-shake de Açaí`);
    await page.evaluate(() => document.getElementById('cart-dialog')?.close());
    await page.click('[data-catalog-sku="ACA-700-007"] .add-btn');
    await page.waitForSelector('#flavor-dialog[open] #acai-double-options:not([hidden])', { timeout: 5000 });
    const sixIngredientOptions = await page.$$eval('#acai-double-options-list .acai-double-option', (rows) => rows.length);
    assert.equal(sixIngredientOptions, 6, `${viewport.name}: copo de 700 ml não exibiu os seis complementos oficiais`);
    await page.evaluate(() => document.getElementById('flavor-dialog')?.close());

    const dimensions = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth }));
    assert.ok(dimensions.bodyWidth <= dimensions.viewportWidth + 2, `${viewport.name}: overflow horizontal (${dimensions.bodyWidth}/${dimensions.viewportWidth})`);
    assert.deepEqual(errors, [], `${viewport.name}: erros de página`);
    assert.deepEqual(mutationRequests, [], `${viewport.name}: houve requisição mutativa`);
    results.push({ viewport: viewport.name, form, cart, dimensions, errors, mutationRequests });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, viewports: results.length, results }, null, 2));
