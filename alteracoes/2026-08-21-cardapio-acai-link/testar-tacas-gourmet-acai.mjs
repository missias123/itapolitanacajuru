import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9234;
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-tacas-gourmet-${Date.now()}`,
  '--window-size=390,844', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (target) return target;
    } catch { /* Aguarda a inicialização. */ }
    await wait(200);
  }
  throw new Error('Navegador de teste indisponível.');
}

const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const payload = JSON.parse(event.data);
  if (!payload.id || !pending.has(payload.id)) return;
  const current = pending.get(payload.id); pending.delete(payload.id);
  payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {});
});
function command(method, params = {}) { const requestId = ++id; return new Promise((resolve, reject) => { pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); }); }
const evaluate = (expression) => command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
async function screenshot(name) { const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(`${root}/${name}`, Buffer.from(image.data, 'base64')); }

try {
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}/retirada.html?teste-tacas-gourmet=1#catalogo` });
  await wait(4200);
  await evaluate(`localStorage.removeItem('itap_retirada_v1')`);
  await evaluate(`location.reload()`);
  await wait(3200);
  const beforeClick = await evaluate(`(() => {
    const section = document.getElementById('sec-acai-natureon');
    const heading = [...section.querySelectorAll('.product-subgroup strong')].find((node) => node.textContent.includes('Taças Gourmet Açaí Natureon'));
    const cards = [...section.querySelectorAll('[data-catalog-sku^="ACA-TCG-"]')];
    heading?.scrollIntoView({ block: 'start' });
    return { sectionFound: Boolean(section), groupName: heading?.textContent || '', cardCount: cards.length, cardSkus: cards.map((card) => card.dataset.catalogSku), orderAfterCombinations: Boolean(heading && heading.compareDocumentPosition(cards[0]) & Node.DOCUMENT_POSITION_FOLLOWING) };
  })()`);
  await wait(500);
  await screenshot('demonstracao-mobile-tacas-gourmet-acai.png');
  const added = await evaluate(`(() => {
    document.querySelector('[data-catalog-sku="ACA-TCG-001"] button')?.click();
    const cart = JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]');
    const item = cart.find((entry) => entry.sku === 'ACA-TCG-001');
    return { addedDirectly: Boolean(item), flavors: item?.flavors?.length || 0, flavorDialogOpen: document.getElementById('flavor-dialog')?.open, total: item?.price || 0 };
  })()`);
  const result = { apresentação: beforeClick.result?.value || null, adicao: added.result?.value || null, whatsappAberto: false, pedidoEnviado: false };
  writeFileSync(`${root}/resultado-teste-tacas-gourmet-acai.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  socket.close();
  process.kill(-chrome.pid, 'SIGTERM');
}
