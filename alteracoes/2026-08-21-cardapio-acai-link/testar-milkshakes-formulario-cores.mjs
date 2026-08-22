import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9233;
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-milkshake-${Date.now()}`,
  '--window-size=390,844', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* Aguarda a inicialização do navegador. */ }
    await wait(200);
  }
  throw new Error('Navegador de teste indisponível.');
}

const page = await target();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0;
const waiting = new Map();
socket.addEventListener('message', (event) => {
  const payload = JSON.parse(event.data);
  if (!payload.id || !waiting.has(payload.id)) return;
  const current = waiting.get(payload.id); waiting.delete(payload.id);
  payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {});
});
function command(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => { waiting.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
}
const evaluate = (expression) => command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
async function screenshot(name) {
  const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/${name}`, Buffer.from(image.data, 'base64'));
}

try {
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}/retirada.html?teste-milkshakes=1#catalogo` });
  await wait(4200);
  await evaluate(`localStorage.removeItem('itap_retirada_v1')`);
  await evaluate(`location.reload()`);
  await wait(3200);

  const traditional = await evaluate(`(() => {
    const product = document.querySelector('[data-catalog-sku="MLK-TRD-300"]');
    product?.scrollIntoView({ block: 'center' });
    product?.querySelector('button')?.click();
    return { opened: document.getElementById('flavor-dialog')?.open, status: document.getElementById('flavor-status')?.textContent?.trim() };
  })()`);
  await wait(650);
  await screenshot('demonstracao-mobile-milkshake-tradicional.png');
  const traditionalAdded = await evaluate(`(() => {
    document.querySelector('#flavor-grid button')?.click();
    document.querySelector('input[name="item-mode"][value="store"]')?.click();
    document.getElementById('confirm-flavors')?.click();
    const cart = JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]');
    const item = cart.find((entry) => entry.sku === 'MLK-TRD-300');
    return { added: Boolean(item), flavors: item?.flavors?.length || 0, flavorDialogOpen: document.getElementById('flavor-dialog')?.open };
  })()`);
  await wait(700);

  const acai = await evaluate(`(() => {
    const product = document.querySelector('[data-catalog-sku="ACA-MSK-001"]');
    product?.scrollIntoView({ block: 'center' });
    product?.querySelector('button')?.click();
    const cart = JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]');
    const item = cart.find((entry) => entry.sku === 'ACA-MSK-001');
    return { addedDirectly: Boolean(item), flavorDialogOpen: document.getElementById('flavor-dialog')?.open, flavors: item?.flavors?.length || 0 };
  })()`);
  await wait(700);
  await evaluate(`(() => { const dialog = document.getElementById('cart-dialog'); if (!dialog.open) dialog.showModal(); document.getElementById('pickup-form')?.scrollIntoView({ block: 'start' }); })()`);
  await wait(500);
  await screenshot('demonstracao-mobile-formulario-cores-inicio.png');
  await evaluate(`document.querySelector('.form-block--confirmation')?.scrollIntoView({ block: 'center' })`);
  await wait(500);
  await screenshot('demonstracao-mobile-formulario-cores.png');

  const result = {
    produtoTradicional: traditional.result?.value || null,
    tradicionalAdicionado: traditionalAdded.result?.value || null,
    acaiPreMontado: acai.result?.value || null,
    whatsappAberto: false,
    pedidoEnviado: false
  };
  writeFileSync(`${root}/resultado-teste-milkshakes-formulario-cores.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  socket.close();
  process.kill(-chrome.pid, 'SIGTERM');
}
