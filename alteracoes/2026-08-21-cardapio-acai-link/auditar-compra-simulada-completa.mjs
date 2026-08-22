import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9241;
const baseUrl = 'https://itapolitanacajuru.com.br';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--ignore-certificate-errors',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-auditoria-total-${Date.now()}`,
  '--window-size=390,844', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function findTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const items = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = items.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* Aguarda o navegador controlado iniciar. */ }
    await wait(200);
  }
  throw new Error('Não foi possível iniciar a auditoria no navegador.');
}

const target = await findTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const current = pending.get(message.id); pending.delete(message.id);
  message.error ? current.reject(new Error(message.error.message)) : current.resolve(message.result || {});
});
function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
}
async function until(expression, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(expression)) return true;
    await wait(80);
  }
  return false;
}

await command('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__itapWhatsAppOpenCount = 0; window.open = () => { window.__itapWhatsAppOpenCount += 1; return null; };' });
await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await command('Page.navigate', { url: `${baseUrl}/retirada.html?auditoria-completa=${Date.now()}` });
if (!(await until("Boolean(document.querySelector('#catalog .catalog-section'))"))) throw new Error('O catálogo público não carregou para auditoria.');
await evaluate("localStorage.removeItem('itap_retirada_v1'); location.reload()");
if (!(await until("Boolean(document.querySelector('#catalog .catalog-section'))"))) throw new Error('O catálogo não recarregou após limpar o carrinho de teste.');

const inventory = await evaluate(`(() => ({
  groups: [...document.querySelectorAll('#catalog .catalog-section')].map((section) => ({
    id: section.id,
    title: section.querySelector('h2')?.textContent.trim() || section.id,
    products: [...section.querySelectorAll('.product')].map((row) => ({ sku: row.dataset.catalogSku || '', name: row.querySelector('.product__name')?.textContent.trim() || '', label: row.querySelector('.add-btn')?.textContent.trim() || '' }))
  }))
}))()`);

const report = { started_at: new Date().toISOString(), url: `${baseUrl}/retirada.html`, sent_to_whatsapp: false, inventory, direct_or_modal_products: [], popsicle_products: [], failures: [], skipped: [], cart: null };

async function resolveFlavorDialog() {
  let outcome = null;
  for (let guard = 0; guard < 180; guard += 1) {
    outcome = await evaluate(`(() => {
      const confirm = document.getElementById('confirm-flavors');
      if (confirm && !confirm.disabled) return { enabled: true, action: 'ready', status: document.getElementById('flavor-status')?.textContent.trim() || '' };
      const click = (element, action) => { if (!element) return null; element.click(); return { enabled: false, action, status: document.getElementById('flavor-status')?.textContent.trim() || '' }; };
      const cakeBox = document.querySelector('#cake-choice:not([hidden])');
      const cake = cakeBox && !cakeBox.querySelector('input:checked') ? cakeBox.querySelector('input') : null;
      if (cake) return click(cake, 'torta');
      const containerBox = document.querySelector('#item-container:not([hidden])');
      const container = containerBox && !containerBox.querySelector('input:checked') ? containerBox.querySelector('input') : null;
      if (container) return click(container, 'recipiente');
      const distribution = document.querySelector('#flavor-distribution:not([hidden])');
      const plus = distribution ? [...distribution.querySelectorAll('.qty button')].filter((button) => button.textContent.trim() === '+').find((button) => !button.disabled) : null;
      if (plus) return click(plus, 'bola');
      const chip = [...document.querySelectorAll('#flavor-grid:not([hidden]) .flavor-chip')].find((button) => !button.disabled && button.getAttribute('aria-pressed') !== 'true');
      if (chip) return click(chip, 'sabor');
      const modeBox = document.querySelector('#item-mode:not([hidden])');
      const mode = modeBox && !modeBox.querySelector('input:checked') ? modeBox.querySelector('input') : null;
      if (mode) return click(mode, 'modalidade');
      return { enabled: Boolean(confirm && !confirm.disabled), action: 'sem-ação', status: document.getElementById('flavor-status')?.textContent.trim() || '' };
    })()`);
    if (outcome?.enabled) break;
    await wait(45);
  }
  if (!outcome?.enabled) throw new Error(`Não foi possível completar seleção válida: ${outcome?.status || 'sem estado'}`);
  await evaluate("document.getElementById('confirm-flavors').click()");
}

