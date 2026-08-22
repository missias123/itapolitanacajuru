import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const url = 'http://127.0.0.1:4173/retirada.html?sete-cores=1';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture(name, width, height, mobile) {
  const port = mobile ? 9241 : 9242;
  const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-sete-cores-${name}-${Date.now()}`, `--window-size=${width},${height}`, 'about:blank'], { detached: true, stdio: 'ignore' });
  chrome.unref();
  let page;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* espera o navegador */ }
    await wait(200);
  }
  if (!page) throw new Error(`Não foi possível iniciar captura ${name}.`);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map();
  socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !pending.has(response.id)) return; const call = pending.get(response.id); pending.delete(response.id); response.error ? call.reject(new Error(response.error.message)) : call.resolve(response.result || {}); });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await command('Page.navigate', { url });
  await wait(4500);
  await command('Runtime.evaluate', { expression: "document.querySelector('.section-chooser')?.scrollIntoView({block:'start'})" });
  await wait(500);
  const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/demonstracao-${name}-sete-cores.png`, Buffer.from(screenshot.data, 'base64'));
  socket.close(); process.kill(-chrome.pid, 'SIGTERM');
}

await capture('mobile', 375, 812, true);
await capture('desktop', 1280, 720, false);
console.log('Capturas das sete cores criadas.');
