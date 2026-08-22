import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const url = process.argv[2] || 'http://127.0.0.1:4173/index.html#catalogo-acai-natureon';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture(name, width, height, mobile) {
  const port = mobile ? 9251 : 9252;
  const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-natureon-${name}-${Date.now()}`, `--window-size=${width},${height}`, 'about:blank'], { detached: true, stdio: 'ignore' });
  chrome.unref();
  let page;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* aguarda */ }
    await wait(200);
  }
  if (!page) throw new Error(`Não foi possível abrir a captura ${name}.`);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map();
  socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !pending.has(response.id)) return; const call = pending.get(response.id); pending.delete(response.id); response.error ? call.reject(new Error(response.error.message)) : call.resolve(response.result || {}); });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await command('Page.navigate', { url });
  await wait(3600);
  await command('Runtime.evaluate', { expression: "document.querySelector('.natureon-header')?.scrollIntoView({block:'start'})" });
  await wait(450);
  const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/demonstracao-${name}-acai-natureon-responsivo.png`, Buffer.from(screenshot.data, 'base64'));
  const closeResult = await command('Runtime.evaluate', { expression: "(() => { const modal = document.getElementById('catalogo-acai-natureon'); const wasOpen = Boolean(modal?.open); modal?.querySelector('button')?.click(); return { wasOpen, closed: !modal?.open }; })()", returnByValue: true });
  socket.close(); process.kill(-chrome.pid, 'SIGTERM');
  return closeResult.result?.value || { wasOpen: false, closed: false };
}

const mobile = await capture('mobile', 375, 812, true);
const desktop = await capture('desktop', 1280, 720, false);
console.log(JSON.stringify({ mobile, desktop }, null, 2));