async function closeModals() { await evaluate("['flavor-dialog','popsicle-dialog','cart-dialog'].forEach((id) => document.getElementById(id)?.close())"); await wait(35); }

for (const group of inventory.groups) {
  if (group.id === 'sec-picoles') continue;
  for (const product of group.products) {
    const startCount = await evaluate("JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]').length");
    try {
      const exists = await evaluate(`(() => { const row = document.querySelector('[data-catalog-sku="${product.sku}"]'); const button = row?.querySelector('.add-btn'); if (!button) return false; row.scrollIntoView({block:'center'}); button.click(); return true; })()`);
      if (!exists) throw new Error('Botão do produto não localizado.');
      await wait(60);
      if (await evaluate("Boolean(document.getElementById('flavor-dialog')?.open)")) await resolveFlavorDialog();
      if (!(await until("Boolean(document.getElementById('cart-dialog')?.open)", 3000))) throw new Error('Carrinho não abriu após adicionar produto.');
      const endCount = await evaluate("JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]').length");
      if (endCount <= startCount) throw new Error('Produto não foi persistido no carrinho.');
      report.direct_or_modal_products.push({ ...product, status: 'ok' });
      await closeModals();
    } catch (error) { report.failures.push({ ...product, group: group.title, error: String(error.message || error) }); await closeModals(); }
  }
}

const popsicleGroups = await evaluate(`(() => [...document.querySelectorAll('#sec-picoles .product')].map((row) => ({ name: row.querySelector('.product__name')?.textContent.trim() || '', sku: row.dataset.catalogSku || '' })))()`);
for (const group of popsicleGroups) {
  try {
    const opened = await evaluate(`(() => { const row = document.querySelector('#sec-picoles [data-catalog-sku="${group.sku}"]'); const button = row?.querySelector('.add-btn'); if (!button || button.disabled) return false; button.click(); return true; })()`);
    if (!opened) { report.skipped.push({ ...group, reason: 'Grupo de picolés indisponível ou sem botão.' }); continue; }
    if (!(await until("Boolean(document.getElementById('popsicle-dialog')?.open)", 3000))) throw new Error('Modal de picolés não abriu.');
    const flavors = await evaluate(`(() => [...document.querySelectorAll('#popsicle-list .popsicle-row')].map((row) => row.querySelector('.product__name')?.textContent.trim() || ''))()`);
    for (const flavor of flavors) {
      const added = await evaluate(`(() => { const row = [...document.querySelectorAll('#popsicle-list .popsicle-row')].find((item) => item.querySelector('.product__name')?.textContent.trim() === ${JSON.stringify(flavor)}); const plus = row?.querySelector('.qty button:last-child'); if (!plus || plus.disabled) return false; plus.click(); return true; })()`);
      report.popsicle_products.push({ group: group.name, flavor, status: added ? 'ok' : 'indisponível' });
      await wait(15);
    }
    await evaluate("document.querySelector('[data-close=\\\"popsicle-dialog\\\"]')?.click()");
  } catch (error) { report.failures.push({ ...group, group: 'Picolés', error: String(error.message || error) }); }
}

await evaluate("document.getElementById('summary-bar')?.click()");
await until("Boolean(document.getElementById('cart-dialog')?.open)", 2000);
report.cart = await evaluate(`(() => {
  const items = JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]');
  const invalid = items.filter((item) => !item.sku || !item.name || !Number.isFinite(Number(item.price)) || Number(item.quantity) < 1).map((item) => item.sku || item.name || 'sem identificação');
  return { line_items: items.length, total_items: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), total_text: document.getElementById('cart-total')?.textContent.trim() || '', invalid_items: invalid, whatsapp_open_count: window.__itapWhatsAppOpenCount || 0 };
})()`);
report.sent_to_whatsapp = report.cart.whatsapp_open_count > 0;
await command('Runtime.evaluate', { expression: "document.getElementById('cart-dialog')?.close()" });
writeFileSync(`${root}/resultado-compra-simulada-completa.json`, `${JSON.stringify(report, null, 2)}\n`);
socket.close();
process.kill(-chrome.pid, 'SIGTERM');
console.log(JSON.stringify({ products_ok: report.direct_or_modal_products.length, popsicles_ok: report.popsicle_products.filter((item) => item.status === 'ok').length, failures: report.failures.length, skipped: report.skipped.length, cart: report.cart }, null, 2));
