import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9227;
const sourceUrl = process.argv[2] || 'http://127.0.0.1:4173/index.html?demo-mobile=1';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-mobile-demo-${Date.now()}`,
  '--window-size=375,812', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getPageTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* Aguarda a aba de demonstração iniciar. */ }
    await wait(200);
  }
  throw new Error('Não foi possível iniciar o navegador de demonstração.');
}

const pageTarget = await getPageTarget();
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (!data.id || !pending.has(data.id)) return;
  const { resolve, reject } = pending.get(data.id); pending.delete(data.id);
  if (data.error) reject(new Error(data.error.message)); else resolve(data.result || {});
});
function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function go(url) {
  await command('Page.navigate', { url });
  await wait(3500);
  await command('Runtime.evaluate', { expression: "[...document.querySelectorAll('button')].find((button) => /Aceitar todos/i.test(button.textContent))?.click()" });
  await wait(250);
}
async function shot(filename) {
  const { data } = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/${filename}`, Buffer.from(data, 'base64'));
}

await command('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
await go(sourceUrl);
await command('Runtime.evaluate', { expression: "document.getElementById('vc-btn')?.click(); document.querySelector('#acc-sorvetes .acc-header')?.click();" });
await wait(600);
const source = await command('Runtime.evaluate', { expression: "(() => { const button = document.querySelector('.product-pickup-btn'); button?.scrollIntoView({ block: 'center' }); return button ? { sku: button.dataset.sku, href: button.href, label: button.textContent.trim() } : null; })()", returnByValue: true });
await wait(500);
await shot('demonstracao-mobile-botao-produto.png');

await command('Runtime.evaluate', { expression: "document.querySelector('.product-pickup-btn')?.click()" });
await wait(3500);
const destination = await command('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
const target = destination.result?.value || source.result?.value?.href || 'http://127.0.0.1:4173/retirada.html?sku=SVM-CC-01#catalogo';
await shot('demonstracao-mobile-pagina-retirada.png');

mkdirSync(root, { recursive: true });
writeFileSync(`${root}/resultado-demonstracao-mobile.json`, `${JSON.stringify({ origem: sourceUrl, produto: source.result?.value || null, destinoAberto: target, pedidoEnviado: false }, null, 2)}\n`);
socket.close();
process.kill(-chrome.pid, 'SIGTERM');
console.log(JSON.stringify({ produto: source.result?.value || null, destino: target }, null, 2));
