import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture(name, width, height, mobile) {
  const port = mobile ? 9281 : 9282;
  const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-size-${name}-${Date.now()}`, `--window-size=${width},${height}`, 'about:blank'], { detached: true, stdio: 'ignore' });
  browser.unref();
  let target;
  for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl); if (target) break; } catch { /* aguarda */ } await wait(200); }
  if (!target) throw new Error(`Navegador indisponível em ${name}.`);
  const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !pending.has(response.id)) return; const call = pending.get(response.id); pending.delete(response.id); response.error ? call.reject(new Error(response.error.message)) : call.resolve(response.result || {}); });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }); await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html#catalogo' }); await wait(3300);
  const result = await command('Runtime.evaluate', { expression: `(() => { const section = document.querySelector('#sec-sorvetes-de-massa'); section?.scrollIntoView({ block: 'start' }); const badges = [...document.querySelectorAll('.product__size-badge')].slice(0, 8).map((item) => item.textContent.trim()); return { badges, visible: Boolean(section), firstCard: section?.querySelector('.product')?.textContent.trim() || '' }; })()`, returnByValue: true }); await wait(350);
  const screenshot = await command('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${root}/demonstracao-${name}-destaque-tamanho.png`, Buffer.from(screenshot.data, 'base64'));
  socket.close(); process.kill(-browser.pid, 'SIGTERM'); return result.result?.value;
}

console.log(JSON.stringify({ mobile: await capture('mobile', 375, 812, true), desktop: await capture('desktop', 1280, 900, false) }, null, 2));
