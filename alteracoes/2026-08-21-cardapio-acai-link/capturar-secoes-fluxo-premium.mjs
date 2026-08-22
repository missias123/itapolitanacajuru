import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9236;
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-secoes-${Date.now()}`, '--window-size=375,812', 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try { const items = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const page = items.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) return page; } catch { /* Aguarda o navegador. */ }
    await wait(200);
  }
  throw new Error('Não foi possível iniciar a captura móvel.');
}
const page = await target(); const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0; const pending = new Map();
socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !pending.has(response.id)) return; const current = pending.get(response.id); pending.delete(response.id); response.error ? current.reject(new Error(response.error.message)) : current.resolve(response.result || {}); });
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
await command('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?fluxo-premium=1' });
await wait(4500);
await command('Runtime.evaluate', { expression: "document.querySelector('.section-chooser')?.scrollIntoView({block:'start'})" });
await wait(500);
const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(`${root}/demonstracao-mobile-secoes-fluxo-premium.png`, Buffer.from(shot.data, 'base64'));
socket.close(); process.kill(-chrome.pid, 'SIGTERM');
console.log('Captura das seções criada.');
