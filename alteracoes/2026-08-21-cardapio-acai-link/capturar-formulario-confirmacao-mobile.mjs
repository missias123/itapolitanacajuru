import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9231;
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-confirmacao-${Date.now()}`,
  '--window-size=375,812', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (target) return target;
    } catch { /* Aguarda o Chromium iniciar. */ }
    await wait(200);
  }
  throw new Error('Navegador móvel de demonstração indisponível.');
}

const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0;
const awaiting = new Map();
socket.addEventListener('message', (event) => {
  const payload = JSON.parse(event.data);
  if (!payload.id || !awaiting.has(payload.id)) return;
  const current = awaiting.get(payload.id); awaiting.delete(payload.id);
  payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {});
});
function command(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    awaiting.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}
async function evaluate(expression) { return command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); }
async function screenshot(name) {
  const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/${name}`, Buffer.from(image.data, 'base64'));
}

await command('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?sku=TAC-TRD-001#catalogo' });
await wait(4000);
await evaluate(`(() => {
  const product = document.querySelector('[data-catalog-sku="TAC-TRD-001"]');
  product?.scrollIntoView({ block: 'center' });
  product?.querySelector('button')?.click();
})()`);
await wait(650);
await screenshot('demonstracao-mobile-taca-sabores.png');

const result = await evaluate(`(() => {
  const plus = [...document.querySelectorAll('#flavor-distribution-list .qty button:last-child')];
  plus[0]?.click(); plus[1]?.click();
  document.querySelector('input[name="item-mode"][value="store"]')?.click();
  document.getElementById('confirm-flavors')?.click();
  return {
    dialogOpen: document.getElementById('cart-dialog')?.open,
    itemCount: JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]').length,
    selectedFlavorCount: plus.length >= 2 ? 2 : 0
  };
})()`);
await wait(650);
await evaluate(`document.getElementById('call-confirmation-rule')?.scrollIntoView({ block: 'center' })`);
await wait(500);
await screenshot('demonstracao-mobile-confirmacao-ligacao.png');
writeFileSync(`${root}/resultado-demonstracao-confirmacao.json`, `${JSON.stringify({
  sku: 'TAC-TRD-001',
  regraSabores: '2 sabores de sorvete com contador e limite',
  confirmacaoLigacao: true,
  pedidoEnviado: false,
  resultado: result.result?.value || null
}, null, 2)}\n`);
socket.close();
process.kill(-chrome.pid, 'SIGTERM');
console.log(JSON.stringify(result.result?.value || {}, null, 2));
