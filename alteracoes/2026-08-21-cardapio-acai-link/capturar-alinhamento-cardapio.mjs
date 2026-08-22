import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const outDir = `${root}/alteracoes/2026-08-21-cardapio-acai-link`;
const port = 9377;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync(outDir, { recursive: true });
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-card-align-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page'); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de captura indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const capture = async (name, width, height) => {
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/index.html?audit-align=1' }); await wait(3400);
  await evaluate(`(() => { [...document.querySelectorAll('button')].find((button) => /aceitar todos/i.test(button.textContent || ''))?.click(); document.querySelector('a[href="#acc-picolés"]')?.click(); document.querySelector('#acc-picolés')?.scrollIntoView({ block: 'start' }); })()`); await wait(700);
  const shot = await command('Page.captureScreenshot', { format: 'png' });
  await import('node:fs').then(({ writeFileSync }) => writeFileSync(`${outDir}/${name}`, Buffer.from(shot.data, 'base64')));
};
try { await capture('demonstracao-desktop-alinhamento-cardapio.png', 1280, 720); await capture('demonstracao-mobile-alinhamento-cardapio.png', 375, 812); } finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
